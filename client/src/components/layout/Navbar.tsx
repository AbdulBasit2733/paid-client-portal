import {
  FileText,
  LogOut,
  RefreshCw,
  ReceiptIndianRupee,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { UserProfileRow } from '../../types/portal';

interface NavbarProps {
  userEmail: string | null;
  profile: UserProfileRow | null;
  dataLoading: boolean;
  paidCount: number;
  hasPendingSync: boolean;
  simulateZohoFailure: boolean;
  onOpenLogsSheet: () => void;
  onOpenDemoSheet: () => void;
  onRefresh: () => void;
  onSignOut: () => void;
}

export function Navbar({
  userEmail,
  profile,
  dataLoading,
  paidCount,
  hasPendingSync,
  simulateZohoFailure,
  onOpenLogsSheet,
  onOpenDemoSheet,
  onRefresh,
  onSignOut,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Identity (#2F5CEA Theme) */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F5CEA] text-white shadow-sm shadow-[#2F5CEA]/25">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-[#0B132B] sm:text-lg">
                Knowbal Advisory Portal
              </span>
              <Badge
                variant="secondary"
                className="hidden sm:inline-flex bg-[#EEF3FD] text-[#2F5CEA] border-[#2F5CEA]/20"
              >
                Client Portal
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Secure document access &amp; instant online payments in Indian Rupees (₹)
            </p>
          </div>
        </div>

        {/* Right Actions */}
        {userEmail ? (
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="hidden md:flex flex-col items-end text-right pr-2 border-r border-slate-200">
              <span className="text-xs font-bold text-[#0B132B]">
                {profile?.name?.split('(')[0]?.trim() || userEmail}
              </span>
              <span className="text-[11px] text-slate-500">{userEmail}</span>
            </div>

            {/* Global Logs Sheet Trigger (Account, Payment Receipts & Zoho CRM Sync Status) */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenLogsSheet}
              className="gap-1.5 border-[#2F5CEA]/25 hover:bg-[#EEF3FD] hover:text-[#2F5CEA]"
            >
              <ReceiptIndianRupee className="h-3.5 w-3.5 text-[#2F5CEA]" aria-hidden="true" />
              <span>Logs</span>
              {hasPendingSync ? (
                <span className="inline-flex h-5 items-center rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-800">
                  Sync Pending
                </span>
              ) : paidCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EEF3FD] px-1.5 text-[10px] font-bold text-[#2F5CEA]">
                  {paidCount}
                </span>
              ) : null}
            </Button>

            {/* Global Demo Actions Sheet Trigger (Live Walkthrough & Edge-Case Controls) */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenDemoSheet}
              className="gap-1.5 border-[#2F5CEA]/25 hover:bg-[#EEF3FD] hover:text-[#2F5CEA]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#2F5CEA]" aria-hidden="true" />
              <span>Demo Actions</span>
              {simulateZohoFailure && (
                <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" title="Zoho Outage Simulation Active" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={dataLoading}
              aria-label="Refresh portal data"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${dataLoading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span className="hidden lg:inline">Refresh</span>
            </Button>

            <Button variant="secondary" size="sm" onClick={onSignOut}>
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EEF3FD] px-3 py-1.5 text-xs font-semibold text-[#2F5CEA]">
              20 Test Clients Ready
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
