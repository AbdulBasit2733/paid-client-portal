import { useState } from 'react';
import {
  ShieldCheck,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/primitives';
import type { RlsAuditResult } from '../../types/portal';

interface DemoToolsPanelProps {
  simulateZohoFailure: boolean;
  onToggleSimulateZohoFailure: (checked: boolean) => void;
  rlsAudit: RlsAuditResult | null;
  rlsProbing: boolean;
  onRunRlsProbe: () => void;
}

export function DemoToolsPanel({
  simulateZohoFailure,
  onToggleSimulateZohoFailure,
  rlsAudit,
  rlsProbing,
  onRunRlsProbe,
}: DemoToolsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-slate-200 bg-slate-50/80">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200/80 text-slate-700">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Walkthrough &amp; Testing Controls (Evaluator Demo Mode)
                </span>
                {simulateZohoFailure && (
                  <Badge variant="warning">CRM Outage Simulation ON</Badge>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Optional controls to test CRM outage recovery and verify account privacy between
                clients.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
          >
            <span>{isOpen ? 'Hide Demo Controls' : 'Show Demo Controls'}</span>
            {isOpen ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </Button>
        </div>

        {isOpen && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Control 1: Simulate CRM Outage */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  <span>1. Test Zoho CRM Outage Recovery</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Turn this on before paying to simulate a temporary Zoho CRM outage. Your document
                  will still unlock immediately after payment, while the CRM status will show{' '}
                  <strong>Sync Pending</strong> so you can test the retry button.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 border border-slate-200/80">
                <label
                  htmlFor="simulate-zoho-outage"
                  className="text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  {simulateZohoFailure
                    ? 'Simulate CRM Outage: Enabled'
                    : 'Simulate CRM Outage: Disabled'}
                </label>
                <Switch
                  id="simulate-zoho-outage"
                  checked={simulateZohoFailure}
                  onCheckedChange={onToggleSimulateZohoFailure}
                  aria-label="Simulate Zoho CRM outage during checkout"
                />
              </div>
            </div>

            {/* Control 2: Verify Cross-Client Privacy */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  <span>2. Verify Privacy Between Clients</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Click below to run a live security check confirming that your signed-in account
                  can never view another client’s documents or payment records.
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
                    {rlsProbing ? 'Checking Account Privacy...' : 'Run Account Privacy Check'}
                  </span>
                </Button>

                {rlsAudit && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-950 space-y-1">
                    <div className="flex items-center justify-between font-semibold text-emerald-800">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Privacy Verified ({rlsAudit.testedAt})
                      </span>
                      <Badge variant="default">Passed</Badge>
                    </div>
                    <div>
                      • Other clients’ records visible to you:{' '}
                      <strong>{rlsAudit.foreignPurchasesReturned} (Blocked)</strong>
                    </div>
                    <div>
                      • Unauthorized payment modification:{' '}
                      <strong>{rlsAudit.directInsertBlocked ? 'Blocked' : 'Allowed'}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
