import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getAllForms } from '../../api/forms.api';
import { FORM_STATUS, STATIONS } from '../../lib/constants';
import { fullName, formatDate } from '../../lib/formatters';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';

const STAT_CARDS = [
  { key: 'total', label: 'Total Forms', tone: 'text-ink-900' },
  { key: FORM_STATUS.PENDING_ASSESSMENT, label: 'Pending Assessment', tone: 'text-sky-700' },
  { key: FORM_STATUS.PENDING_CONSULTATION, label: 'Pending Consultation', tone: 'text-amber-700' },
  { key: FORM_STATUS.COMPLETED, label: 'Completed', tone: 'text-emerald-700' },
  { key: FORM_STATUS.CANCELLED, label: 'Cancelled', tone: 'text-rose-700' },
];

const STATION_CARDS = [
  { key: STATIONS.ONE, label: 'At Station 1' },
  { key: STATIONS.TWO, label: 'At Station 2' },
  { key: STATIONS.THREE, label: 'At Station 3' },
];

const STATUS_LABEL = {
  [FORM_STATUS.PENDING_ASSESSMENT]: 'Pending Assessment',
  [FORM_STATUS.PENDING_CONSULTATION]: 'Pending Consultation',
  [FORM_STATUS.COMPLETED]: 'Completed',
  [FORM_STATUS.CANCELLED]: 'Cancelled',
};

const STATUS_TONE = {
  [FORM_STATUS.PENDING_ASSESSMENT]: 'info',
  [FORM_STATUS.PENDING_CONSULTATION]: 'warn',
  [FORM_STATUS.COMPLETED]: 'success',
  [FORM_STATUS.CANCELLED]: 'danger',
};

const RECENT_COLUMNS = [
  { key: 'name', header: 'Name', render: (f) => fullName(f.patient) },
  {
    key: 'status',
    header: 'Status',
    render: (f) => <Badge tone={STATUS_TONE[f.status]}>{STATUS_LABEL[f.status] ?? f.status}</Badge>,
  },
  { key: 'currentStation', header: 'Station', render: (f) => `Station ${f.currentStation}` },
  { key: 'formDate', header: 'Date', render: (f) => formatDate(f.formDate) },
];

const RECENT_LIMIT = 8;

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

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: forms, isLoading, error, refetch } = useQuery({
    queryKey: ['forms'],
    queryFn: getAllForms,
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const counts = countByStatus(forms);
  const stationCounts = countByStation(forms);
  const totalPatients = new Set(forms.map((f) => f.patientID)).size;
  const submittedToday = forms.filter((f) => isToday(f.formDate)).length;
  const recentForms = forms.slice(0, RECENT_LIMIT);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STAT_CARDS.map(({ key, label, tone }) => (
          <Card key={key} title={label}>
            <p className={`text-3xl font-semibold ${tone}`}>{counts[key] ?? 0}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card title="Total Patients">
          <p className="text-3xl font-semibold text-ink-900">{totalPatients}</p>
        </Card>
        <Card title="Submitted Today">
          <p className="text-3xl font-semibold text-brand-700">{submittedToday}</p>
        </Card>
        {STATION_CARDS.map(({ key, label }) => (
          <Card key={key} title={label}>
            <p className="text-3xl font-semibold text-ink-900">{stationCounts[key] ?? 0}</p>
          </Card>
        ))}
      </div>

      <Card
        title="Recent Forms"
        actions={<Link to="/forms" className="text-sm text-brand-600 hover:underline">View all</Link>}
      >
        <DataTable
          columns={RECENT_COLUMNS}
          rows={recentForms}
          onRowClick={(row) => navigate(`/forms/${row.formID}`)}
          empty="No forms yet."
        />
      </Card>
    </div>
  );
}
