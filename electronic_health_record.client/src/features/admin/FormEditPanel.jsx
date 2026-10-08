import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Activity, AlertTriangle, ClipboardList, Eye, Smile, Stethoscope } from 'lucide-react';
import { DENTAL_INDICATORS, VISION_INDICATORS, FORM_STATUS } from '../../lib/constants';
import SectionCard, { SubPanel } from '../station3/SectionCard';
import FamilyHistorySection from '../station3/FamilyHistorySection';
import PastMedicalHistorySection from '../station3/PastMedicalHistorySection';
import SocialHistorySection from '../station3/SocialHistorySection';
import AssessmentPlanSection from '../station3/AssessmentPlanSection';
import CategoryCard from '../station2/CategoryCard';
import Field from '../../components/ui/Field';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import DatePicker from '../../components/ui/DatePicker';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import {
  CONSULTATION_KEYS,
  answersFromForm,
  answersPayload,
  changedAnswerCount,
  consultationChanges,
  consultationValuesFromForm,
  formDateValue,
} from './formEditValues';

/**
 * The nine Station 1 vitals, in the order they are taken. `step` drives the
 * numeric input's granularity: the two decimal readings step by 0.1, the
 * integer counts by 1.
 */
const VITALS = [
  { name: 'weightKg', label: 'Weight', unit: 'kg', step: '0.01' },
  { name: 'heightCm', label: 'Height', unit: 'cm', step: '0.01' },
  { name: 'bmi', label: 'BMI', unit: '', step: '0.01' },
  { name: 'idealBMI', label: 'Ideal BMI', unit: '', step: '0.01' },
  { name: 'bpSystolic', label: 'BP Systolic', unit: 'mmHg', step: '1' },
  { name: 'bpDiastolic', label: 'BP Diastolic', unit: 'mmHg', step: '1' },
  { name: 'tempCelsius', label: 'Temperature', unit: '°C', step: '0.1' },
  { name: 'heartRate', label: 'Heart Rate', unit: 'bpm', step: '1' },
  { name: 'respRate', label: 'Resp. Rate', unit: '/min', step: '1' },
];

/** One tab per station, in the order the patient passes through them. */
const TABS = [
  { id: 'vitals', label: 'Vitals', station: 'Station 1', icon: Activity },
  { id: 'assessment', label: 'Assessment', station: 'Station 2', icon: ClipboardList },
  { id: 'consultation', label: 'Consultation', station: 'Station 3', icon: Stethoscope },
  { id: 'dental', label: 'Dental', station: 'Station 4', icon: Smile },
  { id: 'vision', label: 'Vision', station: 'Station 5', icon: Eye },
];

/**
 * Empty string is what an emptied <input> gives us, and it has to become null
 * rather than "" so the server clears the column instead of failing to parse a
 * blank as a number.
 */
function normalize(value) {
  if (value === '' || value === undefined) return null;
  return value;
}

