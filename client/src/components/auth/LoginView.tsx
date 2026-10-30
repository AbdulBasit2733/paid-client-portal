import React, { useState, useMemo } from 'react';
import {
  Lock,
  ArrowRight,
  Search,
  Users,
  FileText,
  Building2,
  CheckCircle2,
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
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Input } from '../ui/primitives';
import { DEMO_CLIENTS } from '../../types/portal';

interface LoginViewProps {
  email: string;
  password: string;
  authLoading: boolean;
  authError: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSignIn: (e?: React.FormEvent, quickEmail?: string, quickPass?: string) => void;
}

export function LoginView({
  email,
  password,
  authLoading,
  authError,
  onEmailChange,
  onPasswordChange,
  onSignIn,
}: LoginViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [docFilter, setDocFilter] = useState<'all' | 'multi' | 'single'>('all');

  const filteredClients = useMemo(() => {
    return DEMO_CLIENTS.filter((c) => {
      if (docFilter === 'multi' && c.docsCount <= 1) return false;
      if (docFilter === 'single' && c.docsCount > 1) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.fullName.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.primaryDocSummary.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, docFilter]);

  return (
    <div className="space-y-8">
      {/* Top Hero Banner (Inspired by Knowbal #2F5CEA Clean Aesthetic) */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B132B] leading-tight">
          Access your advisory documents—starting with a single click
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Sign in with your client email or select any of the 20 pre-configured client accounts on
          the right to test single-document, multi-document, and Indian Rupee (₹) payments.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left Column (5 Cols): Client Sign-In Form */}
        <Card className="lg:col-span-5 border-slate-200 shadow-md">
          <CardHeader className="space-y-2 border-b border-slate-100 pb-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF3FD] px-3 py-1 text-xs font-bold text-[#2F5CEA]">
                Client Sign-In
              </span>
              <Lock className="h-4 w-4 text-[#2F5CEA]" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl text-[#0B132B] pt-1">Sign In to Your Account</CardTitle>
            <CardDescription>
              Enter your client email and password, or click any client from the directory on the
              right to sign in immediately.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            <form onSubmit={(e) => onSignIn(e)} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="portal-email"
                  className="block text-xs font-bold text-[#0B132B]"
                >
                  Client Email Address
                </label>
                <Input
                  id="portal-email"
                  type="email"
                  placeholder="alice@example.com"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="portal-password"
                  className="block text-xs font-bold text-[#0B132B]"
                >
                  Password
                </label>
                <Input
                  id="portal-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {authError && (
                <Alert variant="destructive">
                  <AlertTitle>Unable to Sign In</AlertTitle>
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={authLoading}>
                <span>{authLoading ? 'Signing In...' : 'Sign In to Portal'}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>

            <div className="rounded-xl bg-[#F4F7FE] border border-[#2F5CEA]/15 p-3.5 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-[#0B132B] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#2F5CEA]" aria-hidden="true" />
                <span>Shared Demo Password for All 20 Accounts:</span>
              </div>
              <p className="pl-5">
                Every test client uses password{' '}
                <code className="font-mono font-semibold text-[#2F5CEA] bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  Password123!
                </code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right Column (7 Cols): Interactive 20-Client Test Directory */}
        <Card className="lg:col-span-7 border-slate-200 shadow-md">
          <CardHeader className="space-y-3 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#2F5CEA]" aria-hidden="true" />
                <CardTitle className="text-xl text-[#0B132B]">
                  Select a Test Client Account (20 Clients)
                </CardTitle>
              </div>
              <Badge className="bg-[#EEF3FD] text-[#2F5CEA] border-[#2F5CEA]/20">
                28 Zoho Deals Linked
              </Badge>
            </div>
            <CardDescription>
              Click <strong>Select &amp; Sign In</strong> on any client below to test single-document
              auto-expand, multi-document lists, and Zoho CRM Deal updates.
            </CardDescription>

            {/* Search & Filter Controls */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center pt-1">
              <div className="relative flex-1">
                <Search
                  className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  placeholder="Search client name, company, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-xs"
                  aria-label="Search test clients"
                />
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-[#F4F7FE] p-1 border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setDocFilter('all')}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                    docFilter === 'all'
                      ? 'bg-[#2F5CEA] text-white'
                      : 'text-slate-600 hover:text-[#0B132B]'
                  }`}
                >
                  All (20)
                </button>
                <button
                  type="button"
                  onClick={() => setDocFilter('multi')}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                    docFilter === 'multi'
                      ? 'bg-[#2F5CEA] text-white'
                      : 'text-slate-600 hover:text-[#0B132B]'
                  }`}
                >
                  Multi-Doc (7)
                </button>
                <button
                  type="button"
                  onClick={() => setDocFilter('single')}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                    docFilter === 'single'
                      ? 'bg-[#2F5CEA] text-white'
                      : 'text-slate-600 hover:text-[#0B132B]'
                  }`}
                >
                  1 Doc (13)
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="max-h-[430px] overflow-y-auto divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No clients match &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                filteredClients.map((client) => {
                  const isSelected = email.toLowerCase() === client.email.toLowerCase();
                  return (
                    <div
                      key={client.email}
                      className={`p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between transition-colors ${
                        isSelected ? 'bg-[#EEF3FD]/70' : 'hover:bg-slate-50/90'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">
                            #{String(client.id).padStart(2, '0')}
                          </span>
                          <span className="text-sm font-bold text-[#0B132B]">
                            {client.fullName}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Building2 className="h-3 w-3 text-slate-400" aria-hidden="true" />
                            {client.company}
                          </span>
                          <Badge
                            variant={client.docsCount > 1 ? 'default' : 'secondary'}
                            className={
                              client.docsCount > 1
                                ? 'bg-[#EEF3FD] text-[#2F5CEA] border-[#2F5CEA]/25'
                                : ''
                            }
                          >
                            <FileText className="h-3 w-3" aria-hidden="true" />
                            <span>
                              {client.docsCount}{' '}
                              {client.docsCount === 1 ? 'Document' : 'Documents'}
                            </span>
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-600 truncate">
                          {client.primaryDocSummary}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <span className="font-mono text-slate-600">{client.email}</span>
                          <span>·</span>
                          <span className="font-semibold text-[#0B132B]">
                            Fee: {client.priceLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          type="button"
                          size="sm"
                          variant={isSelected ? 'default' : 'secondary'}
                          disabled={authLoading}
                          onClick={() => onSignIn(undefined, client.email, client.password)}
                        >
                          <span>Select &amp; Sign In</span>
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
