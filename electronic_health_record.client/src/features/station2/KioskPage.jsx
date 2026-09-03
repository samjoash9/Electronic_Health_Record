import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getAssessmentTemplate } from '../../api/assessment.api';
import { useWellnessForm } from '../../hooks/useWellnessForm';
import { totalAnswered, totalQuestions } from '../../lib/scoring';
import { fullName } from '../../lib/formatters';
import KioskShell from '../../components/layout/KioskShell';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import CategoryCard from './CategoryCard';

export default function KioskPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: form } = useWellnessForm(formId);
  const {
    data: categories, isLoading, error, refetch,
  } = useQuery({
    queryKey: ['assessment-template'],
    queryFn: getAssessmentTemplate,
    staleTime: Infinity,
  });

  if (isLoading) return <Skeleton rows={10} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const answered = totalAnswered(categories, Object.entries(answers).map(
    ([questionID, optionID]) => ({ questionID: Number(questionID), optionID }),
  ));
  const total = totalQuestions(categories);

  const handleAnswer = (questionID, optionID) => {
    setAnswers((prev) => ({ ...prev, [questionID]: optionID }));
  };

  const confirmDone = () => {
    navigate(`/station2/${formId}`, { state: { answers, justCompleted: true } });
  };

  return (
    <KioskShell
      title="Health Assessment"
      subtitle={form?.patient ? fullName(form.patient) : undefined}
      progress={`${answered} of ${total} answered`}
      footer={
        <div className="flex flex-col items-center gap-2">
          {answered < total && (
            <p className="text-xs text-ink-500">
              {total - answered} question{total - answered === 1 ? '' : 's'} left
            </p>
          )}
          <Button
            type="button"
            disabled={answered < total}
            onClick={() => setConfirmOpen(true)}
            className="w-full"
          >
            Done
          </Button>
        </div>
      }
    >
      {categories.map((category) => (
        <CategoryCard
          key={category.categoryID}
          category={category}
          answers={answers}
          onAnswer={handleAnswer}
        />
      ))}

      <Modal
        open={confirmOpen}
        title="Finished?"
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)}>
              Keep answering
            </Button>
            <Button type="button" onClick={confirmDone}>
              Yes, I&apos;m done
            </Button>
          </>
        }
      >
        Please hand the tablet back to the staff member.
      </Modal>
    </KioskShell>
  );
}
