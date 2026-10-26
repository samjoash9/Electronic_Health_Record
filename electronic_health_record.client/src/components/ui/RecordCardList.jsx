import { Fragment } from 'react';
import { ChevronRight, Inbox } from 'lucide-react';
import Avatar from './Avatar';
import ActionsMenu from './ActionsMenu';

/**
 * One record as a card: an avatar (or icon chip), a title and subtitle,
 * badges, a row of icon-labelled facts, and the record's actions -- the shape
 * a table row takes when the table's columns cannot fit (phones, tablets
 * beside the sidebar).
 *
 * - `avatarName` draws initials; pass `icon` + `iconClass` instead for a
 *   record that is not a person.
 * - `meta` is `[{ icon, label }]`. Two or fewer sit on one line split by a
 *   hairline; more stack one per line, since a wrapped line would leave a
 *   divider dangling at its end.
 * - `children` render below the facts, for interactive content (an editable
 *   price, say).
 * - `actions` take the ActionsMenu shape. A single action shows as its own
 *   icon button; several fold into the kebab menu, named by `actionsLabel`.
 * - `trailing` sits where the actions would, for a note in place of them.
 * - `onOpen` makes the whole card a button with a chevron.
 */
export function RecordCard({
  avatarName, icon: Icon, iconClass = '', title, titleClass = '', subtitle, badges,
  meta = [], children, actions = [], actionsLabel, trailing, onOpen,
}) {
  const single = actions.length === 1 ? actions[0] : null;
  const SingleIcon = single?.icon;

  return (
    <div
      onClick={onOpen}
      // A clickable card must be reachable without a touch, so it takes focus
      // and answers Enter/Space like the button it behaves as.
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={onOpen ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      } : undefined}
      className={`flex gap-3 rounded-xl border border-line bg-surface p-4 shadow-sm ${onOpen
        ? 'cursor-pointer transition-colors hover:bg-[#f9fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'
        : ''
      }`}
    >
      {avatarName != null
        ? <Avatar name={avatarName} size={44} />
        : Icon && (
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
            <Icon size={20} strokeWidth={1.75} />
          </span>
        )}

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold wrap-break-word text-ink-900 ${titleClass}`}>{title}</p>
        {subtitle && <div className="truncate text-[13px] text-ink-500">{subtitle}</div>}
        {badges && <div className="mt-2 flex flex-wrap gap-1.5">{badges}</div>}
        {meta.length > 0 && (
          <div className={`mt-3 flex text-xs text-ink-500 ${meta.length > 2
            ? 'flex-col items-start gap-1.5'
            : 'flex-wrap items-center gap-x-3 gap-y-1'
          }`}>
            {meta.map(({ icon: MetaIcon, label }, i) => (
              <Fragment key={i}>
                {i > 0 && meta.length <= 2 && <span aria-hidden="true" className="h-3.5 w-px bg-line" />}
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <MetaIcon size={14} className="shrink-0" />
                  <span className="wrap-break-word">{label}</span>
                </span>
              </Fragment>
            ))}
          </div>
        )}
        {children && <div className="mt-3">{children}</div>}
      </div>

      {(onOpen || actions.length > 0 || trailing) && (
        <div className="flex shrink-0 items-start">
          {trailing}
          {onOpen && <ChevronRight aria-hidden="true" size={18} className="mt-2 text-ink-400" />}
          {single && (
            <button
              type="button"
              title={single.title ?? single.label}
              aria-label={single.title ?? single.label}
              disabled={single.disabled}
              onClick={(e) => { e.stopPropagation(); single.onSelect(); }}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${single.tone ?? 'text-ink-500 hover:bg-gray-100 hover:text-ink-700'}`}
            >
              <SingleIcon size={16} />
            </button>
          )}
          {actions.length > 1 && <ActionsMenu label={actionsLabel} actions={actions} />}
        </div>
      )}
    </div>
  );
}

/**
 * A list of RecordCards: `card(row)` returns each card's props, `rowKey(row)`
 * its key, and `onOpen(row)` (optional) makes every card open its record.
 */
export default function RecordCardList({ rows, rowKey, card, onOpen, empty = 'Nothing here yet.' }) {
  if (!rows?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line px-3 py-14 text-center">
        <Inbox size={28} className="text-ink-300" />
        <p className="text-sm text-ink-500">{empty}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <RecordCard key={rowKey(row)} {...card(row)} onOpen={onOpen ? () => onOpen(row) : undefined} />
      ))}
    </div>
  );
}