function toNumber(value) {
  const normalized = normalize(value);
  if (normalized === null) return null;
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

// The local calendar day, not toISOString's UTC one: in Manila the two differ
// until 8am, which would leave the morning's own visits unpickable.
function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Builds the draft the panel starts from: the form's own values, as strings. */
function initialDraft(form) {
  return {
    formDate: formDateValue(form),
    physicianID: form.physicianID ?? '',
    dentistID: form.dentistID ?? '',
    optometristID: form.optometristID ?? '',
    ...Object.fromEntries(VITALS.map((v) => [v.name, form[v.name] ?? ''])),
    dental: Object.fromEntries(
      DENTAL_INDICATORS.flatMap(({ name }) => [
        [name, form.dentalAssessment?.[name] ?? ''],
        [`${name}Remarks`, form.dentalAssessment?.[`${name}Remarks`] ?? ''],
      ])
    ),
    vision: Object.fromEntries(
      VISION_INDICATORS.flatMap(({ name, hasOther, otherFieldName }) => [
        [name, form.visionAssessment?.[name] ?? ''],
        [`${name}Remarks`, form.visionAssessment?.[`${name}Remarks`] ?? ''],
        ...(hasOther ? [[otherFieldName, form.visionAssessment?.[otherFieldName] ?? '']] : []),
      ])
    ),
  };
}

/**
 * Superadmin correction surface for one form.
 *
 * What is editable here is exactly what the PATCH endpoint accepts: the visit
 * date and vitals, the Station 2 answers, the whole Station 3 consultation
 * (family, past medical and social history, exercise, ordered tests,
 * impression, treatment), the three practitioner attributions, and the dental
 * and vision indicator grids. Signatures, status and station routing are
 * absent by design -- the server rejects them, and offering an input the
 * server refuses would be a lie.
 *
 * Stations 2 and 3 are edited through those stations' own inputs (the
 * kiosk's answer cards, the consultation's sections) rather than through a
 * flattened copy of their columns: the stored rows only make sense in the
 * shape the station wrote them, and a correction should read back the same
 * way the original did.
 *
 * The fields are split into one tab per station rather than one long scroll:
 * an operator correcting a blood pressure reading has no business scrolling
 * past thirty vision inputs to reach the save bar. Each tab's header carries
 * the count of fields changed inside it, so what has been touched stays visible
 * from whichever tab is open.
 *
 * Only changed fields are sent. Each part starts as a copy of the form's
 * current values and the diff against that copy at save time is what becomes
 * the payload, so an untouched field is omitted from the request entirely
 * rather than sent back unchanged.
 *
 * The panel owns the draft but not the decision to leave: `onDirtyChange` hands
 * the dirty flag up so the page can block navigation, and Cancel/Save are the
 * page's to wire.
 */
export default function FormEditPanel({
  form,
  physicians = [],
  categories,
  onSave,
  onCancel,
  isPending,
  error,
  onDirtyChange,
}) {
  const [draft, setDraft] = useState(() => initialDraft(form));
  const [reason, setReason] = useState('');
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  const [initialAnswers] = useState(() => answersFromForm(form));
  const [answers, setAnswers] = useState(initialAnswers);

  // Station 3's sections are react-hook-form components, so the consultation
  // lives in a form of its own. The baseline is built separately from the
  // defaults handed to useForm so nothing the form does can reach back into
  // what the edit is diffed against.
  const [initialConsultation] = useState(() => consultationValuesFromForm(form));
  const consultation = useForm({ defaultValues: consultationValuesFromForm(form) });
  // Subscribes the panel to every consultation keystroke, which is what keeps
  // the change counts and the save button current.
  const consultationValues = consultation.watch();

  const set = (name, value) => setDraft((d) => ({ ...d, [name]: value }));
  const setNested = (group, name, value) =>
    setDraft((d) => ({ ...d, [group]: { ...d[group], [name]: value } }));

  const physicianOptions = useMemo(
    () => [
      { value: '', label: '— None —' },
      ...physicians.map((p) => ({
        value: String(p.physicianID),
        label: `Dr. ${p.firstName} ${p.surname}`,
      })),
    ],
    [physicians]
  );

  // A signed record is a practitioner's attestation, so correcting one asks for
  // a justification the way cancelling does. Station 3 signs well before the
  // form as a whole completes, so this keys off any signature, not off status.
  const isSigned = Boolean(form.signedAt || form.dentalSignedAt || form.visionSignedAt);
  const isCancelled = form.status === FORM_STATUS.CANCELLED;
  const reasonRequired = isSigned || isCancelled;

  // Recomputed every render rather than memoised: watch() hands back the
  // form's live values object, whose identity does not change as it fills.
  const consultationChanged = consultationChanges(initialConsultation, consultationValues);
  const answerChanges = changedAnswerCount(initialAnswers, answers);

  // Only what actually moved. The endpoint is a sparse PATCH: a key we omit is
  // left alone, so sending unchanged fields back would widen the audit entry
  // with noise and risk clobbering a value another station changed meanwhile.
  const changes = {};

  // The visit date cannot be cleared server-side, so an emptied picker is
  // simply not sent.
  if (draft.formDate && draft.formDate !== formDateValue(form)) changes.formDate = draft.formDate;

  for (const { name } of VITALS) {
    const next = toNumber(draft[name]);
    const current = form[name] ?? null;
    if (next !== current) changes[name] = next;
  }

  for (const name of ['physicianID', 'dentistID', 'optometristID']) {
    const next = toNumber(draft[name]);
    const current = form[name] ?? null;
    if (next !== current) changes[name] = next;
  }

  // Station 2's answers go back as the full set: the server replaces them
  // wholesale, so a partial list would drop the questions it left out.
  if (answerChanges > 0) changes.assessmentAnswers = answersPayload(answers);

  Object.assign(changes, consultationChanged);

  // The two assessment grids go as whole objects or not at all -- the server
  // replaces the row wholesale, so a partial object would blank the
  // indicators it left out.
  const dentalFields = DENTAL_INDICATORS.reduce((n, { name }) => {
    const valueMoved = normalize(draft.dental[name]) !== (form.dentalAssessment?.[name] ?? null);
    const remarksMoved = normalize(draft.dental[`${name}Remarks`])
      !== (form.dentalAssessment?.[`${name}Remarks`] ?? null);
    return n + (valueMoved ? 1 : 0) + (remarksMoved ? 1 : 0);
  }, 0);

  if (dentalFields > 0) {
    changes.dentalAssessment = Object.fromEntries(
      Object.entries(draft.dental).map(([k, v]) => [k, normalize(v)])
    );
  }

  const visionFields = VISION_INDICATORS.reduce((n, { name, hasOther, otherFieldName }) => {
    const valueMoved = normalize(draft.vision[name]) !== (form.visionAssessment?.[name] ?? null);
    const remarksMoved = normalize(draft.vision[`${name}Remarks`])
      !== (form.visionAssessment?.[`${name}Remarks`] ?? null);
    const otherMoved = hasOther
      && normalize(draft.vision[otherFieldName]) !== (form.visionAssessment?.[otherFieldName] ?? null);
    return n + (valueMoved ? 1 : 0) + (remarksMoved ? 1 : 0) + (otherMoved ? 1 : 0);
  }, 0);

  if (visionFields > 0) {
    changes.visionAssessment = Object.fromEntries(
      Object.entries(draft.vision).map(([k, v]) => [k, normalize(v)])
    );
  }

  // Per-tab counts for the badges, counted the way an operator would: one per
  // answer, indicator or section touched. `changes` itself cannot be counted
  // directly -- a grid or the answer set is one key however much moved inside
  // it, and `charges` rides along with the test list rather than being an
  // edit of its own.
  const countIn = (names) => names.filter((n) => n in changes).length;
  const tabChangeCounts = {
    vitals: countIn(['formDate', ...VITALS.map((v) => v.name)]),
    assessment: answerChanges,
    consultation: countIn(['physicianID', ...CONSULTATION_KEYS]),
    dental: countIn(['dentistID']) + dentalFields,
    vision: countIn(['optometristID']) + visionFields,
  };

  const changedCount = Object.values(tabChangeCounts).reduce((sum, n) => sum + n, 0);

  const canSave = changedCount > 0
    && !isPending
    && (!reasonRequired || reason.trim().length >= 3);

  // The page needs the dirty flag for its navigation blocker, which reads it
  // synchronously at intercept time. Reported during render into a ref the page
  // owns -- not through state -- so it is already current in the same tick as
  // the keystroke, and so reporting it never schedules a parent re-render.
  const isDirty = changedCount > 0 || reason.trim().length > 0;
  if (onDirtyChange) onDirtyChange(isDirty);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <div className="text-sm text-amber-900">
          <p>
            You are editing form <strong>#{form.formID}</strong> directly. Every change is
            written to the activity log with its old and new value.
          </p>
          <p className="mt-1 text-amber-800">
            Signatures, form status, and station routing cannot be changed here — those
            belong to the stations and to the practitioners who signed.
          </p>
        </div>
      </div>

      {/* Sticky so the operator can cross to another station's fields without
          scrolling back up through the tab they are in. */}
      <div
        role="tablist"
        aria-label="Form sections"
        className="sticky top-0 z-10 -mx-1 flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface/95 p-1.5 shadow-sm backdrop-blur"
      >
        {TABS.map(({ id, label, station, icon: Icon }) => {
          const isActive = activeTab === id;
          const count = tabChangeCounts[id];
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`edit-tab-${id}`}
              aria-selected={isActive}
              aria-controls={`edit-panel-${id}`}
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-[#e9fbf6] text-[#0e7d6b] shadow-sm ring-1 ring-[#0e7d6b]/15'
                  : 'text-ink-500 hover:bg-gray-50 hover:text-ink-700'
              }`}
            >
              <Icon size={16} strokeWidth={2.25} />
              <span className="flex flex-col items-start leading-tight">
                <span>{label}</span>
                <span className="text-[10px] font-normal text-ink-400">{station}</span>
              </span>
              {count > 0 && (
                <span
                  className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-semibold text-white"
                  title={`${count} field${count === 1 ? '' : 's'} changed`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* One fieldset around whichever tab is open, so a save in flight locks
          every input -- including the Station 2 and 3 components, which take
          no disabled prop of their own. */}
      <fieldset disabled={isPending} className="m-0 min-w-0 border-0 p-0">
        {activeTab === 'vitals' && (
          <div role="tabpanel" id="edit-panel-vitals" aria-labelledby="edit-tab-vitals">
            <SectionCard
              title="Visit and Vitals"
              subtitle="Visit date and the Station 1 measurements."
              icon={Activity}
            >
              <div className="flex flex-col gap-4">
                <Field label="Visit date" htmlFor="edit-formDate" className="sm:max-w-xs">
                  <DatePicker
                    id="edit-formDate"
                    value={draft.formDate}
                    max={todayIso()}
                    onChange={(e) => set('formDate', e.target.value)}
                    disabled={isPending}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {VITALS.map(({ name, label, unit, step }) => (
                    <Field key={name} label={unit ? `${label} (${unit})` : label} htmlFor={`edit-${name}`}>
                      <Input
                        id={`edit-${name}`}
                        type="number"
                        step={step}
                        min="0"
                        className="w-full"
                        value={draft[name]}
                        onChange={(e) => set(name, e.target.value)}
                      />
                    </Field>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'assessment' && (
          <div role="tabpanel" id="edit-panel-assessment" aria-labelledby="edit-tab-assessment">
            <SectionCard
              title="Wellness Assessment"
              subtitle="The patient's Station 2 answers. Pick a different option to correct one."
              icon={ClipboardList}
            >
              {categories ? (
                // CategoryCard spaces itself with a bottom margin, so the last
                // one's is cancelled rather than doubling the card padding.
                <div className="[&>section:last-child]:mb-0">
                  {categories.map((category) => (
                    <CategoryCard
                      key={category.categoryID}
                      category={category}
                      answers={answers}
                      onAnswer={(questionID, optionID) =>
                        setAnswers((a) => ({ ...a, [questionID]: optionID }))}
                    />
                  ))}
                </div>
              ) : (
                <Skeleton />
              )}
            </SectionCard>
          </div>
        )}

        {activeTab === 'consultation' && (
          <div
            role="tabpanel"
            id="edit-panel-consultation"
            aria-labelledby="edit-tab-consultation"
            className="flex flex-col gap-4"
          >
            <SectionCard
              title="Attending Physician"
              subtitle="The doctor who saw the patient at Station 3."
              icon={Stethoscope}
            >
              <Select
                id="edit-physicianID"
                options={physicianOptions}
                value={String(draft.physicianID ?? '')}
                onChange={(e) => set('physicianID', e.target.value)}
                disabled={isPending}
              />
            </SectionCard>

            <FamilyHistorySection
              register={consultation.register}
              watch={consultation.watch}
              setValue={consultation.setValue}
              control={consultation.control}
            />
            <PastMedicalHistorySection control={consultation.control} register={consultation.register} />
            <SocialHistorySection control={consultation.control} watch={consultation.watch} />
            <AssessmentPlanSection
              register={consultation.register}
              watch={consultation.watch}
              setValue={consultation.setValue}
              control={consultation.control}
            />
          </div>
        )}

        {activeTab === 'dental' && (
          <div role="tabpanel" id="edit-panel-dental" aria-labelledby="edit-tab-dental">
            <SectionCard
              title="Dental Assessment"
              subtitle="Station 4 findings and the examining dentist's remarks."
              icon={Smile}
            >
              <div className="flex flex-col gap-4">
                <SubPanel icon={Smile} title="Examining Dentist" subtitle="Station 4">
                  <Select
                    options={physicianOptions}
                    value={String(draft.dentistID ?? '')}
                    onChange={(e) => set('dentistID', e.target.value)}
                    disabled={isPending}
                  />
                </SubPanel>

                {DENTAL_INDICATORS.map(({ name, label, options, remarksPlaceholder }, index) => (
                  <SubPanel key={name} icon={Smile} title={`${index + 1}. ${label}`}>
                    <div className="flex flex-col gap-2">
                      <Select
                        options={[{ value: '', label: '— Not assessed —' }, ...options]}
                        value={draft.dental[name] ?? ''}
                        onChange={(e) => setNested('dental', name, e.target.value)}
                        disabled={isPending}
                      />
                      <Textarea
                        rows={2}
                        className="w-full"
                        value={draft.dental[`${name}Remarks`] ?? ''}
                        onChange={(e) => setNested('dental', `${name}Remarks`, e.target.value)}
                        placeholder={remarksPlaceholder}
                        maxLength={300}
                      />
                    </div>
                  </SubPanel>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'vision' && (
          <div role="tabpanel" id="edit-panel-vision" aria-labelledby="edit-tab-vision">
            <SectionCard
              title="Vision Assessment"
              subtitle="Station 5 findings and the examining optometrist's remarks."
              icon={Eye}
            >
              <div className="flex flex-col gap-4">
                <SubPanel icon={Eye} title="Examining Optometrist" subtitle="Station 5">
                  <Select
                    options={physicianOptions}
                    value={String(draft.optometristID ?? '')}
                    onChange={(e) => set('optometristID', e.target.value)}
                    disabled={isPending}
                  />
                </SubPanel>

                {VISION_INDICATORS.map((indicator, index) => {
                  const {
                    name, label, type, options, placeholder,
                    hasOther, otherFieldName, otherPlaceholder, remarksPlaceholder,
                  } = indicator;

                  return (
                    <SubPanel key={name} icon={Eye} title={`${index + 1}. ${label}`}>
                      <div className="flex flex-col gap-2">
                        {type === 'text' ? (
                          <Input
                            className="w-full"
                            value={draft.vision[name] ?? ''}
                            onChange={(e) => setNested('vision', name, e.target.value)}
                            placeholder={placeholder}
                            maxLength={50}
                          />
                        ) : (
                          <Select
                            options={[{ value: '', label: '— Not assessed —' }, ...options]}
                            value={draft.vision[name] ?? ''}
                            onChange={(e) => setNested('vision', name, e.target.value)}
                            disabled={isPending}
                          />
                        )}

                        {hasOther && draft.vision[name] === 'Other' && (
                          <Input
                            className="w-full"
                            value={draft.vision[otherFieldName] ?? ''}
                            onChange={(e) => setNested('vision', otherFieldName, e.target.value)}
                            placeholder={otherPlaceholder}
                            maxLength={100}
                          />
                        )}

                        <Textarea
                          rows={2}
                          className="w-full"
                          value={draft.vision[`${name}Remarks`] ?? ''}
                          onChange={(e) => setNested('vision', `${name}Remarks`, e.target.value)}
                          placeholder={remarksPlaceholder}
                          maxLength={300}
                        />
                      </div>
                    </SubPanel>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        )}
      </fieldset>

      <div className="sticky bottom-0 flex flex-col gap-3 rounded-xl border border-line bg-surface/95 p-4 shadow-lg backdrop-blur">
        <Field
          label={reasonRequired ? 'Reason for this correction' : 'Reason for this correction (optional)'}
          htmlFor="edit-reason"
          required={reasonRequired}
          hint={reasonRequired
            ? 'This record has been signed, so a justification is recorded alongside the change.'
            : 'Recorded in the activity log beside the changed fields.'}
        >
          <Textarea
            id="edit-reason"
            rows={2}
            className="w-full"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Transcription error from the paper intake sheet"
            maxLength={500}
            disabled={isPending}
          />
        </Field>

        {error && <p className="text-sm font-medium text-rose-600">{error.message}</p>}

        <div className="flex items-center gap-3">
          <p className="mr-auto text-sm text-ink-500">
            {changedCount === 0
              ? 'No changes yet.'
              : `${changedCount} field${changedCount === 1 ? '' : 's'} changed.`}
          </p>
          <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={isPending}>
            Discard changes
          </Button>
          <Button
            type="button"
            variant="teal"
            size="md"
            disabled={!canSave}
            onClick={() => onSave({ changes, reason: reason.trim() || undefined })}
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
