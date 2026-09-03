import { useLocation, useParams } from 'react-router-dom';
import { useWellnessForm } from '../../hooks/useWellnessForm';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import HandoffConfirm from './HandoffConfirm';

export default function Station2AssessmentPage() {
  const { formId } = useParams();
  const location = useLocation();
  const { data: form, isLoading, error, refetch } = useWellnessForm(formId);

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const hasAnswers = form.assessmentAnswers?.length > 0 || location.state?.justCompleted;

  if (!hasAnswers) {
    return <HandoffConfirm form={form} />;
  }

  // Review-and-submit UI is completed in Task 12 (AnswersReview, ScoreBar, submit mutation).
  return <div className="p-6 text-sm text-ink-500">Answer review — built in Task 12.</div>;
}
