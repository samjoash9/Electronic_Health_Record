import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, ClipboardList, MessageSquareDot, CircleCheck, CircleX,
  Users, Landmark, User, ListFilter, Calendar, ArrowRight, MoreHorizontal,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { getAllForms } from '../../api/forms.api';
import { FORM_STATUS, STATUS_LABEL, STATUS_TONE } from '../../lib/constants';
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

const STATION_CONFIG = [
  { id: 1, name: 'Station 1', bgClass: 'bg-sky-500', hex: '#0ea5e9' },
  { id: 2, name: 'Station 2', bgClass: 'bg-emerald-500', hex: '#10b981' },
  { id: 3, name: 'Station 3', bgClass: 'bg-violet-500', hex: '#8b5cf6' },
  { id: 4, name: 'Station 4', bgClass: 'bg-amber-500', hex: '#f59e0b' },
  { id: 5, name: 'Station 5', bgClass: 'bg-rose-500', hex: '#f43f5e' },
  { id: 6, name: 'Station 6', bgClass: 'bg-teal-500', hex: '#14b8a6' },
];

const STATIC_DONUT_DATA = [
  { name: 'Hypertension', value: 45, color: '#3b82f6' },
  { name: 'Arthritis', value: 25, color: '#10b981' },
  { name: 'Diabetes', value: 18, color: '#f59e0b' },
  { name: 'Cancer', value: 12, color: '#8b5cf6' },
];

const STATIC_LINE_DATA = [
  { month: 'Jan', current: 500, previous: 400 },
  { month: 'Feb', current: 260, previous: 200 },
  { month: 'Mar', current: 520, previous: 400 },
  { month: 'Apr', current: 250, previous: 100 },
  { month: 'May', current: 400, previous: 200 },
  { month: 'Jun', current: 500, previous: 41 },
  { month: 'Jul', current: 200, previous: 90 },
  { month: 'Aug', current: 152, previous: 120 },
  { month: 'Sep', current: 395, previous: 302 },
  { month: 'Oct', current: 295, previous: 199 },
  { month: 'Nov', current: 143, previous: 67 },
  { month: 'Dec', current: 267, previous: 80 },
];
// temporary due to need ko and threshold para ma determined kung pila ang bagsak
const STATIC_WELLNESS_ASPECTS_DATA = [
  { aspect: 'Spiritual', score: 82 },
  { aspect: 'Psychological', score: 74 },
  { aspect: 'Mental', score: 68 },
  { aspect: 'Emotional', score: 71 },
  { aspect: 'Physical', score: 88 },
  { aspect: 'Financial', score: 60 },
  { aspect: 'Social', score: 79 },
];

