import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, X } from 'lucide-react';
import { getPatientForms } from '../../api/forms.api';
import { useAuth } from '../../auth/useAuth';
import { useTableControls } from '../../hooks/useTableControls';
import { FORM_STATUS, STATUS_LABEL, STATUS_TONE } from '../../lib/constants';
import { formatDate } from '../../lib/formatters';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import TableFooter from '../../components/ui/TableFooter';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import StatusTimeline from './StatusTimeline';

// No max-width: every other list screen fills the AppShell's main column, and
// this page's table now carries the same search/filter/pagination controls, so
// a narrower container here would make the identical table look different.
function Page({ children }) {
  return <div className="flex w-full flex-col gap-4 p-5 pb-8">{children}</div>;
}

// Only the statuses a patient's own visit can actually be in, so the dropdown
// never offers a filter that matches nothing.
const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Visits' },
  ...Object.values(FORM_STATUS).map((status) => ({
    value: status,
    label: STATUS_LABEL[status] ?? status,
  })),
];

// The visit date is matched as it is displayed ("Sep 12, 2026"), so typing what
// is on screen finds the row; the raw ISO timestamp would not match that.
const searchFields = (f) => [
  formatDate(f.formDate),
  STATUS_LABEL[f.status] ?? f.status,
  `Station ${f.currentStation}`,
];

const filterField = (f) => f.status;

const COLUMNS = [
  { key: 'formDate', header: 'Visit Date', render: (f) => formatDate(f.formDate) },
  {
    key: 'status',
    header: 'Status',
    render: (f) => <Badge tone={STATUS_TONE[f.status]} dot>{STATUS_LABEL[f.status] ?? f.status}</Badge>,
  },
  { key: 'currentStation', header: 'Station', render: (f) => `Station ${f.currentStation}` },
  {
    key: 'action',
    header: '',
    render: (f) => (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0e7d6b]">
        {f.status === FORM_STATUS.COMPLETED ? 'View record' : 'View progress'}
        <ChevronRight size={14} />
      </span>
    ),
  },
];

/**
 * A patient can go through the station workflow repeatedly (monthly,
 * six-monthly cadence -- not yet decided, and not encoded here), so this
 * page always shows the full table of visits rather than treating "the
 * latest one" as special. One row at a time expands below the table:
 * a Completed visit's row instead navigates straight to its full record
 * (MyRecordDetailPage), since that page redirects away from anything else.
 */
export default function MyRecordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expandedFormID, setExpandedFormID] = useState(null);

  const { data: forms, isLoading, error, refetch } = useQuery({
    queryKey: ['my-forms', user.patientID],
    queryFn: () => getPatientForms(user.patientID),
  });

  // Hooks run before the early returns below, so the table state is declared
  // here even though `forms` is still undefined on the loading pass.
  const table = useTableControls(forms, { searchFields, filterField });

  if (isLoading) return <Page><Skeleton /></Page>;
  if (error) return <Page><ErrorState error={error} onRetry={refetch} /></Page>;

  if (!forms?.length) {
    return (
      <Page>
        <div className="flex flex-col items-center rounded-2xl border border-line bg-surface px-6 py-14 text-center shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9fbf6] text-[#0e7d6b]">
            <FileText size={22} strokeWidth={2} />
          </span>
          <p className="mt-4 text-base font-semibold text-ink-900">No record yet</p>
          <p className="mt-1 max-w-sm text-sm text-ink-500">
            Your record appears here after your first wellness examination at the health office.
          </p>
        </div>
      </Page>
    );
  }

  const expandedForm = forms.find((f) => f.formID === expandedFormID) ?? null;

  function onRowClick(form) {
    if (form.status === FORM_STATUS.COMPLETED) {
      navigate(`/my-record/${form.formID}`);
      return;
    }
    // No standalone page exists for an in-progress visit -- MyRecordDetailPage
    // redirects away from anything not Completed -- so its timeline expands
    // in place instead. Clicking the same row again collapses it.
    setExpandedFormID((current) => (current === form.formID ? null : form.formID));
  }

  return (
    <Page>
      <h1 className="text-lg font-semibold text-ink-900">My Record</h1>

      <Card
        flush
        actions={
          <div className="flex items-center gap-2">
            <SearchInput
              id="my-visits-search"
              value={table.query}
              onChange={table.onSearch}
              placeholder="Search by date, status, or station"
              className="w-80"
            />
            <Select
              value={table.filter}
              onChange={(e) => table.onFilter(e.target.value)}
              options={STATUS_FILTER_OPTIONS}
              className="w-52"
            />
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <DataTable
            columns={COLUMNS}
            rows={table.pageRows.map((f) => ({ ...f, id: f.formID }))}
            onRowClick={onRowClick}
            variant="plain"
            empty="No visits match your search."
          />

          <TableFooter
            page={table.page}
            totalPages={table.totalPages}
            total={table.total}
            noun="visit"
            onPageChange={table.setPage}
          />
        </div>
      </Card>

      {expandedForm && (
        <Card
          flush
          title={`Visit on ${formatDate(expandedForm.formDate)} — step by step`}
          actions={
            <button
              type="button"
              onClick={() => setExpandedFormID(null)}
              aria-label="Close"
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-400 hover:bg-gray-100 hover:text-ink-700"
            >
              <X size={14} />
            </button>
          }
        >
          <StatusTimeline form={expandedForm} />
        </Card>
      )}
    </Page>
  );
}
