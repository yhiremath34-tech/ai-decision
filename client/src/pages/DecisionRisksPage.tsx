import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  PlusCircle,
  Shield,
  Trash2,
  Edit2,
  ArrowRight,
  User,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.js';
import { DecisionProgress } from '../components/decisions/DecisionProgress.js';
import { RiskMatrix } from '../components/risks/RiskMatrix.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Textarea } from '../components/ui/Textarea.js';
import { Select } from '../components/ui/Select.js';
import { Modal } from '../components/ui/Modal.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.js';
import { Risk, DecisionWorkspaceData } from '../types/index.js';

export const DecisionRisksPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<DecisionWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [deleteRiskId, setDeleteRiskId] = useState<string | null>(null);

  // Form states
  const [riskName, setRiskName] = useState('');
  const [desc, setDesc] = useState('');
  const [prob, setProb] = useState('3');
  const [impact, setImpact] = useState('3');
  const [mitigation, setMitigation] = useState('');
  const [owner, setOwner] = useState('');
  const [selectedAltId, setSelectedAltId] = useState('');
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
      setError(err.message || 'Failed to load risks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const openCreateModal = () => {
    setEditingRisk(null);
    setRiskName('');
    setDesc('');
    setProb('3');
    setImpact('3');
    setMitigation('');
    setOwner('');
    setSelectedAltId(data?.alternatives[0]?.id || '');
    setModalOpen(true);
  };

  const openEditModal = (risk: Risk) => {
    setEditingRisk(risk);
    setRiskName(risk.name);
    setDesc(risk.description || '');
    setProb(String(risk.probability));
    setImpact(String(risk.impact));
    setMitigation(risk.mitigation || '');
    setOwner(risk.owner || '');
    setSelectedAltId(risk.alternative_id || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !riskName.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: riskName.trim(),
        description: desc.trim() || null,
        probability: parseInt(prob, 10),
        impact: parseInt(impact, 10),
        mitigation: mitigation.trim() || null,
        owner: owner.trim() || null,
        alternative_id: selectedAltId || null,
      };

      if (editingRisk) {
        await api.updateRisk(editingRisk.id, payload);
        toast.success(`Risk "${riskName}" updated.`);
      } else {
        await api.createRisk(id, payload);
        toast.success(`Risk "${riskName}" added to register.`);
      }

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save risk');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRiskId) return;
    try {
      await api.deleteRisk(deleteRiskId);
      toast.success('Risk removed from register.');
      setDeleteRiskId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete risk');
    }
  };

  if (loading) {
    return <Spinner size="lg" text="Loading risk register..." className="py-24" />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Decision not found'} onRetry={loadData} />;
  }

  const { risks, alternatives } = data;

  const altOptions = [
    { value: '', label: 'General / All Alternatives' },
    ...alternatives.map(a => ({ value: a.id, label: a.name })),
  ];

  const scaleOptions = [
    { value: '1', label: '1 - Negligible / Very Low' },
    { value: '2', label: '2 - Minor / Low' },
    { value: '3', label: '3 - Moderate' },
    { value: '4', label: '4 - Major / High' },
    { value: '5', label: '5 - Severe / Critical' },
  ];

  return (
    <PageContainer
      title="Risk Analysis & Mitigation"
      subtitle="Identify operational, technical, or financial hazards using a 1–5 Probability and Impact matrix."
      actions={
        <Button variant="primary" onClick={openCreateModal} icon={<PlusCircle className="w-4 h-4" />}>
          Register Risk
        </Button>
      }
    >
      <DecisionProgress data={data} />

      {/* 5x5 Heat Matrix Component */}
      <RiskMatrix risks={risks} onSelectRisk={openEditModal} />

      {/* Risk Register Table */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Registered Risks ({risks.length})</h3>
          <span className="text-xs text-slate-500">Risk Score = Probability × Impact (1–25)</span>
        </div>

        {risks.length === 0 ? (
          <Card className="p-8 text-center text-slate-400 text-xs border-dashed">
            No risks registered. Document known failure modes, vendor dependencies, and mitigation strategies.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {risks.map(r => {
              const alt = alternatives.find(a => a.id === r.alternative_id);
              const isCritical = r.risk_score >= 17;
              const isHigh = r.risk_score >= 10 && r.risk_score < 17;

              return (
                <Card key={r.id} className="p-4 space-y-3 border-slate-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-full ${
                            isCritical
                              ? 'bg-rose-100 text-rose-800'
                              : isHigh
                              ? 'bg-orange-100 text-orange-800'
                              : r.risk_score >= 5
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          Score: {r.risk_score}/25
                        </span>
                        {alt && (
                          <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 truncate max-w-[200px]">
                            {alt.name}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{r.name}</h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(r)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteRiskId(r.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {r.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {r.description}
                    </p>
                  )}

                  {r.mitigation && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                      <span className="font-bold text-slate-900 block text-[10px] uppercase">
                        Mitigation Control:
                      </span>
                      <span>{r.mitigation}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    <span>Probability: <strong>{r.probability}/5</strong> • Impact: <strong>{r.impact}/5</strong></span>
                    {r.owner && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> Owner: {r.owner}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <Button variant="outline" onClick={() => navigate(`/decisions/${id}/evidence`)}>
          Back to Evidence
        </Button>
        <Button variant="primary" onClick={() => navigate(`/decisions/${id}/analyze`)} icon={<ArrowRight className="w-4 h-4" />}>
          Proceed to AI Decision Analysis
        </Button>
      </div>

      {/* Register / Edit Risk Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRisk ? 'Edit Risk Profile' : 'Register New Risk'}
        description="Quantify the probability and impact of potential adverse outcomes."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Risk Hazard Title"
            required
            placeholder="e.g. Unplanned Outage Due to Bare-Metal Hardware Failure"
            value={riskName}
            onChange={e => setRiskName(e.target.value)}
          />

          <Select
            label="Associated Alternative (Optional)"
            options={altOptions}
            value={selectedAltId}
            onChange={e => setSelectedAltId(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Probability (1-5)"
              options={scaleOptions}
              value={prob}
              onChange={e => setProb(e.target.value)}
            />
            <Select
              label="Impact Severity (1-5)"
              options={scaleOptions}
              value={impact}
              onChange={e => setImpact(e.target.value)}
            />
          </div>

          <Textarea
            label="Risk Description & Failure Mechanism"
            rows={2}
            placeholder="Describe what triggers this risk and the immediate operational consequences..."
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />

          <Textarea
            label="Mitigation Strategy & Preventative Action"
            rows={2}
            placeholder="Specific engineering or operational controls to reduce probability or impact..."
            value={mitigation}
            onChange={e => setMitigation(e.target.value)}
          />

          <Input
            label="Risk Owner / Point of Contact"
            placeholder="e.g. Principal Architect, Lead SRE"
            value={owner}
            onChange={e => setOwner(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {editingRisk ? 'Save Changes' : 'Register Risk'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteRiskId)}
        onClose={() => setDeleteRiskId(null)}
        title="Delete Risk?"
        description="Are you sure you want to remove this risk from the register?"
        maxWidth="sm"
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={() => setDeleteRiskId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete Risk
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
};
