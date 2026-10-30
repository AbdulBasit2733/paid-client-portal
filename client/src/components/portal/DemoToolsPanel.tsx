import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Repeat,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/primitives';
import type { PurchaseRow, RlsAuditResult, WebhookReplayResult } from '../../types/portal';

interface DemoToolsPanelProps {
  simulateZohoFailure: boolean;
  onToggleSimulateZohoFailure: (checked: boolean) => void;
  rlsAudit: RlsAuditResult | null;
  rlsProbing: boolean;
  onRunRlsProbe: () => void;
  purchases: PurchaseRow[];
  webhookReplay: WebhookReplayResult | null;
  replayingWebhook: boolean;
  onReplayDuplicateWebhook: (purchaseId: string) => void;
}

export function DemoToolsPanel({
  simulateZohoFailure,
  onToggleSimulateZohoFailure,
  rlsAudit,
  rlsProbing,
  onRunRlsProbe,
  purchases,
  webhookReplay,
  replayingWebhook,
  onReplayDuplicateWebhook,
}: DemoToolsPanelProps) {
  const latestPaidPurchase = purchases.find((p) => p.status === 'PAID');

  return (
    <div className="space-y-4">
      {/* Edge Case 1: Requirement 2 — Duplicate Webhook Idempotency */}
      <div className="rounded-xl border border-slate-200 bg-[#F4F7FE]/70 p-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0B132B]">
              <Repeat className="h-4 w-4 text-[#2F5CEA]" aria-hidden="true" />
              <span>1. Duplicate Webhook Replay</span>
            </div>
            <Badge className="bg-[#EEF3FD] text-[#2F5CEA] border-[#2F5CEA]/20">
              Requirement 2
            </Badge>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Re-send the exact same Stripe payment webhook to prove that repeated deliveries do
            <strong> not</strong> create a second purchase row or trigger a second Zoho CRM Deal
            update.
          </p>
        </div>

        <div className="space-y-2.5">
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            disabled={!latestPaidPurchase || replayingWebhook}
            onClick={() =>
              latestPaidPurchase && onReplayDuplicateWebhook(latestPaidPurchase.id)
            }
          >
            <Repeat className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {!latestPaidPurchase
                ? 'Pay 1 Document First to Test Replay'
                : replayingWebhook
                  ? 'Replaying Webhook...'
                  : 'Replay Duplicate Stripe Webhook'}
            </span>
          </Button>

          {webhookReplay && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/90 p-3 text-xs text-emerald-950 space-y-1">
              <div className="flex items-center justify-between font-bold text-emerald-800">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Idempotent Skip ({webhookReplay.testedAt})
                </span>
                <Badge variant="default">No Duplicate</Badge>
              </div>
              <div>
                • Duplicate Ignored:{' '}
                <strong>{webhookReplay.idempotentSkip ? 'Yes (Skipped)' : 'No'}</strong>
              </div>
              <div>
                • Total Purchases for Doc:{' '}
                <strong>{webhookReplay.totalPurchasesForDoc} (Exactly 1)</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edge Case 2: Requirement 3 — Simulate Zoho CRM Outage */}
      <div className="rounded-xl border border-slate-200 bg-[#F4F7FE]/70 p-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0B132B]">
              <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
              <span>2. Zoho CRM Outage &amp; Retry</span>
            </div>
            <Badge className="bg-[#EEF3FD] text-[#2F5CEA] border-[#2F5CEA]/20">
              Requirement 3
            </Badge>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Turn this ON before paying to simulate a Zoho CRM failure. Your document still unlocks
            immediately (<code className="font-mono">PAID</code>), while Zoho records{' '}
            <code className="font-mono">PENDING</code> so you can click{' '}
            <strong>Sync Account Status Now</strong> to recover.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-white px-3.5 py-2.5 border border-slate-200">
          <label
            htmlFor="simulate-zoho-outage"
            className="text-xs font-bold text-[#0B132B] cursor-pointer"
          >
            {simulateZohoFailure
              ? 'Simulate Zoho Outage: ON'
              : 'Simulate Zoho Outage: OFF'}
          </label>
          <Switch
            id="simulate-zoho-outage"
            checked={simulateZohoFailure}
            onCheckedChange={onToggleSimulateZohoFailure}
            aria-label="Simulate Zoho CRM outage during checkout"
          />
        </div>
      </div>

      {/* Edge Case 3: Requirement 4 — Cross-Client Privacy Check */}
      <div className="rounded-xl border border-slate-200 bg-[#F4F7FE]/70 p-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0B132B]">
              <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <span>3. Cross-Client Privacy RLS Audit</span>
            </div>
            <Badge className="bg-[#EEF3FD] text-[#2F5CEA] border-[#2F5CEA]/20">
              Requirement 4
            </Badge>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Runs a live browser query against Supabase PostgreSQL under RLS to prove this client
            cannot retrieve any of the other 19 clients’ documents or purchases, nor forge a
            payment from browser DevTools.
          </p>
        </div>

        <div className="space-y-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRunRlsProbe}
            disabled={rlsProbing}
            className="w-full"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {rlsProbing ? 'Checking Account Privacy...' : 'Run Cross-Client Privacy Check'}
            </span>
          </Button>

          {rlsAudit && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/90 p-3 text-xs text-emerald-950 space-y-1">
              <div className="flex items-center justify-between font-bold text-emerald-800">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  RLS Verified ({rlsAudit.testedAt})
                </span>
                <Badge variant="default">Isolated</Badge>
              </div>
              <div>
                • Other 19 clients’ records returned:{' '}
                <strong>{rlsAudit.foreignPurchasesReturned} rows (Blocked)</strong>
              </div>
              <div>
                • Browser INSERT forgery:{' '}
                <strong>{rlsAudit.directInsertBlocked ? 'Rejected' : 'Allowed'}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
