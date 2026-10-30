import React, { useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AlertTriangle, FileText, Loader2, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured, API_BASE_URL } from './lib/supabase';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './components/ui/sheet';
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
  WebhookReplayResult,
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

  // Expanded document IDs state:
  // If a client has only 1 document, it is automatically expanded!
  // If a client has multiple documents, the first document is expanded by default and others can be toggled.
  const [expandedDocIds, setExpandedDocIds] = useState<Record<string, boolean>>({});

  // Action states
  const [simulateZohoFailure, setSimulateZohoFailure] = useState(false);
  const [checkoutLoadingDocId, setCheckoutLoadingDocId] = useState<string | null>(null);
  const [retryingPurchaseId, setRetryingPurchaseId] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'warning' | 'destructive';
    title: string;
    body: string;
  } | null>(null);

  // Edge-case demo verification states
  const [rlsAudit, setRlsAudit] = useState<RlsAuditResult | null>(null);
  const [rlsProbing, setRlsProbing] = useState(false);
  const [webhookReplay, setWebhookReplay] = useState<WebhookReplayResult | null>(null);
  const [replayingWebhook, setReplayingWebhook] = useState(false);

  // Global Sheet states (Logs Sheet & Demo Actions Sheet)
  const [logsSheetOpen, setLogsSheetOpen] = useState(false);
  const [demoSheetOpen, setDemoSheetOpen] = useState(false);

  const [pendingSessionId, setPendingSessionId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success' && params.get('session_id')) {
      return params.get('session_id');
    }
    return null;
  });

  // Check URL query parameters after returning from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutParam = params.get('checkout');
    const sessionIdParam = params.get('session_id');
    if (checkoutParam === 'success') {
      if (sessionIdParam) {
        setPendingSessionId(sessionIdParam);
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

      const fetchedDocs = (docsRes.data as DocumentRow[]) || [];
      setProfile((profileRes.data as UserProfileRow) || null);
      setDocuments(fetchedDocs);
      setPurchases((purchasesRes.data as PurchaseRow[]) || []);
      setSyncLogs((syncRes.data as ZohoSyncLogRow[]) || []);

      // Auto-expand logic:
      // If only 1 document, always expanded. If multiple, expand first document by default if none set yet.
      setExpandedDocIds((prev) => {
        if (fetchedDocs.length === 1) {
          return { [fetchedDocs[0].id]: true };
        }
        const hasAnyCurrentDocKey = fetchedDocs.some((d) => prev[d.id] !== undefined);
        if (hasAnyCurrentDocKey) return prev;
        const initial: Record<string, boolean> = {};
        fetchedDocs.forEach((d, idx) => {
          initial[d.id] = idx === 0;
        });
        return initial;
      });

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
      setWebhookReplay(null);
      setExpandedDocIds({});
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

        const payload = await res.json().catch(() => ({}));
        await fetchPortalStateFromSupabase(session);
        if (cancelled) return;

        if (res.ok) {
          const unlockedDocId = payload?.result?.purchase?.documentId;
          if (unlockedDocId) {
            setExpandedDocIds((prev) => ({
              ...prev,
              [unlockedDocId]: true,
            }));
          }
          setBannerMessage(null);
        } else {
          setBannerMessage({
            type: 'destructive',
            title: 'Could Not Confirm Payment Session',
            body: payload.error || 'Please click Refresh in the top bar.',
          });
        }
      } catch (err) {
        if (!cancelled) {
          await fetchPortalStateFromSupabase(session);
          setBannerMessage({
            type: 'warning',
            title: 'Payment Completed — Refreshing Access Status',
            body:
              err instanceof Error ? err.message : 'Click Refresh to check your document status.',
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
    setWebhookReplay(null);
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
        return;
      }
      setCheckoutLoadingDocId(null);
    } catch (err) {
      setCheckoutLoadingDocId(null);
      setBannerMessage({
        type: 'destructive',
        title: 'Unable to Start Payment',
        body: err instanceof Error ? err.message : String(err),
      });
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

      if (data.syncLog?.status !== 'SUCCESS') {
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

  const handleReplayDuplicateWebhook = async (purchaseId: string) => {
    if (!session) return;
    setReplayingWebhook(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/checkout/replay-webhook/${purchaseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to replay webhook.');
      }

      setWebhookReplay({
        testedAt: new Date().toLocaleTimeString('en-IN'),
        replayedEventId: data.replayedEventId,
        idempotentSkip: Boolean(data.idempotentSkip),
        totalPurchasesForDoc: data.totalPurchasesForDoc ?? 1,
        zohoSyncStatus: data.zohoSyncStatus ?? 'SUCCESS',
      });
    } catch (err) {
      setBannerMessage({
        type: 'destructive',
        title: 'Webhook Replay Error',
        body: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setReplayingWebhook(false);
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

  const toggleExpandDoc = (docId: string) => {
    setExpandedDocIds((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  const globalPaymentLoadingState = checkoutLoadingDocId
    ? {
        title: 'Redirecting to Secure Stripe Checkout...',
        subtitle:
          'Preparing your encrypted ₹ INR payment session and linking your Zoho CRM Deal ID.',
        badge: 'Step 1 of 2 • Initializing Checkout',
      }
    : pendingSessionId
      ? {
          title: 'Confirming Payment & Unlocking Document...',
          subtitle:
            'Verifying your Stripe payment, unlocking your confidential advisory report under Supabase RLS, and updating your Zoho CRM Deal to Closed Won.',
          badge: 'Step 2 of 2 • Finalizing Entitlement & CRM Sync',
        }
      : retryingPurchaseId
        ? {
            title: 'Syncing Account Status with Zoho CRM...',
            subtitle:
              'Updating your Zoho CRM Deal stage to Closed Won via OAuth 2.0 while preserving your unlocked document access.',
            badge: 'Zoho CRM OAuth 2.0 Sync',
          }
        : null;

  return (
    <div className="min-h-screen bg-[#F4F7FE] text-[#0B132B] flex flex-col">
      {globalPaymentLoadingState && (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B132B]/55 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#2F5CEA]/20 bg-white p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF3FD] text-[#2F5CEA] shadow-inner">
              <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF3FD] border border-[#2F5CEA]/20 px-3 py-1 text-[11px] font-bold text-[#2F5CEA]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{globalPaymentLoadingState.badge}</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#0B132B]">
                {globalPaymentLoadingState.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {globalPaymentLoadingState.subtitle}
              </p>
            </div>

            <div className="w-full overflow-hidden rounded-full bg-slate-100 h-1.5">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-[#2F5CEA]" />
            </div>
          </div>
        </div>
      )}

      <Navbar
        userEmail={session?.user.email ?? null}
        profile={profile}
        dataLoading={dataLoading}
        paidCount={purchases.filter((p) => p.status === 'PAID').length}
        hasPendingSync={syncLogs.some((s) => s.status !== 'SUCCESS')}
        simulateZohoFailure={simulateZohoFailure}
        onOpenLogsSheet={() => setLogsSheetOpen(true)}
        onOpenDemoSheet={() => setDemoSheetOpen(true)}
        onRefresh={() => fetchPortalStateFromSupabase(session)}
        onSignOut={() => {
          setLogsSheetOpen(false);
          setDemoSheetOpen(false);
          handleSignOut();
        }}
      />

      {/* Global Sheet 1: Account, Payment Receipts & Zoho CRM Sync Logs */}
      <Sheet open={logsSheetOpen} onOpenChange={setLogsSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Account, Payment &amp; CRM Sync Logs</SheetTitle>
            <SheetDescription>
              View your client account details, completed ₹ INR payments, Zoho CRM Deal sync logs,
              and retry controls.
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            <AccountSyncCard
              profile={profile}
              purchases={purchases}
              syncLogs={syncLogs}
              retryingPurchaseId={retryingPurchaseId}
              onRetrySync={handleRetryZohoSync}
            />
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Global Sheet 2: Live Walkthrough & Edge-Case Demo Actions */}
      <Sheet open={demoSheetOpen} onOpenChange={setDemoSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Live Walkthrough &amp; Demo Actions</SheetTitle>
            <SheetDescription>
              Interactive controls to demonstrate all 4 assignment requirements: Duplicate Webhook
              Idempotency, Zoho CRM Outage &amp; Recovery, and Cross-Client RLS Privacy.
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            <DemoToolsPanel
              simulateZohoFailure={simulateZohoFailure}
              onToggleSimulateZohoFailure={setSimulateZohoFailure}
              rlsAudit={rlsAudit}
              rlsProbing={rlsProbing}
              onRunRlsProbe={handleRunRlsIsolationProbe}
              purchases={purchases}
              webhookReplay={webhookReplay}
              replayingWebhook={replayingWebhook}
              onReplayDuplicateWebhook={handleReplayDuplicateWebhook}
            />
          </SheetBody>
        </SheetContent>
      </Sheet>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-6">
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
                  <code className="font-mono">server/</code> to load your 20 client accounts.
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
          <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B132B]">
                    Hello, {profile?.name?.split('(')[0]?.trim() || session.user.email}
                  </h1>
                  <Badge className="bg-[#EEF3FD] text-[#2F5CEA] border-[#2F5CEA]/20">
                    {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">
                  {documents.length === 1
                    ? 'Your assigned advisory document is automatically expanded below.'
                    : `You have ${documents.length} advisory documents assigned to your account. Click any document card to expand or collapse it.`}
                </p>
              </div>

              {documents.length > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allOpen: Record<string, boolean> = {};
                      documents.forEach((d) => {
                        allOpen[d.id] = true;
                      });
                      setExpandedDocIds(allOpen);
                    }}
                  >
                    Expand All ({documents.length})
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setExpandedDocIds({});
                    }}
                  >
                    Collapse All
                  </Button>
                </div>
              )}
            </div>

            {/* Client Documents List (Full Width) */}
            <div className="space-y-5">
              {documents.length === 0 ? (
                <Card>
                  <CardContent className="p-10 text-center space-y-2">
                    <FileText className="h-8 w-8 text-slate-400 mx-auto" aria-hidden="true" />
                    <h3 className="text-base font-bold text-[#0B132B]">
                      No Advisory Documents Assigned Yet
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Run <code className="font-mono text-slate-700">npm run db:setup</code> inside{' '}
                      <code className="font-mono text-slate-700">server/</code> to seed all 20
                      client accounts and their Zoho CRM Deals.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                documents.map((doc, idx) => {
                  const purchase = purchases.find(
                    (p) => p.document_id === doc.id && p.status === 'PAID'
                  );
                  const syncLog = purchase
                    ? syncLogs.find((s) => s.purchase_id === purchase.id)
                    : undefined;
                  const isExpanded =
                    documents.length === 1 ? true : Boolean(expandedDocIds[doc.id]);

                  return (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      index={idx}
                      totalDocuments={documents.length}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleExpandDoc(doc.id)}
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
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
