import { CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import type { DocumentContentRow, PurchaseRow } from '../../types/portal';
import { formatINR } from '../../types/portal';

interface DocumentReaderProps {
  content: DocumentContentRow;
  purchase: PurchaseRow;
}

export function DocumentReader({ content, purchase }: DocumentReaderProps) {
  const paidDate = new Date(purchase.granted_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Render clean readable sections from markdown lines without developer clutter
  const lines = content.body_markdown.split('\n');

  return (
    <div className="space-y-4">
      {/* Payment & Verification Receipt Strip */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-900">
              Full Document Unlocked · Paid {formatINR(purchase.amount_cents)} on {paidDate}
            </div>
            <div className="text-xs text-emerald-700">
              Document Verification Code:{' '}
              <span className="font-mono font-semibold">{content.secret_code}</span>
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-white/90 border border-emerald-200 rounded-lg px-3 py-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          <span>Verified Client Copy</span>
        </div>
      </div>

      {/* Clean Document Paper View */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-200">
          <FileText className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <span>Advisory Report Content</span>
        </div>

        <div className="space-y-2.5 text-slate-800 pt-1">
          {lines.map((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) {
              return <div key={index} className="h-1" />;
            }
            if (trimmed.startsWith('# ')) {
              return (
                <h2 key={index} className="text-xl font-bold text-slate-900 pt-1">
                  {trimmed.replace(/^#\s+/, '')}
                </h2>
              );
            }
            if (trimmed.startsWith('## ')) {
              return (
                <h3
                  key={index}
                  className="text-base font-bold text-slate-900 pt-3 border-t border-slate-200/80"
                >
                  {trimmed.replace(/^##\s+/, '')}
                </h3>
              );
            }
            if (trimmed.startsWith('- ')) {
              return (
                <div key={index} className="flex items-start gap-2.5 pl-1 text-sm text-slate-700">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                  <span>{trimmed.replace(/^-\s+/, '').replace(/\*\*/g, '')}</span>
                </div>
              );
            }
            return (
              <p key={index} className="text-sm text-slate-700 leading-relaxed">
                {trimmed.replace(/\*\*/g, '')}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
