import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ListTree,
  PlusCircle,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.js';
import { DecisionProgress } from '../components/decisions/DecisionProgress.js';
import { Card, CardHeader, CardBody } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Textarea } from '../components/ui/Textarea.js';
import { Modal } from '../components/ui/Modal.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.js';
import { Alternative, DecisionWorkspaceData } from '../types/index.js';

export const DecisionAlternativesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<DecisionWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlt, setEditingAlt] = useState<Alternative | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState<string>('');
  const [benefit, setBenefit] = useState<string>('');
  const [effort, setEffort] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [notes, setNotes] = useState('');
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
      setError(err.message || 'Failed to load alternatives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const openCreateModal = () => {
    setEditingAlt(null);
    setName('');
    setDescription('');
    setCost('');
    setBenefit('');
    setEffort('');
    setDuration('');
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (alt: Alternative) => {
    setEditingAlt(alt);
    setName(alt.name);
    setDescription(alt.description || '');
    setCost(alt.estimated_cost !== null && alt.estimated_cost !== undefined ? String(alt.estimated_cost) : '');
    setBenefit(alt.estimated_benefit !== null && alt.estimated_benefit !== undefined ? String(alt.estimated_benefit) : '');
    setEffort(alt.implementation_effort !== null && alt.implementation_effort !== undefined ? String(alt.implementation_effort) : '');
    setDuration(alt.duration_days !== null && alt.duration_days !== undefined ? String(alt.duration_days) : '');
    setNotes(alt.notes || '');
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        estimated_cost: cost ? parseFloat(cost) : null,
        estimated_benefit: benefit ? parseFloat(benefit) : null,
        implementation_effort: effort ? parseFloat(effort) : null,
        duration_days: duration ? parseInt(duration, 10) : null,
        notes: notes.trim() || null,
      };

      if (editingAlt) {
        await api.updateAlternative(editingAlt.id, payload);
        toast.success(`Alternative "${name}" updated.`);
      } else {
        await api.createAlternative(id, payload);
        toast.success(`Alternative "${name}" added.`);
      }

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save alternative');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteAlternative(deleteId);
      toast.success('Alternative removed.');
      setDeleteId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete alternative');
    }
  };

  if (loading) {
    return <Spinner size="lg" text="Loading alternatives..." className="py-24" />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Decision not found'} onRetry={loadData} />;
  }

  const { alternatives } = data;

  return (
    <PageContainer
      title="Manage Alternatives"
      subtitle="Define the competing candidates, options, or strategies under evaluation (minimum 2 required)."
      actions={
        <Button variant="primary" onClick={openCreateModal} icon={<PlusCircle className="w-4 h-4" />}>
          Add Alternative
        </Button>
      }
    >
      <DecisionProgress data={data} />

      {/* Requirement Notice */}
      {alternatives.length < 2 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <span>
            <strong>Requirement:</strong> A comparative decision model requires at least <strong>2 alternatives</strong>. You currently have {alternatives.length}.
          </span>
          <Button variant="secondary" size="sm" onClick={openCreateModal}>
            Add Option
          </Button>
        </div>
      )}

      {/* Alternatives Grid */}
      {alternatives.length === 0 ? (
        <EmptyState
          icon={<ListTree className="w-8 h-8 text-slate-400" />}
          title="No alternatives defined yet"
          description="Every decision requires at least two viable alternatives to compare."
          actionLabel="Add First Alternative"
          onAction={openCreateModal}
          actionIcon={<PlusCircle className="w-4 h-4" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alternatives.map((alt, idx) => (
            <Card key={alt.id} className="p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(alt)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(alt.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900">{alt.name}</h3>

                {alt.description && (
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {alt.description}
                  </p>
                )}

                {/* Quantitative Attributes */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    <span>Cost: <strong>{alt.estimated_cost !== null && alt.estimated_cost !== undefined ? `$${Number(alt.estimated_cost).toLocaleString()}` : 'N/A'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Benefit: <strong>{alt.estimated_benefit !== null && alt.estimated_benefit !== undefined ? `$${Number(alt.estimated_benefit).toLocaleString()}` : 'N/A'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Effort: <strong>{alt.implementation_effort !== null && alt.implementation_effort !== undefined ? `${alt.implementation_effort}/100` : 'N/A'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Duration: <strong>{alt.duration_days ? `${alt.duration_days}d` : 'N/A'}</strong></span>
                  </div>
                </div>

                {alt.notes && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 italic">
                    "{alt.notes}"
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Next Step Action */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <Button variant="outline" onClick={() => navigate(`/decisions/${id}/context`)}>
          Back to Context
        </Button>
        <Button
          variant="primary"
          disabled={alternatives.length < 2}
          onClick={() => navigate(`/decisions/${id}/criteria`)}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          Proceed to Criteria & Weights
        </Button>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAlt ? 'Edit Alternative' : 'Add Alternative'}
        description="Provide alternative candidate details, financial projections, and implementation scope."
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Alternative Name"
            required
            placeholder="e.g. Google Cloud Platform (GKE + Spanner)"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <Textarea
            label="Description"
            rows={3}
            placeholder="Detailed description of this option's architectural or operational attributes..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimated Cost ($)"
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 12000"
              value={cost}
              onChange={e => setCost(e.target.value)}
            />
            <Input
              label="Estimated Benefit ($)"
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 45000"
              value={benefit}
              onChange={e => setBenefit(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Implementation Effort (0-100)"
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 45"
              value={effort}
              onChange={e => setEffort(e.target.value)}
            />
            <Input
              label="Estimated Duration (Days)"
              type="number"
              min="0"
              placeholder="e.g. 30"
              value={duration}
              onChange={e => setDuration(e.target.value)}
            />
          </div>

          <Textarea
            label="Observations & Notes"
            rows={2}
            placeholder="Team sentiment, vendor references, external caveats..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {editingAlt ? 'Save Changes' : 'Add Alternative'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete Alternative?"
        description="Removing this alternative will also delete its scores and specific risk ratings. Are you sure?"
        maxWidth="sm"
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
};
