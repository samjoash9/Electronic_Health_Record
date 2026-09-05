import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { getAssessmentTemplate } from '../../api/assessment.api';
import { useWellnessForm } from '../../hooks/useWellnessForm';
import { scoreCategory, totalAnswered, totalQuestions } from '../../lib/scoring';
import { fullName } from '../../lib/formatters';
import KioskShell from '../../components/layout/KioskShell';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import StationStepIndicator from '../../components/ui/StationStepIndicator';
import CategoryCard from './CategoryCard';

export default function KioskPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const { data: form, isLoading: formLoading, error: formError, refetch: refetchForm } = useWellnessForm(formId);
  const {
    data: categories, isLoading: templateLoading, error: templateError, refetch: refetchTemplate,
  } = useQuery({
    queryKey: ['assessment-template'],
    queryFn: getAssessmentTemplate,
    staleTime: Infinity,
  });

  if (formLoading || templateLoading) return <Skeleton rows={10} />;
  if (formError) return <ErrorState error={formError} onRetry={refetchForm} />;
  if (templateError) return <ErrorState error={templateError} onRetry={refetchTemplate} />;

  const answered = totalAnswered(categories, Object.entries(answers).map(
    ([questionID, optionID]) => ({ questionID: Number(questionID), optionID }),
  ));
  const total = totalQuestions(categories);

  // A category counts as "unlocked" once every prior category is fully
  // answered, so the step dots can't be used to skip ahead of unanswered work.
  let unlockedUpTo = 1;
  for (let i = 0; i < categories.length; i += 1) {
    const { answered: catAnswered, questionCount } = scoreCategory(categories[i], answers);
    if (catAnswered < questionCount) break;
    unlockedUpTo = i + 2;
  }
  unlockedUpTo = Math.min(unlockedUpTo, categories.length);

  const category = categories[step];
  const catScore = scoreCategory(category, answers);
  const categoryComplete = catScore.answered === catScore.questionCount;
  const isLastCategory = step === categories.length - 1;

  const handleAnswer = (questionID, optionID) => {
    setAnswers((prev) => ({ ...prev, [questionID]: optionID }));
  };

  const handleReset = () => {
    setAnswers({});
    setStep(0);
  };

  const goToStep = (target) => {
    if (target <= unlockedUpTo) setStep(target - 1);
  };

  const goNext = () => {
    if (isLastCategory) {
      setConfirmOpen(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  const confirmDone = () => {
    navigate(`/station2/${formId}`, { state: { answers, justCompleted: true } });
  };

  return (
    <KioskShell
      title="Health Assessment"
      subtitle={form?.patient ? fullName(form.patient) : undefined}
      headerActions={
        <>
          <Button type="button" variant="ghost" size="md" onClick={() => navigate('/station2')}>
            <ArrowLeft size={16} strokeWidth={2.25} />
            Back
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={() => setResetOpen(true)}>
            <RotateCcw size={16} strokeWidth={2.25} />
            Reset
          </Button>
        </>
      }
      footer={
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <div>
            {step > 0 && (
              <Button type="button" variant="secondary" size="lg" onClick={() => setStep((s) => s - 1)}>
                Previous
              </Button>
            )}
          </div>
          <div className="flex flex-1 flex-col items-end gap-1">
            {!categoryComplete && (
              <p className="text-xs font-medium text-ink-500">
                {catScore.questionCount - catScore.answered} question
                {catScore.questionCount - catScore.answered === 1 ? '' : 's'} left in this section
              </p>
            )}
            <Button
              type="button"
              variant="teal"
              size="lg"
              disabled={!categoryComplete}
              onClick={goNext}
              className="w-full sm:w-auto sm:min-w-40"
            >
              {isLastCategory ? 'Done' : 'Next'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="mb-6 rounded-2xl border border-line bg-surface px-5 py-4 shadow-sm">
        <StationStepIndicator
          steps={categories.map((c) => c.name)}
          current={step + 1}
          unlockedUpTo={unlockedUpTo}
          onSelect={goToStep}
        />
      </div>

      <p className="mb-4 text-center text-sm font-semibold text-[#0e7d6b]" role="status">
        {answered} of {total} answered overall
      </p>

      <CategoryCard
        key={category.categoryID}
        category={category}
        answers={answers}
        onAnswer={handleAnswer}
      />

      <Modal
        open={confirmOpen}
        title="Finished?"
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" size="lg" onClick={() => setConfirmOpen(false)}>
              Keep answering
            </Button>
            <Button type="button" variant="teal" size="lg" onClick={confirmDone}>
              Yes, I&apos;m done
            </Button>
          </>
        }
      >
        Please hand the tablet back to the staff member.
      </Modal>

      <Modal
        open={resetOpen}
        title="Reset progress?"
        onClose={() => setResetOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" size="lg" onClick={() => setResetOpen(false)}>
              Keep answers
            </Button>
            <Button
              type="button"
              variant="danger"
              size="lg"
              onClick={() => {
                handleReset();
                setResetOpen(false);
              }}
            >
              Reset progress
            </Button>
          </>
        }
      >
        This will clear every answer and take you back to the first section. This cannot be undone.
      </Modal>
    </KioskShell>
  );
}
