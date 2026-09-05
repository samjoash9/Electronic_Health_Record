import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, ClipboardList, MessageSquareDot, CircleCheck, CircleX,
  Users, Send, Landmark, User, ListFilter, Calendar, ArrowRight, MoreHorizontal,
} from 'lucide-react';
import { getAllForms } from '../../api/forms.api';
import { FORM_STATUS, STATIONS, STATUS_LABEL, STATUS_TONE } from '../../lib/constants';
import { fullName, formatDate } from '../../lib/formatters';
import { useTableControls } from '../../hooks/useTableControls';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import StatCard from '../../components/ui/StatCard';
import Avatar from '../../components/ui/Avatar';
import TableFooter from '../../components/ui/TableFooter';

const STAT_CARDS = [
  { key: 'total', label: 'Total Forms', icon: FileText, accent: 'indigo' },
  { key: FORM_STATUS.PENDING_ASSESSMENT, label: 'Pending Assessment', icon: ClipboardList, accent: 'sky' },
  { key: FORM_STATUS.PENDING_CONSULTATION, label: 'Pending Consultation', icon: MessageSquareDot, accent: 'amber' },
  { key: FORM_STATUS.COMPLETED, label: 'Completed', icon: CircleCheck, accent: 'emerald' },
  { key: FORM_STATUS.CANCELLED, label: 'Cancelled', icon: CircleX, accent: 'rose' },
];

const STATION_CARDS = [
  { key: STATIONS.ONE, label: 'At Station 1', accent: 'sky' },
  { key: STATIONS.TWO, label: 'At Station 2', accent: 'emerald' },
  { key: STATIONS.THREE, label: 'At Station 3', accent: 'violet' },
];

const RECENT_COLUMNS = [
  {
    key: 'name',
    header: 'Name',
    icon: User,
    render: (f) => (
      <span className="inline-flex items-center gap-2.5">
        <Avatar name={fullName(f.patient)} size={28} palette="muted" />
        {fullName(f.patient)}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    icon: ListFilter,
    render: (f) => (
      <Badge tone={STATUS_TONE[f.status]} dot>{STATUS_LABEL[f.status] ?? f.status}</Badge>
    ),
  },
  {
    key: 'currentStation',
    header: 'Station',
    icon: Landmark,
    render: (f) => (
      <span className="inline-flex items-center gap-2">
        <Landmark size={14} className="text-[#b3bccb]" />
        Station {f.currentStation}
      </span>
    ),
  },
  {
    key: 'formDate',
    header: 'Date',
    icon: Calendar,
    render: (f) => (
      <span className="inline-flex items-center gap-2">
        <Calendar size={14} className="text-[#b3bccb]" />
        {formatDate(f.formDate)}
      </span>
    ),
  },
];

// The dashboard shows a recent window rather than every form — "View all"
// leads to the full list — but that window is paged so the card keeps a fixed
// height instead of growing with the data.
const RECENT_LIMIT = 25;
const RECENT_PAGE_SIZE = 5;

function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

function countByStatus(forms) {
  const counts = { total: forms.length };
  for (const status of Object.values(FORM_STATUS)) counts[status] = 0;
  for (const form of forms) counts[form.status] = (counts[form.status] ?? 0) + 1;
  return counts;
}

function countByStation(forms) {
  const counts = {};
  for (const form of forms) counts[form.currentStation] = (counts[form.currentStation] ?? 0) + 1;
  return counts;
}

/** Per-row overflow menu. Only ever offers routes the form actually has. */
function RowMenu({ form, onView }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button
        type="button"
        aria-label={`Actions for ${fullName(form.patient)}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-gray-100 hover:text-ink-700"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg">
          <button
            type="button"
            onClick={() => { setOpen(false); onView(form); }}
            className="block w-full px-3 py-2 text-left text-sm text-ink-700 transition hover:bg-gray-50"
          >
            View form
          </button>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: forms, isLoading, error, refetch } = useQuery({
    queryKey: ['forms'],
    queryFn: getAllForms,
  });

  const recentForms = forms?.slice(0, RECENT_LIMIT);

  const recentTable = useTableControls(recentForms, { pageSize: RECENT_PAGE_SIZE });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const counts = countByStatus(forms);
  const stationCounts = countByStation(forms);
  const totalPatients = new Set(forms.map((f) => f.patientID)).size;
  const submittedToday = forms.filter((f) => isToday(f.formDate)).length;

  const viewForm = (form) => navigate(`/forms/${form.formID}`);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {STAT_CARDS.map(({ key, label, icon, accent }) => (
          <StatCard key={key} label={label} value={counts[key] ?? 0} icon={icon} accent={accent} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Patients" value={totalPatients} icon={Users} accent="violet" />
        <StatCard label="Submitted Today" value={submittedToday} icon={Send} accent="sky" />
        {STATION_CARDS.map(({ key, label, accent }) => (
          <StatCard
            key={key}
            label={label}
            value={stationCounts[key] ?? 0}
            icon={Landmark}
            accent={accent}
          />
        ))}
      </div>

      <Card
        title="Recent Forms"
        flush
        dividedHeader={false}
        className="border-[#eef0f4] shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
        actions={
          <Link
            to="/forms"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#8b95a7] transition hover:text-brand-600"
          >
            View all
            <ArrowRight size={15} />
          </Link>
        }
      >
        <div className="flex flex-col gap-3">
          <DataTable
            variant="plain"
            columns={RECENT_COLUMNS}
            rows={recentTable.pageRows}
            onRowClick={viewForm}
            rowActions={(row) => <RowMenu form={row} onView={viewForm} />}
            empty="No forms yet."
          />

          <TableFooter
            page={recentTable.page}
            totalPages={recentTable.totalPages}
            total={recentTable.total}
            noun="form"
            onPageChange={recentTable.setPage}
          />
        </div>
      </Card>
    </div>
  );
}
