import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.js';
import { Card, CardHeader, CardBody } from '../components/ui/Card.js';
import { Input } from '../components/ui/Input.js';
import { Textarea } from '../components/ui/Textarea.js';
import { Select } from '../components/ui/Select.js';
import { Button } from '../components/ui/Button.js';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.js';

export const DecisionNewPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [domain, setDomain] = useState('Technology');
  const [customDomain, setCustomDomain] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [constraints, setConstraints] = useState('');
  const [decisionStyle, setDecisionStyle] = useState('balanced');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  const domainOptions = [
    { value: 'Technology', label: 'Technology (Software, Cloud, Architecture)' },
    { value: 'Business', label: 'Business & Strategy (Vendors, Expansion, Ops)' },
    { value: 'Education', label: 'Education (College, Course, Certifications)' },
    { value: 'Finance', label: 'Finance & Investment (Capex, Budgets, Assets)' },
    { value: 'Healthcare Operations', label: 'Healthcare Operations (Resources, Facilities)' },
    { value: 'Sustainability', label: 'Sustainability & ESG (Energy, Decarbonization)' },
    { value: 'Personal', label: 'Personal (Career, Relocation, Major Purchases)' },
    { value: 'Custom', label: 'Custom Domain...' },
  ];

  const styleOptions = [
    { value: 'balanced', label: 'Balanced (Standard utility trade-offs)' },
    { value: 'conservative', label: 'Conservative (High weight on stability & low variance)' },
    { value: 'growth-oriented', label: 'Growth-Oriented (Prioritize high upside & scalability)' },
    { value: 'risk-sensitive', label: 'Risk-Sensitive (Minimize downside risk exposure)' },
    { value: 'cost-sensitive', label: 'Cost-Sensitive (Rigorous capital preservation)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !question.trim()) {
      toast.error('Title and Decision Question are mandatory.');
      return;
    }

    try {
      setLoading(true);
      const chosenDomain = domain === 'Custom' ? (customDomain.trim() || 'Custom') : domain;

      const res = await api.createDecision({
        title: title.trim(),
        decision_question: question.trim(),
        domain: chosenDomain,
        description: description.trim() || null,
        deadline: deadline || null,
        desired_outcome: desiredOutcome.trim() || null,
        constraints: constraints.trim() || null,
        decision_style: decisionStyle as any,
      });

      toast.success('Decision workspace created successfully!');
      navigate(`/decisions/${res.decision.id}/alternatives`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create decision workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Create New Decision Workspace"
      subtitle="Define your decision question, desired outcome, constraints, and analytical style."
      maxWidth="5xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50 border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">Core Decision Formulation</h3>
            </div>
          </CardHeader>
          <CardBody className="space-y-5">
            <Input
              label="Decision Title"
              required
              placeholder="e.g. Select Cloud Provider for Next-Gen SaaS Platform"
              value={title}
              onChange={e => setTitle(e.target.value)}
              helperText="A concise summary of what this decision resolves."
            />

            <Textarea
              label="Decision Question"
              required
              rows={3}
              placeholder="e.g. Which cloud infrastructure provider best balances monthly compute expenses, 99.99% uptime reliability, and developer onboarding velocity?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              helperText="The precise question the analytical model and AI will answer."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Target Domain"
                options={domainOptions}
                value={domain}
                onChange={e => setDomain(e.target.value)}
              />

              {domain === 'Custom' ? (
                <Input
                  label="Specify Custom Domain"
                  required
                  placeholder="e.g. Urban Planning, Aerospace, Agriculture"
                  value={customDomain}
                  onChange={e => setCustomDomain(e.target.value)}
                />
              ) : (
                <Input
                  label="Target Decision Deadline (Optional)"
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                />
              )}
            </div>

            <Textarea
              label="Description & Context (Optional)"
              rows={3}
              placeholder="Provide background context, stakeholders involved, and historical precedents..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </CardBody>
        </Card>

        {/* Advisory Configuration */}
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50 border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Objectives, Constraints & Style</h3>
          </CardHeader>
          <CardBody className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Textarea
                label="Desired Outcome (Optional)"
                rows={3}
                placeholder="e.g. Achieve sub-20ms global API latency while keeping monthly hosting under $15k."
                value={desiredOutcome}
                onChange={e => setDesiredOutcome(e.target.value)}
                helperText="What does success look like for this decision?"
              />

              <Textarea
                label="Hard Constraints & Dealbreakers (Optional)"
                rows={3}
                placeholder="e.g. Must comply with SOC2 Type II, must not require single-region lock-in."
                value={constraints}
                onChange={e => setConstraints(e.target.value)}
                helperText="Non-negotiable boundaries or minimum acceptable limits."
              />
            </div>

            <Select
              label="Analytical Decision Style Preference"
              options={styleOptions}
              value={decisionStyle}
              onChange={e => setDecisionStyle(e.target.value)}
              helperText="Influences AI trade-off analysis and explanation perspectives without overriding quantitative scores."
            />
          </CardBody>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/decisions')} icon={<ArrowLeft className="w-4 h-4" />}>
            Cancel
          </Button>

          <Button type="submit" variant="primary" size="lg" isLoading={loading} icon={<ArrowRight className="w-4 h-4" />}>
            Create & Add Alternatives
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};
