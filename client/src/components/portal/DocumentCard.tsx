import {
  CreditCard,
  Lock,
  Unlock,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { DocumentReader } from './DocumentReader';
import {
  formatINR,
  type DocumentContentRow,
  type DocumentRow,
  type PurchaseRow,
  type ZohoSyncLogRow,
} from '../../types/portal';

interface DocumentCardProps {
  document: DocumentRow;
  index: number;
  totalDocuments: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  purchase?: PurchaseRow;
  syncLog?: ZohoSyncLogRow;
  unlockedContent?: DocumentContentRow;
  checkoutLoading: boolean;
  retryingSync: boolean;
  onStartCheckout: (documentId: string) => void;
  onRetrySync: (purchaseId: string) => void;
}

export function DocumentCard({
  document,
  index,
  totalDocuments,
  isExpanded,
  onToggleExpand,
  purchase,
  syncLog,
  unlockedContent,
  checkoutLoading,
  retryingSync,
  onStartCheckout,
  onRetrySync,
}: DocumentCardProps) {
  const isUnlocked = Boolean(purchase && purchase.status === 'PAID' && unlockedContent);
  const formattedPrice = formatINR(document.price_cents);

  return (
    <Card
      className={
        isUnlocked
          ? 'border-emerald-300 shadow-md transition-all'
          : 'border-slate-200 shadow-sm transition-all'
      }
    >
      {/* Card Header (Clickable to Expand/Collapse when client has multiple documents) */}
      <CardHeader
        onClick={totalDocuments > 1 ? onToggleExpand : undefined}
        className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${
          isExpanded ? 'border-b border-slate-100 pb-5' : 'pb-6'
        } ${totalDocuments > 1 ? 'cursor-pointer hover:bg-slate-50/70 rounded-t-xl' : ''}`}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {totalDocuments > 1 && (
              <span className="rounded-md bg-[#EEF3FD] px-2 py-0.5 text-xs font-bold text-[#2F5CEA]">
                Document {index + 1} of {totalDocuments}
              </span>
            )}

            {isUnlocked ? (
              <Badge variant="default">
                <Unlock className="h-3 w-3" aria-hidden="true" />
                <span>Unlocked &amp; Ready to Read</span>
              </Badge>
            ) : (
              <Badge variant="warning">
                <Lock className="h-3 w-3" aria-hidden="true" />
                <span>Locked — Payment Required</span>
              </Badge>
            )}

            {syncLog && (
              <Badge
                variant={
                  syncLog.status === 'SUCCESS'
                    ? 'default'
                    : syncLog.status === 'PENDING'
                      ? 'warning'
                      : 'destructive'
                }
              >
                {syncLog.status === 'SUCCESS' ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    <span>Zoho Deal Updated</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span>CRM Sync Pending</span>
                  </>
                )}
              </Badge>
            )}

            {document.zoho_deal_id && (
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Deal #{document.zoho_deal_id}
              </span>
            )}
          </div>

          <CardTitle className="text-xl text-[#0B132B]">{document.title}</CardTitle>
          <CardDescription className="max-w-2xl">{document.description}</CardDescription>
        </div>

        {/* Right Price & Expand Indicator */}
        <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
          <div className="flex flex-col items-start sm:items-end rounded-xl bg-[#F4F7FE] border border-[#2F5CEA]/15 px-4 py-2">
            <span className="text-xl sm:text-2xl font-extrabold text-[#0B132B]">
              {formattedPrice}
            </span>
            <span className="text-[11px] font-semibold text-[#2F5CEA]">
              {isUnlocked ? 'Paid in Full (INR)' : 'One-Time Fee (INR)'}
            </span>
          </div>

          {totalDocuments > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse document details' : 'Expand document details'}
            >
              {isExpanded ? (
                <>
                  <span className="text-xs">Collapse</span>
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                </>
              ) : (
                <>
                  <span className="text-xs">Expand</span>
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Expandable Document Content & Footer */}
      {isExpanded && (
        <>
          <CardContent className="pt-6">
            {isUnlocked && unlockedContent && purchase ? (
              <DocumentReader content={unlockedContent} purchase={purchase} />
            ) : (
              /* Client-Friendly Locked Preview Box */
              <div className="rounded-xl border border-dashed border-slate-300 bg-[#F4F7FE]/60 p-8 flex flex-col items-center justify-center text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Lock className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="space-y-1 max-w-md">
                  <h4 className="text-base font-bold text-[#0B132B]">
                    Unlock Your Full Advisory Report
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Complete a secure one-time payment of <strong>{formattedPrice}</strong> to
                    unlock and read this document immediately in your portal.
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-5 bg-slate-50/50 rounded-b-xl">
            <div className="text-xs text-slate-500">
              {isUnlocked
                ? 'You have permanent access to this document under your account.'
                : 'Secure online checkout powered by Stripe (Supports Cards in ₹ INR).'}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              {!isUnlocked ? (
                <Button
                  size="lg"
                  onClick={() => onStartCheckout(document.id)}
                  disabled={checkoutLoading}
                  className="w-full sm:w-auto"
                >
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {checkoutLoading
                      ? 'Opening Secure Checkout...'
                      : `Pay ${formattedPrice} to Unlock Document`}
                  </span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : (
                syncLog &&
                syncLog.status !== 'SUCCESS' &&
                purchase && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRetrySync(purchase.id)}
                    disabled={retryingSync}
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${retryingSync ? 'animate-spin' : ''}`}
                      aria-hidden="true"
                    />
                    <span>
                      {retryingSync ? 'Syncing Account Status...' : 'Retry Account Manager Sync'}
                    </span>
                  </Button>
                )
              )}
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