const STATIC_SMOKER_DATA = [
  { category: 'Smoker', traditional: 210, ecigarette: 95, nonSmoker: 0 },
  { category: 'Non Smoker', traditional: 0, ecigarette: 0, nonSmoker: 680 },
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

const RECENT_LIMIT = 25;
const RECENT_PAGE_SIZE = 5;

function countByStatus(forms = []) {
  const counts = { total: forms.length };
  for (const status of Object.values(FORM_STATUS)) counts[status] = 0;
  for (const form of forms) counts[form.status] = (counts[form.status] ?? 0) + 1;
  return counts;
}

function countByStation(forms = []) {
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

/** Custom Tooltip filtering out 0 values for clean hover states */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const filteredPayload = payload.filter((item) => item.value > 0);
  if (!filteredPayload.length) return null;

  return (
    <div className="bg-white p-3 shadow-lg rounded-md border border-slate-200 text-xs">
      <p className="font-semibold text-ink-900 mb-1.5">{label}</p>
      <div className="flex flex-col gap-1">
        {filteredPayload.map((item) => {
          const itemColor = item.color || item.payload?.fill || item.fill;
          return (
            <div key={item.dataKey || item.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: itemColor }}>
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: itemColor }} />
                {item.name}
              </span>
              <span className="font-semibold text-ink-900 tabular-nums">
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
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

  const safeForms = forms ?? [];
  const counts = countByStatus(safeForms);
  const stationCounts = countByStation(safeForms);
  const totalPatients = new Set(safeForms.map((f) => f.patientID)).size;

  // Total patients across all 6 stations
  const totalStationPatients = STATION_CONFIG.reduce(
    (sum, st) => sum + (stationCounts[st.id] ?? 0),
    0
  );

  const viewForm = (form) => navigate(`/forms/${form.formID}`);

  // Dynamic color assignment for Smoker Status chart:
  const smokerEntry = STATIC_SMOKER_DATA.find((d) => d.category === 'Smoker');
  const traditionalVal = smokerEntry?.traditional ?? 0;
  const ecigaretteVal = smokerEntry?.ecigarette ?? 0;

  const DARK_TEAL = '#0F766E';
  const LIGHT_MINT = '#99F6E4';
  const SLATE_GREY = '#94A3B8';

  // Whichever is higher gets the primary dark teal; lower gets the lighter mint
  const traditionalColor = traditionalVal >= ecigaretteVal ? DARK_TEAL : LIGHT_MINT;
  const ecigaretteColor = ecigaretteVal > traditionalVal ? DARK_TEAL : LIGHT_MINT;

  return (
    <div className="flex flex-col gap-6 p-5">
      <h1 className="text-xl font-semibold text-ink-900">Dashboard</h1>

      {/* 1. Main Grid Restructuring (Top Section): 5 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        {/* Left Side: 6 Summary Stat Cards in 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:col-span-3">
          <StatCard
            label="Total Form"
            value={counts.total ?? 0}
            icon={FileText}
            accent="brand"
          />
          <StatCard
            label="Total Patient"
            value={totalPatients}
            icon={Users}
            accent="brand"
          />
          <StatCard
            label="Completed"
            value={counts[FORM_STATUS.COMPLETED] ?? 0}
            icon={CircleCheck}
            accent="brand"
          />
          <StatCard
            label="Cancelled"
            value={counts[FORM_STATUS.CANCELLED] ?? 0}
            icon={CircleX}
            iconWrapperClass="bg-red-500/15 text-red-600"
          />
          <StatCard
            label="Pending Assessment"
            value={counts[FORM_STATUS.PENDING_ASSESSMENT] ?? 0}
            icon={ClipboardList}
            iconWrapperClass="bg-amber-500/15 text-amber-600"
          />
          <StatCard
            label="Pending Consultation"
            value={counts[FORM_STATUS.PENDING_CONSULTATION] ?? 0}
            icon={MessageSquareDot}
            iconWrapperClass="bg-emerald-500/15 text-emerald-600"
          />
        </div>

        {/* Right Side: Station Overview Card spanning 2 columns */}
        <div className="lg:col-span-2 rounded-2xl border border-[#eef0f4] bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold tracking-wide text-ink-900">Station Overview</h2>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-ink-600 tabular-nums">
                {totalStationPatients} {totalStationPatients === 1 ? 'Patient' : 'Patients'}
              </span>
            </div>

            {/* Proportional Segmented Progress Bar */}
            <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-100 flex p-0.5 gap-0.5">
              {totalStationPatients === 0 ? (
                <div className="h-full w-full rounded-full bg-slate-200" />
              ) : (
                STATION_CONFIG.map((st) => {
                  const stationCount = stationCounts[st.id] ?? 0;
                  const widthPercentage = (stationCount / totalStationPatients) * 100;
                  if (widthPercentage === 0) return null;
                  return (
                    <div
                      key={st.id}
                      className={`h-full ${st.bgClass} transition-all duration-300 first:rounded-l-full last:rounded-r-full`}
                      style={{ width: `${(stationCount / totalStationPatients) * 100}%` }}
                      title={`${st.name}: ${stationCount} (${widthPercentage.toFixed(1)}%)`}
                    />
                  );
                })
              )}
            </div>

            {/* 2-Column Legend */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-6">
              {STATION_CONFIG.map((st) => (
                <div key={st.id} className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${st.bgClass}`} />
                    <span className="truncate text-ink-600">{st.name}</span>
                  </div>
                  <span className="font-semibold text-ink-900 tabular-nums ml-2">
                    {stationCounts[st.id] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Strictly Static Charts (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Donut Chart (Col 1) */}
        <div className="lg:col-span-1 rounded-2xl border border-[#eef0f4] bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-ink-400"> diagnosed conditions</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-ink-900 tabular-nums">400</p>
              </div>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-ink-600">
                This Week
              </span>
            </div>

            <div className="h-56 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={STATIC_DONUT_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {STATIC_DONUT_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-line text-xs">
            {STATIC_DONUT_DATA.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-ink-500 truncate">{entry.name}</span>
                <span className="ml-auto font-medium text-ink-800">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Line Chart (Cols 2 & 3) */}
        <div className="lg:col-span-2 rounded-2xl border border-[#eef0f4] bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-ink-400">Total Patient Entry</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-ink-900 tabular-nums">2000</p>
              </div>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-ink-600">
                Jan - Jun
              </span>
            </div>

            <div className="h-56 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={STATIC_LINE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="current"
                    name="Current"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#3b82f6' }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="previous"
                    name="Previous"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-3 border-t border-line text-xs text-ink-500">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              <span>Previous</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3b. Third Row Analytics: 7 Aspects of Wellness & Smoker Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* The '7 Aspects of Wellness' Bar Chart (Left Side: 2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-[#eef0f4] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-ink-400">7 Aspects of Wellness</p>
                <p className="text-sm font-medium text-ink-600 mt-0.5">Average Assessment Scores</p>
              </div>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-ink-600">
                All Patients
              </span>
            </div>

            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={STATIC_WELLNESS_ASPECTS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="aspect" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="score" name="Score" fill="#37AF9B" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* The 'Smoker Status' Stacked Bar Chart (Right Side: 1 Column) */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-6 border border-[#eef0f4] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-ink-400">Smoker Status</p>
                <p className="text-sm font-medium text-ink-600 mt-0.5">Distribution Overview</p>
              </div>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-ink-600">
                Patient Records
              </span>
            </div>

            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={STATIC_SMOKER_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="traditional" name="Traditional Cigarette" stackId="smoker" fill={traditionalColor} maxBarSize={55}>
                    {STATIC_SMOKER_DATA.map((entry, index) => (
                      <Cell
                        key={`cell-traditional-${index}`}
                        fill={entry.category === 'Smoker' ? traditionalColor : 'transparent'}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="ecigarette" name="E-Cigarette" stackId="smoker" fill={ecigaretteColor} radius={[12, 12, 0, 0]} maxBarSize={55}>
                    {STATIC_SMOKER_DATA.map((entry, index) => (
                      <Cell
                        key={`cell-ecigarette-${index}`}
                        fill={entry.category === 'Smoker' ? ecigaretteColor : 'transparent'}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="nonSmoker" name="Non-Smoker" stackId="smoker" fill={SLATE_GREY} radius={[12, 12, 0, 0]} maxBarSize={55}>
                    {STATIC_SMOKER_DATA.map((entry, index) => (
                      <Cell
                        key={`cell-nonsmoker-${index}`}
                        fill={entry.category === 'Non Smoker' ? SLATE_GREY : 'transparent'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-line text-xs text-ink-500">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm transition-colors duration-200"
                style={{ backgroundColor: traditionalColor }}
              />
              <span>Traditional</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm transition-colors duration-200"
                style={{ backgroundColor: ecigaretteColor }}
              />
              <span>E-Cigarette</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm transition-colors duration-200"
                style={{ backgroundColor: SLATE_GREY }}
              />
              <span>Non-Smoker</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Existing Recent Forms table with mt-6 */}
      <div className="mt-6">
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
    </div>
  );
}
