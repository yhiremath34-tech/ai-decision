import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  PlusCircle,
  Edit2,
  Trash2,
  ArrowRight,
  Scale,
  Percent,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.js';
import { DecisionProgress } from '../components/decisions/DecisionProgress.js';
import { DecisionMatrixTable } from '../components/criteria/DecisionMatrixTable.js';
import { Card, CardHeader, CardBody } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Textarea } from '../components/ui/Textarea.js';
import { Select } from '../components/ui/Select.js';
import { Modal } from '../components/ui/Modal.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.js';
import { Criterion, DecisionWorkspaceData } from '../types/index.js';

export const DecisionCriteriaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<DecisionWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Criteria Modals
  const [critModalOpen, setCritModalOpen] = useState(false);
  const [editingCrit, setEditingCrit] = useState<Criterion | null>(null);
  const [deleteCritId, setDeleteCritId] = useState<string | null>(null);

  // Score Edit Modal
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [targetScoreAltId, setTargetScoreAltId] = useState('');
  const [targetScoreCritId, setTargetScoreCritId] = useState('');
  const [scoreVal, setScoreVal] = useState<string>('');

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [critType, setCritType] = useState('quantitative');
  const [weight, setWeight] = useState('25');
  const [direction, setDirection] = useState('higher_better');
  const [unit, setUnit] = useState('');
  const [minVal, setMinVal] = useState('');
  const [maxVal, setMaxVal] = useState('');
  const [targetVal, setTargetVal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDecision(id);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load criteria');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const openCreateCritModal = () => {
    setEditingCrit(null);
    setName('');
    setDescription('');
    setCritType('quantitative');
    setWeight('25');
    setDirection('higher_better');
    setUnit('');
    setMinVal('');
    setMaxVal('');
    setTargetVal('');
    setCritModalOpen(true);
  };

  const openEditCritModal = (crit: Criterion) => {
    setEditingCrit(crit);
    setName(crit.name);
    setDescription(crit.description || '');
    setCritType(crit.criterion_type);
    setWeight(String(crit.weight));
    setDirection(crit.direction);
    setUnit(crit.unit || '');
    setMinVal(crit.min_value !== null && crit.min_value !== undefined ? String(crit.min_value) : '');
    setMaxVal(crit.max_value !== null && crit.max_value !== undefined ? String(crit.max_value) : '');
    setTargetVal(crit.target_value !== null && crit.target_value !== undefined ? String(crit.target_value) : '');
    setCritModalOpen(true);
  };

  const handleCritSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        criterion_type: critType as any,
        weight: parseFloat(weight) || 0,
        direction: direction as any,
        unit: unit.trim() || null,
        min_value: minVal ? parseFloat(minVal) : null,
        max_value: maxVal ? parseFloat(maxVal) : null,
        target_value: targetVal ? parseFloat(targetVal) : null,
      };

      if (editingCrit) {
        await api.updateCriterion(editingCrit.id, payload);
        toast.success(`Criterion "${name}" updated.`);
      } else {
        await api.createCriterion(id, payload);
        toast.success(`Criterion "${name}" created.`);
      }

      setCritModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save criterion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNormalizeWeights = async () => {
    if (!id) return;
    try {
      await api.normalizeWeights(id);
      toast.success('Criterion weights normalized to sum to exactly 100%.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to normalize weights');
    }
  };

  const confirmDeleteCrit = async () => {
    if (!deleteCritId) return;
    try {
      await api.deleteCriterion(deleteCritId);
      toast.success('Criterion deleted.');
      setDeleteCritId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete criterion');
    }
  };

  const handleEditCellScore = (altId: string, critId: string, currentVal: number | null) => {
    setTargetScoreAltId(altId);
    setTargetScoreCritId(critId);
    setScoreVal(currentVal !== null && currentVal !== undefined ? String(currentVal) : '');
    setScoreModalOpen(true);
  };

  const handleSaveScoreCell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !targetScoreAltId || !targetScoreCritId) return;

    try {
      setSubmitting(true);
      const parsedVal = scoreVal === '' ? null : parseFloat(scoreVal);
      await api.saveScores(id, [
        {
          alternative_id: targetScoreAltId,
          criterion_id: targetScoreCritId,
          raw_value: parsedVal,
        },
      ]);
      toast.success('Matrix value updated.');
      setScoreModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update matrix score');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Spinner size="lg" text="Loading criteria & matrix..." className="py-24" />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Decision not found'} onRetry={loadData} />;
  }

  const { criteria, alternatives, scores, live_matrix } = data;
  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  const weightsBalanced = Math.abs(totalWeight - 100) < 0.1;

  const typeOptions = [
    { value: 'quantitative', label: 'Quantitative (Numerical with min/max bounds)' },
    { value: 'qualitative', label: 'Qualitative (Descriptive assessment)' },
    { value: 'rating', label: 'Rating Scale (1 to 5 stars/levels)' },
    { value: 'boolean', label: 'Boolean (Yes/No requirement)' },
  ];

  const directionOptions = [
    { value: 'higher_better', label: 'Higher is Better (e.g. Uptime, Revenue, Speed)' },
    { value: 'lower_better', label: 'Lower is Better (e.g. Cost, Risk, Overhead)' },
    { value: 'target', label: 'Target Value (Optimal midpoint target)' },
  ];

  return (
    <PageContainer
      title="Criteria & Decision Matrix"
      subtitle="Establish evaluation dimensions, assign priority weights (summing to 100%), and populate alternative scores."
      actions={
        <Button variant="primary" onClick={openCreateCritModal} icon={<PlusCircle className="w-4 h-4" />}>
          Add Criterion
        </Button>
      }
    >
      <DecisionProgress data={data} />

      {/* Weight Summary Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
            weightsBalanced ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Total Criteria Weight: {totalWeight.toFixed(1)}%</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                weightsBalanced ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {weightsBalanced ? 'Balanced (100%)' : 'Imbalance Detected'}
              </span>
            </div>
            <p className="text-xs text-slate-500">Weights reflect relative priority in calculating final composite scores.</p>
          </div>
        </div>

        {!weightsBalanced && criteria.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleNormalizeWeights} icon={<Scale className="w-3.5 h-3.5" />}>
            Auto-Normalize to 100%
          </Button>
        )}
      </div>

      {/* Criteria Cards */}
      {criteria.length === 0 ? (
        <EmptyState
          icon={<FileSpreadsheet className="w-8 h-8 text-slate-400" />}
          title="No criteria defined yet"
          description="Add criteria (e.g. Monthly Cost, Reliability, Latency) to build the decision matrix."
          actionLabel="Add First Criterion"
          onAction={openCreateCritModal}
          actionIcon={<PlusCircle className="w-4 h-4" />}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {criteria.map(crit => (
              <Card key={crit.id} className="p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {crit.weight}%
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditCritModal(crit)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteCritId(crit.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{crit.name}</h4>
                  <div className="text-[11px] text-slate-500">
                    {crit.direction === 'higher_better' ? 'Higher is better' : crit.direction === 'lower_better' ? 'Lower is better' : 'Target'} • {crit.unit || crit.criterion_type}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Interactive Multi-Criteria Decision Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Multi-Criteria Decision Matrix</h3>
                <p className="text-xs text-slate-500">
                  Click any cell to edit raw performance values. Normalized and weighted scores update dynamically.
                </p>
              </div>
            </div>

            <DecisionMatrixTable
              alternatives={alternatives}
              criteria={criteria}
              scores={scores}
              calculationSnapshot={live_matrix}
              onEditScore={handleEditCellScore}
            />
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <Button variant="outline" onClick={() => navigate(`/decisions/${id}/alternatives`)}>
          Back to Alternatives
        </Button>
        <Button
          variant="primary"
          disabled={criteria.length < 2 || alternatives.length < 2}
          onClick={() => navigate(`/decisions/${id}/evidence`)}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          Proceed to Evidence & Risks
        </Button>
      </div>

      {/* Add / Edit Criterion Modal */}
      <Modal
        isOpen={critModalOpen}
        onClose={() => setCritModalOpen(false)}
        title={editingCrit ? 'Edit Evaluation Criterion' : 'Add Evaluation Criterion'}
        description="Define an objective criterion, its measurement type, and priority weight."
        maxWidth="lg"
      >
        <form onSubmit={handleCritSubmit} className="space-y-4">
          <Input
            label="Criterion Name"
            required
            placeholder="e.g. Monthly Infrastructure Cost"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Criterion Type"
              options={typeOptions}
              value={critType}
              onChange={e => setCritType(e.target.value)}
            />

            <Input
              label="Priority Weight (%)"
              type="number"
              min="0"
              max="100"
              required
              value={weight}
              onChange={e => setWeight(e.target.value)}
              helperText="Relative percentage (sum of all should equal 100%)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Optimization Direction"
              options={directionOptions}
              value={direction}
              onChange={e => setDirection(e.target.value)}
            />

            <Input
              label="Unit of Measurement (Optional)"
              placeholder="e.g. USD, ms, %, Hours"
              value={unit}
              onChange={e => setUnit(e.target.value)}
            />
          </div>

          {direction === 'target' && (
            <Input
              label="Target Ideal Value"
              type="number"
              step="any"
              placeholder="e.g. 50"
              value={targetVal}
              onChange={e => setTargetVal(e.target.value)}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Minimum Bound (Optional)"
              type="number"
              step="any"
              placeholder="Auto-detected if blank"
              value={minVal}
              onChange={e => setMinVal(e.target.value)}
            />
            <Input
              label="Maximum Bound (Optional)"
              type="number"
              step="any"
              placeholder="Auto-detected if blank"
              value={maxVal}
              onChange={e => setMaxVal(e.target.value)}
            />
          </div>

          <Textarea
            label="Description & Evaluation Standard (Optional)"
            rows={2}
            placeholder="Guidance for evaluating alternatives on this dimension..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setCritModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {editingCrit ? 'Save Changes' : 'Create Criterion'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Score Value Cell Modal */}
      <Modal
        isOpen={scoreModalOpen}
        onClose={() => setScoreModalOpen(false)}
        title="Enter Metric Value"
        description="Set the performance score for this alternative on the chosen criterion."
        maxWidth="sm"
      >
        <form onSubmit={handleSaveScoreCell} className="space-y-4">
          <Input
            label="Numerical Performance Value"
            type="number"
            step="any"
            required
            autoFocus
            placeholder="e.g. 11200 or 99.9"
            value={scoreVal}
            onChange={e => setScoreVal(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="secondary" onClick={() => setScoreModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Save Score
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteCritId)}
        onClose={() => setDeleteCritId(null)}
        title="Delete Criterion?"
        description="Removing this criterion will delete all its scores across all alternatives. Continue?"
        maxWidth="sm"
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={() => setDeleteCritId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteCrit}>
            Delete Criterion
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
};
