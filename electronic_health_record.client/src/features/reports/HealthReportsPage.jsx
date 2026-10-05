import { useState } from 'react';
import { Users, Weight, HeartPulse, TriangleAlert, Info } from 'lucide-react';
import Select from '../../components/ui/Select';
import StatCard from '../../components/ui/StatCard';
import { ALL_OFFICES, OFFICE_OPTIONS } from '../admin/dashboardOffice';
import { getSampleVitalsReport } from './sampleVitalsReport';
import { BMI_CLASSES, BP_CLASS_LIST } from './reportTheme';
import ClassBarChart from './ClassBarChart';
import VitalsTrendChart from './VitalsTrendChart';
import IntakeFlagsCard from './IntakeFlagsCard';
import OfficeBmiHeatmap from './OfficeBmiHeatmap';
import AtRiskTable from './AtRiskTable';

const percent = (count, total) => (total ? `${Math.round((count / total) * 1000) / 10}%` : '—');

/**
 * Population reports built on the Station 1 vitals (BMI, blood pressure,
 * temperature, heart and breathing rate). Open to admins, superadmins and
 * doctors. Runs on placeholder data from sampleVitalsReport until the
 * server has an endpoint for it.
 */
export default function HealthReportsPage() {
  const [office, setOffice] = useState(ALL_OFFICES);
  const report = getSampleVitalsReport(office === ALL_OFFICES ? null : office);
  const { total, bmi, bp } = report;
  const highBp = bp.stage1 + bp.stage2 + bp.crisis;

  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Health Reports</h1>
          <p className="mt-0.5 text-sm text-ink-500">Station 1 vital signs · each patient&apos;s latest visit</p>
        </div>
        <Select
          aria-label="Office"
          className="w-full sm:w-80"
          options={OFFICE_OPTIONS}
          value={office}
          onChange={(e) => setOffice(e.target.value)}
        />
      </div>

      <div role="note" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <Info size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <p>
          <strong>Sample data.</strong> Every name and number on this page is a placeholder
          until the report is connected to real patient records.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Patients assessed" value={total} icon={Users} accent="brand" />
        <StatCard label="Healthy BMI" value={percent(bmi.normal, total)} icon={Weight} accent="emerald" />
        <StatCard label="High blood pressure" value={percent(highBp, total)} icon={HeartPulse} accent="warning" />
        <StatCard label="At-risk patients" value={report.atRisk.length} icon={TriangleAlert} accent="red" />
      </div>

      {total === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white px-6 py-14 text-center text-sm text-ink-500">
          No sample data for this office yet. Pick another office, or All offices.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ClassBarChart
              eyebrow="BMI distribution"
              title="Asia-Pacific (WPRO) cutoffs"
              classes={BMI_CLASSES}
              counts={bmi}
              total={total}
              legendLabel="BMI classes"
            />
            <ClassBarChart
              eyebrow="Blood pressure"
              title="ACC/AHA 2017 stages · pending clinical sign-off"
              classes={BP_CLASS_LIST}
              counts={bp}
              total={total}
              legendLabel="Blood pressure classes"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <VitalsTrendChart trend={report.trend} className="lg:col-span-2" />
            <IntakeFlagsCard flags={report.intakeFlags} total={total} />
          </div>

          {/* Keyed by office so a new filter starts the list on page 1. */}
          <AtRiskTable key={office} patients={report.atRisk} />
        </>
      )}

      <OfficeBmiHeatmap rows={report.byOffice} selectedOffice={office} />
    </div>
  );
}
