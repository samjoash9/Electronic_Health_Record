import { ClipboardCheck, Stethoscope, Pill, FlaskConical, Check } from 'lucide-react';
import { parseManagement, sameDrug, listNames } from '../../lib/consultationRecord';
import { parseDiagnosticTests, diagnosticTestsTotal, catalogFullName } from '../../lib/diagnosticTests';
import { peso } from '../../lib/formatters';
import { RecordSection, RecordHeading, NotRecorded, Chip, SignOff } from './RecordParts';

function Card({ icon, title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <RecordHeading icon={icon} title={title} subtitle={subtitle} level={4} />
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Management({ text, maintenanceDrugs }) {
  const { medications, advice, other } = parseManagement(text);
  if (other) return <p className="text-sm whitespace-pre-wrap text-ink-900">{other}</p>;

  return (
    <dl className="flex flex-col gap-3 text-sm">
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3">
        <dt className="pt-0.5 text-xs text-ink-500">Medication</dt>
        <dd>
          {medications.length === 0 ? <NotRecorded /> : (
            <ul className="flex flex-col gap-2">
              {medications.map(({ drug, details }, i) => (
                <li key={`${drug}-${i}`}>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-ink-900">{drug}</span>
                    {details.map((detail) => <Chip key={detail}>{detail}</Chip>)}
                  </span>
                  {maintenanceDrugs.some((m) => sameDrug(m, drug)) && (
                    <span className="mt-1 flex items-center gap-1 text-xs text-[#0e7d6b]">
                      <Check size={12} aria-hidden />
                      Same as maintenance medication on file
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </dd>
      </div>
      {/* One field at Station 3, so one row here, though the plan covers both. */}
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3">
        <dt className="pt-0.5 text-xs text-ink-500">Lifestyle advice &amp; follow-up</dt>
        <dd>{advice ? <p className="whitespace-pre-wrap text-ink-900">{advice}</p> : <NotRecorded />}</dd>
      </div>
    </dl>
  );
}

/**
 * The ordered tests priced as billing will price them. Tests with no set
 * price are named under the total so it is never read as covering them.
 */
function DiagnosticTests({ id, value }) {
  const rows = parseDiagnosticTests(value);
  const { total, pricedCount } = diagnosticTestsTotal(value);
  const unpriced = rows.filter((row) => row.price == null).map((row) => row.name);

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="p-4">
        <RecordHeading id={id} icon={FlaskConical} title="Recommended diagnostic tests" subtitle="Labs, imaging, or referrals ordered" level={4} />
      </div>
      {rows.length === 0 ? (
        <p className="border-t border-line px-4 py-3 text-sm text-ink-500">No diagnostic tests ordered.</p>
      ) : (
        <div className="overflow-x-auto border-t border-line">
          <table aria-labelledby={id} className="w-full min-w-[28rem] text-left text-sm">
            <thead className="border-b border-line bg-gray-50 text-xs text-ink-500">
              <tr>
                <th scope="col" colSpan={2} className="px-4 py-2.5 font-medium">Test</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row, i) => (
                <tr key={`${row.name}-${i}`}>
                  <th scope="row" className="w-36 px-4 py-2.5 font-bold text-ink-900">{row.name}</th>
                  <td className="px-4 py-2.5 text-[#0e7d6b]">{catalogFullName(row.name)}</td>
                  <td className="px-4 py-2.5 text-right">
                    {row.price == null
                      ? <NotRecorded label="No set price" />
                      : <span className="font-semibold text-ink-900 tabular-nums">{peso(row.price)}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-line bg-gray-50">
              <tr>
                <th scope="row" colSpan={2} className="px-4 py-3 font-normal">
                  <span className="block text-sm font-bold text-ink-900">
                    {pricedCount > 0 ? 'Total for priced tests' : 'No set price for these tests'}
                  </span>
                  {pricedCount > 0 && unpriced.length > 0 && (
                    <span className="block text-xs text-ink-500">
                      Excludes {listNames(unpriced)}, which {unpriced.length === 1 ? 'has' : 'have'} no set price
                    </span>
                  )}
                </th>
                <td className="px-4 py-3 text-right text-base font-bold text-ink-900 tabular-nums">
                  {pricedCount > 0 ? peso(total) : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

/** Impression, plan, ordered tests and the physician's sign-off -- held back until the consultation is signed. */
export default function PhysicianAssessmentDetail({ id, form }) {
  const maintenanceDrugs = (form.pastMedicalHistory ?? []).map((row) => row.maintenanceDrugGeneric).filter(Boolean);
  const { physician } = form;

  return (
    <RecordSection
      id={id}
      icon={ClipboardCheck}
      title="Physician's assessment"
      subtitle="Findings and plan of care recorded by the attending physician"
    >
      {!form.signedAt ? (
        <p className="text-sm text-ink-500">Not yet completed.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 @3xl:grid-cols-2">
            <Card icon={Stethoscope} title="Impression" subtitle="Working diagnosis from the findings">
              {form.impressionClinical
                ? <p className="text-sm whitespace-pre-wrap text-ink-900">{form.impressionClinical}</p>
                : <NotRecorded />}
            </Card>
            <Card icon={Pill} title="Management" subtitle="Medication, lifestyle advice and follow-up">
              <Management text={form.managementTreatment} maintenanceDrugs={maintenanceDrugs} />
            </Card>
          </div>

          <DiagnosticTests id={`${id}-tests`} value={form.recommendedDiagnosticTest} />

          <SignOff
            role="Attending physician"
            name={physician ? `Dr. ${physician.firstName} ${physician.surname}` : form.signedByName}
            licenseNo={physician?.prcLicenseNo ?? form.signedByLicenseNo}
            signature={form.signature}
            signatureAlt="Physician signature"
            signedAt={form.signedAt}
          />
        </div>
      )}
    </RecordSection>
  );
}
