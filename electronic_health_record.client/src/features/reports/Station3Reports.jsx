import { useState, useMemo } from 'react';
import {
  Stethoscope,
  Pill,
  FlaskConical,
  TriangleAlert,
  Info,
  Activity,
  AlertCircle,
  FileCheck2,
  Share2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import Select from '../../components/ui/Select';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import TableFooter from '../../components/ui/TableFooter';
import { useTableControls } from '../../hooks/useTableControls';
import { ALL_OFFICES, OFFICE_OPTIONS } from '../admin/dashboardOffice';
import ReportCard from './ReportCard';

// Color Palette conforming to Medical EHR Design System
const CHART_COLORS = {
  hypertension: '#0ea5e9', // Sky blue
  diabetes: '#10b981',     // Emerald
  urti: '#f59e0b',         // Amber
  dyslipidemia: '#8b5cf6', // Violet
  arthritis: '#ec4899',    // Pink
  unremarkable: '#64748b', // Slate

  // Care Plan Colors
  clearance: '#10b981',    // Emerald
  maintenanceRx: '#0ea5e9',// Sky
  diagnosticWorkup: '#f59e0b', // Amber
  specialistReferral: '#ec4899', // Pink
  urgentTransfer: '#ef4444', // Red
};

const GRID_LINE = '#f1f5f9';
const AXIS_COLOR = '#94a3b8';

// Clinical Diagnostic Classes
const DIAGNOSIS_CLASSES = [
  { key: 'hypertension', label: 'Hypertension', icd: 'I10 Essential (Primary)', color: CHART_COLORS.hypertension },
  { key: 'diabetes', label: 'Type 2 Diabetes', icd: 'E11 Non-insulin-dependent', color: CHART_COLORS.diabetes },
  { key: 'urti', label: 'Acute URTI', icd: 'J06 Upper Resp Infection', color: CHART_COLORS.urti },
  { key: 'dyslipidemia', label: 'Dyslipidemia', icd: 'E78 Lipoprotein Disorders', color: CHART_COLORS.dyslipidemia },
  { key: 'arthritis', label: 'Arthritis / OA', icd: 'M19 Degenerative Joint Disease', color: CHART_COLORS.arthritis },
  { key: 'unremarkable', label: 'Unremarkable / Clear', icd: 'Z00 Routine Medical Exam', color: CHART_COLORS.unremarkable },
];

// Consultation Disposition / Care Plan Categories
const DISPOSITION_CLASSES = [
  { key: 'maintenanceRx', label: 'Maintenance Rx Renewed', desc: 'Pharmacotherapy prescribed', color: CHART_COLORS.maintenanceRx },
  { key: 'diagnosticWorkup', label: 'Diagnostic Labs Ordered', desc: 'CBC, FBS, ECG, Imaging', color: CHART_COLORS.diagnosticWorkup },
  { key: 'clearance', label: 'Routine Clearance', desc: 'Lifestyle advice & surveillance', color: CHART_COLORS.clearance },
  { key: 'specialistReferral', label: 'Specialist Referral', desc: 'Cardiology, Nephrology, etc.', color: CHART_COLORS.specialistReferral },
  { key: 'urgentTransfer', label: 'Urgent Care Escalation', desc: 'Acute symptom intervention', color: CHART_COLORS.urgentTransfer },
];

// Top Prescribed Medications in Consultation
const TOP_MEDICATIONS = [
  {
    key: 'amlodipine',
    name: 'Amlodipine 5mg / 10mg',
    category: 'Antihypertensive · Calcium Channel Blocker',
    icon: Pill,
    baseCount: 84,
  },
  {
    key: 'losartan',
    name: 'Losartan Potassium 50mg',
    category: 'Antihypertensive · Angiotensin II Antagonist',
    icon: Pill,
    baseCount: 62,
  },
  {
    key: 'metformin',
    name: 'Metformin HCl 500mg',
    category: 'Antidiabetic · Biguanide Glycemic Control',
    icon: Pill,
    baseCount: 48,
  },
  {
    key: 'amoxicillin',
    name: 'Amoxicillin 500mg',
    category: 'Antibiotic · Beta-lactam Respiratory Therapy',
    icon: Activity,
    baseCount: 31,
  },
  {
    key: 'specialistReferrals',
    name: 'Specialist / Hospital Referrals',
    category: 'Cardiology, Nephrology & Pulmonary Consults',
    icon: Share2,
    baseCount: 18,
  },
];

// 12-Month Longitudinal Consultation Trend Data
const BASE_TREND = [
  { month: 'Nov', label: 'Nov', chronicRate: 51.4, labOrderRate: 38.2, consults: 210 },
  { month: 'Dec', label: 'Dec', chronicRate: 53.0, labOrderRate: 39.5, consults: 195 },
  { month: 'Jan', label: 'Jan', chronicRate: 54.8, labOrderRate: 44.0, consults: 240 },
  { month: 'Feb', label: 'Feb', chronicRate: 52.6, labOrderRate: 41.2, consults: 225 },
  { month: 'Mar', label: 'Mar', chronicRate: 55.1, labOrderRate: 43.8, consults: 260 },
  { month: 'Apr', label: 'Apr', chronicRate: 53.9, labOrderRate: 40.5, consults: 235 },
  { month: 'May', label: 'May', chronicRate: 56.4, labOrderRate: 42.1, consults: 250 },
  { month: 'Jun', label: 'Jun', chronicRate: 54.2, labOrderRate: 39.8, consults: 245 },
  { month: 'Jul', label: 'Jul', chronicRate: 57.0, labOrderRate: 41.6, consults: 255 },
  { month: 'Aug', label: 'Aug', chronicRate: 55.8, labOrderRate: 40.2, consults: 230 },
  { month: 'Sep', label: 'Sep', chronicRate: 58.5, labOrderRate: 43.1, consults: 265 },
  { month: 'Oct', label: 'Oct', chronicRate: 59.7, labOrderRate: 42.3, consults: 248 },
];

// Mock Consultation Patients for Flagged/Critical Follow-Up Table
const MOCK_CRITICAL_CONSULTATIONS = [
  {
    id: 1,
    name: 'DELA CRUZ, JUAN M.',
    office: 'PROVINCIAL ENGINEERING OFFICE',
    diagnosis: 'Stage 2 Hypertension; Dyslipidemia',
    treatmentPlan: 'Amlodipine 10mg OD, Atorvastatin 20mg OD; Lipid Profile & 12-Lead ECG ordered',
    lastVisit: '2026-10-02',
    disposition: 'Chronic Follow-up (2 wks)',
    statusTone: 'warn',
  },
  {
    id: 2,
    name: 'SANTOS, MARIA L.',
    office: 'PROVINCIAL CORRECTIONAL AND SECURITY MANAGEMENT OFFICE',
    diagnosis: 'Hypertensive Urgency (BP 184/112); Uncontrolled T2DM',
    treatmentPlan: 'Immediate oral anti-hypertensive; Urgent cardiology referral & STAT FBS/HbA1c',
    lastVisit: '2026-10-03',
    disposition: 'Urgent Specialty Referral',
    statusTone: 'danger',
  },
  {
    id: 3,
    name: 'REYES, ANTONIO P.',
    office: 'PROVINCIAL ENGINEERING OFFICE',
    diagnosis: 'Acute Bronchitis; Asthmatic Exacerbation',
    treatmentPlan: 'Salbutamol + Ipratropium Nebulization; Amoxicillin-Clavulanate 625mg BID x 7d',
    lastVisit: '2026-10-01',
    disposition: 'Short-term Recheck (3 days)',
    statusTone: 'warn',
  },
  {
    id: 4,
    name: 'GARCIA, ROSARIO T.',
    office: 'PROVINCIAL HEALTH OFFICE',
    diagnosis: 'Type 2 Diabetes with Peripheral Neuropathy',
    treatmentPlan: 'Metformin 500mg TID + Empagliflozin 10mg OD; Routine Diabetic Foot Surveillance',
    lastVisit: '2026-09-29',
    disposition: 'Endocrinology Review',
    statusTone: 'warn',
  },
  {
    id: 5,
    name: 'MENDOZA, CARLITO B.',
    office: 'PROVINCIAL CORRECTIONAL AND SECURITY MANAGEMENT OFFICE',
    diagnosis: 'Suspected Angina Pectoris; Stage 2 HTN',
    treatmentPlan: 'Sublingual Nitroglycerin PRN, Carvedilol 6.25mg BID; Immediate 2D Echo Referral',
    lastVisit: '2026-10-04',
    disposition: 'Urgent Specialty Referral',
    statusTone: 'danger',
  },
  {
    id: 6,
    name: 'NAVARRO, ELENA D.',
    office: 'PROVINCIAL GOVERNOR’S OFFICE',
    diagnosis: 'Osteoarthritis (Bilateral Knees); Chronic Pain',
    treatmentPlan: 'Celecoxib 200mg OD PRN with Omeprazole; Physical Therapy referral & Weight reduction',
    lastVisit: '2026-09-28',
    disposition: 'Physical Therapy Follow-up',
    statusTone: 'neutral',
  },
  {
    id: 7,
    name: 'BAUTISTA, RAMON G.',
    office: 'PROVINCIAL TREASURER’S OFFICE',
    diagnosis: 'Hyperuricemia with Acute Gouty Arthritis',
    treatmentPlan: 'Colchicine 500mcg BID x 3d, then Allopurinol 100mg OD; Serum Uric Acid test ordered',
    lastVisit: '2026-09-27',
    disposition: 'Lab Review (2 wks)',
    statusTone: 'warn',
  },
  {
    id: 8,
    name: 'AQUINO, JOCELYN V.',
    office: 'PROVINCIAL PLANNING AND DEVELOPMENT OFFICE',
    diagnosis: 'Thyromegaly with Palpitations (Suspected Hyperthyroidism)',
    treatmentPlan: 'Propranolol 10mg BID; Free T3, Free T4, TSH & Thyroid Ultrasound requested',
    lastVisit: '2026-09-25',
    disposition: 'Endocrinology Workup',
    statusTone: 'warn',
  },
];

// Helper calculations
const pct = (count, total) => (total ? Math.round((count / total) * 1000) / 10 : 0);
const percent = (count, total) => (total ? `${pct(count, total)}%` : '—');

// Custom Tooltip for Diagnoses Bar Chart
function DiagnosisTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-xs shadow-lg">
      <p className="mb-1 flex items-center gap-1.5 font-semibold text-ink-900">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
        {row.label}
      </p>
      <p className="text-[11px] text-ink-500 mb-1.5">{row.icd}</p>
      <p className="text-ink-600">
        <span className="font-semibold text-ink-900 tabular-nums">{row.count}</span> consultations ·{' '}
        <span className="tabular-nums font-medium text-ink-800">{row.pct}%</span>
      </p>
    </div>
  );
}

