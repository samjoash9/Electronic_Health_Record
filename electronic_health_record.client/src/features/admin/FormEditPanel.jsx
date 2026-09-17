import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, Eye, Pill, Smile, Stethoscope, FlaskConical } from 'lucide-react';
import { DENTAL_INDICATORS, VISION_INDICATORS, FORM_STATUS } from '../../lib/constants';
import SectionCard, { SubPanel } from '../station3/SectionCard';
import Field from '../../components/ui/Field';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';

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

const CONSULTATION = [
  {
    name: 'recommendedDiagnosticTest',
    label: 'Recommended Diagnostic Test',
    icon: FlaskConical,
    subtitle: 'Labs, imaging, or referrals ordered.',
    maxLength: 200,
  },
  {
    name: 'impressionClinical',
    label: 'Impression / Clinical',
    icon: Stethoscope,
    subtitle: 'Working diagnosis from the findings.',
    maxLength: 300,
  },
  {
    name: 'managementTreatment',
    label: 'Management / Treatment',
    icon: Pill,
    subtitle: 'Medication, lifestyle advice, and follow-up.',
    maxLength: 300,
  },
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

/**
 * Superadmin correction surface for one form.
 *
 * Renders the editable fields only -- the read-only detail view stays mounted
 * above it, so the operator keeps the full record in view while correcting one
 * part of it. What is editable here is exactly what the PATCH endpoint accepts:
 * vitals, the physician's assessment text, the three practitioner attributions,
 * and the dental and vision indicator grids. Signatures, status and station
 * routing are absent by design -- the server rejects them, and offering an
 * input the server refuses would be a lie.
 *
 * Only changed fields are sent. `draft` starts as a copy of the form's current
 * values and the diff against `form` at save time is what becomes the payload,
 * so an untouched field is omitted from the request entirely rather than sent
 * back unchanged.
 */
export default function FormEditPanel({ form, physicians = [], onSave, onCancel, isPending, error }) {
  const [draft, setDraft] = useState(() => ({
    physicianID: form.physicianID ?? '',
    dentistID: form.dentistID ?? '',
    optometristID: form.optometristID ?? '',
    ...Object.fromEntries(VITALS.map((v) => [v.name, form[v.name] ?? ''])),
    ...Object.fromEntries(CONSULTATION.map((c) => [c.name, form[c.name] ?? ''])),
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
  }));

  const [reason, setReason] = useState('');

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

  // Only what actually moved. The endpoint is a sparse PATCH: a key we omit is
  // left alone, so sending unchanged fields back would widen the audit entry
  // with noise and risk clobbering a value another station changed meanwhile.
  const changes = useMemo(() => {
    const out = {};

    for (const { name } of VITALS) {
      const next = toNumber(draft[name]);
      const current = form[name] ?? null;
      if (next !== current) out[name] = next;
    }

    for (const { name } of CONSULTATION) {
      const next = normalize(draft[name]);
      const current = form[name] ?? null;
      if (next !== current) out[name] = next;
    }

    for (const name of ['physicianID', 'dentistID', 'optometristID']) {
      const next = toNumber(draft[name]);
      const current = form[name] ?? null;
      if (next !== current) out[name] = next;
    }

    // The two assessment grids go as whole objects or not at all -- the server
    // replaces the row wholesale, so a partial object would blank the
    // indicators it left out.
    const dentalChanged = DENTAL_INDICATORS.some(({ name }) =>
      normalize(draft.dental[name]) !== (form.dentalAssessment?.[name] ?? null)
      || normalize(draft.dental[`${name}Remarks`]) !== (form.dentalAssessment?.[`${name}Remarks`] ?? null));

    if (dentalChanged) {
      out.dentalAssessment = Object.fromEntries(
        Object.entries(draft.dental).map(([k, v]) => [k, normalize(v)])
      );
    }

    const visionChanged = VISION_INDICATORS.some(({ name, hasOther, otherFieldName }) =>
      normalize(draft.vision[name]) !== (form.visionAssessment?.[name] ?? null)
      || normalize(draft.vision[`${name}Remarks`]) !== (form.visionAssessment?.[`${name}Remarks`] ?? null)
      || (hasOther
        && normalize(draft.vision[otherFieldName]) !== (form.visionAssessment?.[otherFieldName] ?? null)));

    if (visionChanged) {
      out.visionAssessment = Object.fromEntries(
        Object.entries(draft.vision).map(([k, v]) => [k, normalize(v)])
      );
    }

    return out;
  }, [draft, form]);

  const changedCount = Object.keys(changes).length;
  const canSave = changedCount > 0
    && !isPending
    && (!reasonRequired || reason.trim().length >= 3);

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

      <SectionCard
        step={1}
        title="Vitals"
        subtitle="Station 1 measurements."
        icon={Activity}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {VITALS.map(({ name, label, unit, step }) => (
            <Field key={name} label={unit ? `${label} (${unit})` : label} htmlFor={`edit-${name}`}>
              <Input
                id={`edit-${name}`}
                type="number"
                step={step}
                min="0"
                value={draft[name]}
                onChange={(e) => set(name, e.target.value)}
                disabled={isPending}
              />
            </Field>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        step={2}
        title="Physician's Assessment"
        subtitle="Findings and plan of care recorded at Station 3."
        icon={Stethoscope}
      >
        <div className="flex flex-col gap-4">
          <SubPanel icon={Stethoscope} title="Attending Physician" subtitle="Station 3 consultation">
            <Select
              options={physicianOptions}
              value={String(draft.physicianID ?? '')}
              onChange={(e) => set('physicianID', e.target.value)}
              disabled={isPending}
            />
          </SubPanel>

          {CONSULTATION.map(({ name, label, icon, subtitle, maxLength }) => (
            <SubPanel key={name} icon={icon} title={label} subtitle={subtitle}>
              <Textarea
                id={`edit-${name}`}
                value={draft[name]}
                onChange={(e) => set(name, e.target.value)}
                maxLength={maxLength}
                disabled={isPending}
              />
            </SubPanel>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        step={3}
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
                  value={draft.dental[`${name}Remarks`] ?? ''}
                  onChange={(e) => setNested('dental', `${name}Remarks`, e.target.value)}
                  placeholder={remarksPlaceholder}
                  maxLength={300}
                  disabled={isPending}
                />
              </div>
            </SubPanel>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        step={4}
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
                      value={draft.vision[name] ?? ''}
                      onChange={(e) => setNested('vision', name, e.target.value)}
                      placeholder={placeholder}
                      maxLength={50}
                      disabled={isPending}
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
                      value={draft.vision[otherFieldName] ?? ''}
                      onChange={(e) => setNested('vision', otherFieldName, e.target.value)}
                      placeholder={otherPlaceholder}
                      maxLength={100}
                      disabled={isPending}
                    />
                  )}

                  <Textarea
                    rows={2}
                    value={draft.vision[`${name}Remarks`] ?? ''}
                    onChange={(e) => setNested('vision', `${name}Remarks`, e.target.value)}
                    placeholder={remarksPlaceholder}
                    maxLength={300}
                    disabled={isPending}
                  />
                </div>
              </SubPanel>
            );
          })}
        </div>
      </SectionCard>

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
