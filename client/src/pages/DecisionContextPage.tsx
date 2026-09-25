import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer.js';
import { DecisionProgress } from '../components/decisions/DecisionProgress.js';
import { Card, CardHeader, CardBody } from '../components/ui/Card.js';
import { Input } from '../components/ui/Input.js';
import { Textarea } from '../components/ui/Textarea.js';
import { Select } from '../components/ui/Select.js';
import { Button } from '../components/ui/Button.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.js';
import { DecisionWorkspaceData } from '../types/index.js';
import { Save, ArrowRight } from 'lucide-react';

export const DecisionContextPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<DecisionWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [domain, setDomain] = useState('Technology');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [constraints, setConstraints] = useState('');
  const [decisionStyle, setDecisionStyle] = useState('balanced');
  const [status, setStatus] = useState('draft');

  const toast = useToast();
  const navigate = useNavigate();

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDecision(id);
      setData(res);
      setTitle(res.decision.title);
      setQuestion(res.decision.decision_question);
      setDomain(res.decision.domain);
      setDescription(res.decision.description || '');
      setDeadline(res.decision.deadline ? res.decision.deadline.split('T')[0] : '');
      setDesiredOutcome(res.decision.desired_outcome || '');
      setConstraints(res.decision.constraints || '');
      setDecisionStyle(res.decision.decision_style || 'balanced');
      setStatus(res.decision.status);
    } catch (err: any) {
      setError(err.message || 'Failed to load context');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setSaving(true);
      await api.updateDecision(id, {
        title: title.trim(),
        decision_question: question.trim(),
        domain,
        description: description.trim() || null,
        deadline: deadline || null,
        desired_outcome: desiredOutcome.trim() || null,
        constraints: constraints.trim() || null,
        decision_style: decisionStyle as any,
        status: status as any,
      });

      toast.success('Decision context updated.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update context');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spinner size="lg" text="Loading context..." className="py-24" />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Decision not found'} onRetry={loadData} />;
  }

  const domainOptions = [
    { value: 'Technology', label: 'Technology' },
    { value: 'Business', label: 'Business & Strategy' },
    { value: 'Education', label: 'Education' },
    { value: 'Finance', label: 'Finance & Investment' },
    { value: 'Healthcare Operations', label: 'Healthcare Operations' },
    { value: 'Sustainability', label: 'Sustainability & ESG' },
    { value: 'Personal', label: 'Personal' },
    { value: 'Custom', label: 'Custom' },
  ];

  const styleOptions = [
    { value: 'balanced', label: 'Balanced (Standard utility trade-offs)' },
    { value: 'conservative', label: 'Conservative (High weight on stability & low variance)' },
    { value: 'growth-oriented', label: 'Growth-Oriented (Prioritize high upside & scalability)' },
    { value: 'risk-sensitive', label: 'Risk-Sensitive (Minimize downside risk exposure)' },
    { value: 'cost-sensitive', label: 'Cost-Sensitive (Rigorous capital preservation)' },
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'analysis_ready', label: 'Ready for Analysis' },
    { value: 'analyzed', label: 'Analyzed' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'decided', label: 'Decided' },
    { value: 'archived', label: 'Archived' },
  ];

  return (
    <PageContainer
      title="Edit Decision Context"
      subtitle="Refine the decision problem statement, domain boundaries, and strategic constraints."
    >
      <DecisionProgress data={data} />

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50 border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Decision Problem Statement</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Decision Title"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
            />

            <Textarea
              label="Decision Question"
              required
              rows={3}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              helperText="The precise analytical inquiry the decision model evaluates."
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Domain Category"
                options={domainOptions}
                value={domain}
                onChange={e => setDomain(e.target.value)}
              />

              <Input
                label="Target Decision Deadline"
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />

              <Select
                label="Workspace Status"
                options={statusOptions}
                value={status}
                onChange={e => setStatus(e.target.value)}
              />
            </div>

            <Textarea
              label="Background Description & Notes"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </CardBody>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50 border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Objectives, Constraints & Style</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Textarea
                label="Desired Outcome"
                rows={3}
                placeholder="Explicit goals to achieve..."
                value={desiredOutcome}
                onChange={e => setDesiredOutcome(e.target.value)}
              />

              <Textarea
                label="Constraints & Hard Dealbreakers"
                rows={3}
                placeholder="Boundaries, budget limits, regulatory mandates..."
                value={constraints}
                onChange={e => setConstraints(e.target.value)}
              />
            </div>

            <Select
              label="Decision Style Preference"
              options={styleOptions}
              value={decisionStyle}
              onChange={e => setDecisionStyle(e.target.value)}
            />
          </CardBody>
        </Card>

        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/decisions/${id}/alternatives`)}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Go to Alternatives
          </Button>

          <Button type="submit" variant="primary" size="lg" isLoading={saving} icon={<Save className="w-4 h-4" />}>
            Save Context
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};
