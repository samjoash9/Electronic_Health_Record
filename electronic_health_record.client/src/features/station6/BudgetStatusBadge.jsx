import { AlertTriangle } from 'lucide-react';

/** A billing period's Within / Over Budget pill, shared by its table row and card. */
export default function BudgetStatusBadge({ isOverBudget }) {
  return isOverBudget ? (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
      <AlertTriangle size={11} className="shrink-0" />
      Over Budget
    </span>
  ) : (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      Within Budget
    </span>
  );
}
