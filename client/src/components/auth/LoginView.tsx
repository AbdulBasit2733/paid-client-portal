import React from 'react';
import {
  Lock,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  ArrowRight,
  UserCheck,
  ShieldCheck,
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
import { Input, Separator } from '../ui/primitives';
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
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start pt-2">
      {/* Left Column: Simple Client Sign-In Card */}
      <Card className="lg:col-span-5 border-slate-200 shadow-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="default">Client Portal Sign-In</Badge>
            <Lock className="h-4 w-4 text-blue-600" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in with your registered email address to view your advisory reports, complete
            payments in Indian Rupees (₹), and read your unlocked documents.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={(e) => onSignIn(e)} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="portal-email"
                className="block text-xs font-semibold text-slate-700"
              >
                Email Address
              </label>
              <Input
                id="portal-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="portal-password"
                className="block text-xs font-semibold text-slate-700"
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
              <span>{authLoading ? 'Signing In...' : 'Sign In to My Account'}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>

          <Separator />

          {/* One-Click Demo Client Switcher */}
          <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
              <UserCheck className="h-4 w-4" aria-hidden="true" />
              <span>Quick Demo Accounts (One-Click Sign In)</span>
            </div>
            <p className="text-xs text-slate-600">
              Testing the portal? Click either client account below to sign in immediately:
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              {DEMO_CLIENTS.map((client) => (
                <Button
                  key={client.email}
                  type="button"
                  variant="outline"
                  className="justify-between text-left h-auto py-2.5 px-3.5 bg-white hover:bg-blue-50/50 border-slate-200"
                  disabled={authLoading}
                  onClick={() => onSignIn(undefined, client.email, client.password)}
                >
                  <span className="flex flex-col items-start">
                    <span className="text-sm font-semibold text-slate-900">
                      {client.fullName}
                    </span>
                    <span className="text-xs text-slate-500">
                      {client.company} · {client.email}
                    </span>
                  </span>
                  <Badge variant="secondary">{client.priceLabel}</Badge>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Column: Client-Friendly "How It Works" Overview */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="border-slate-200">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Simple &amp; Secure Experience
            </Badge>
            <CardTitle className="text-2xl pt-1">
              Access Your Advisory Documents in 3 Easy Steps
            </CardTitle>
            <CardDescription>
              Your private reports and financial documents are stored securely in your personal
              account and unlock immediately upon payment.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <UserCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <h4 className="font-semibold text-sm text-slate-900">1. Sign In Privately</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Log in to view only the documents and reports prepared specifically for your
                business.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <CreditCard className="h-5 w-5" aria-hidden="true" />
              </div>
              <h4 className="font-semibold text-sm text-slate-900">2. Pay in ₹ INR</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Complete a secure one-time payment in Indian Rupees (₹) via Stripe Checkout.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <FileCheck2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <h4 className="font-semibold text-sm text-slate-900">3. Read Anytime</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your document unlocks right away and your dedicated account manager is notified
                automatically.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-5 flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-900">
                100% Private &amp; Guaranteed Access
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your documents and payment receipts are strictly isolated to your account—no other
                client can ever view your files. Even if our internal CRM system is undergoing
                maintenance, your paid documents unlock without delay.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-medium text-emerald-700">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Instant Unlock on Payment
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Strict Account Privacy
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
