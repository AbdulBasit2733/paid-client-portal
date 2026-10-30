import { Router, Response } from 'express';
import { prisma } from '../config/clients';
import { AuthenticatedRequest, requireSupabaseAuth } from '../middleware/auth';
import { syncPurchaseToZoho } from '../services/zohoService';

export const zohoRouter = Router();

/**
 * POST /api/zoho/retry/:purchaseId
 * Allows an authenticated client to retry a PENDING/FAILED Zoho CRM Deal update
 * for their own purchase without affecting their active document access.
 */
zohoRouter.post(
  '/retry/:purchaseId',
  requireSupabaseAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const purchaseId = String(req.params.purchaseId);
      const authUser = req.user!;

      const purchase = await prisma.purchase.findUnique({
        where: { id: purchaseId },
        include: { zohoSync: true },
      });

      if (!purchase) {
        res.status(404).json({ error: 'Purchase record not found.' });
        return;
      }

      // Enforce strict tenant isolation: a client cannot trigger retry for another client's purchase
      if (purchase.userId !== authUser.id) {
        res.status(403).json({
          error: 'Access denied: You can only retry Zoho CRM sync for your own purchase.',
        });
        return;
      }

      const simulateFailure = req.body?.simulateFailure === true;
      const result = await syncPurchaseToZoho(purchase.id, { simulateFailure });

      res.json({
        alreadySynced: result.alreadySynced,
        syncLog: result.syncLog,
      });
    } catch (err) {
      console.error('[ZohoRetry] Error retrying Zoho sync:', err);
      res.status(500).json({
        error: 'Failed to retry Zoho CRM sync.',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
);
