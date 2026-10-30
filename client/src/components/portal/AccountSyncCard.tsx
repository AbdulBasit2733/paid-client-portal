import {
  CheckCircle2,
  Clock,
  RefreshCw,
  ReceiptIndianRupee,
  Building2,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import {
  formatINR,
  type PurchaseRow,
  type UserProfileRow,
  type ZohoSyncLogRow,
} from '../../types/portal';

interface AccountSyncCardProps {
  profile: UserProfileRow | null;
  purchases: PurchaseRow[];
  syncLogs: ZohoSyncLogRow[];
  retryingPurchaseId: string | null;
  onRetrySync: (purchaseId: string) => void;
}

export function AccountSyncCard({
  profile,
  purchases,
  syncLogs,
  retryingPurchaseId,
  onRetrySync,
}: AccountSyncCardProps) {
  return (
    <div className="space-y-6">
      {/* Account Summary Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <Building2 className="h-4 w-4" aria-hidden="true" />
            <span>Your Client Account</span>
          </div>
          <CardTitle className="text-lg pt-1">{profile?.name || 'Client Account'}</CardTitle>
          <CardDescription>{profile?.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200/80 px-3 py-2.5">
            <span className="text-slate-500 font-medium">Account Deal Reference</span>
            <span className="font-mono font-semibold text-slate-800">
              #{profile?.zoho_deal_id || 'Not Assigned'}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200/80 px-3 py-2.5">
            <span className="text-slate-500 font-medium">Unlocked Documents</span>
            <span className="font-semibold text-emerald-700">
              {purchases.filter((p) => p.status === 'PAID').length} Paid
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Receipts & Account Manager (Zoho CRM) Sync Status */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <ReceiptIndianRupee className="h-4 w-4" aria-hidden="true" />
            <span>Payment &amp; Account Status</span>
          </div>
          <CardTitle className="text-lg pt-1">Order History &amp; CRM Sync</CardTitle>
          <CardDescription>
            Shows your completed payments in ₹ INR and whether your dedicated account manager’s CRM
            record has been updated.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {purchases.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center text-xs text-slate-500">
              No payments completed yet. Once you unlock a document, your receipt and account sync
              status will appear here.
            </div>
          ) : (
            purchases.map((purchase) => {
              const syncLog = syncLogs.find((s) => s.purchase_id === purchase.id);
              const isSynced = syncLog?.status === 'SUCCESS';
              const isRetrying = retryingPurchaseId === purchase.id;

              return (
                <div
                  key={purchase.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      Paid {formatINR(purchase.amount_cents)}
                    </span>
                    <Badge variant="default">Payment Confirmed</Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Account Manager CRM Status:</span>
                      {isSynced ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Synced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          Sync Pending
                        </span>
                      )}
                    </div>

                    {syncLog?.synced_at && (
                      <div className="text-[11px] text-slate-500">
                        Updated on {new Date(syncLog.synced_at).toLocaleString('en-IN')}
                      </div>
                    )}

                    {!isSynced && syncLog && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900 space-y-1">
                        <div className="font-semibold">
                          Your document is already unlocked!
                        </div>
                        <div>
                          Our CRM system was temporarily unreachable during payment (Attempt #
                          {syncLog.attempts}). Click below to finish syncing your account record.
                        </div>
                      </div>
                    )}
                  </div>

                  {syncLog && (
                    <Button
                      variant={isSynced ? 'outline' : 'default'}
                      size="sm"
                      className="w-full"
                      onClick={() => onRetrySync(purchase.id)}
                      disabled={isRetrying}
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`}
                        aria-hidden="true"
                      />
                      <span>
                        {isRetrying
                          ? 'Syncing with CRM...'
                          : isSynced
                            ? 'Re-verify CRM Sync Status'
                            : 'Sync Account Status Now'}
                      </span>
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
