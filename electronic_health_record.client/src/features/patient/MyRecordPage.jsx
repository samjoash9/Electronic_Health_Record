import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, X } from 'lucide-react';
import { getPatientForms } from '../../api/forms.api';
import { useAuth } from '../../auth/useAuth';
import { FORM_STATUS, STATUS_LABEL, STATUS_TONE } from '../../lib/constants';
import { formatDate } from '../../lib/formatters';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import StatusTimeline from './StatusTimeline';

function Page({ children }) {
  return <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-8">{children}</div>;
}

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
      <Card title="Your Visits" flush>
        <DataTable
          columns={COLUMNS}
          rows={forms.map((f) => ({ ...f, id: f.formID }))}
          onRowClick={onRowClick}
          variant="plain"
        />
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
