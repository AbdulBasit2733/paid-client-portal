import { FileText, LogOut, RefreshCw, UserCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DEMO_CLIENTS, type UserProfileRow } from '../../types/portal';

interface NavbarProps {
  userEmail: string | null;
  profile: UserProfileRow | null;
  dataLoading: boolean;
  authLoading: boolean;
  onRefresh: () => void;
  onSignOut: () => void;
  onQuickSwitchClient: (email: string, password: string) => void;
}

export function Navbar({
  userEmail,
  profile,
  dataLoading,
  authLoading,
  onRefresh,
  onSignOut,
  onQuickSwitchClient,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                Apex Client Portal
              </span>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                Secure Document Access
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Instant document access &amp; online payments in Indian Rupees (₹)
            </p>
          </div>
        </div>

        {/* Right Actions */}
        {userEmail ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Client Switcher Pills */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <span className="px-2 text-xs font-medium text-slate-500">Account:</span>
              {DEMO_CLIENTS.map((client) => {
                const isActive = userEmail.toLowerCase() === client.email.toLowerCase();
                return (
                  <button
                    key={client.email}
                    type="button"
                    disabled={isActive || authLoading}
                    onClick={() => onQuickSwitchClient(client.email, client.password)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    {client.shortName}
                  </button>
                );
              })}
            </div>

            <div className="hidden md:flex flex-col items-end text-right px-1">
              <span className="text-xs font-semibold text-slate-900">
                {profile?.name || userEmail}
              </span>
              <span className="text-[11px] text-slate-500">{userEmail}</span>
            </div>

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
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button variant="secondary" size="sm" onClick={onSignOut}>
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <UserCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <span>Client Sign-In</span>
          </div>
        )}
      </div>
    </header>
  );
}