// Custom Tooltip for Consultation Dispositions Bar Chart
function DispositionTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-xs shadow-lg">
      <p className="mb-1 flex items-center gap-1.5 font-semibold text-ink-900">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
        {row.label}
      </p>
      <p className="text-[11px] text-ink-500 mb-1.5">{row.desc}</p>
      <p className="text-ink-600">
        <span className="font-semibold text-ink-900 tabular-nums">{row.count}</span> patients ·{' '}
        <span className="tabular-nums font-medium text-ink-800">{row.pct}%</span>
      </p>
    </div>
  );
}

// Custom Tooltip for 12-Month Longitudinal Trend Line Chart
function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-ink-900">{label} 2026</p>
      <div className="flex flex-col gap-1">
        {payload.map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-ink-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-semibold text-ink-900 tabular-nums">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Latest End-Point Label for Line Chart
const endLabel = (lastIndex) =>
  function EndLabel({ x, y, value, index }) {
    if (index !== lastIndex) return null;
    return (
      <text x={x + 8} y={y} dy={4} fill="#334155" fontSize={12} fontWeight={600}>
        {value}%
      </text>
    );
  };

// Table Columns for High-Priority Consultation Follow-Ups
const TABLE_COLUMNS = [
  { key: 'name', header: 'Patient Name' },
  { key: 'office', header: 'Agency / Office' },
  {
    key: 'diagnosis',
    header: 'Working Impression',
    render: (row) => <span className="font-medium text-ink-800">{row.diagnosis}</span>,
  },
  {
    key: 'treatmentPlan',
    header: 'Management & Plan',
    render: (row) => <span className="text-xs text-ink-600 line-clamp-1">{row.treatmentPlan}</span>,
  },
  {
    key: 'disposition',
    header: 'Action / Disposition',
    render: (row) => <Badge tone={row.statusTone}>{row.disposition}</Badge>,
  },
  {
    key: 'lastVisit',
    header: 'Consult Date',
    render: (row) => <span className="tabular-nums text-ink-600">{row.lastVisit}</span>,
  },
];

/**
 * Station 3 Health Reports Dashboard: Doctor's Consultation Analytics
 * Strictly adheres to the current multi-row UI grid layout.
 */
export default function Station3Reports() {
  const [office, setOffice] = useState(ALL_OFFICES);

  // Filter multiplier based on selected office
  const officeMultiplier = useMemo(() => {
    if (office === ALL_OFFICES) return 1;
    // Scale count realistically per office
    return 0.16;
  }, [office]);

  // Dynamic Metrics based on active office filter
  const totalConsultations = Math.round(248 * officeMultiplier);
  const prescriptionsIssued = Math.round(170 * officeMultiplier);
  const labsOrdered = Math.round(105 * officeMultiplier);
  const criticalReferrals = Math.round(18 * officeMultiplier);

  // Diagnoses Distribution Data
  const diagnosisData = useMemo(() => {
    const rawCounts = {
      hypertension: Math.round(95 * officeMultiplier),
      diabetes: Math.round(53 * officeMultiplier),
      urti: Math.round(40 * officeMultiplier),
      dyslipidemia: Math.round(30 * officeMultiplier),
      arthritis: Math.round(19 * officeMultiplier),
      unremarkable: Math.round(11 * officeMultiplier),
    };

    return DIAGNOSIS_CLASSES.map((cls) => ({
      ...cls,
      count: rawCounts[cls.key] || 0,
      pct: pct(rawCounts[cls.key] || 0, totalConsultations),
    }));
  }, [officeMultiplier, totalConsultations]);

  // Care Plan Dispositions Data
  const dispositionData = useMemo(() => {
    const rawCounts = {
      maintenanceRx: Math.round(86 * officeMultiplier),
      diagnosticWorkup: Math.round(70 * officeMultiplier),
      clearance: Math.round(64 * officeMultiplier),
      specialistReferral: Math.round(18 * officeMultiplier),
      urgentTransfer: Math.round(10 * officeMultiplier),
    };

    return DISPOSITION_CLASSES.map((cls) => ({
      ...cls,
      count: rawCounts[cls.key] || 0,
      pct: pct(rawCounts[cls.key] || 0, totalConsultations),
    }));
  }, [officeMultiplier, totalConsultations]);

  // Filtered Table Patients
  const filteredPatients = useMemo(() => {
    if (office === ALL_OFFICES) return MOCK_CRITICAL_CONSULTATIONS;
    const matched = MOCK_CRITICAL_CONSULTATIONS.filter((p) => p.office === office);
    return matched.length ? matched : MOCK_CRITICAL_CONSULTATIONS.slice(0, 3);
  }, [office]);

  const tableControls = useTableControls(filteredPatients, { pageSize: 5 });

  return (
    <div className="flex flex-col gap-6 p-5">
      {/* 1. Page Header & Office Filter */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Health Reports</h1>
          <p className="mt-0.5 text-sm text-ink-500">
            Station 3: Consultation records · clinical diagnoses and treatment outcomes
          </p>
        </div>
        <Select
          aria-label="Office"
          className="w-full sm:w-80"
          options={OFFICE_OPTIONS}
          value={office}
          onChange={(e) => setOffice(e.target.value)}
        />
      </div>

      {/* 2. Sample Data Disclaimer Banner */}
      <div
        role="note"
        className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      >
        <Info size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <p>
          <strong>Sample data.</strong> Every diagnostic metric and consultation record on this page is a
          clinical placeholder until connected to active Station 3 records.
        </p>
      </div>

      {/* 3. Top Row: 4 Individual KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Consultations completed"
          value={totalConsultations}
          icon={Stethoscope}
          accent="brand"
        />
        <StatCard
          label="Prescription issuance rate"
          value={percent(prescriptionsIssued, totalConsultations)}
          icon={Pill}
          accent="emerald"
        />
        <StatCard
          label="Diagnostic labs ordered"
          value={percent(labsOrdered, totalConsultations)}
          icon={FlaskConical}
          accent="warning"
        />
        <StatCard
          label="Flagged / Urgent referrals"
          value={criticalReferrals}
          icon={TriangleAlert}
          accent="red"
        />
      </div>

      {/* 4. Middle Row: 2 Side-by-Side Charts (Strict Grid with Custom Color-Coded Legends) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Chart: Top Diagnosed Conditions */}
        <ReportCard
          eyebrow="Primary clinical diagnoses"
          title="Top conditions identified during medical consultation"
        >
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diagnosisData} margin={{ top: 20, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID_LINE} />
                <XAxis
                  dataKey="label"
                  stroke={AXIS_COLOR}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  interval={0}
                />
                <YAxis
                  stroke={AXIS_COLOR}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  allowDecimals={false}
                />
                <Tooltip content={<DiagnosisTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {diagnosisData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="top"
                    fill="#334155"
                    fontSize={12}
                    fontWeight={600}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Color-Coded Custom Legend Below */}
          <ul
            aria-label="Diagnosed Conditions Legend"
            className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 border-t border-line pt-3 text-xs sm:grid-cols-2"
          >
            {diagnosisData.map((item) => (
              <li key={item.key} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-ink-700 font-medium">{item.label}</span>
                <span className="truncate text-ink-400 text-[11px]">{item.icd.split(' ')[0]}</span>
                <span className="ml-auto font-semibold text-ink-800 tabular-nums">{item.count}</span>
                <span className="w-11 text-right text-ink-500 tabular-nums">{item.pct}%</span>
              </li>
            ))}
          </ul>
        </ReportCard>

        {/* Right Chart: Care Plan / Clinical Disposition */}
        <ReportCard
          eyebrow="Consultation disposition & plan"
          title="Clinical management, workup and referral outcomes"
        >
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dispositionData} margin={{ top: 20, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID_LINE} />
                <XAxis
                  dataKey="label"
                  stroke={AXIS_COLOR}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  interval={0}
                />
                <YAxis
                  stroke={AXIS_COLOR}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  allowDecimals={false}
                />
                <Tooltip content={<DispositionTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {dispositionData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="top"
                    fill="#334155"
                    fontSize={12}
                    fontWeight={600}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Color-Coded Custom Legend Below */}
          <ul
            aria-label="Disposition Legend"
            className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 border-t border-line pt-3 text-xs sm:grid-cols-2"
          >
            {dispositionData.map((item) => (
              <li key={item.key} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-ink-700 font-medium">{item.label}</span>
                <span className="ml-auto font-semibold text-ink-800 tabular-nums">{item.count}</span>
                <span className="w-11 text-right text-ink-500 tabular-nums">{item.pct}%</span>
              </li>
            ))}
          </ul>
        </ReportCard>
      </div>

      {/* 5. Bottom Row: 1 Wide Line Chart (Left 2 Cols) + Vertical Action List (Right 1 Col) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: 12-Month Longitudinal Trend Line Chart */}
        <ReportCard
          eyebrow="Longitudinal consultation trend"
          title="Chronic care & diagnostic order rates, last 12 months"
          className="lg:col-span-2"
          aside={
            <ul
              aria-label="Trend Legend"
              className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600"
            >
              <li className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full bg-[#0ea5e9]" />
                Chronic Care Management (%)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full bg-[#f59e0b]" />
                Diagnostic Labs Ordered (%)
              </li>
            </ul>
          }
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={BASE_TREND} margin={{ top: 12, right: 46, left: -14, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID_LINE} />
                <XAxis
                  dataKey="label"
                  stroke={AXIS_COLOR}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis
                  stroke={AXIS_COLOR}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  domain={[30, 70]}
                  ticks={[30, 40, 50, 60, 70]}
                  unit="%"
                />
                <Tooltip content={<TrendTooltip />} />
                <Line
                  type="monotone"
                  dataKey="chronicRate"
                  name="Chronic Care"
                  stroke="#0ea5e9"
                  strokeWidth={2.25}
                  dot={{ r: 2.5, fill: '#0ea5e9' }}
                  activeDot={{ r: 4.5 }}
                >
                  <LabelList
                    dataKey="chronicRate"
                    content={endLabel(BASE_TREND.length - 1)}
                  />
                </Line>
                <Line
                  type="monotone"
                  dataKey="labOrderRate"
                  name="Diagnostic Labs"
                  stroke="#f59e0b"
                  strokeWidth={2.25}
                  dot={{ r: 2.5, fill: '#f59e0b' }}
                  activeDot={{ r: 4.5 }}
                >
                  <LabelList
                    dataKey="labOrderRate"
                    content={endLabel(BASE_TREND.length - 1)}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ReportCard>

        {/* Right: Top Prescribed Medications / Critical Consultation Flags */}
        <ReportCard
          eyebrow="Clinical prescribing profile"
          title="Top prescribed medications & urgent actions"
        >
          <ul aria-label="Top Prescriptions" className="flex flex-col divide-y divide-line">
            {TOP_MEDICATIONS.map(({ key, name, category, icon: Icon, baseCount }) => {
              const count = Math.round(baseCount * officeMultiplier);
              return (
                <li key={key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-teal-700">
                    <Icon size={17} strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-800 truncate">{name}</p>
                    <p className="text-xs text-ink-500 truncate">{category}</p>
                  </div>
                  <div className="ml-auto text-right shrink-0">
                    <p className="text-base font-semibold text-ink-900">{count}</p>
                    <p className="text-xs text-ink-500 tabular-nums">
                      {percent(count, totalConsultations)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </ReportCard>
      </div>

      {/* 6. Bottom Table: High-Priority Consultation Follow-Ups */}
      <ReportCard
        eyebrow="Flagged consultations"
        title="Patients requiring immediate follow-up, specialty referral, or diagnostic review"
      >
        <div className="flex flex-col gap-3">
          <DataTable
            columns={TABLE_COLUMNS}
            rows={tableControls.pageRows}
            empty="No flagged consultations for this office filter."
          />
          <TableFooter
            page={tableControls.page}
            totalPages={tableControls.totalPages}
            total={tableControls.total}
            noun="consultation"
            onPageChange={tableControls.setPage}
          />
        </div>
      </ReportCard>
    </div>
  );
}
