import { useState, useRef } from 'react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import {
  Clock,
  ShieldCheck,
  UserCheck,
  FileSpreadsheet,
  Download,
  Loader2,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ReportFilterBar from '../admin/ReportFilterBar';
import { useReportFilter } from '../admin/useReportFilter';
import Station1HealthSection from './Station1HealthSection';
import Station2HealthSection from './Station2HealthSection';
import Station3HealthSection from './Station3HealthSection';
import Station4HealthSection from './Station4HealthSection';
import Station5HealthSection from './Station5HealthSection';
import { pdfScopeText } from './pdfScope';
import ExportProgress from './ExportProgress';
import QuickJumpNav from './QuickJumpNav';
import { waitForChartsDrawn } from './chartExport';

const STATIONS = [
  { id: 'station-1', label: '1. Registration & Vitals' },
  { id: 'station-2', label: '2. Wellness Assessment' },
  { id: 'station-3', label: '3. Consultation' },
  { id: 'station-4', label: '4. Dental' },
  { id: 'station-5', label: '5. Vision' },
];

// Helper function to parse user station selection input
const parseStationInput = (input) => {
  if (!input) return [1, 2, 3, 4, 5]; // Default to all if empty
  const stations = new Set();
  const parts = input.replace(/\s+/g, '').split(',');
  
  parts.forEach(part => {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      if (start && end && start <= end) {
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= 5) stations.add(i);
        }
      }
    } else {
      const num = Number(part);
      if (num >= 1 && num <= 5) stations.add(num);
    }
  });
  return Array.from(stations).sort();
};

/**
 * Master Health Reports: Clinic Pipeline Analytics
 * Vertically scrollable master dashboard providing graphical surveillance
 * across Station 1 (Registration) through Station 5 (Vision Screening).
 */
