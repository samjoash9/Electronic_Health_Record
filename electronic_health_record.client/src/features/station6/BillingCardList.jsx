import { Trash2, Users } from 'lucide-react';
import { peso, formatDate } from '../../lib/formatters';
import Badge from '../../components/ui/Badge';
import RecordCardList from '../../components/ui/RecordCardList';
import BudgetStatusBadge from './BudgetStatusBadge';

// Past this share of capital the bar turns amber, matching the dashboard's
// Station 6 report, so a period is flagged before it runs out.
const BUDGET_WARN_PERCENT = 80;

function percentUsed(period) {
  if (period.capital > 0) return (period.consumed / period.capital) * 100;
  return period.consumed > 0 ? 100 : 0;
}

/**
 * Capital, consumed and remaining as a small ledger with a usage bar. Label
 * and amount share each line rather than sitting in three columns: a phone
 * card is too narrow for three peso amounts side by side.
 */
function BudgetBreakdown({ period }) {
  const percent = percentUsed(period);
  let barTone = 'bg-brand-500';
  if (period.isOverBudget) barTone = 'bg-rose-500';
  else if (percent >= BUDGET_WARN_PERCENT) barTone = 'bg-amber-500';
  // A fresh period's first few charges round to 0%, which would read as
  // nothing spent.
  const percentLabel = percent > 0 && percent < 1 ? '<1%' : `${Math.round(percent)}%`;

  return (
    <div className="rounded-lg bg-gray-50 p-3 text-xs">
      <dl className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-500">Capital</dt>
          <dd className="whitespace-nowrap font-medium text-ink-900">{peso(period.capital)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-500">Consumed</dt>
          <dd className="whitespace-nowrap font-medium text-ink-900">{peso(period.consumed)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className={period.isOverBudget ? 'text-rose-700' : 'text-ink-500'}>
            {period.isOverBudget ? 'Over by' : 'Remaining'}
          </dt>
          <dd className={`whitespace-nowrap text-sm font-semibold ${period.isOverBudget ? 'text-rose-600' : 'text-[#0A594D]'}`}>
            {peso(Math.abs(period.remaining))}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center gap-2">
        <div
          role="progressbar"
          aria-label={`${period.title} capital used`}
          aria-valuenow={Math.round(Math.min(percent, 100))}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200"
        >
          <div className={`h-full rounded-full ${barTone}`} style={{ width: `${Math.min(percent, 100)}%` }} />
        </div>
        <span className="shrink-0 text-[11px] text-ink-500">{percentLabel} used</span>
      </div>
    </div>
  );
}

/**
 * The billing periods as record cards, for widths the table's seven columns
 * cannot fit (phones, tablets beside the sidebar). No avatar chip: the card's
 * width goes to the peso amounts instead.
 */
export default function BillingCardList({ periods, onOpen, onDelete, empty }) {
  return (
    <RecordCardList
      rows={periods}
      rowKey={(period) => period.billingFormID}
      onOpen={onOpen}
      empty={empty}
      card={(period) => ({
        title: period.title,
        subtitle: `${formatDate(period.startDate)} – ${formatDate(period.endDate)}`,
        badges: (
          <>
            <BudgetStatusBadge isOverBudget={period.isOverBudget} />
            {period.unpricedCount > 0 && <Badge tone="warn">{period.unpricedCount} unpriced</Badge>}
          </>
        ),
        meta: [{
          icon: Users,
          label: `${period.employeeCount} employee${period.employeeCount === 1 ? '' : 's'}`,
        }],
        children: <BudgetBreakdown period={period} />,
        actions: [{
          key: 'delete',
          label: 'Delete',
          icon: Trash2,
          tone: 'text-ink-400 hover:bg-rose-50 hover:text-rose-600',
          title: `Delete ${period.title}`,
          onSelect: () => onDelete(period),
        }],
      })}
    />
  );
}
