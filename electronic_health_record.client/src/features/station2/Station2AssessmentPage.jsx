import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useWellnessForm } from '../../hooks/useWellnessForm';
import { getAssessmentTemplate } from '../../api/assessment.api';
import { submitStation2 } from '../../api/forms.api';
import { clearDraft } from '../../lib/station2Draft';
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
      clearDraft(formId);
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
    <div className="m-5 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
      <Card title="Review Assessment" className="m-0 rounded-none border-0 shadow-none">
        <AnswersReview categories={categories} answers={answersForReview} />
      </Card>

      <div className="flex justify-end gap-2 rounded-lg bg-surface px-4 py-3">
        <Button
          type="button"
          variant="teal"
          size="lg"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(draftAnswers ?? Object.fromEntries(
            savedAnswers.map((a) => [a.questionID, a.optionID]),
          ))}
        >
          {mutation.isPending ? 'Submitting…' : 'Submit to Station 3'}
        </Button>
      </div>

      <ConflictModal open={conflictOpen} onReload={handleReload} onClose={() => setConflictOpen(false)} />
    </div>
  );
}
