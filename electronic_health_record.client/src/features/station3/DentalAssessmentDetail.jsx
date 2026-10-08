import { DENTAL_INDICATORS } from '../../lib/constants';
import { NotRecorded, SignOff } from './RecordParts';

/**
 * A stored answer as the record reads it: sentence case, "a/b" spaced out, and
 * the en dash before a qualifier read as a comma, so 'Yes – satisfactory' shows
 * as "Yes, satisfactory". Only the display changes -- the stored strings are
 * what the CK_DentalAssessment_* constraints match on.
 */
function plainAnswer(value) {
  const spaced = value.replace(/ – /g, ', ').replace(/(\w)\/(\w)/g, '$1 / $2');
  return spaced.charAt(0) + spaced.slice(1).toLowerCase();
}

/**
 * Who examined and signed. A dentist whose account was since deleted is named
 * from the copy the server kept on the form (dentalSignedByName/LicenseNo).
 */
function DentistSignOff({ form }) {
  const { dentist } = form;

  return (
    <SignOff
      role="Examining dentist"
      name={dentist ? `Dr. ${dentist.firstName} ${dentist.surname}` : form.dentalSignedByName}
      licenseNo={dentist?.prcLicenseNo ?? form.dentalSignedByLicenseNo}
      signature={form.dentalSignature}
      signatureAlt="Dentist signature"
      signedAt={form.dentalSignedAt}
    />
  );
}

/**
 * Station 4 as the form record shows it once opened: every finding in two
 * columns, then the dentist's remarks and sign-off. The sign-off carries the
 * signing time, so give the station card `signOffInBody`.
 */
export default function DentalAssessmentDetail({ form }) {
  const assessment = form.dentalAssessment;
  if (!assessment) return <p className="text-sm text-ink-500">Not yet completed.</p>;

  const findings = DENTAL_INDICATORS.map(({ name, shortLabel }) => ({
    name,
    shortLabel,
    answer: assessment[name] ? plainAnswer(assessment[name]) : null,
    remarks: assessment[`${name}Remarks`]?.trim() || null,
  }));
  const remarked = findings.filter((finding) => finding.remarks);

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid gap-x-8 @xl:grid-cols-2">
        {findings.map(({ name, shortLabel, answer }) => (
          <div key={name} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5">
            <dt className="text-sm text-ink-500">{shortLabel}</dt>
            <dd className="text-right text-sm font-semibold text-ink-900">
              {answer ?? <NotRecorded label="Not assessed" />}
            </dd>
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

      <DentistSignOff form={form} />
    </div>
  );
}
