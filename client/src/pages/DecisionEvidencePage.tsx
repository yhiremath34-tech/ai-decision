import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileCheck,
  PlusCircle,
  HelpCircle,
  Trash2,
  Calendar,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.js';
import { DecisionProgress } from '../components/decisions/DecisionProgress.js';
import { Card, CardHeader, CardBody } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Textarea } from '../components/ui/Textarea.js';
import { Select } from '../components/ui/Select.js';
import { Modal } from '../components/ui/Modal.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.js';
import { Evidence, Assumption, DecisionWorkspaceData } from '../types/index.js';

export const DecisionEvidencePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<DecisionWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Evidence Modal
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [eTitle, setETitle] = useState('');
  const [eType, setEType] = useState('internal_data');
  const [eSource, setESource] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eReliability, setEReliability] = useState('90');
  const [eDate, setEDate] = useState('');

  // Assumption Modal
  const [assumptionModalOpen, setAssumptionModalOpen] = useState(false);
  const [aName, setAName] = useState('');
  const [aValue, setAValue] = useState('');
  const [aUnit, setAUnit] = useState('');
  const [aConfidence, setAConfidence] = useState('75');
  const [aSource, setASource] = useState('');
  const [aNotes, setANotes] = useState('');

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
      setError(err.message || 'Failed to load evidence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleCreateEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !eTitle.trim() || !eDesc.trim()) return;

    try {
      setSubmitting(true);
      await api.createEvidence(id, {
        title: eTitle.trim(),
        evidence_type: eType as any,
        source: eSource.trim() || null,
        description: eDesc.trim(),
        reliability: eReliability ? parseFloat(eReliability) : null,
        evidence_date: eDate || null,
      });

      toast.success('Empirical evidence record added.');
      setEvidenceModalOpen(false);
      setETitle('');
      setESource('');
      setEDesc('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add evidence');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAssumption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !aName.trim() || !aValue.trim()) return;

    try {
      setSubmitting(true);
      await api.createAssumption(id, {
        name: aName.trim(),
        value: aValue.trim(),
        unit: aUnit.trim() || null,
        confidence: aConfidence ? parseFloat(aConfidence) : null,
        source: aSource.trim() || null,
        notes: aNotes.trim() || null,
      });

      toast.success('Strategic assumption recorded.');
      setAssumptionModalOpen(false);
      setAName('');
      setAValue('');
      setAUnit('');
      setANotes('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add assumption');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvidence = async (evId: string) => {
    try {
      await api.deleteEvidence(evId);
      toast.success('Evidence removed.');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteAssumption = async (asId: string) => {
    try {
      await api.deleteAssumption(asId);
      toast.success('Assumption removed.');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return <Spinner size="lg" text="Loading evidence & assumptions..." className="py-24" />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Decision not found'} onRetry={loadData} />;
  }

  const { evidence, assumptions } = data;

  const evidenceTypeOptions = [
    { value: 'internal_data', label: 'Internal Production Data / Telemetry' },
    { value: 'research', label: 'Empirical Research / Benchmark' },
    { value: 'report', label: 'Audit / Formal Report' },
    { value: 'historical_data', label: 'Historical Precedent' },
    { value: 'expert_opinion', label: 'Expert Consultation' },
    { value: 'user_observation', label: 'User Observation' },
    { value: 'estimate', label: 'Engineering Estimate' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <PageContainer
      title="Evidence & Assumption Tracking"
      subtitle="Explicitly distinguish empirical facts and telemetry from subjective assumptions and estimates."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setAssumptionModalOpen(true)} icon={<HelpCircle className="w-4 h-4" />}>
            Add Assumption
          </Button>
          <Button variant="primary" onClick={() => setEvidenceModalOpen(true)} icon={<PlusCircle className="w-4 h-4" />}>
            Add Evidence
          </Button>
        </div>
      }
    >
      <DecisionProgress data={data} />

      {/* Distinction Header Banner */}
      <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 text-sky-900 text-xs flex items-center justify-between">
        <span>
          <strong>Evidence vs Assumptions:</strong> Evidence consists of verified empirical reports, invoices, or benchmark data. Assumptions are forward-looking hypotheses that may carry model volatility.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: Empirical Evidence */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Documented Evidence ({evidence.length})</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEvidenceModalOpen(true)}>
              + Add
            </Button>
          </div>

          {evidence.length === 0 ? (
            <Card className="p-6 text-center text-slate-400 text-xs border-dashed">
              No evidence items registered. Add benchmark results, billing audits, or performance reports.
            </Card>
          ) : (
            <div className="space-y-3">
              {evidence.map(item => (
                <Card key={item.id} className="p-4 space-y-2 border-slate-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {item.evidence_type.replace('_', ' ')}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{item.title}</h4>
                    </div>
                    <button
                      onClick={() => handleDeleteEvidence(item.id)}
                      className="p-1 text-slate-300 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-600" />
                      Reliability: <strong>{item.reliability ?? 'N/A'}%</strong>
                    </span>
                    {item.source && <span>Source: {item.source}</span>}
                    {item.evidence_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.evidence_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Explicit Assumptions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900">Tracked Assumptions ({assumptions.length})</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setAssumptionModalOpen(true)}>
              + Add
            </Button>
          </div>

          {assumptions.length === 0 ? (
            <Card className="p-6 text-center text-slate-400 text-xs border-dashed">
              No assumptions tracked yet. Document key working assumptions (e.g. traffic growth, exchange rates, staffing).
            </Card>
          ) : (
            <div className="space-y-3">
              {assumptions.map(item => (
                <Card key={item.id} className="p-4 space-y-2 border-slate-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                      <div className="text-xs font-black text-purple-700 mt-0.5">
                        Value: {item.value} {item.unit || ''}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAssumption(item.id)}
                      className="p-1 text-slate-300 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "{item.notes}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-purple-600" />
                      Confidence: <strong>{item.confidence ?? 'N/A'}%</strong>
                    </span>
                    {item.source && <span>Basis: {item.source}</span>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <Button variant="outline" onClick={() => navigate(`/decisions/${id}/criteria`)}>
          Back to Criteria
        </Button>
        <Button variant="primary" onClick={() => navigate(`/decisions/${id}/risks`)} icon={<ArrowRight className="w-4 h-4" />}>
          Proceed to Risk Register
        </Button>
      </div>

      {/* Evidence Modal */}
      <Modal
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        title="Add Documented Evidence"
        description="Record empirical facts, pilot test results, benchmark data, or stakeholder quotes."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateEvidence} className="space-y-4">
          <Input
            label="Evidence Title"
            required
            placeholder="e.g. Q2 AWS CloudWatch Bandwidth Audit"
            value={eTitle}
            onChange={e => setETitle(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Evidence Type"
              options={evidenceTypeOptions}
              value={eType}
              onChange={e => setEType(e.target.value)}
            />

            <Input
              label="Reliability Rating (0-100%)"
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 95"
              value={eReliability}
              onChange={e => setEReliability(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Source or Origin"
              placeholder="e.g. FinOps Report, VP Engineering"
              value={eSource}
              onChange={e => setESource(e.target.value)}
            />

            <Input
              label="Observation Date"
              type="date"
              value={eDate}
              onChange={e => setEDate(e.target.value)}
            />
          </div>

          <Textarea
            label="Detailed Findings / Description"
            required
            rows={3}
            placeholder="Empirical data points, specific findings, and quantitative measurements..."
            value={eDesc}
            onChange={e => setEDesc(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="secondary" onClick={() => setEvidenceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Add Evidence Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assumption Modal */}
      <Modal
        isOpen={assumptionModalOpen}
        onClose={() => setAssumptionModalOpen(false)}
        title="Track Working Assumption"
        description="Document key hypotheses and expected baseline conditions."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAssumption} className="space-y-4">
          <Input
            label="Assumption Parameter Name"
            required
            placeholder="e.g. Monthly Traffic Growth Rate"
            value={aName}
            onChange={e => setAName(e.target.value)}
          />

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Assumed Value"
                required
                placeholder="e.g. 25% MoM or 3 Full-Time Engineers"
                value={aValue}
                onChange={e => setAValue(e.target.value)}
              />
            </div>
            <Input
              label="Unit"
              placeholder="e.g. %, FTEs, USD"
              value={aUnit}
              onChange={e => setAUnit(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Confidence Level (0-100%)"
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 75"
              value={aConfidence}
              onChange={e => setAConfidence(e.target.value)}
            />
            <Input
              label="Basis / Source"
              placeholder="e.g. Executive forecast"
              value={aSource}
              onChange={e => setASource(e.target.value)}
            />
          </div>

          <Textarea
            label="Rationale & Conditions"
            rows={2}
            placeholder="Why is this assumption reasonable and under what conditions could it fail?"
            value={aNotes}
            onChange={e => setANotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="secondary" onClick={() => setAssumptionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Save Assumption
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};
