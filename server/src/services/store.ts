import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Decision,
  Alternative,
  Criterion,
  AlternativeScore,
  Evidence,
  Assumption,
  Risk,
  Analysis,
  SensitivityRun,
  FinalDecision,
  UserProfile,
} from '../types/index.js';

interface DatabaseData {
  profiles: UserProfile[];
  decisions: Decision[];
  alternatives: Alternative[];
  criteria: Criterion[];
  scores: AlternativeScore[];
  evidence: Evidence[];
  assumptions: Assumption[];
  risks: Risk[];
  analyses: Analysis[];
  sensitivity_runs: SensitivityRun[];
  final_decisions: FinalDecision[];
}

class PersistenceStore {
  private supabase: SupabaseClient | null = null;
  private localFilePath: string;
  private memoryData: DatabaseData;
  public isSupabaseActive: boolean = false;

  constructor() {
    this.localFilePath = path.join(process.cwd(), 'data', 'local_store.json');
    this.memoryData = this.loadLocalFile();

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (url && key && !url.includes('your-project') && !key.includes('your-supabase')) {
      try {
        this.supabase = createClient(url, key);
        this.isSupabaseActive = true;
        console.log('[Database] Connected to Supabase PostgreSQL at:', url);
      } catch (err: any) {
        console.warn('[Database] Supabase connection error. Using local JSON store:', err.message);
        this.isSupabaseActive = false;
      }
    } else {
      console.log('[Database] Supabase credentials not set or using placeholder. Running in local JSON storage mode.');
      this.isSupabaseActive = false;
    }
  }