export default function HealthReports() {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [stationSelection, setStationSelection] = useState('');

  // Period + office for every station section.
  const reportFilter = useReportFilter();
  // { done, total } while the export captures charts.
  const [exportProgress, setExportProgress] = useState(null);
  const stickyBarRef = useRef(null);

  // Individual Section Container Refs
  const station1Ref = useRef(null);
  const station2Ref = useRef(null);
  const station3Ref = useRef(null);
  const station4Ref = useRef(null);
  const station5Ref = useRef(null);

  // Individual Chart Refs for Detailed Clinical PDF Export
  const agencyChartRef = useRef(null);
  const bmiChartRef = useRef(null);
  const bpChartRef = useRef(null);
  const wellnessScoresChartRef = useRef(null);
  const wellnessAtRiskChartRef = useRef(null);
  const medicalHistoryRef = useRef(null);
  const maintenanceDrugRef = useRef(null);
  const socialHistoryRef = useRef(null);
  const diagnosticsChartRef = useRef(null);
  const treatmentMedicationRef = useRef(null);
  const oralHygieneRef = useRef(null);
  const gumConditionRef = useRef(null);
  const visionSymptomsRef = useRef(null);

  /**
   * Generates a multi-page clinical PDF report capturing each chart individually
   * and appending a formatted clinical description below it.
   */
  const generatePDF = async () => {
    if (isGeneratingPDF) return;
    const selectedStations = parseStationInput(stationSelection);
    if (selectedStations.length === 0) return;

    setIsGeneratingPDF(true);

    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
      const margin = 14;
      const printableWidth = pageWidth - margin * 2; // 182 mm
      let currentY = margin;

      // Filter out external Google Fonts stylesheet links to prevent CORS DOM cloning errors
      const filter = (node) => {
        if (node.tagName === 'LINK' && node.href && node.href.includes('fonts.googleapis.com')) {
          return false;
        }
        return true;
      };

      const allReportSections = [
        {
          station: 1,
          ref: agencyChartRef,
          title: 'Station 1: Intake Volume by Agency / Office',
          desc: 'This chart illustrates the distribution of patient registrations across local provincial agencies, highlighting the primary sources of patient volume across the workforce.',
        },
        {
          station: 1,
          ref: bmiChartRef,
          title: 'Station 1: Asia-Pacific BMI Classification',
          desc: 'Nutritional status categorization according to WHO Western Pacific Region cutoffs evaluated during initial triage, providing an early indicator for metabolic and lifestyle disease risks.',
        },
        {
          station: 1,
          ref: bpChartRef,
          title: 'Station 1: Blood Pressure Stage Distribution',
          desc: 'AHA/ACC cardiovascular risk staging evaluated at registration triage to identify individuals presenting with Stage 1/2 Hypertension or hypertensive urgencies requiring immediate intervention.',
        },
        {
          station: 2,
          ref: wellnessScoresChartRef,
          title: 'Station 2: 7-Aspect Wellness Assessment (Average Scores)',
          desc: 'Average assessment scores across the 7 wellness aspects (Physical, Emotional, Psychological, Mental, Spiritual, Social, Financial) on a 0–100 scale, identifying population health benchmarks.',
        },
        {
          station: 2,
          ref: wellnessAtRiskChartRef,
          title: 'Station 2: At-Risk Patients by Wellness Aspect (Score < 50)',
          desc: 'Volume of screened individuals scoring below the critical threshold of 50 in specific wellness categories, highlighting priority targets for institutional counseling and support programs.',
        },
        {
          station: 3,
          ref: medicalHistoryRef,
          title: 'Station 3: Past & Recent Medical History',
          desc: 'Aggregation of self-reported and documented past medical conditions, grouped by standardized nomenclature.',
        },
        {
          station: 3,
          ref: maintenanceDrugRef,
          title: 'Station 3: Maintenance Medication Tracking',
          desc: 'Tracking of active maintenance pharmacotherapy utilized by the patient population to manage chronic conditions.',
        },
        {
          station: 3,
          ref: socialHistoryRef,
          title: 'Station 3: Lifestyle Risk & Social History',
          desc: 'Overview of patient social history and lifestyle risk factors, including tobacco use, physical activity levels, and alcohol consumption patterns to inform holistic screening.',
        },
        {
          station: 3,
          ref: diagnosticsChartRef,
          title: 'Station 3: Recommended Diagnostic & Laboratory Tests',
          desc: 'Volume and distribution of recommended clinical diagnostics, laboratory tests, and imaging ordered during patient consultations.',
        },
        {
          station: 3,
          ref: treatmentMedicationRef,
          title: 'Station 3: Top Prescribed Medications (Inventory Demand)',
          desc: 'Volume of generic medications prescribed during management and treatment, utilized to forecast pharmacy inventory requirements and high-demand therapeutics.',
        },
        {
          station: 4,
          ref: oralHygieneRef,
          title: 'Station 4: Oral Hygiene Status Distribution',
          desc: 'Categorical distribution of patient oral hygiene status based on plaque and calculus evaluation.',
        },
        {
          station: 4,
          ref: gumConditionRef,
          title: 'Station 4: Periodontal & Gum Condition Assessment',
          desc: 'Clinical assessment of periodontal health, tracking the prevalence of gingivitis and suspected periodontal disease.',
        },
        {
          station: 5,
          ref: visionSymptomsRef,
          title: 'Station 5: Prevalence of Reported Visual Symptoms',
          desc: 'Prevalence of self-reported visual symptoms, history of ocular problems, and difficulty in near and distant visual acuity to inform optometry and ophthalmology referrals.',
        },
      ];

      const reportSections = allReportSections.filter((section) =>
        selectedStations.includes(section.station)
      );

      // Master Report Header Banner
      doc.setFillColor(10, 89, 77); // Deep Teal (#0A594D)
      doc.rect(margin, currentY, printableWidth, 1.5, 'F');
      currentY += 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(10, 89, 77);
      doc.text('eHPR System — Integrated Clinic Pipeline Analytics', margin, currentY);
      currentY += 5.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      // Wrapped: with an office name in it the line can outrun the page.
      const scopeLines = doc.splitTextToSize(
        pdfScopeText({
          selectedStations,
          scope: reportFilter.label,
          generated: dateStr,
        }),
        printableWidth
      );
      doc.text(scopeLines, margin, currentY);
      currentY += 4.2 * scopeLines.length + 3.8;

      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.4);
      doc.line(margin, currentY, margin + printableWidth, currentY);
      currentY += 7;

      // Stations never scrolled to have only just mounted their charts for
      // this export; let them draw before capturing.
      await waitForChartsDrawn(reportSections.map((section) => section.ref.current).filter(Boolean));

      for (const [index, section] of reportSections.entries()) {
        setExportProgress({ done: index, total: reportSections.length });
        if (!section.ref?.current) continue;

        // Render DOM node to high-res JPEG natively with 0.9 compression
        const dataUrl = await toJpeg(section.ref.current, {
          quality: 0.9,
          cacheBust: true,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          filter,
        });

        const imgProps = doc.getImageProperties(dataUrl);
        const imgNaturalHeight = (imgProps.height * printableWidth) / imgProps.width;

        // Cap image height to 85mm to maintain elegant visual balance and room for text
        const maxImgHeight = 85;
        const imgHeight = Math.min(imgNaturalHeight, maxImgHeight);
        const imgWidth = (imgProps.width * imgHeight) / imgProps.height;
        const imgX = margin + (printableWidth - imgWidth) / 2;

        // Wrap description text to printable width
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const splitDesc = doc.splitTextToSize(section.desc, printableWidth);
        const descHeight = splitDesc.length * 4.2;

        const totalSectionHeight = 6 + imgHeight + 4 + descHeight + 8;

        // Vertical pagination: if card exceeds page boundary, trigger new page
        if (currentY + totalSectionHeight > pageHeight - margin - 8) {
          doc.addPage();
          currentY = margin + 4;
        }

        // 1. Chart Section Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(10, 89, 77); // Deep Teal
        doc.text(section.title, margin, currentY);
        currentY += 4.5;

        // 2. Chart Snapshot Image
        doc.addImage(dataUrl, 'JPEG', imgX, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 3.5;

        // 3. Clinical Description (Wrapped Text)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text(splitDesc, margin, currentY);
        currentY += descHeight + 7;

        // Subtle divider between sections if not at page bottom
        if (currentY < pageHeight - margin - 15) {
          doc.setDrawColor(241, 245, 249); // slate-100
          doc.setLineWidth(0.3);
          doc.line(margin, currentY - 3, margin + printableWidth, currentY - 3);
        }
      }
      setExportProgress({ done: reportSections.length, total: reportSections.length });

      // Apply Diagonal Security Watermark across all pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(230, 235, 233); // Faint grayish-teal
        doc.setFontSize(28);

        // Passing an array splits the text into two centered lines
        doc.text(
          ['eHPR System', 'Confidential Clinical Surveillance'],
          105, // Exact X center of A4
          148.5, // Exact Y center of A4
          {
            angle: 45,
            align: 'center',
            baseline: 'middle',
          }
        );
      }

      // Add Page Numbers Footer
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
          `eHPR System — Confidential Clinical Surveillance  |  Page ${p} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
      }

      const fileDate = new Date().toISOString().split('T')[0];
      const stationFileSuffix =
        selectedStations.length === 5
          ? 'All_Stations'
          : `Stations_${selectedStations.join('_')}`;
      doc.save(`eHPR_Clinical_Analytics_Report_${stationFileSuffix}_${fileDate}.pdf`);

      setIsDownloadModalOpen(false);
      setStationSelection('');
    } catch (error) {
      console.error('Failed to generate PDF report:', error);
    } finally {
      setIsGeneratingPDF(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8 font-sans">
      <div className="mx-auto max-w-7xl">
        {/* ==========================================
            MASTER DASHBOARD HEADER
        =========================================== */}
        <div className="mb-8 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-3 w-3 rounded-full bg-[#0A594D]" />
            <p className="text-xs font-bold uppercase tracking-wider text-[#0A594D]">
              Integrated EHR Surveillance
            </p>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Clinic Pipeline Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Master clinical and graphical reports spanning Station 1 (Registration) through Station 5 (Vision Screening).
          </p>
        </div>

        {/* Quick Station Navigation & Master PDF Export Sticky Bar */}
        <div
          ref={stickyBarRef}
          className="sticky top-3 z-30 mb-8 flex flex-wrap items-center gap-3 rounded-xl bg-white/95 p-2.5 shadow-sm border border-slate-200/80 backdrop-blur-md"
        >
          {/* Left: Quick Jump Navigation Links */}
          <QuickJumpNav stations={STATIONS} stickyBarRef={stickyBarRef} />

          {/* Middle: period + office for the sections on live data. Below xl it
              takes a row of its own, under the station chips and the button. */}
          <div className="order-last w-full xl:order-none xl:w-auto">
            <ReportFilterBar filter={reportFilter} />
          </div>

          {/* Right: Master Download PDF Report Action Button -- icon-only on phones */}
          <Button
            type="button"
            size="md"
            onClick={() => setIsDownloadModalOpen(true)}
            className="shrink-0"
            title="Download PDF Report"
          >
            <Download size={16} aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Download PDF Report</span>
          </Button>
        </div>

        {/* ==========================================
            STATION 1: REGISTRATION & VITALS SECTION
        =========================================== */}
        <div id="station-1" ref={station1Ref}>
          <Station1HealthSection
            params={reportFilter.params}
            chartRefs={{ byOffice: agencyChartRef, bmi: bmiChartRef, bp: bpChartRef }}
            exporting={isGeneratingPDF}
          />
        </div>

        {/* ==========================================
            STATION 2: WELLNESS ASSESSMENT SECTION
        =========================================== */}
        <div id="station-2" ref={station2Ref}>
          <Station2HealthSection
            params={reportFilter.params}
            chartRefs={{ scores: wellnessScoresChartRef, atRisk: wellnessAtRiskChartRef }}
            exporting={isGeneratingPDF}
          />
        </div>

        {/* ==========================================
            STATION 3: CONSULTATION SECTION
        =========================================== */}
        <div id="station-3" ref={station3Ref}>
          <Station3HealthSection
            params={reportFilter.params}
            chartRefs={{
              conditions: medicalHistoryRef,
              maintenance: maintenanceDrugRef,
              social: socialHistoryRef,
              labs: diagnosticsChartRef,
              medications: treatmentMedicationRef,
            }}
            exporting={isGeneratingPDF}
          />
        </div>

        {/* ==========================================
            STATION 4: DENTAL ASSESSMENT SECTION
        =========================================== */}
        <div id="station-4" ref={station4Ref}>
          <Station4HealthSection
            params={reportFilter.params}
            chartRefs={{ hygiene: oralHygieneRef, gum: gumConditionRef }}
            exporting={isGeneratingPDF}
          />
        </div>

        {/* ==========================================
            STATION 5: VISION SCREENING SECTION
        =========================================== */}
        <div id="station-5" ref={station5Ref}>
          <Station5HealthSection
            params={reportFilter.params}
            chartRefs={{ symptoms: visionSymptomsRef }}
            exporting={isGeneratingPDF}
          />
        </div>

        {/* Custom Report Download Modal */}
        {/* Escape and backdrop clicks are ignored mid-export so the PDF capture
            isn't left running behind a closed modal. */}
        <Modal
          open={isDownloadModalOpen}
          title="Download Custom Report"
          onClose={() => {
            if (!isGeneratingPDF) setIsDownloadModalOpen(false);
          }}
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setIsDownloadModalOpen(false)}
                disabled={isGeneratingPDF}
              >
                Cancel
              </Button>
              <Button type="button" size="md" onClick={generatePDF} disabled={isGeneratingPDF}>
                {isGeneratingPDF ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  'Generate PDF'
                )}
              </Button>
            </>
          }
        >
          <p className="mb-4 text-ink-500">
            Enter the stations you want to include in the PDF. Use commas for specific stations (e.g., <strong>1, 3, 5</strong>) or hyphens for a range (e.g., <strong>1-4</strong>). Leave blank to download all.
          </p>
          <Input
            type="text"
            placeholder="e.g. 1-3, 5"
            value={stationSelection}
            onChange={(e) => setStationSelection(e.target.value)}
            disabled={isGeneratingPDF}
            className="w-full"
          />
          {exportProgress && <ExportProgress done={exportProgress.done} total={exportProgress.total} />}
        </Modal>
      </div>
    </div>
  );
}
