import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/clients';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export async function requireSupabaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Missing or invalid Authorization header. Expected Bearer <supabase_access_token>.',
      });
      return;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      res.status(401).json({
        error: 'Invalid or expired Supabase session token.',
        details: error?.message,
      });
      return;
    }

    req.user = {
      id: data.user.id,
      email: data.user.email || '',
    };

    next();
  } catch (err) {
    res.status(500).json({
      error: 'Failed to verify authentication token.',
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
