import React, { useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AlertTriangle, FileText } from 'lucide-react';
import { supabase, isSupabaseConfigured, API_BASE_URL } from './lib/supabase';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { Navbar } from './components/layout/Navbar';
import { LoginView } from './components/auth/LoginView';
import { DocumentCard } from './components/portal/DocumentCard';
import { AccountSyncCard } from './components/portal/AccountSyncCard';
import { DemoToolsPanel } from './components/portal/DemoToolsPanel';
import type {
  DocumentContentRow,
  DocumentRow,
  PurchaseRow,
  RlsAuditResult,
  UserProfileRow,
  ZohoSyncLogRow,
} from './types/portal';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('alice@example.com');
  const [password, setPassword] = useState('Password123!');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Direct-from-Supabase state (Browser reads access status directly from Supabase under RLS)
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [syncLogs, setSyncLogs] = useState<ZohoSyncLogRow[]>([]);
  const [docContents, setDocContents] = useState<Record<string, DocumentContentRow>>({});
  const [dataLoading, setDataLoading] = useState(false);

  // Action states
  const [simulateZohoFailure, setSimulateZohoFailure] = useState(false);
  const [checkoutLoadingDocId, setCheckoutLoadingDocId] = useState<string | null>(null);
  const [retryingPurchaseId, setRetryingPurchaseId] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'warning' | 'destructive';
    title: string;
    body: string;
  } | null>(null);

  // Privacy verification state
  const [rlsAudit, setRlsAudit] = useState<RlsAuditResult | null>(null);
  const [rlsProbing, setRlsProbing] = useState(false);

  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);

  // Check URL query parameters after returning from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutParam = params.get('checkout');
    const sessionIdParam = params.get('session_id');
    if (checkoutParam === 'success') {
      if (sessionIdParam) {
        setPendingSessionId(sessionIdParam);
        setBannerMessage({
          type: 'warning',
          title: 'Confirming Your Payment with Stripe...',
          body: 'Please wait a moment while we verify your payment and unlock your document.',
        });
      } else {
        setBannerMessage({
          type: 'success',
          title: 'Payment Successful — Your Document Is Unlocked!',
          body: 'Thank you for your payment. Your full advisory report is now available to read below.',
        });
      }
      window.history.replaceState({}, '', window.location.pathname);
    } else if (checkoutParam === 'cancelled') {
      setBannerMessage({
        type: 'warning',
        title: 'Payment Not Completed',
        body: 'Your checkout session was cancelled and your card was not charged.',
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  /**
   * Queries `users`, `documents`, `purchases`, `zoho_sync_logs`, and `document_contents`
   * DIRECTLY from Supabase using the signed-in client's session.
   */
  const fetchPortalStateFromSupabase = useCallback(async (activeSession: Session | null) => {
    if (!activeSession || !isSupabaseConfigured) return;
    setDataLoading(true);

    try {
      const userId = activeSession.user.id;

      const [profileRes, docsRes, purchasesRes, syncRes, contentsRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).maybeSingle(),
        supabase.from('documents').select('*').order('created_at', { ascending: true }),
        supabase.from('purchases').select('*').order('granted_at', { ascending: false }),
        supabase.from('zoho_sync_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('document_contents').select('*'),
      ]);

      setProfile((profileRes.data as UserProfileRow) || null);
      setDocuments((docsRes.data as DocumentRow[]) || []);
      setPurchases((purchasesRes.data as PurchaseRow[]) || []);
      setSyncLogs((syncRes.data as ZohoSyncLogRow[]) || []);

      const contentMap: Record<string, DocumentContentRow> = {};
      for (const row of (contentsRes.data as DocumentContentRow[]) || []) {
        contentMap[row.document_id] = row;
      }
      setDocContents(contentMap);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Initialize Supabase Auth listener
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        fetchPortalStateFromSupabase(data.session);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setRlsAudit(null);
      if (newSession) {
        fetchPortalStateFromSupabase(newSession);
      } else {
        setProfile(null);
        setDocuments([]);
        setPurchases([]);
        setSyncLogs([]);
        setDocContents({});
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchPortalStateFromSupabase]);

  // Reconcile pending Stripe Checkout session_id on return from Stripe Checkout
  useEffect(() => {
    if (!session || !pendingSessionId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/checkout/verify-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ sessionId: pendingSessionId }),
        });

        await fetchPortalStateFromSupabase(session);
        if (cancelled) return;

        if (res.ok) {
          setBannerMessage({
            type: 'success',
            title: 'Payment Successful — Your Document Is Unlocked!',
            body: 'Thank you for your payment. Your full advisory report is now available to read below.',
          });
        } else {
          const errData = await res.json().catch(() => ({}));
          setBannerMessage({
            type: 'destructive',
            title: 'Could Not Confirm Payment Session',
            body: errData.error || 'Please click Refresh in the top bar.',
          });
        }
      } catch (err) {
        if (!cancelled) {
          await fetchPortalStateFromSupabase(session);
          setBannerMessage({
            type: 'warning',
            title: 'Payment Completed — Refreshing Access Status',
            body: err instanceof Error ? err.message : 'Click Refresh to check your document status.',
          });
        }
      } finally {
        if (!cancelled) {
          setPendingSessionId(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, pendingSessionId, fetchPortalStateFromSupabase]);

  // Subscribe to Supabase Realtime Postgres changes so webhook updates reflect immediately
  useEffect(() => {
    if (!session || !isSupabaseConfigured) return;

    const channel = supabase
      .channel('portal-rls-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchases' },
        () => fetchPortalStateFromSupabase(session)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'zoho_sync_logs' },
        () => fetchPortalStateFromSupabase(session)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchPortalStateFromSupabase]);

  const handleSignIn = async (e?: React.FormEvent, quickEmail?: string, quickPass?: string) => {
    if (e) e.preventDefault();
    const targetEmail = quickEmail ?? email;
    const targetPassword = quickPass ?? password;

    setEmail(targetEmail);
    setPassword(targetPassword);
    setAuthError(null);
    setAuthLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: targetPassword,
      });
      if (error) {
        setAuthError(error.message);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : String(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setBannerMessage(null);
    setRlsAudit(null);
  };

  const handleStartStripeCheckout = async (documentId: string) => {
    if (!session) return;
    setCheckoutLoadingDocId(documentId);
    setBannerMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/checkout/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          documentId,
          simulateZohoFailure,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not start online checkout.');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setBannerMessage({
        type: 'destructive',
        title: 'Unable to Start Payment',
        body: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setCheckoutLoadingDocId(null);
    }
  };

  const handleRetryZohoSync = async (purchaseId: string) => {
    if (!session) return;
    setRetryingPurchaseId(purchaseId);
    setBannerMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/zoho/retry/${purchaseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ simulateFailure: false }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not sync account status.');
      }

      await fetchPortalStateFromSupabase(session);

      if (data.syncLog?.status === 'SUCCESS') {
        setBannerMessage({
          type: 'success',
          title: 'Account Status Synced',
          body: 'Your payment record has been updated with your dedicated account manager in Zoho CRM.',
        });
      } else {
        setBannerMessage({
          type: 'warning',
          title: 'Account Sync Still Pending',
          body:
            data.syncLog?.lastError ||
            'Our CRM service is still unreachable. Your document access remains active.',
        });
      }
    } catch (err) {
      setBannerMessage({
        type: 'destructive',
        title: 'Sync Request Failed',
        body: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setRetryingPurchaseId(null);
    }
  };

  const handleRunRlsIsolationProbe = async () => {
    if (!session) return;
    setRlsProbing(true);

    try {
      const currentUid = session.user.id;

      const { data: foreignPurchases } = await supabase
        .from('purchases')
        .select('*')
        .neq('user_id', currentUid);

      const { error: forgeError } = await supabase.from('purchases').insert({
        user_id: currentUid,
        document_id: documents[0]?.id || '00000000-0000-0000-0000-000000000000',
        zoho_deal_id: 'UNAUTHORIZED_BROWSER_ATTEMPT',
        stripe_session_id: 'cs_unauthorized',
        stripe_event_id: 'evt_unauthorized',
        amount_cents: 0,
        status: 'PAID',
      });

      setRlsAudit({
        testedAt: new Date().toLocaleTimeString('en-IN'),
        ownPurchasesCount: purchases.length,
        foreignPurchasesReturned: foreignPurchases?.length ?? 0,
        unlockedContentsCount: Object.keys(docContents).length,
        directInsertBlocked: Boolean(forgeError),
      });
    } finally {
      setRlsProbing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      <Navbar
        userEmail={session?.user.email ?? null}
        profile={profile}
        dataLoading={dataLoading}
        authLoading={authLoading}
        onRefresh={() => fetchPortalStateFromSupabase(session)}
        onSignOut={handleSignOut}
        onQuickSwitchClient={(quickEmail, quickPass) =>
          handleSignIn(undefined, quickEmail, quickPass)
        }
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {!isSupabaseConfigured && (
          <Alert variant="warning">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <AlertTitle>Portal Connection Not Configured Yet</AlertTitle>
                <AlertDescription>
                  Add your Supabase URL and Anon Key in <code className="font-mono">client/.env</code>{' '}
                  (or <code className="font-mono">client/.env.local</code>) and run{' '}
                  <code className="font-mono">npm run db:setup</code> inside{' '}
                  <code className="font-mono">server/</code> to load your client accounts.
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {bannerMessage && (
          <Alert variant={bannerMessage.type}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <AlertTitle>{bannerMessage.title}</AlertTitle>
                <AlertDescription>{bannerMessage.body}</AlertDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBannerMessage(null)}
                aria-label="Close message"
              >
                Close
              </Button>
            </div>
          </Alert>
        )}

        {!session ? (
          <LoginView
            email={email}
            password={password}
            authLoading={authLoading}
            authError={authError}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSignIn={handleSignIn}
          />
        ) : (
          <div className="space-y-8">
            {/* Welcome Header */}
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Hello, {profile?.name?.split('(')[0]?.trim() || session.user.email}
              </h1>
              <p className="text-sm text-slate-600">
                View your advisory documents, download unlocked reports, and check your payment
                status below.
              </p>
            </div>

            {/* Main 2-Column Client Layout */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              {/* Left 8 Columns: Client Documents */}
              <div className="lg:col-span-8 space-y-6">
                {documents.length === 0 ? (
                  <Card>
                    <CardContent className="p-10 text-center space-y-2">
                      <FileText className="h-8 w-8 text-slate-400 mx-auto" aria-hidden="true" />
                      <h3 className="text-base font-bold text-slate-900">
                        No Advisory Documents Assigned Yet
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        If you are setting up the demo environment, run{' '}
                        <code className="font-mono text-slate-700">npm run db:setup</code> inside{' '}
                        <code className="font-mono text-slate-700">server/</code> to load sample
                        client documents.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  documents.map((doc) => {
                    const purchase = purchases.find(
                      (p) => p.document_id === doc.id && p.status === 'PAID'
                    );
                    const syncLog = purchase
                      ? syncLogs.find((s) => s.purchase_id === purchase.id)
                      : undefined;

                    return (
                      <DocumentCard
                        key={doc.id}
                        document={doc}
                        purchase={purchase}
                        syncLog={syncLog}
                        unlockedContent={docContents[doc.id]}
                        checkoutLoading={checkoutLoadingDocId === doc.id}
                        retryingSync={retryingPurchaseId === purchase?.id}
                        onStartCheckout={handleStartStripeCheckout}
                        onRetrySync={handleRetryZohoSync}
                      />
                    );
                  })
                )}
              </div>

              {/* Right 4 Columns: Account Summary & Order/CRM Status */}
              <div className="lg:col-span-4">
                <AccountSyncCard
                  profile={profile}
                  purchases={purchases}
                  syncLogs={syncLogs}
                  retryingPurchaseId={retryingPurchaseId}
                  onRetrySync={handleRetryZohoSync}
                />
              </div>
            </div>

            {/* Bottom Collapsible Evaluator Demo Bar */}
            <DemoToolsPanel
              simulateZohoFailure={simulateZohoFailure}
              onToggleSimulateZohoFailure={setSimulateZohoFailure}
              rlsAudit={rlsAudit}
              rlsProbing={rlsProbing}
              onRunRlsProbe={handleRunRlsIsolationProbe}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
