import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Collapsible({ title, icon: Icon, subtitle, defaultOpen = false, children }) {
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
      {open && <div className="border-t border-line px-4 py-4">{children}</div>}
    </div>
  );
}
