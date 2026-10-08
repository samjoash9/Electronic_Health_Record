import { CircleCheck } from 'lucide-react';
import { formatDateAtTime } from '../../lib/formatters';

/** Icon tile, title and one-line description heading a part of a station's record. */
export function RecordHeading({ id, icon: Icon, title, subtitle, level = 3 }) {
  const Heading = `h${level}`;
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e9fbf6] text-[#0e7d6b]">
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <Heading id={id} className="text-sm font-bold text-ink-900">{title}</Heading>
        {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
      </div>
    </div>
  );
}

/**
 * One ruled-off part of a station's record. Unboxed: the station card is the
 * only box, and its sections are told apart by the rules between them.
 */
export function RecordSection({ id, icon, title, subtitle, className = '', children }) {
  return (
    <section aria-labelledby={id} className={`px-5 py-5 ${className}`}>
      <RecordHeading id={id} icon={icon} title={title} subtitle={subtitle} />
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** A value nobody entered, said as such rather than left blank. */
export function NotRecorded({ label = 'Not recorded' }) {
  return (
    <span className="inline-flex rounded-full border border-line px-2.5 py-0.5 text-xs font-normal text-ink-500">
      {label}
    </span>
  );
}

const CHIP_TONES = {
  plain: 'border border-line bg-surface text-ink-700',
  teal: 'bg-[#e9fbf6] text-[#0e7d6b] ring-1 ring-[#0e7d6b]/15',
};

export function Chip({ tone = 'plain', children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${CHIP_TONES[tone]}`}>
      {children}
    </span>
  );
}

const initialsOf = (name) => {
  const words = name.replace(/^Dr\.\s*/, '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  return `${words[0][0]}${words.length > 1 ? words[words.length - 1][0] : ''}`.toUpperCase();
};

/**
 * Who signed the station off: the clinician, their licence, signature and
 * when. Every signing station -- consultation, dental, vision -- closes on
 * this same block, so a record reads its three sign-offs alike.
 */
export function SignOff({ role, name, licenseNo, signature, signatureAlt, signedAt }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-gray-50 p-4 @xl:flex-row @xl:items-center @xl:justify-between">
      <div className="flex items-center gap-3">
        <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0e7d6b] text-sm font-bold text-white">
          {initialsOf(name ?? '')}
        </span>
        <div className="min-w-0">
          <p className="text-xs text-ink-500">{role}</p>
          <p className="text-sm font-bold text-ink-900">{name ?? '—'}</p>
          <p className="text-xs text-ink-500">PRC License No. {licenseNo ?? '—'}</p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-1.5 @xl:items-end">
        {signature ? (
          <img src={signature} alt={signatureAlt} className="h-16 rounded-lg border border-line bg-surface" />
        ) : (
          <span className="flex h-16 w-40 items-center justify-center rounded-lg border border-dashed border-line text-xs text-ink-400">
            No signature on file
          </span>
        )}
        {signedAt && (
          <p className="flex items-center gap-1 text-xs font-medium text-[#0e7d6b]">
            <CircleCheck size={14} aria-hidden />
            Signed {formatDateAtTime(signedAt)}
          </p>
        )}
      </div>
    </div>
  );
}
