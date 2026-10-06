import { useState, useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import {
  ArrowLeft, Download, Loader2, Briefcase, Building2, Cake, VenusAndMars, HeartHandshake, MapPin, Phone,
  Users, Stethoscope, Activity, ClipboardList, FlaskConical, Pill,
  Cigarette, Dumbbell, Wine, BadgeCheck, Smile, Eye,
} from 'lucide-react';
import { getAssessmentTemplate } from '../../api/assessment.api';
import { useWellnessForm } from '../../hooks/useWellnessForm';
import { FORM_STATUS, DENTAL_INDICATORS, VISION_INDICATORS } from '../../lib/constants';
import { fullName, ageFrom, formatDate, formatDateTime } from '../../lib/formatters';
import { familyHistoryLabel } from '../../lib/familyHistory';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import PriorStationsPanel from '../station3/PriorStationsPanel';
import SectionCard, { SubPanel } from '../station3/SectionCard';
import DiagnosticTestList from '../../components/ui/DiagnosticTestList';

// Mirrors Station3ConsultationPage's PATIENT_FIELDS — the physician sees this
// same identity grid when they open the record, so the patient's own copy
// reads as the same document rather than a lighter substitute.
const PATIENT_FIELDS = [
  { key: 'position', label: 'Position', icon: Briefcase },
  { key: 'agencyOffice', label: 'Agency/Office', icon: Building2 },
  { key: 'birthdate', label: 'Birthdate', icon: Cake, render: (p) => formatDate(p.birthdate) },
  { key: 'sex', label: 'Sex', icon: VenusAndMars },
  { key: 'civilStatus', label: 'Civil Status', icon: HeartHandshake },
  { key: 'address', label: 'Address', icon: MapPin },
  { key: 'contactNo', label: 'Contact No.', icon: Phone },
];

function HistoryList({ items, render, empty }) {
  if (!items?.length) return <p className="text-sm text-ink-500">{empty}</p>;
  return (
    <ul className="flex flex-col gap-1.5 text-sm">
      {items.map((item, i) => <li key={item.fmhID ?? item.pmhID ?? item.exerciseID ?? item.dentalAssessmentID ?? i}>{render(item)}</li>)}
    </ul>
  );
}

/** Read-only stand-in for AssessmentPlanSection's Textarea — the same label and icon, just the physician's own words instead of an input. */
function StaticAnswer({ value, placeholder }) {
  return value
    ? <p className="text-sm whitespace-pre-wrap text-ink-900">{value}</p>
    : <p className="text-sm text-ink-400 italic">{placeholder}</p>;
}

export default function MyRecordDetailPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const demographicsRef = useRef(null);
  const station1Ref = useRef(null);
  const station2HeaderRef = useRef(null);
  const station2SpiritualRef = useRef(null);
  const station2PsychologicalRef = useRef(null);
  const station2MentalRef = useRef(null);
  const station2EmotionalRef = useRef(null);
  const station2PhysicalRef = useRef(null);
  const station2FinancialRef = useRef(null);
  const station2SocialRef = useRef(null);
  const station3Ref = useRef(null);
  const station4Ref = useRef(null);
  const station5Ref = useRef(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const { data: form, isLoading, error, refetch } = useWellnessForm(formId);
  const { data: categories } = useQuery({
    queryKey: ['assessment-template'],
    queryFn: getAssessmentTemplate,
    staleTime: Infinity,
  });

  const downloadPatientRecord = async () => {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true);

    // 1. Define the refs array representing your sections in order
    const sections = [
      demographicsRef,
      station1Ref,
      station2HeaderRef,
      station2SpiritualRef,
      station2PsychologicalRef,
      station2MentalRef,
      station2EmotionalRef,
      station2PhysicalRef,
      station2FinancialRef,
      station2SocialRef,
      station3Ref,
      station4Ref,
      station5Ref,
    ];

    const buttonsToClose = [];
    try {
      // Temporarily expand any collapsed sections within the document
      const collapsedButtons = document.querySelectorAll('button[aria-expanded="false"]');
      collapsedButtons.forEach((btn) => {
        btn.click();
        buttonsToClose.push(btn);
      });

      if (buttonsToClose.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Filter out external font stylesheets to avoid CORS cloning issues
      const filter = (node) => {
        if (node.tagName === 'LINK' && node.href && node.href.includes('fonts.googleapis.com')) {
          return false;
        }
        return true;
      };

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const marginX = 10; // 10mm margins on left/right
      const usableWidth = pdfWidth - (marginX * 2); 
      let currentY = 15; // Starting top margin

      // 2. Loop through each section
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i].current;
        if (!section) continue;

        // Force a fixed pixel width for the capture so it doesn't rely on screen size
        const captureWidth = 1024; 

        const dataUrl = await toPng(section, {
          quality: 1,
          backgroundColor: '#ffffff', // Ensure pure white background
          pixelRatio: 2,
          width: captureWidth,
          filter,
          style: {
            width: `${captureWidth}px`,
            transform: 'scale(1)',
            transformOrigin: 'top left',
          },
        });

        const imgProps = pdf.getImageProperties(dataUrl);
        const imgHeight = (imgProps.height * usableWidth) / imgProps.width;

        // Page break logic: If this section exceeds the page height, add a new page
        if (currentY + imgHeight > pdfHeight - 15 && i > 0) {
          pdf.addPage();
          currentY = 15; // Reset Y for the new page
        }

        pdf.addImage(dataUrl, 'PNG', marginX, currentY, usableWidth, imgHeight);
        currentY += imgHeight + 10; // Add 10mm spacing between sections
      }

      // 3. Add the centered watermark to every page
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setTextColor(230, 235, 233);
        pdf.setFontSize(28); 
        pdf.text(
          ['eHPR System', 'Confidential Patient Record'], 
          pdfWidth / 2, 
          pdfHeight / 2, 
          { angle: 45, align: 'center', baseline: 'middle' }
        );
      }

      pdf.save(`My_Health_Record_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to generate patient record PDF:', err);
    } finally {
      // Restore user's previous collapsed section state
      buttonsToClose.forEach((btn) => btn.click());
      setIsGeneratingPDF(false);
    }
  };

  const backButton = (
    <Button
      type="button"
      variant="secondary"
      size="md"
      className="self-start"
      onClick={() => navigate('/my-record')}
    >
      <ArrowLeft size={16} strokeWidth={2.25} />
      Back to My Record
    </Button>
  );

  if (isLoading || error) {
    return (
      <div className="flex flex-col gap-3 pb-6">
        {backButton}
        {isLoading ? <Skeleton /> : <ErrorState error={error} onRetry={refetch} />}
      </div>
    );
  }

  if (form.status !== FORM_STATUS.COMPLETED) {
    return <Navigate to="/my-record" replace />;
  }

  const patient = form.patient;
  const social = form.socialHistory;

  return (
    <div className="flex flex-col gap-4 pb-10">
      <div className="flex justify-between items-center mb-6">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => navigate('/my-record')}
        >
          <ArrowLeft size={16} strokeWidth={2.25} />
          Back to My Record
        </Button>

        <button
          type="button"
          onClick={downloadPatientRecord}
          disabled={isGeneratingPDF}
          className="flex items-center gap-2 bg-[#0A594D] hover:bg-[#07463c] text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
        >
          {isGeneratingPDF ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download size={16} />
              <span>Download Record</span>
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div ref={demographicsRef} className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          <div className="flex items-center gap-4 bg-linear-to-r from-[#e9fbf6] to-[#f3fdfb] p-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#14a690] to-[#0e7d6b] text-xl font-bold text-white shadow-sm ring-4 ring-white">
              {fullName(patient).charAt(0).toUpperCase()}
            </div>
          <div>
            <p className="text-lg font-semibold text-ink-900">{fullName(patient)}</p>
            <p className="text-sm text-ink-500">Age {ageFrom(patient?.birthdate)} · {patient?.position} · {patient?.agencyOffice}</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {PATIENT_FIELDS.map(({ key, label, icon: Icon, render }) => (
            <div key={key} className="flex items-start gap-3 rounded-lg border border-line bg-canvas p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#e9fbf6] text-[#0e7d6b]">
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
                <dd className={`mt-0.5 text-sm font-medium text-ink-900 ${key === 'address' ? 'wrap-break-word' : 'truncate'}`}>
                  {render ? render(patient) : patient?.[key] || '—'}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>

      <PriorStationsPanel
        form={form}
        categories={categories}
        station1Ref={station1Ref}
        station2HeaderRef={station2HeaderRef}
        station2SpiritualRef={station2SpiritualRef}
        station2PsychologicalRef={station2PsychologicalRef}
        station2MentalRef={station2MentalRef}
        station2EmotionalRef={station2EmotionalRef}
        station2PhysicalRef={station2PhysicalRef}
        station2FinancialRef={station2FinancialRef}
        station2SocialRef={station2SocialRef}
      />

      <div ref={station3Ref} className="flex flex-col gap-4">
        <SectionCard
          step={1}
          title="Family Medical History"
          subtitle="Conditions reported among your immediate family."
          icon={Users}
        >
        <HistoryList
          items={form.familyMedicalHistory}
          empty="No family medical history on file."
          render={familyHistoryLabel}
        />
      </SectionCard>

      <SectionCard
        step={2}
        title="Past Medical History"
        subtitle="Diagnosed conditions and any maintenance medication on file."
        icon={Stethoscope}
      >
        <HistoryList
          items={form.pastMedicalHistory}
          empty="No past medical history on file."
          render={(row) => `${row.conditionOther} (${row.yearDiagnosed ?? '—'}) — ${row.maintenanceDrugGeneric ?? '—'} ${row.dosage ?? ''} ${row.frequency ?? ''}`}
        />
      </SectionCard>

      <SectionCard
        step={3}
        title="Social History"
        subtitle="Lifestyle habits recorded during your consultation."
        icon={Activity}
      >
        {social ? (
          <div className="flex flex-col gap-4">
            <SubPanel icon={Cigarette} title="Smoking" subtitle="Cigarette and e-cigarette usage">
              {social.smokes !== true ? (
                <p className="text-sm text-ink-500">Patient does not smoke.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {social.smokesCigarette && (
                    <p className="text-sm font-medium text-ink-900">
                      Cigarette — {social.cigaretteSticksPerDay ?? '—'} sticks/day,{' '}
                      {social.cigaretteFrequency ?? '—'}, started {social.cigaretteYearStarted ?? '—'},{' '}
                      {social.cigarettePuffsPerDay ?? '—'} puffs/day
                    </p>
                  )}
                  {social.smokesEcig && (
                    <p className="text-sm font-medium text-ink-900">
                      E-cigarette — {social.ecigPodsPerMonth ?? '—'} pods/month,{' '}
                      {social.ecigFrequency ?? '—'}, started {social.ecigYearStarted ?? '—'},{' '}
                      {social.ecigPuffsPerDay ?? '—'} puffs/day
                    </p>
                  )}
                  {!social.smokesCigarette && !social.smokesEcig && (
                    <p className="text-sm text-ink-500">No cigarette or e-cigarette details on file.</p>
                  )}
                </div>
              )}
            </SubPanel>
            <SubPanel icon={Dumbbell} title="Exercise" subtitle="Physical activity">
              <HistoryList
                items={form.exercise}
                empty="No exercise on file."
                render={(row) => `${row.exerciseType} — ${row.exerciseFrequency ?? '—'} · started ${row.exerciseYearStarted ?? '—'}`}
              />
            </SubPanel>
            <SubPanel icon={Wine} title="Alcohol" subtitle="Alcohol consumption">
              <p className="text-sm font-medium text-ink-900">{social.alcoholType ?? '—'}</p>
              <p className="mt-1 text-xs text-ink-500">Drinking frequency: {social.drinkFrequency ?? '—'}</p>
            </SubPanel>
          </div>
        ) : (
          <p className="text-sm text-ink-500">No social history on file.</p>
        )}
      </SectionCard>

      <SectionCard
        step={4}
        title="Physician's Assessment"
        subtitle="Findings and plan of care recorded by the attending physician."
        icon={ClipboardList}
      >
        <div className="flex flex-col gap-4">
          <SubPanel icon={FlaskConical} title="Recommended Diagnostic Test" subtitle="Labs, imaging, or referrals ordered.">
            <DiagnosticTestList value={form.recommendedDiagnosticTest} />
          </SubPanel>
          <SubPanel icon={Stethoscope} title="Impression / Clinical" subtitle="Working diagnosis from the findings above.">
            <StaticAnswer value={form.impressionClinical} placeholder="No impression recorded." />
          </SubPanel>
          <SubPanel icon={Pill} title="Management / Treatment" subtitle="Medication, lifestyle advice, and follow-up.">
            <StaticAnswer value={form.managementTreatment} placeholder="No treatment plan recorded." />
          </SubPanel>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-line bg-surface/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e9fbf6] text-[#0e7d6b] ring-1 ring-[#0e7d6b]/10"
            >
              <BadgeCheck size={16} strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-wide text-ink-500 uppercase">Physician</p>
              <p className="text-sm font-semibold text-ink-900">
                {form.physician ? `Dr. ${form.physician.firstName} ${form.physician.surname}` : '—'}
              </p>
              <p className="text-xs text-ink-500">PRC License No. {form.physician?.prcLicenseNo ?? '—'}</p>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end">
            {form.signature && (
              <img src={form.signature} alt="Physician signature" className="h-16 rounded border border-line bg-surface" />
            )}
            <p className="mt-1 text-xs text-ink-500">Signed {formatDateTime(form.signedAt)}</p>
          </div>
        </div>
      </SectionCard>
      </div>

      <div ref={station4Ref}>
        <SectionCard
          step={5}
          title="Dental Assessment"
          subtitle="Station 4 findings and the examining dentist's remarks."
          icon={Smile}
        >
          {form.dentalAssessment ? (
            <div className="flex flex-col gap-4">
              {DENTAL_INDICATORS.map(({ name, label }, index) => (
                // SubPanel renders its icon unconditionally with no fallback, and
                // DENTAL_INDICATORS carries no per-indicator icon, so every row
                // reuses the section's own Smile icon rather than passing none.
                <SubPanel key={name} icon={Smile} title={`${index + 1}. ${label}`}>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-semibold text-ink-900">
                      {form.dentalAssessment[name] || <span className="font-normal text-ink-400 italic">Not assessed</span>}
                    </p>
                    <StaticAnswer
                      value={form.dentalAssessment[`${name}Remarks`]}
                      placeholder="No remarks."
                    />
                  </div>
                </SubPanel>
              ))}

              <div className="mt-6 border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-[#e6f4f1] text-[#37AF9B] p-2 rounded-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">DENTIST</p>
                    <p className="font-bold text-gray-900 leading-tight">
                      {form.dentist ? `Dr. ${form.dentist.firstName} ${form.dentist.surname}` : '—'}
                    </p>
                    <p className="text-sm text-gray-500">PRC License No. {form.dentist?.prcLicenseNo ?? '—'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end">
                  <div className="w-48 h-16 border border-gray-200 rounded-md flex items-center justify-center mb-1 bg-surface p-1">
                    {form.dentalSignature ? (
                      <img
                        src={form.dentalSignature}
                        alt="Dentist signature"
                        className="h-full max-h-14 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-gray-400 italic">No signature</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Signed {form.dentalSignedAt ? formatDateTime(form.dentalSignedAt) : '—'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-500">Not yet completed.</p>
          )}
        </SectionCard>
      </div>

      <div ref={station5Ref}>
        <SectionCard
          step={6}
          title="Vision Assessment"
          subtitle="Station 5 findings and the examining optometrist's remarks."
          icon={Eye}
        >
          {form.visionAssessment ? (
            <div className="flex flex-col gap-4">
              {VISION_INDICATORS.map((indicator, index) => {
                const { name, label, type, hasOther, otherFieldName } = indicator;
                const value = form.visionAssessment[name];
                const otherValue = hasOther ? form.visionAssessment[otherFieldName] : null;
                // SubPanel renders its icon unconditionally with no fallback, and
                // VISION_INDICATORS carries no per-indicator icon, so every row
                // reuses the section's own Eye icon rather than passing none.
                return (
                  <SubPanel key={name} icon={Eye} title={`${index + 1}. ${label}`}>
                    <div className="flex flex-col gap-1.5">
                      <p className="text-sm font-semibold text-ink-900">
                        {value
                          ? `${value}${hasOther && value === 'Other' && otherValue ? ` — ${otherValue}` : ''}`
                          : <span className="font-normal text-ink-400 italic">{type === 'text' ? 'Not recorded' : 'Not assessed'}</span>}
                      </p>
                      <StaticAnswer
                        value={form.visionAssessment[`${name}Remarks`]}
                        placeholder="No remarks."
                      />
                    </div>
                  </SubPanel>
                );
              })}

              <div className="mt-6 border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-[#e6f4f1] text-[#37AF9B] p-2 rounded-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">OPTOMETRIST</p>
                    <p className="font-bold text-gray-900 leading-tight">
                      {form.optometrist ? `Dr. ${form.optometrist.firstName} ${form.optometrist.surname}` : '—'}
                    </p>
                    <p className="text-sm text-gray-500">PRC License No. {form.optometrist?.prcLicenseNo ?? '—'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end">
                  <div className="w-48 h-16 border border-gray-200 rounded-md flex items-center justify-center mb-1 bg-surface p-1">
                    {form.visionSignature ? (
                      <img
                        src={form.visionSignature}
                        alt="Optometrist signature"
                        className="h-full max-h-14 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-gray-400 italic">No signature</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Signed {form.visionSignedAt ? formatDateTime(form.visionSignedAt) : '—'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-500">Not yet completed.</p>
          )}
        </SectionCard>
      </div>
      </div>
    </div>
  );
}