  private loadLocalFile(): DatabaseData {
    try {
      if (fs.existsSync(this.localFilePath)) {
        const raw = fs.readFileSync(this.localFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading local store file:', e);
    }

    return {
      profiles: [],
      decisions: [],
      alternatives: [],
      criteria: [],
      scores: [],
      evidence: [],
      assumptions: [],
      risks: [],
      analyses: [],
      sensitivity_runs: [],
      final_decisions: [],
    };
  }

  private saveLocalFile(): void {
    try {
      const dir = path.dirname(this.localFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.localFilePath, JSON.stringify(this.memoryData, null, 2));
    } catch (e) {
      console.error('Error saving local store file:', e);
    }
  }

  // --- Profiles ---
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (this.isSupabaseActive && this.supabase) {
      const { data } = await this.supabase.from('profiles').select('*').eq('id', userId).single();
      return data;
    }
    return this.memoryData.profiles.find(p => p.id === userId) || null;
  }

  async upsertProfile(profile: Partial<UserProfile> & { id: string }): Promise<UserProfile> {
    const now = new Date().toISOString();
    const existing = await this.getProfile(profile.id);

    if (this.isSupabaseActive && this.supabase) {
      const { data, error } = await this.supabase
        .from('profiles')
        .upsert({ ...profile, updated_at: now })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    if (existing) {
      Object.assign(existing, { ...profile, updated_at: now });
      this.saveLocalFile();
      return existing;
    } else {
      const newP: UserProfile = {
        id: profile.id,
        full_name: profile.full_name || null,
        avatar_url: profile.avatar_url || null,
        created_at: now,
        updated_at: now,
      };
      this.memoryData.profiles.push(newP);
      this.saveLocalFile();
      return newP;
    }
  }

  // --- Decisions ---
  async listDecisions(userId: string, filters?: { search?: string; domain?: string; status?: string }): Promise<Decision[]> {
    if (this.isSupabaseActive && this.supabase) {
      let query = this.supabase.from('decisions').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
      if (filters?.domain && filters.domain !== 'all') {
        query = query.eq('domain', filters.domain);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    return this.memoryData.decisions
      .filter(d => d.user_id === userId)
      .filter(d => {
        if (filters?.domain && filters.domain !== 'all' && d.domain.toLowerCase() !== filters.domain.toLowerCase()) return false;
        if (filters?.status && filters.status !== 'all' && d.status !== filters.status) return false;
        if (filters?.search && !d.title.toLowerCase().includes(filters.search.toLowerCase()) && !d.decision_question.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  async getDecision(id: string, userId: string): Promise<Decision | null> {
    if (this.isSupabaseActive && this.supabase) {
      const { data } = await this.supabase.from('decisions').select('*').eq('id', id).eq('user_id', userId).single();
      return data;
    }
    return this.memoryData.decisions.find(d => d.id === id && d.user_id === userId) || null;
  }

  async createDecision(decision: Omit<Decision, 'id' | 'created_at' | 'updated_at' | 'analysis_version'>): Promise<Decision> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const record: Decision = {
      ...decision,
      id,
      analysis_version: 0,
      created_at: now,
      updated_at: now,
    };

    if (this.isSupabaseActive && this.supabase) {
      const { data, error } = await this.supabase.from('decisions').insert(record).select().single();
      if (error) throw error;
      return data;
    }

    this.memoryData.decisions.push(record);
    this.saveLocalFile();
    return record;
  }

  async updateDecision(id: string, userId: string, updates: Partial<Decision>): Promise<Decision | null> {
    const now = new Date().toISOString();

    if (this.isSupabaseActive && this.supabase) {
      const { data, error } = await this.supabase
        .from('decisions')
        .update({ ...updates, updated_at: now })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const item = this.memoryData.decisions.find(d => d.id === id && d.user_id === userId);
    if (!item) return null;
    Object.assign(item, { ...updates, updated_at: now });
    this.saveLocalFile();
    return item;
  }

  async deleteDecision(id: string, userId: string): Promise<boolean> {
    if (this.isSupabaseActive && this.supabase) {
      const { error } = await this.supabase.from('decisions').delete().eq('id', id).eq('user_id', userId);
      return !error;
    }

    const idx = this.memoryData.decisions.findIndex(d => d.id === id && d.user_id === userId);
    if (idx === -1) return false;

    this.memoryData.decisions.splice(idx, 1);
    // Cascade delete child entities
    this.memoryData.alternatives = this.memoryData.alternatives.filter(a => a.decision_id !== id);
    this.memoryData.criteria = this.memoryData.criteria.filter(c => c.decision_id !== id);
    this.memoryData.evidence = this.memoryData.evidence.filter(e => e.decision_id !== id);
    this.memoryData.assumptions = this.memoryData.assumptions.filter(a => a.decision_id !== id);
    this.memoryData.risks = this.memoryData.risks.filter(r => r.decision_id !== id);
    this.memoryData.analyses = this.memoryData.analyses.filter(a => a.decision_id !== id);
    this.memoryData.sensitivity_runs = this.memoryData.sensitivity_runs.filter(s => s.decision_id !== id);
    this.memoryData.final_decisions = this.memoryData.final_decisions.filter(f => f.decision_id !== id);

    this.saveLocalFile();
    return true;
  }

  // --- Alternatives ---
  async getAlternatives(decisionId: string): Promise<Alternative[]> {
    if (this.isSupabaseActive && this.supabase) {
      const { data } = await this.supabase.from('alternatives').select('*').eq('decision_id', decisionId).order('created_at', { ascending: true });
      return data || [];
    }
    return this.memoryData.alternatives.filter(a => a.decision_id === decisionId);
  }

  async createAlternative(decisionId: string, alt: Omit<Alternative, 'id' | 'decision_id' | 'created_at' | 'updated_at'>): Promise<Alternative> {
    const now = new Date().toISOString();
    const record: Alternative = {
      ...alt,
      id: crypto.randomUUID(),
      decision_id: decisionId,
      created_at: now,
      updated_at: now,
    };

    if (this.isSupabaseActive && this.supabase) {
      const { data, error } = await this.supabase.from('alternatives').insert(record).select().single();
      if (error) throw error;
      return data;
    }

    this.memoryData.alternatives.push(record);
    this.saveLocalFile();
    return record;
  }

  async updateAlternative(id: string, updates: Partial<Alternative>): Promise<Alternative | null> {
    const now = new Date().toISOString();
    if (this.isSupabaseActive && this.supabase) {
      const { data, error } = await this.supabase.from('alternatives').update({ ...updates, updated_at: now }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }

    const item = this.memoryData.alternatives.find(a => a.id === id);
    if (!item) return null;
    Object.assign(item, { ...updates, updated_at: now });
    this.saveLocalFile();
    return item;
  }

  async deleteAlternative(id: string): Promise<boolean> {
    if (this.isSupabaseActive && this.supabase) {
      const { error } = await this.supabase.from('alternatives').delete().eq('id', id);
      return !error;
    }

    const idx = this.memoryData.alternatives.findIndex(a => a.id === id);
    if (idx === -1) return false;
    this.memoryData.alternatives.splice(idx, 1);
    this.memoryData.scores = this.memoryData.scores.filter(s => s.alternative_id !== id);
    this.memoryData.risks = this.memoryData.risks.filter(r => r.alternative_id !== id);
    this.saveLocalFile();
    return true;
  }

  // --- Criteria ---
  async getCriteria(decisionId: string): Promise<Criterion[]> {
    if (this.isSupabaseActive && this.supabase) {
      const { data } = await this.supabase.from('criteria').select('*').eq('decision_id', decisionId).order('created_at', { ascending: true });
      return data || [];
    }
    return this.memoryData.criteria.filter(c => c.decision_id === decisionId);
  }

  async createCriterion(decisionId: string, crit: Omit<Criterion, 'id' | 'decision_id' | 'created_at' | 'updated_at'>): Promise<Criterion> {
    const now = new Date().toISOString();
    const record: Criterion = {
      ...crit,
      id: crypto.randomUUID(),
      decision_id: decisionId,
      created_at: now,
      updated_at: now,
    };

    if (this.isSupabaseActive && this.supabase) {
      const { data, error } = await this.supabase.from('criteria').insert(record).select().single();
      if (error) throw error;
      return data;
    }

    this.memoryData.criteria.push(record);
    this.saveLocalFile();
    return record;
  }

  async updateCriterion(id: string, updates: Partial<Criterion>): Promise<Criterion | null> {
    const now = new Date().toISOString();
    if (this.isSupabaseActive && this.supabase) {
      const { data, error } = await this.supabase.from('criteria').update({ ...updates, updated_at: now }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }

    const item = this.memoryData.criteria.find(c => c.id === id);
    if (!item) return null;
    Object.assign(item, { ...updates, updated_at: now });
    this.saveLocalFile();
    return item;
  }

  async deleteCriterion(id: string): Promise<boolean> {
    if (this.isSupabaseActive && this.supabase) {
      const { error } = await this.supabase.from('criteria').delete().eq('id', id);
      return !error;
    }

    const idx = this.memoryData.criteria.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.memoryData.criteria.splice(idx, 1);
    this.memoryData.scores = this.memoryData.scores.filter(s => s.criterion_id !== id);
    this.saveLocalFile();
    return true;
  }

  // --- Scores ---
  async getScoresForDecision(decisionId: string): Promise<AlternativeScore[]> {
    const alternatives = await this.getAlternatives(decisionId);
    const altIds = alternatives.map(a => a.id);

    if (this.isSupabaseActive && this.supabase) {
      const { data } = await this.supabase.from('alternative_scores').select('*').in('alternative_id', altIds);
      return data || [];
    }

    return this.memoryData.scores.filter(s => altIds.includes(s.alternative_id));
  }

  async saveScores(scores: Array<Omit<AlternativeScore, 'id' | 'created_at' | 'updated_at'>>): Promise<AlternativeScore[]> {
    const now = new Date().toISOString();
    const results: AlternativeScore[] = [];

    for (const score of scores) {
      if (this.isSupabaseActive && this.supabase) {
        const { data, error } = await this.supabase
          .from('alternative_scores')
          .upsert({
            alternative_id: score.alternative_id,
            criterion_id: score.criterion_id,
            raw_value: score.raw_value,
            qualitative_value: score.qualitative_value,
            normalized_score: score.normalized_score,
            weighted_score: score.weighted_score,
            updated_at: now,
          }, { onConflict: 'alternative_id,criterion_id' })
          .select()
          .single();
        if (!error && data) results.push(data);
      } else {
        const existing = this.memoryData.scores.find(
          s => s.alternative_id === score.alternative_id && s.criterion_id === score.criterion_id
        );
        if (existing) {
          Object.assign(existing, { ...score, updated_at: now });
          results.push(existing);
        } else {
          const newScore: AlternativeScore = {
            ...score,
            id: crypto.randomUUID(),
            created_at: now,
            updated_at: now,
          };
          this.memoryData.scores.push(newScore);
          results.push(newScore);
        }
      }
    }

    if (!this.isSupabaseActive) {
      this.saveLocalFile();
    }

    return results;
  }

  // --- Evidence ---
  async getEvidence(decisionId: string): Promise<Evidence[]> {
    if (this.isSupabaseActive && this.supabase) {
      const { data } = await this.supabase.from('evidence').select('*').eq('decision_id', decisionId).order('created_at', { ascending: false });
      return data || [];
    }
    return this.memoryData.evidence.filter(e => e.decision_id === decisionId);
  }

  async createEvidence(decisionId: string, item: Omit<Evidence, 'id' | 'decision_id' | 'created_at' | 'updated_at'>): Promise<Evidence> {
    const now = new Date().toISOString();
    const record: Evidence = {
      ...item,
      id: crypto.randomUUID(),
      decision_id: decisionId,
      created_at: now,
      updated_at: now,
    };

    if (this.isSupabaseActive && this.supabase) {
      const { data, error } = await this.supabase.from('evidence').insert(record).select().single();
      if (error) throw error;
      return data;
    }

    this.memoryData.evidence.push(record);
    this.saveLocalFile();
    return record;
  }

  async updateEvidence(id: string, updates: Partial<Evidence>): Promise<Evidence | null> {
    const now = new Date().toISOString();
    if (this.isSupabaseActive && this.supabase) {
      const { data, error } = await this.supabase.from('evidence').update({ ...updates, updated_at: now }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }

    const item = this.memoryData.evidence.find(e => e.id === id);
    if (!item) return null;
    Object.assign(item, { ...updates, updated_at: now });
    this.saveLocalFile();
    return item;
  }

  async deleteEvidence(id: string): Promise<boolean> {
    if (this.isSupabaseActive && this.supabase) {
      const { error } = await this.supabase.from('evidence').delete().eq('id', id);
      return !error;
    }

    const idx = this.memoryData.evidence.findIndex(e => e.id === id);
    if (idx === -1) return false;
    this.memoryData.evidence.splice(idx, 1);
    this.saveLocalFile();
    return true;
  }

  // --- Assumptions ---
  async getAssumptions(decisionId: string): Promise<Assumption[]> {
    if (this.isSupabaseActive && this.supabase) {
      const { data } = await this.supabase.from('assumptions').select('*').eq('decision_id', decisionId).order('created_at', { ascending: false });
      return data || [];
    }
    return this.memoryData.assumptions.filter(a => a.decision_id === decisionId);
  }

  async createAssumption(decisionId: string, item: Omit<Assumption, 'id' | 'decision_id' | 'created_at' | 'updated_at'>): Promise<Assumption> {
    const now = new Date().toISOString();
    const record: Assumption = {
      ...item,
      id: crypto.randomUUID(),
      decision_id: decisionId,
      created_at: now,
      updated_at: now,
    };

    if (this.isSupabaseActive && this.supabase) {
      const { data, error } = await this.supabase.from('assumptions').insert(record).select().single();
      if (error) throw error;
      return data;
    }

    this.memoryData.assumptions.push(record);
    this.saveLocalFile();
    return record;
  }

  async updateAssumption(id: string, updates: Partial<Assumption>): Promise<Assumption | null> {
    const now = new Date().toISOString();
    if (this.isSupabaseActive && this.supabase) {
      const { data, error } = await this.supabase.from('assumptions').update({ ...updates, updated_at: now }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }

    const item = this.memoryData.assumptions.find(a => a.id === id);
    if (!item) return null;
    Object.assign(item, { ...updates, updated_at: now });
    this.saveLocalFile();
    return item;
  }

  async deleteAssumption(id: string): Promise<boolean> {
    if (this.isSupabaseActive && this.supabase) {
      const { error } = await this.supabase.from('assumptions').delete().eq('id', id);
      return !error;
    }

    const idx = this.memoryData.assumptions.findIndex(a => a.id === id);
    if (idx === -1) return false;
    this.memoryData.assumptions.splice(idx, 1);
    this.saveLocalFile();
    return true;
  }

  // --- Risks ---
  async getRisks(decisionId: string): Promise<Risk[]> {
    if (this.isSupabaseActive && this.supabase) {
      const { data } = await this.supabase.from('risks').select('*').eq('decision_id', decisionId).order('created_at', { ascending: false });
      return data || [];
    }
    return this.memoryData.risks.filter(r => r.decision_id === decisionId);
  }

  async createRisk(decisionId: string, item: Omit<Risk, 'id' | 'decision_id' | 'risk_score' | 'created_at' | 'updated_at'>): Promise<Risk> {
    const now = new Date().toISOString();
    const score = item.probability * item.impact;
    const record: Risk = {
      ...item,
      id: crypto.randomUUID(),
      decision_id: decisionId,
      risk_score: score,
      created_at: now,
      updated_at: now,
    };

    if (this.isSupabaseActive && this.supabase) {
      const { data, error } = await this.supabase.from('risks').insert(record).select().single();
      if (error) throw error;
      return data;
    }

    this.memoryData.risks.push(record);
    this.saveLocalFile();
    return record;
  }

  async updateRisk(id: string, updates: Partial<Risk>): Promise<Risk | null> {
    const now = new Date().toISOString();
    if (this.isSupabaseActive && this.supabase) {
      const { data, error } = await this.supabase.from('risks').update({ ...updates, updated_at: now }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }

    const item = this.memoryData.risks.find(r => r.id === id);
    if (!item) return null;
    const newProb = updates.probability ?? item.probability;
    const newImp = updates.impact ?? item.impact;
    Object.assign(item, {
      ...updates,
      risk_score: newProb * newImp,
      updated_at: now,
    });
    this.saveLocalFile();
    return item;
  }

  async deleteRisk(id: string): Promise<boolean> {
    if (this.isSupabaseActive && this.supabase) {
      const { error } = await this.supabase.from('risks').delete().eq('id', id);
      return !error;
    }

    const idx = this.memoryData.risks.findIndex(r => r.id === id);
    if (idx === -1) return false;
    this.memoryData.risks.splice(idx, 1);
    this.saveLocalFile();
    return true;
  }

  // --- Analyses ---
  async getLatestAnalysis(decisionId: string): Promise<Analysis | null> {
    if (this.isSupabaseActive && this.supabase) {
      const { data } = await this.supabase
        .from('analyses')
        .select('*')
        .eq('decision_id', decisionId)
        .order('version', { ascending: false })
        .limit(1)
        .single();
      return data || null;
    }

    const matched = this.memoryData.analyses
      .filter(a => a.decision_id === decisionId)
      .sort((a, b) => b.version - a.version);
    return matched[0] || null;
  }

  async saveAnalysis(analysis: Omit<Analysis, 'id' | 'created_at'>): Promise<Analysis> {
    const now = new Date().toISOString();
    const record: Analysis = {
      ...analysis,
      id: crypto.randomUUID(),
      created_at: now,
    };

    if (this.isSupabaseActive && this.supabase) {
      const { data, error } = await this.supabase.from('analyses').insert(record).select().single();
      if (error) throw error;
      return data;
    }

    this.memoryData.analyses.push(record);
    this.saveLocalFile();
    return record;
  }

  // --- Sensitivity Runs ---
  async saveSensitivityRun(run: Omit<SensitivityRun, 'id' | 'created_at'>): Promise<SensitivityRun> {
    const now = new Date().toISOString();
    const record: SensitivityRun = {
      ...run,
      id: crypto.randomUUID(),
      created_at: now,
    };

    if (this.isSupabaseActive && this.supabase) {
      const { data, error } = await this.supabase.from('sensitivity_runs').insert(record).select().single();
      if (error) throw error;
      return data;
    }

    this.memoryData.sensitivity_runs.push(record);
    this.saveLocalFile();
    return record;
  }

  // --- Final Decisions ---
  async getFinalDecision(decisionId: string): Promise<FinalDecision | null> {
    if (this.isSupabaseActive && this.supabase) {
      const { data } = await this.supabase.from('final_decisions').select('*').eq('decision_id', decisionId).single();
      return data || null;
    }
    return this.memoryData.final_decisions.find(f => f.decision_id === decisionId) || null;
  }

  async saveFinalDecision(finalDecision: Omit<FinalDecision, 'id' | 'decided_at'>): Promise<FinalDecision> {
    const now = new Date().toISOString();
    const record: FinalDecision = {
      ...finalDecision,
      id: crypto.randomUUID(),
      decided_at: now,
    };

    if (this.isSupabaseActive && this.supabase) {
      const { data, error } = await this.supabase
        .from('final_decisions')
        .upsert(record, { onConflict: 'decision_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const existingIdx = this.memoryData.final_decisions.findIndex(f => f.decision_id === finalDecision.decision_id);
    if (existingIdx !== -1) {
      this.memoryData.final_decisions[existingIdx] = record;
    } else {
      this.memoryData.final_decisions.push(record);
    }
    this.saveLocalFile();
    return record;
  }

  // Populate sample decision if store is empty for instant demonstration
  async seedSampleDecisionIfEmpty(userId: string): Promise<void> {
    const existing = await this.listDecisions(userId);
    if (existing.length > 0) return;

    console.log('[Seed] Populating initial sample decision for user:', userId);
    const d = await this.createDecision({
      user_id: userId,
      title: 'Select Cloud Infrastructure for High-Traffic SaaS Platform',
      decision_question: 'Which cloud provider best satisfies our reliability, multi-region scalability, monthly cost, and developer productivity requirements?',
      description: 'Evaluating AWS vs Google Cloud Platform vs Self-Hosted Kubernetes to support our anticipated 10x traffic expansion over the next 18 months.',
      domain: 'Technology',
      status: 'analysis_ready',
      deadline: '2026-10-15',
      desired_outcome: 'Achieve 99.99% uptime with <$15,000 monthly compute expenses and high engineering team velocity.',
      constraints: 'Must comply with SOC2, support Terraform infrastructure-as-code, and offer managed Kubernetes.',
      decision_style: 'balanced',
    });

    const alt1 = await this.createAlternative(d.id, {
      name: 'Google Cloud Platform (GKE + Cloud Spanner)',
      description: 'Fully managed Kubernetes with native BigQuery data warehouse and global Anycast IP routing.',
      estimated_cost: 11200,
      estimated_benefit: 45000,
      implementation_effort: 35,
      duration_days: 30,
      notes: 'Strongest Kubernetes ergonomics and AI integration capabilities.',
    });

    const alt2 = await this.createAlternative(d.id, {
      name: 'Amazon Web Services (EKS + Aurora Postgres)',
      description: 'Industry-standard cloud ecosystem with widest third-party partner integrations and mature enterprise support.',
      estimated_cost: 13800,
      estimated_benefit: 42000,
      implementation_effort: 45,
      duration_days: 45,
      notes: 'Most team members have AWS certifications; higher base data egress pricing.',
    });

    const alt3 = await this.createAlternative(d.id, {
      name: 'Hybrid Bare-Metal / Self-Hosted Kubernetes (Equinix)',
      description: 'Custom bare-metal deployment offering maximum raw CPU performance and zero vendor lock-in.',
      estimated_cost: 6500,
      estimated_benefit: 32000,
      implementation_effort: 85,
      duration_days: 90,
      notes: 'Substantially lowest monthly hosting cost, but requires significant 24/7 DevOps staffing overhead.',
    });

    const crit1 = await this.createCriterion(d.id, {
      name: 'Monthly Infrastructure Cost ($)',
      description: 'Total monthly projected cost for compute, storage, and networking.',
      criterion_type: 'quantitative',
      weight: 30,
      direction: 'lower_better',
      unit: 'USD',
      min_value: 5000,
      max_value: 20000,
    });

    const crit2 = await this.createCriterion(d.id, {
      name: 'System Reliability & Uptime SLA (%)',
      description: 'Documented provider SLA and disaster recovery redundancy.',
      criterion_type: 'quantitative',
      weight: 35,
      direction: 'higher_better',
      unit: '%',
      min_value: 99.0,
      max_value: 99.999,
    });

    const crit3 = await this.createCriterion(d.id, {
      name: 'Developer Velocity & Time-to-Market',
      description: 'Turnaround speed for staging environments, CI/CD integrations, and managed services.',
      criterion_type: 'rating',
      weight: 20,
      direction: 'higher_better',
      unit: '1-5 scale',
      min_value: 1,
      max_value: 5,
    });

    const crit4 = await this.createCriterion(d.id, {
      name: 'Operational Maintenance Overhead',
      description: 'DevOps hours required per sprint to maintain clusters, patching, and backups.',
      criterion_type: 'quantitative',
      weight: 15,
      direction: 'lower_better',
      unit: 'Hours/month',
      min_value: 10,
      max_value: 120,
    });

    // Populate scores
    await this.saveScores([
      // GCP
      { alternative_id: alt1.id, criterion_id: crit1.id, raw_value: 11200 },
      { alternative_id: alt1.id, criterion_id: crit2.id, raw_value: 99.99 },
      { alternative_id: alt1.id, criterion_id: crit3.id, raw_value: 5 },
      { alternative_id: alt1.id, criterion_id: crit4.id, raw_value: 20 },
      // AWS
      { alternative_id: alt2.id, criterion_id: crit1.id, raw_value: 13800 },
      { alternative_id: alt2.id, criterion_id: crit2.id, raw_value: 99.95 },
      { alternative_id: alt2.id, criterion_id: crit3.id, raw_value: 4 },
      { alternative_id: alt2.id, criterion_id: crit4.id, raw_value: 30 },
      // Hybrid
      { alternative_id: alt3.id, criterion_id: crit1.id, raw_value: 6500 },
      { alternative_id: alt3.id, criterion_id: crit2.id, raw_value: 99.5 },
      { alternative_id: alt3.id, criterion_id: crit3.id, raw_value: 2 },
      { alternative_id: alt3.id, criterion_id: crit4.id, raw_value: 95 },
    ]);

    // Populate evidence
    await this.createEvidence(d.id, {
      title: 'Current AWS CloudWatch & Invoice Audit',
      evidence_type: 'internal_data',
      source: 'FinOps Team Q2 Report',
      description: 'Baseline workloads currently run on 12 AWS t3.xlarge nodes consuming $9,800/mo. Egress bandwidth accounts for 22% of line item costs.',
      reliability: 95,
      evidence_date: '2026-08-01',
    });

    await this.createEvidence(d.id, {
      title: 'Google Cloud GKE Benchmark Pilot',
      evidence_type: 'research',
      source: 'Infrastructure POC Sprint',
      description: 'Tested 50,000 synthetic rps through GKE Autopilot with Cloud Spanner; p99 latency was 14ms compared to AWS 28ms.',
      reliability: 88,
      evidence_date: '2026-08-20',
    });

    // Populate assumptions
    await this.createAssumption(d.id, {
      name: 'Projected Traffic Growth Rate',
      value: '25% MoM',
      confidence: 80,
      source: 'Growth Marketing Pipeline Model',
      notes: 'Assumes successful rollout of self-serve enterprise tier in Q4.',
    });

    await this.createAssumption(d.id, {
      name: 'Internal DevOps Capacity',
      value: '2 Full-Time Engineers',
      confidence: 90,
      source: 'Engineering Headcount Plan',
      notes: 'No budget allocated for dedicated night-shift SRE rotation in the next fiscal year.',
    });

    // Populate risks
    await this.createRisk(d.id, {
      alternative_id: alt3.id,
      name: 'Unplanned Outage Due to Bare-Metal Hardware Failure',
      description: 'Physical drive or PSU failure requires data center technician dispatch without automatic hypervisor migration.',
      probability: 4,
      impact: 5,
      mitigation: 'Procure hot-standby nodes and configure multi-chassis link aggregation.',
      owner: 'Principal Architect',
    });

    await this.createRisk(d.id, {
      alternative_id: alt2.id,
      name: 'Egress Bandwidth Cost Explosion',
      description: 'Multi-region data replication over internet gateways could double projected network charges.',
      probability: 3,
      impact: 4,
      mitigation: 'Enforce CloudFront caching and VPC peering interconnects.',
      owner: 'Lead SRE',
    });

    await this.createRisk(d.id, {
      alternative_id: alt1.id,
      name: 'Team Learning Curve with GCP IAM Policies',
      description: 'Engineers accustomed to AWS IAM role policies may encounter initial permission configuration delays.',
      probability: 2,
      impact: 2,
      mitigation: 'Conduct team Google Cloud Associate Cloud Engineer workshop.',
      owner: 'DevOps Lead',
    });
  }
}

export const store = new PersistenceStore();
