import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAssessmentTemplate } from '../../api/assessment.api';
import { useWellnessForm } from '../../hooks/useWellnessForm';
import { fullName, ageFrom } from '../../lib/formatters';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import PriorStationsPanel from './PriorStationsPanel';

export default function Station3ConsultationPage() {
  const { formId } = useParams();
  const { data: form, isLoading, error, refetch } = useWellnessForm(formId);
  const { data: categories } = useQuery({
    queryKey: ['assessment-template'],
    queryFn: getAssessmentTemplate,
    staleTime: Infinity,
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const patient = form.patient;

  return (
    <div className="flex flex-col gap-4 pb-20">
      <div className="rounded border border-line bg-surface px-4 py-3">
        <p className="text-lg font-semibold text-ink-900">{fullName(patient)}</p>
        <p className="text-sm text-ink-500">
          {patient?.externalEmployeeId} · Age {ageFrom(patient?.birthdate)} · {patient?.sex} · {patient?.agencyOffice}
        </p>
      </div>

      <PriorStationsPanel form={form} categories={categories} />

      {/* Consultation form is completed in Tasks 14 and 15. */}
      <Card title="Consultation">
        <p className="text-sm text-ink-500">Consultation form — built in Tasks 14 and 15.</p>
      </Card>
    </div>
  );
}
