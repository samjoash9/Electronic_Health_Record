import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useWellnessForm } from '../../hooks/useWellnessForm';
import { getAssessmentTemplate } from '../../api/assessment.api';
import { submitStation2 } from '../../api/forms.api';
import { useAuth } from '../../auth/useAuth';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';
import ConflictModal from '../../components/ui/ConflictModal';
import HandoffConfirm from './HandoffConfirm';
import AnswersReview from './AnswersReview';

function toAnswerList(answersByQuestionId) {
  return Object.entries(answersByQuestionId).map(([questionID, optionID]) => ({
    questionID: Number(questionID),
    optionID,
  }));
}

export default function Station2AssessmentPage() {
  const { formId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [conflictOpen, setConflictOpen] = useState(false);

  const { data: form, isLoading, error, refetch } = useWellnessForm(formId);
  const { data: categories, isLoading: templateLoading } = useQuery({
    queryKey: ['assessment-template'],
    queryFn: getAssessmentTemplate,
    staleTime: Infinity,
  });

  const mutation = useMutation({
    mutationFn: (answersByQuestionId) => submitStation2({
      formID: Number(formId),
      answers: toAnswerList(answersByQuestionId),
      adminID: user.id,
      rowVersion: form.rowVersion,
    }),
    onSuccess: () => {
      toast.success('Submitted to Station 3.');
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      queryClient.invalidateQueries({ queryKey: ['form', Number(formId)] });
      navigate('/station2');
    },
    onError: (error) => {
      if (error.status === 409) setConflictOpen(true);
      else toast.error(error.message);
    },
  });

  if (isLoading || templateLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const savedAnswers = form.assessmentAnswers ?? [];
  const draftAnswers = location.state?.answers;
  const hasAnswers = savedAnswers.length > 0 || Boolean(draftAnswers);

  if (!hasAnswers) {
    return <HandoffConfirm form={form} />;
  }

  const answersForReview = draftAnswers ? toAnswerList(draftAnswers) : savedAnswers;

  const handleReload = () => {
    setConflictOpen(false);
    queryClient.invalidateQueries({ queryKey: ['form', Number(formId)] });
  };

  return (
    <Card
      title="Review Assessment"
      actions={
        <Button
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(draftAnswers ?? Object.fromEntries(
            savedAnswers.map((a) => [a.questionID, a.optionID]),
          ))}
        >
          {mutation.isPending ? 'Submitting…' : 'Submit to Station 3'}
        </Button>
      }
    >
      <AnswersReview categories={categories} answers={answersForReview} />
      <ConflictModal open={conflictOpen} onReload={handleReload} onClose={() => setConflictOpen(false)} />
    </Card>
  );
}
