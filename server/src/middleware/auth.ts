import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { store } from '../services/store.js';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  full_name?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Fallback demo user for local developer preview
export const LOCAL_DEMO_USER: AuthenticatedUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'architect@decisionflow.ai',
  full_name: 'Lead Decision Architect',
};

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  // If Supabase is active, verify JWT token with Supabase Auth
  if (store.isSupabaseActive && process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
      );

      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
        return;
      }

      req.user = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
      };
      next();
      return;
    } catch (err: any) {
      console.error('[Auth Middleware] Verification error:', err.message);
      res.status(401).json({ error: 'Unauthorized: Session validation failed' });
      return;
    }
  }

  // Local storage mode: allow dev token or extract user ID if provided
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token === 'demo-token' || token.length > 5) {
      // Decode if it's base64 user info, otherwise use LOCAL_DEMO_USER or custom ID
      try {
        if (token.startsWith('user_')) {
          req.user = {
            id: token,
            email: `${token}@decisionflow.local`,
            full_name: 'Local User',
          };
        } else {
          req.user = LOCAL_DEMO_USER;
        }
      } catch {
        req.user = LOCAL_DEMO_USER;
      }
      next();
      return;
    }
  }

  // If no auth header in local mode, default to LOCAL_DEMO_USER
  req.user = LOCAL_DEMO_USER;
  next();
}

/**
 * Verifies that the decision belongs to the authenticated user
 */
export async function verifyDecisionOwnership(
  decisionId: string,
  userId: string,
  res: Response
): Promise<boolean> {
  const decision = await store.getDecision(decisionId, userId);
  if (!decision) {
    res.status(404).json({ error: 'Decision not found or access denied' });
    return false;
  }
  return true;
}
