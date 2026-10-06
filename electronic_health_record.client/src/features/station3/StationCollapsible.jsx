import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { formatDateAtTime } from '../../lib/formatters';

/**
 * A station's section in the record view whose closed header still carries
 * the station's headline readings, so a reader skimming the record sees them
 * without opening it. The readings drop out once the section is open: the
 * full detail below them says the same thing at greater length. They also
 * wait for the station to be completed, before which every one is a dash.
 *
 * Below @3xl the readings move onto their own row under the title rather than
 * squeezing it, since five of them need ~460px on one line.
 *
 * A reading is set in mono so figures line up; `mono: false` sets a worded
 * one (a referral, a physician's name) in the body face instead.
 *
 * `signedAt` puts the signing time at the header's right while the section is
 * open, where the readings sat, and drops the subtitle that said the same.
 * `signOffInBody` is for a body that ends in its own sign-off, signing time
 * and all: the subtitle drops out while open and nothing takes its place.
 *
 * `grouped` is for a body of SectionCards: a canvas ground and column gap, so
 * the cards keep the spacing they have when rendered straight on the page.
 * `flush` drops the body padding for a body that rules off its own sections
 * edge to edge.
 */
export default function StationCollapsible({
  station, title, icon: Icon, completed = false, subtitle, summary, signedAt,
  signOffInBody = false, grouped = false, flush = false, defaultOpen = false, children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const showSigned = open && Boolean(signedAt);
  const showSubtitle = Boolean(subtitle) && !showSigned && !(open && signOffInBody);

  let bodyClass = 'px-5 py-4';
  if (grouped) bodyClass = 'flex flex-col gap-4 bg-canvas p-4';
  else if (flush) bodyClass = '';

  return (
    <div className={`@container overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-colors ${open ? 'ring-1 ring-[#0e7d6b]/15' : ''}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 text-left transition-colors hover:bg-[#f3fdfb]"
      >
        <span className="flex min-w-0 flex-1 items-center gap-4">
          {Icon && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e9fbf6] text-[#0e7d6b]">
              <Icon size={20} />
            </span>
          )}
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold tracking-wide text-ink-500 uppercase">Station {station}</span>
            <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="text-lg font-bold text-ink-900">{title}</span>
              {completed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#0e7d6b] px-2.5 py-0.5 text-xs font-medium text-white">
                  <Check size={12} strokeWidth={2.75} />
                  Completed
                </span>
              )}
            </span>
            {showSubtitle && <span className="block truncate text-xs text-ink-500">{subtitle}</span>}
          </span>
        </span>

        {!open && completed && summary?.length > 0 && (
          <span className="order-last flex w-full flex-wrap gap-2 @3xl:order-none @3xl:w-auto @3xl:justify-end">
            {summary.map(({ label, value, mono = true }) => (
              <span key={label} className="inline-flex items-baseline gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5">
                <span className="text-xs text-ink-500">{label}</span>
                <span className={`text-sm font-semibold text-ink-900 ${mono ? 'font-mono tabular-nums' : ''}`}>{value ?? '—'}</span>
              </span>
            ))}
          </span>
        )}

        {showSigned && (
          <span className="shrink-0 text-right">
            <span className="block text-xs text-ink-500">Signed</span>
            <span className="block text-sm font-semibold text-ink-900">{formatDateAtTime(signedAt)}</span>
          </span>
        )}

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line text-ink-500">
          <ChevronDown
            size={18}
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>
      {open && <div className={`border-t border-line ${bodyClass}`}>{children}</div>}
    </div>
  );
}
