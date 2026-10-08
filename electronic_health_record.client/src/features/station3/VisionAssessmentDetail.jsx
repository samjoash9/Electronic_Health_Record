import { VISION_INDICATORS } from '../../lib/constants';
import { SignOff } from './RecordParts';

const RIGHT_EYE = 'visualAcuityRightEye';
const LEFT_EYE = 'visualAcuityLeftEye';
const ACUITY_LABEL = 'Visual acuity (right / left)';

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/** A reading the optometrist left blank, said as such rather than left empty. */
function NotRecorded() {
  return <span className="font-medium text-ink-500 italic">Not recorded</span>;
}

/**
 * A stored answer as the record reads it. A referral reads as whether one is
 * needed, and "Other" as the condition the optometrist specified under it.
 */
function plainAnswer(name, assessment) {
  const value = assessment[name];
  if (name === 'referralToEyeSpecialist') return value === 'Yes' ? 'Needed' : 'Not needed';
  if (name === 'eyeConditionIdentified' && value === 'Other') {
    const other = assessment.eyeConditionOther?.trim();
    return other ? capitalize(other) : value;
  }
  return value;
}

/**
 * Both eyes read on one row: the two figures are compared with each other far
 * more often than with anything else in the record.
 */
function Acuity({ right, left }) {
  if (!right && !left) return <NotRecorded />;
  return <span className="font-mono tabular-nums">{`${right ?? '—'} / ${left ?? '—'}`}</span>;
}

/**
 * Station 5 as the form record shows it once opened: every finding in two
 * columns, then the optometrist's remarks and sign-off. The sign-off carries
 * the signing time, so give the station card `signOffInBody`.
 */
export default function VisionAssessmentDetail({ form }) {
  const assessment = form.visionAssessment;
  if (!assessment) return <p className="text-sm text-ink-500">Not yet completed.</p>;

  // The left eye's reading joins the right eye's row rather than taking its own.
  const findings = VISION_INDICATORS.filter(({ name }) => name !== LEFT_EYE).map(({ name, shortLabel }) => {
    if (name === RIGHT_EYE) {
      return {
        name,
        shortLabel: ACUITY_LABEL,
        answer: <Acuity right={assessment[RIGHT_EYE]?.trim() || null} left={assessment[LEFT_EYE]?.trim() || null} />,
      };
    }
    return { name, shortLabel, answer: assessment[name] ? plainAnswer(name, assessment) : <NotRecorded /> };
  });
  const remarked = VISION_INDICATORS
    .map(({ name, shortLabel }) => ({ name, shortLabel, remarks: assessment[`${name}Remarks`]?.trim() || null }))
    .filter((finding) => finding.remarks);
  const { optometrist } = form;

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid gap-x-8 @xl:grid-cols-2">
        {findings.map(({ name, shortLabel, answer }) => (
          <div key={name} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5">
            <dt className="text-sm text-ink-500">{shortLabel}</dt>
            <dd className="text-right text-sm font-semibold text-ink-900">{answer}</dd>
          </div>
        ))}
      </dl>

      {/* Each indicator has its own remarks field; only the ones written are listed. */}
      {remarked.length === 0 ? (
        <p className="text-xs text-ink-500">No remarks recorded.</p>
      ) : (
        <ul aria-label="Remarks" className="flex flex-col gap-1.5 text-sm text-ink-700">
          {remarked.map(({ name, shortLabel, remarks }) => (
            <li key={name}>
              <span className="font-semibold text-ink-900">{shortLabel}:</span>{' '}
              <span className="whitespace-pre-wrap">{remarks}</span>
            </li>
          ))}
        </ul>
      )}

      {/* An optometrist whose account was since deleted is named from the copy
          the server kept on the form (visionSignedByName/LicenseNo). */}
      <SignOff
        role="Examining optometrist"
        name={optometrist ? `Dr. ${optometrist.firstName} ${optometrist.surname}` : form.visionSignedByName}
        licenseNo={optometrist?.prcLicenseNo ?? form.visionSignedByLicenseNo}
        signature={form.visionSignature}
        signatureAlt="Optometrist signature"
        signedAt={form.visionSignedAt}
      />
    </div>
  );
}
