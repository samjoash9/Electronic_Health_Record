import { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';

// Rough height of a four-item menu, to decide whether it fits below the button.
const MENU_HEIGHT = 180;

/**
 * Kebab menu holding a row's actions, for layouts with no room to show them as
 * a row of buttons (record cards, a narrowed table). Each action is
 * `{ key, label, icon, tone?, title?, disabled?, onSelect }`; `label` names the
 * kebab button itself for screen readers.
 *
 * The menu is `fixed` at the button's on-screen position rather than
 * `absolute`, so a table's overflow-x frame cannot clip it; it opens upward
 * when there is no room below, and closes on scroll since it would otherwise
 * float away from its row.
 */
export default function ActionsMenu({ label, actions }) {
  const [position, setPosition] = useState(null);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const open = position !== null;

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setPosition(null);
    const onMouseDown = (e) => {
      if (!rootRef.current?.contains(e.target)) close();
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const toggle = () => {
    if (open) {
      setPosition(null);
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    const right = window.innerWidth - rect.right;
    setPosition(rect.bottom + MENU_HEIGHT > window.innerHeight
      ? { bottom: window.innerHeight - rect.top + 4, right }
      : { top: rect.bottom + 4, right });
  };

  return (
    // Stop propagation so opening the menu does not also open the row.
    <div ref={rootRef} className="relative" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition hover:bg-gray-100 hover:text-ink-700"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div role="menu" style={position} className="fixed z-30 w-52 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg">
          {actions.map(({ key, label: itemLabel, icon: Icon, tone, title, disabled, onSelect }) => (
            <button
              key={key}
              type="button"
              role="menuitem"
              title={title}
              disabled={disabled}
              onClick={() => { setPosition(null); onSelect(); }}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${tone ?? 'text-ink-700 hover:bg-gray-50'}`}
            >
              <Icon size={16} className="shrink-0" />
              {itemLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
