import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  PlusCircle,
  Clock,
  Layers,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.js';
import { Button } from '../components/ui/Button.js';
import { Card } from '../components/ui/Card.js';
import { Input } from '../components/ui/Input.js';
import { DecisionStatusBadge } from '../components/decisions/DecisionStatusBadge.js';
import { Spinner } from '../components/ui/Spinner.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { Modal } from '../components/ui/Modal.js';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.js';
import { Decision } from '../types/index.js';

export const DecisionListPage: React.FC = () => {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  const navigate = useNavigate();
  const toast = useToast();

  const loadDecisions = async () => {
    try {
      setLoading(true);
      const res = await api.listDecisions({
        search: search || undefined,
        domain: domainFilter !== 'all' ? domainFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setDecisions(res.decisions);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch decisions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecisions();
  }, [domainFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDecisions();
  };

  const confirmDelete = async () => {
    if (!deleteModalId) return;
    try {
      await api.deleteDecision(deleteModalId);
      toast.success('Decision workspace deleted.');
      setDeleteModalId(null);
      loadDecisions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete decision');
    }
  };

  const domains = ['All', 'Business', 'Technology', 'Education', 'Finance', 'Healthcare Operations', 'Sustainability', 'Personal'];
  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'analysis_ready', label: 'Ready for Analysis' },
    { value: 'analyzed', label: 'Analyzed' },
    { value: 'decided', label: 'Decided' },
  ];

  return (
    <PageContainer
      title="Decision Library"
      subtitle="Search, filter, and organize your analytical decision workspaces."
      actions={
        <Link to="/decisions/new">
          <Button variant="primary" icon={<PlusCircle className="w-4 h-4" />}>
            New Decision
          </Button>
        </Link>
      }
    >
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search decisions by title, question, or context..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Domain Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Domain:
            </span>
            {domains.map(d => (
              <button
                key={d}
                onClick={() => setDomainFilter(d.toLowerCase())}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  domainFilter === d.toLowerCase()
                    ? 'bg-brand-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 border-none rounded-lg text-xs font-semibold text-slate-700 cursor-pointer focus:ring-2 focus:ring-brand-500"
            >
              {statuses.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Decisions List Grid */}
      {loading ? (
        <Spinner size="lg" text="Loading decisions..." className="py-20" />
      ) : decisions.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-8 h-8 text-slate-400" />}
          title="No decisions found"
          description={search ? 'No decision workspaces match your search criteria.' : 'Create your first decision model to get started.'}
          actionLabel="Create Decision"
          onAction={() => navigate('/decisions/new')}
          actionIcon={<PlusCircle className="w-4 h-4" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {decisions.map(d => (
            <Card
              key={d.id}
              hoverable
              onClick={() => navigate(`/decisions/${d.id}`)}
              className="p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                    {d.domain}
                  </span>
                  <DecisionStatusBadge status={d.status} />
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug hover:text-brand-600 transition-colors">
                  {d.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 italic">
                  "{d.decision_question}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(d.updated_at).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setDeleteModalId(d.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete decision"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/decisions/${d.id}`)}
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Workspace
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteModalId)}
        onClose={() => setDeleteModalId(null)}
        title="Delete Decision Workspace?"
        description="This will permanently delete this decision model, all associated alternatives, criteria, risk ratings, and AI analyses. This action cannot be undone."
        maxWidth="md"
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={() => setDeleteModalId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Yes, Delete Decision
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
};
