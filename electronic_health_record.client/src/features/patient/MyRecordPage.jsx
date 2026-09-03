import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getPatientForms } from '../../api/forms.api';
import { useAuth } from '../../auth/useAuth';
import { FORM_STATUS } from '../../lib/constants';
import { formatDate } from '../../lib/formatters';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import StatusTimeline from './StatusTimeline';

export default function MyRecordPage() {
  const { user } = useAuth();
  const { data: forms, isLoading, error, refetch } = useQuery({
    queryKey: ['my-forms', user.patientID],
    queryFn: () => getPatientForms(user.patientID),
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (!forms?.length) {
    return (
      <Card title="My Record">
        <p className="text-sm text-ink-500">No wellness examination on file yet.</p>
      </Card>
    );
  }

  const [latest, ...older] = forms;
  const isCompleted = latest.status === FORM_STATUS.COMPLETED;

  return (
    <div className="flex flex-col gap-4">
      <Card title="My Record">
        <StatusTimeline form={latest} />
        {isCompleted ? (
          <Link
            to={`/my-record/${latest.formID}`}
            className="mt-4 inline-flex h-8 items-center justify-center rounded bg-brand-600 px-3 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            View my record
          </Link>
        ) : (
          <p className="mt-4 text-sm text-ink-500">
            Your record becomes available once the physician signs it.
          </p>
        )}
      </Card>

      {older.length > 0 && (
        <Card title="Previous Records">
          <ul className="flex flex-col gap-2 text-sm">
            {older.map((f) => (
              <li key={f.formID} className="flex items-center justify-between">
                <span>{formatDate(f.formDate)}</span>
                {f.status === FORM_STATUS.COMPLETED && (
                  <Link to={`/my-record/${f.formID}`} className="text-brand-600 hover:underline">
                    View
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
