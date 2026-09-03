import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAssessmentTemplate } from '../../api/assessment.api';
import { useWellnessForm } from '../../hooks/useWellnessForm';
import { FORM_STATUS } from '../../lib/constants';
import { fullName, ageFrom, formatDateTime } from '../../lib/formatters';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import PriorStationsPanel from '../station3/PriorStationsPanel';

function HistoryList({ items, render, empty }) {
  if (!items?.length) return <p className="text-sm text-ink-500">{empty}</p>;
  return (
    <ul className="flex flex-col gap-1.5 text-sm">
      {items.map((item, i) => <li key={item.fmhID ?? item.pmhID ?? i}>{render(item)}</li>)}
    </ul>
  );
}

export default function MyRecordDetailPage() {
  const { formId } = useParams();
  const { data: form, isLoading, error, refetch } = useWellnessForm(formId);
  const { data: categories } = useQuery({
    queryKey: ['assessment-template'],
    queryFn: getAssessmentTemplate,
    staleTime: Infinity,
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (form.status !== FORM_STATUS.COMPLETED) {
    return <Navigate to="/my-record" replace />;
  }

  const patient = form.patient;

  return (
    <div className="flex flex-col gap-4 pb-10">
      <div className="rounded border border-line bg-surface px-4 py-3">
        <p className="text-lg font-semibold text-ink-900">{fullName(patient)}</p>
        <p className="text-sm text-ink-500">
          {patient?.externalEmployeeId} · Age {ageFrom(patient?.birthdate)} · {patient?.sex} · {patient?.agencyOffice}
        </p>
      </div>

      <PriorStationsPanel form={form} categories={categories} />

      <Card title="Family Medical History">
        <HistoryList
          items={form.familyMedicalHistory}
          empty="No family medical history on file."
          render={(row) => row.isNone
            ? 'None reported'
            : `${row.conditionOther ?? `Condition #${row.conditionID}`}${row.familyMembers ? ` — ${row.familyMembers}` : ''}`}
        />
      </Card>

      <Card title="Past Medical History">
        <HistoryList
          items={form.pastMedicalHistory}
          empty="No past medical history on file."
          render={(row) => `${row.conditionOther} (${row.yearDiagnosed ?? '—'}) — ${row.maintenanceDrugGeneric ?? '—'} ${row.dosage ?? ''} ${row.frequency ?? ''}`}
        />
      </Card>

      <Card title="Social History">
        {form.socialHistory ? (
          <dl className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
            <div><dt className="text-xs text-ink-500">Smoking</dt><dd>{form.socialHistory.smokingSticksPerDay ?? 0} sticks/day</dd></div>
            <div><dt className="text-xs text-ink-500">Exercise</dt><dd>{form.socialHistory.exerciseFrequency ?? '—'} · {form.socialHistory.exerciseType ?? '—'}</dd></div>
            <div><dt className="text-xs text-ink-500">Alcohol</dt><dd>{form.socialHistory.alcoholType ?? '—'}</dd></div>
            <div><dt className="text-xs text-ink-500">Drinking frequency</dt><dd>{form.socialHistory.drinkFrequency ?? '—'}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-ink-500">No social history on file.</p>
        )}
      </Card>

      <Card title="Physician's Assessment">
        <dl className="mb-4 flex flex-col gap-3 text-sm">
          <div><dt className="text-xs text-ink-500">Recommended Diagnostic Test</dt><dd>{form.recommendedDiagnosticTest ?? '—'}</dd></div>
          <div><dt className="text-xs text-ink-500">Impression / Clinical</dt><dd>{form.impressionClinical ?? '—'}</dd></div>
          <div><dt className="text-xs text-ink-500">Management / Treatment</dt><dd>{form.managementTreatment ?? '—'}</dd></div>
        </dl>
        <div className="flex flex-col gap-3 border-t border-line pt-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs text-ink-500">Physician</p>
            <p className="text-sm font-medium text-ink-900">
              {form.physician ? `Dr. ${form.physician.firstName} ${form.physician.surname}` : '—'}
            </p>
            <p className="text-xs text-ink-500">PRC License No. {form.physician?.prcLicenseNo ?? '—'}</p>
          </div>
          <div className="flex flex-col items-start md:items-end">
            {form.signature && (
              <img src={form.signature} alt="Physician signature" className="h-16 rounded border border-line bg-surface" />
            )}
            <p className="mt-1 text-xs text-ink-500">Signed {formatDateTime(form.signedAt)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
