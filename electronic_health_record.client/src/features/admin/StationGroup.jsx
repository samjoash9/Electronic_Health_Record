import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * One collapsible station in the form record view. Wraps the SectionCards that
 * station produced, so the reader opens and closes a whole desk's output at
 * once rather than each section inside it.
 *
 * The header is Collapsible's, so every station on the page reads as one row of
 * the same list whether its body is bare content (stations 1-2) or SectionCards
 * (stations 3-5). Only the body differs: a canvas ground and column gap, so the
 * cards inside keep the spacing they have when rendered straight on the page.
 */
export default function StationGroup({
  title, subtitle, icon: Icon, defaultOpen = false, children,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`overflow-hidden rounded-xl border border-line bg-surface shadow-sm transition-colors ${open ? 'ring-1 ring-[#0e7d6b]/15' : ''}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f3fdfb]"
      >
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e9fbf6] text-[#0e7d6b]">
            <Icon size={17} />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink-900">{title}</span>
          {subtitle && <span className="block truncate text-xs text-ink-500">{subtitle}</span>}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-ink-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="flex flex-col gap-4 border-t border-line bg-canvas p-4">{children}</div>}
    </div>
  );
}
