import { useEffect, useRef, useState } from 'react';
import {
  Calendar, ChevronRight, CircleX, Clock, Eye, Inbox, MapPin, MoreVertical, Smile, SquareCheck, Users,
} from 'lucide-react';
import { FORM_STATUS, STATUS_LABEL, STATUS_TONE } from '../../lib/constants';
import { fullName, formatDate } from '../../lib/formatters';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';

// Dental and vision reuse their sidebar icons, so a status reads as the desk
// the form is waiting at.
const STATUS_ICON = {
  [FORM_STATUS.PENDING_ASSESSMENT]: Clock,
  [FORM_STATUS.PENDING_CONSULTATION]: Users,
  [FORM_STATUS.PENDING_DENTAL]: Smile,
  [FORM_STATUS.PENDING_VISION]: Eye,
  [FORM_STATUS.COMPLETED]: SquareCheck,
  [FORM_STATUS.CANCELLED]: CircleX,
};

// Rough height of a three-item menu, to decide whether it fits below the button.
const MENU_HEIGHT = 140;

/**
 * Kebab menu holding a form's admin actions, for layouts with no room to show
 * them as a row of buttons (the phone cards, the mid-width table).
 *
 * The menu is `fixed` at the button's on-screen position rather than
 * `absolute`, so the table's overflow-x frame cannot clip it; it opens upward
 * when there is no room below, and closes on scroll since it would otherwise
 * float away from its row.
 */
export function ActionsMenu({ form, actions }) {
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
    // Stop propagation so opening the menu does not also open the form.
    <div ref={rootRef} className="relative" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Actions for ${fullName(form.patient)}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition hover:bg-gray-100 hover:text-ink-700"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div role="menu" style={position} className="fixed z-30 w-44 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg">
          {actions.map(({ key, label, icon: Icon, tone, title, onSelect }) => (
            <button
              key={key}
              type="button"
              role="menuitem"
              title={title}
              onClick={() => { setPosition(null); onSelect(); }}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition ${tone}`}
            >
              <Icon size={16} className="shrink-0" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The Forms list as stacked cards, for widths the table's columns cannot fit
 * (phones, tablets beside the sidebar). `actionsFor(form)` returns the same action list
 * the desktop table renders as buttons; omit it to show no menu at all.
 */
export default function FormCardList({ forms, onOpen, actionsFor, empty = 'Nothing here yet.' }) {
  if (!forms?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line px-3 py-14 text-center">
        <Inbox size={28} className="text-ink-300" />
        <p className="text-sm text-ink-500">{empty}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {forms.map((form) => {
        const name = fullName(form.patient);
        const actions = actionsFor?.(form) ?? [];
        return (
          <div
            key={form.formID}
            onClick={() => onOpen(form)}
            // A clickable card must be reachable without a touch, so it takes
            // focus and answers Enter/Space like the button it behaves as.
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen(form);
              }
            }}
            className="flex cursor-pointer gap-3 rounded-xl border border-line bg-surface p-4 shadow-sm transition-colors hover:bg-[#f9fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <Avatar name={name} size={44} />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold wrap-break-word text-ink-900">{name}</p>
              <p className="truncate text-[13px] text-ink-500">
                {form.patientAccount?.username ?? '—'}
              </p>
              <div className="mt-2">
                <Badge tone={STATUS_TONE[form.status]} icon={STATUS_ICON[form.status]}>
                  {STATUS_LABEL[form.status] ?? form.status}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} className="shrink-0" />
                  Station {form.currentStation}
                </span>
                <span aria-hidden="true" className="h-3.5 w-px bg-line" />
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} className="shrink-0" />
                  {formatDate(form.formDate)}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-start">
              <ChevronRight aria-hidden="true" size={18} className="mt-2 text-ink-400" />
              {actions.length > 0 && <ActionsMenu form={form} actions={actions} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
