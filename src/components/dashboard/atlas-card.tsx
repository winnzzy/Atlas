'use client';

import { useState } from 'react';
import { Snowflake, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DashboardCard } from '@/lib/api-data';
import { cn } from '@/lib/utils';

type AtlasCardProps = {
  card: DashboardCard;
  /** Cardholder name resolved from the signed-in customer's profile. */
  holderName: string;
  /** Spendable balance from the linked bank account (never a $0 credit line). */
  availableBalance: number;
  busy: boolean;
  onToggleFreeze: () => void;
  index: number;
};

const AWAITING_REVIEW = new Set(['REQUESTED', 'PENDING_VERIFICATION']);

function formatCurrency(value: number) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/** A grouped, fully-masked PAN — only the last four digits are ever shown. */
function maskedGroups(lastFour: string) {
  const four = (lastFour || '0000').slice(-4).padStart(4, '0');
  return ['••••', '••••', '••••', four];
}

/** The stylised network wordmark. Text only — no external assets. */
function NetworkMark({ network }: { network: string }) {
  const value = network?.toUpperCase() ?? 'VISA';
  if (value === 'MASTERCARD') {
    return (
      <div className="flex items-center" aria-label="Mastercard">
        <span className="h-6 w-6 rounded-full bg-[#eb001b]/90" />
        <span className="-ml-2.5 h-6 w-6 rounded-full bg-[#f79e1b]/90" />
      </div>
    );
  }
  return (
    <span className="text-xl font-bold italic tracking-tight text-white" aria-label="Visa">
      VISA
    </span>
  );
}

export function AtlasCard({
  card,
  holderName,
  availableBalance,
  busy,
  onToggleFreeze,
  index,
}: AtlasCardProps) {
  const [flipped, setFlipped] = useState(false);
  const pending = AWAITING_REVIEW.has(card.status);
  const frozen = card.status === 'FROZEN';
  const groups = maskedGroups(card.lastFour);
  const displayName = (holderName || card.cardholderName || 'Atlas Cardholder').toUpperCase();

  return (
    <div className="flex flex-col gap-4">
      <div className="atlas-card-scene atlas-card-enter" style={{ animationDelay: `${index * 90}ms` }}>
        <button
          type="button"
          onClick={() => !pending && setFlipped((value) => !value)}
          aria-label={pending ? 'Card awaiting review' : 'Flip card'}
          className={cn(
            'atlas-card-flip relative block w-full max-w-md text-left',
            flipped ? 'is-back' : 'is-front',
            pending ? 'cursor-default' : 'cursor-pointer',
          )}
          style={{ aspectRatio: '1.586' }}
        >
          {/* ── Front ───────────────────────────────────────────── */}
          <div
            className={cn(
              'atlas-card-face absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-[0_24px_60px_rgba(11,52,90,0.35)]',
              'bg-[linear-gradient(135deg,#0a2a4a_0%,#0b345a_45%,#123f6b_70%,#0a2540_100%)]',
              (pending || frozen) && 'opacity-80 grayscale-[0.35]',
            )}
          >
            {/* Subtle decorative glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-sky-300/10 blur-2xl" />

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/15 text-sm font-black">A</span>
                <span className="text-lg font-semibold tracking-[0.3em]">ATLAS</span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">Debit</span>
            </div>

            <div className="flex items-center gap-3">
              {/* EMV chip */}
              <span className="h-7 w-10 rounded-md bg-[linear-gradient(135deg,#e6c15a,#b8860b)] shadow-inner ring-1 ring-yellow-200/40" aria-hidden />
              <Wifi className="h-5 w-5 rotate-90 text-white/85" aria-label="Contactless" />
            </div>

            <div className="font-mono text-xl tracking-[0.18em] sm:text-2xl" aria-label="Card number">
              {groups.map((group, groupIndex) => (
                <span key={groupIndex} className="mr-3 inline-block align-middle">
                  {group}
                </span>
              ))}
            </div>

            <div className="flex items-end justify-between">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Cardholder</p>
                <p className="truncate text-sm font-semibold tracking-wide">{displayName}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Valid thru</p>
                <p className="text-sm font-semibold tracking-wide">{card.expiry || '••/••'}</p>
              </div>
              <NetworkMark network={card.network} />
            </div>
          </div>

          {/* ── Back ────────────────────────────────────────────── */}
          <div className="atlas-card-face atlas-card-face-back flex flex-col justify-between overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0a2540,#0b345a)] py-5 text-white shadow-[0_24px_60px_rgba(11,52,90,0.35)]">
            <div className="mt-2 h-10 w-full bg-black/80" />
            <div className="px-5">
              <div className="flex items-center justify-end gap-3">
                <div className="flex h-8 flex-1 items-center rounded bg-white/85 px-3 text-xs italic text-slate-500">
                  Authorized signature
                </div>
                <div className="grid h-8 place-items-center rounded bg-white px-3 font-mono text-sm font-semibold tracking-widest text-slate-800">
                  •••
                </div>
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/55">
                CVV is never displayed for your security
              </p>
            </div>
            <div className="flex items-center justify-between px-5">
              <span className="text-sm font-semibold tracking-[0.3em]">ATLAS</span>
              <NetworkMark network={card.network} />
            </div>
          </div>
        </button>
      </div>

      {/* ── Meta / actions ─────────────────────────────────────── */}
      {pending ? (
        <p className="text-sm text-slate-600">
          Your application is with an administrator for review. You&apos;ll be able to use this card
          once it&apos;s approved.
        </p>
      ) : (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Available account balance</p>
            <p className="text-2xl font-semibold text-slate-900">{formatCurrency(availableBalance)}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {frozen ? 'Card frozen' : 'Card active'} · {card.name}
            </p>
          </div>
          <Button variant="secondary" disabled={busy} onClick={onToggleFreeze} className="gap-2">
            <Snowflake className="h-4 w-4" />
            {frozen ? 'Unfreeze' : 'Freeze'}
          </Button>
        </div>
      )}
    </div>
  );
}
