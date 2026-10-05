import { bmiCategory } from '../../lib/bmi';
import { bpClass, BP_CLASS_LABEL } from '../../lib/bloodPressure';
import { formatDate } from '../../lib/formatters';
import { useTableControls } from '../../hooks/useTableControls';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import TableFooter from '../../components/ui/TableFooter';
import ReportCard from './ReportCard';

const BMI_TONE = { Underweight: 'warn', Normal: 'success', Overweight: 'warn', Obese: 'danger' };
const BP_TONE = { normal: 'success', elevated: 'warn', stage1: 'warn', stage2: 'danger', crisis: 'danger' };

const COLUMNS = [
  { key: 'name', header: 'Name' },
  { key: 'office', header: 'Office' },
  {
    key: 'bmi',
    header: 'BMI',
    render: (p) => {
      const category = bmiCategory(p.bmi);
      return (
        <span className="inline-flex items-center gap-2">
          <span className="tabular-nums">{p.bmi.toFixed(1)}</span>
          <Badge tone={BMI_TONE[category]}>{category}</Badge>
        </span>
      );
    },
  },
  {
    key: 'bp',
    header: 'Blood Pressure',
    render: (p) => {
      const cls = bpClass(p.systolic, p.diastolic);
      return (
        <span className="inline-flex items-center gap-2">
          <span className="tabular-nums">{p.systolic}/{p.diastolic}</span>
          <Badge tone={BP_TONE[cls]}>{BP_CLASS_LABEL[cls]}</Badge>
        </span>
      );
    },
  },
  { key: 'lastVisit', header: 'Last Visit', render: (p) => formatDate(p.lastVisit) },
];

/** Patients both obese and at stage 1 BP or worse: the follow-up list. */
export default function AtRiskTable({ patients }) {
  const table = useTableControls(patients, { pageSize: 5 });

  return (
    <ReportCard eyebrow="At-risk patients" title="Obese and stage 1 blood pressure or higher at their latest visit">
      <div className="flex flex-col gap-3">
        <DataTable
          columns={COLUMNS}
          rows={table.pageRows}
          empty="No at-risk patients for this office."
        />
        <TableFooter
          page={table.page}
          totalPages={table.totalPages}
          total={table.total}
          noun="patient"
          onPageChange={table.setPage}
        />
      </div>
    </ReportCard>
  );
}
