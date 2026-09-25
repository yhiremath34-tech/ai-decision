import { Request, Response, NextFunction } from 'express';
import { store } from '../services/store.js';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  full_name?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Default open workspace user (No login or account creation required)
export const OPEN_WORKSPACE_USER: AuthenticatedUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'workspace@decisionflow.ai',
  full_name: 'Decision Architect',
};

export const LOCAL_DEMO_USER = OPEN_WORKSPACE_USER;

/**
 * Open Access Middleware:
 * Allows free and instant access to all endpoints without requiring an account or login.
 */
export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const workspaceHeader = req.headers['x-workspace-id'] as string;

  req.user = {
    id: workspaceHeader || OPEN_WORKSPACE_USER.id,
    email: OPEN_WORKSPACE_USER.email,
    full_name: OPEN_WORKSPACE_USER.full_name,
  };

  next();
}

/**
 * Verifies that the decision exists in storage
 */
export async function verifyDecisionOwnership(
  decisionId: string,
  userId: string,
  res: Response
): Promise<boolean> {
  const decision = await store.getDecision(decisionId, userId);
  if (!decision) {
    res.status(404).json({ error: 'Decision not found' });
    return false;
  }
  return true;
}
