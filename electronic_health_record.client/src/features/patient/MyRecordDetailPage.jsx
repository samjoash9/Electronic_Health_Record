import { useState, useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import {
  ArrowLeft, Download, Loader2, Briefcase, Building2, Cake, VenusAndMars, HeartHandshake, MapPin, Phone,
} from 'lucide-react';
import { getAssessmentTemplate } from '../../api/assessment.api';
import { useWellnessForm } from '../../hooks/useWellnessForm';
import { FORM_STATUS, STATUS_LABEL, STATUS_TONE } from '../../lib/constants';
import { fullName, ageFrom, formatDate } from '../../lib/formatters';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import PriorStationsPanel from '../station3/PriorStationsPanel';
import StationCollapsible from '../station3/StationCollapsible';
import { consultationHeader, dentalHeader, visionHeader } from '../station3/stationHeaders';
import Station3ConsultationDetail from '../station3/Station3ConsultationDetail';
import DentalAssessmentDetail from '../station3/DentalAssessmentDetail';
import VisionAssessmentDetail from '../station3/VisionAssessmentDetail';

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

  // Laid out as the Forms page's FormDetailPage lays out the same record, so
  // the patient's copy and the admin's read as one document: the identity card,
  // then every station as a StationCollapsible carrying its headline readings.
  // Each station sits in a wrapper div holding its ref, which the PDF export
  // captures section by section.
  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex flex-wrap items-center gap-3">
        {backButton}
        <button
          type="button"
          onClick={downloadPatientRecord}
          disabled={isGeneratingPDF}
          className="ml-auto flex items-center gap-2 bg-[#0A594D] hover:bg-[#07463c] text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
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

      <div ref={demographicsRef} className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <div className="flex items-center gap-4 bg-linear-to-r from-[#e9fbf6] to-[#f3fdfb] p-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#14a690] to-[#0e7d6b] text-xl font-bold text-white shadow-sm ring-4 ring-white">
            {fullName(patient).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-ink-900">{fullName(patient)}</p>
            <p className="text-sm text-ink-500">Age {ageFrom(patient?.birthdate)} · {patient?.position} · {patient?.agencyOffice}</p>
          </div>
          <Badge tone={STATUS_TONE[form.status]}>{STATUS_LABEL[form.status] ?? form.status}</Badge>
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

      <div ref={station3Ref}>
        <StationCollapsible {...consultationHeader(form)} flush>
          <Station3ConsultationDetail form={form} />
        </StationCollapsible>
      </div>

      <div ref={station4Ref}>
        <StationCollapsible {...dentalHeader(form)} signOffInBody>
          <DentalAssessmentDetail form={form} />
        </StationCollapsible>
      </div>

      <div ref={station5Ref}>
        <StationCollapsible {...visionHeader(form)} signOffInBody>
          <VisionAssessmentDetail form={form} />
        </StationCollapsible>
      </div>
    </div>
  );
}
