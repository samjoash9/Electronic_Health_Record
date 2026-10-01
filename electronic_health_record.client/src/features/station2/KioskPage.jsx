import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { getAssessmentTemplate } from '../../api/assessment.api';
import { useWellnessForm } from '../../hooks/useWellnessForm';
import { useAutosaveDraft } from '../../hooks/useAutosaveDraft';
import { saveDraft, loadDraft, clearDraft } from '../../lib/station2Draft';
import { ZOOM_LEVELS, readZoomIndex, writeZoomIndex } from '../../lib/kioskZoom';
import { DEFAULT_LANGUAGE } from '../../i18n/assessmentTranslations';
import { uiText } from '../../lib/assessmentText';
import { scoreCategory, totalAnswered, totalQuestions } from '../../lib/scoring';
import { fullName } from '../../lib/formatters';
import KioskShell from '../../components/layout/KioskShell';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import StationStepIndicator from '../../components/ui/StationStepIndicator';
import CategoryCard from './CategoryCard';
import TextSizeControl from './TextSizeControl';
import LanguageToggle from './LanguageToggle';

export default function KioskPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  // Read the draft once during the first render so state can be seeded
  // from it directly, instead of set from an effect afterwards (matches
  // station3/4/5's restoredDraft pattern).
  const [restoredDraft] = useState(() => loadDraft(formId));
  const [answers, setAnswers] = useState(restoredDraft?.answers ?? {});
  const [step, setStep] = useState(restoredDraft?.step ?? 0);
  // Text size is a device preference, not a per-form one: it survives
  // handoff to the next patient and is untouched by Reset.
  const [zoomIndex, setZoomIndex] = useState(readZoomIndex);
  // Language is deliberately NOT persisted the way the text size is: the
  // kiosk is shared, and the next patient should be handed a tablet in
  // English rather than in a dialect the previous patient chose. Plain
  // state, so it resets whenever the kiosk is opened for a new assessment.
  const [lang, setLang] = useState(DEFAULT_LANGUAGE);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  // Stops autosave from resurrecting a just-cleared draft once the
  // assessment is handed off (confirmDone navigates away, but the
  // debounced save could otherwise still fire in the interim).
  const doneRef = useRef(false);

  const { data: form, isLoading: formLoading, error: formError, refetch: refetchForm } = useWellnessForm(formId);
  const {
    data: categories, isLoading: templateLoading, error: templateError, refetch: refetchTemplate,
  } = useQuery({
    queryKey: ['assessment-template'],
    queryFn: getAssessmentTemplate,
    staleTime: Infinity,
  });

  // Notify only; the state itself was seeded above during the first render.
  useEffect(() => {
    if (restoredDraft) toast.info('Restored the saved answers for this assessment.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosaves a short idle period after any answer or step changes, so a
  // patient's answers survive a reload or the tablet being put down
  // mid-assessment. Silent on success -- there is no "Draft saved ..."
  // label on the kiosk screen to update.
  useAutosaveDraft(
    () => saveDraft(formId, { answers, step }),
    { answers, step },
    { stoppedRef: doneRef },
  );

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

  const t = uiText(lang);
  const category = categories[step];
  const catScore = scoreCategory(category, answers);
  const categoryComplete = catScore.answered === catScore.questionCount;
  const isLastCategory = step === categories.length - 1;

  const handleAnswer = (questionID, optionID) => {
    setAnswers((prev) => ({ ...prev, [questionID]: optionID }));
  };

  const handleZoomChange = (next) => {
    const clamped = Math.min(Math.max(next, 0), ZOOM_LEVELS.length - 1);
    setZoomIndex(clamped);
    writeZoomIndex(clamped);
  };

  const handleReset = () => {
    clearDraft(formId);
    setAnswers({});
    setStep(0);
    // Reset is how staff hand the tablet to the next patient, so the
    // language goes back to English with the answers. The text size does
    // not: that is a property of the device, not of the patient.
    setLang(DEFAULT_LANGUAGE);
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
    // The draft is not cleared here: the review screen still requires an
    // explicit submit, so a patient who backs out there without
    // submitting should find these answers waiting on next handoff.
    doneRef.current = true;
    navigate(`/station2/${formId}`, { state: { answers, justCompleted: true } });
  };

  return (
    <KioskShell
      title="Wellness Assessment"
      subtitle={form?.patient ? fullName(form.patient) : undefined}
      headerActions={
        <>
          <LanguageToggle value={lang} onChange={setLang} />
          <TextSizeControl index={zoomIndex} onChange={handleZoomChange} />
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
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 md:items-stretch">
          <div className="md:flex md:flex-1">
            {step > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setStep((s) => s - 1)}
                className="md:w-full"
              >
                {t.previous}
              </Button>
            )}
          </div>
          <div className="flex flex-1 flex-col items-end gap-1">
            {!categoryComplete && (
              <p className="text-xs font-medium text-ink-500">
                {t.questionsLeft(catScore.questionCount - catScore.answered)}
              </p>
            )}
            <Button
              type="button"
              variant="teal"
              size="lg"
              disabled={!categoryComplete}
              onClick={goNext}
              className="w-full sm:w-auto sm:min-w-40 md:w-full"
            >
              {isLastCategory ? t.done : t.next}
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
        {t.answeredOverall(answered, total)}
      </p>

      <CategoryCard
        key={category.categoryID}
        category={category}
        answers={answers}
        onAnswer={handleAnswer}
        scale={ZOOM_LEVELS[zoomIndex]}
        lang={lang}
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
