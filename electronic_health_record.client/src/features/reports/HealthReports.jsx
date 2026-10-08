import { useState, useRef } from 'react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import {
  Users,
  Clock,
  ShieldCheck,
  UserCheck,
  Activity,
  HeartPulse,
  Weight,
  Sparkles,
  Stethoscope,
  Pill,
  FlaskConical,
  TriangleAlert,
  Smile,
  ShieldAlert,
  Wrench,
  Eye,
  Glasses,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Loader2,
} from 'lucide-react';
import StationReportSection from './StationReportSection';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from 'recharts';

const THEME = {
  deepTeal: '#0A594D',
  vibrantTeal: '#37AF9B',
  accentBlue: '#0EA5E9',
  accentAmber: '#F59E0B',
  accentEmerald: '#10B981',
  accentRose: '#EF4444',
  accentViolet: '#8B5CF6',
  accentSlate: '#64748B',
};

// Tooltip for Social History Recharts components
function SocialChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const color = item.payload?.color || item.color || '#0A594D';
  const name = item.payload?.name || label || item.name;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-md">
      <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-0.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <span>{name}</span>
      </div>
      <p className="text-slate-600">
        Count: <span className="font-semibold text-slate-900 tabular-nums">{item.value}</span>
        {item.payload?.pct !== undefined && (
          <span className="text-slate-400 ml-1">({item.payload.pct}%)</span>
        )}
      </p>
    </div>
  );
}

// Tooltip for Diagnostic Test orders
function DiagnosticTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-md">
      <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
        <span className="h-2.5 w-2.5 rounded-full bg-[#0A594D]" />
        <span>{item.name}</span>
        {item.category && (
          <span className="text-[10px] text-slate-400 font-normal">({item.category})</span>
        )}
      </div>
      <p className="text-slate-600">
        Orders: <span className="font-semibold text-slate-900 tabular-nums">{item.count ?? item.value}</span>
      </p>
    </div>
  );
}

// Tooltip for Top Prescribed Medication orders
function MedicationDemandTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  const itemColor = item.color || '#0A594D';
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-md">
      <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: itemColor }} />
        <span>{item.name}</span>
      </div>
      <p className="text-slate-600">
        Prescriptions: <span className="font-semibold text-slate-900 tabular-nums">{item.count ?? item.value}</span>
      </p>
    </div>
  );
}

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

  // Individual Section Container Refs
  const station1Ref = useRef(null);
  const station2Ref = useRef(null);
  const station3Ref = useRef(null);
  const station4Ref = useRef(null);
  const station5Ref = useRef(null);

  // Individual Chart Refs for Detailed Clinical PDF Export
  const agencyChartRef = useRef(null);
  const classificationChartRef = useRef(null);
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
          ref: classificationChartRef,
          title: 'Station 1: Patient Classification Breakdown',
          desc: 'Granular breakdown of patient employment status (Permanent, Contract of Service, Job Order, Casual) to assist in administrative tracking, eligibility verification, and health resource planning.',
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
      const stationScopeText =
        selectedStations.length === 5
          ? 'Stations 1–5'
          : `Station(s): ${selectedStations.join(', ')}`;
      doc.text(
        `Official Clinical Surveillance Report  |  Scope: All Provincial Offices & Departments (${stationScopeText})  |  Generated: ${dateStr}`,
        margin,
        currentY
      );
      currentY += 8;

      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.4);
      doc.line(margin, currentY, margin + printableWidth, currentY);
      currentY += 7;

      for (const section of reportSections) {
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
    }
  };

  // ==========================================
  // STATION 1: REGISTRATION & VITALS DATA
  // ==========================================
  const s1Total = 388;
  const s1Kpis = [
    {
      label: 'Patients Registered & Screened',
      value: s1Total,
      badgeTone: 'positive',
      icon: Users,
    },
    {
      label: 'Healthy Normal BMI',
      value: '35.7%',
      badgeTone: 'positive',
      icon: Weight,
    },
    {
      label: 'High BP Flagged (Stage 1+)',
      value: '44.6%',
      badgeTone: 'alert',
      icon: HeartPulse,
    },
  ];

  // 1. Explicit, un-grouped list of all local provincial agencies
  const s1Chart1 = {
    type: 'bar',
    title: 'Intake Volume by Agency / Office',
    subtitle: 'Registrations across all local provincial agencies (Full Breakdown)',
    tag: 'All Agencies',
    barColor: THEME.deepTeal,
    scrollable: true,
    data: [
      { name: 'Prov. Health Office (PHO)', value: 58, color: THEME.deepTeal },
      { name: 'Prov. Engineering Office (PEO)', value: 44, color: THEME.vibrantTeal },
      { name: 'Prov. Governor’s Office (PGO)', value: 38, color: THEME.accentBlue },
      { name: 'Disaster Risk Reduction (PDRRMO)', value: 31, color: '#14B8A6' },
      { name: 'Social Welfare & Dev (PSWDO)', value: 28, color: THEME.accentAmber },
      { name: 'Agriculture & Veterinary (PAVO)', value: 26, color: '#10B981' },
      { name: 'Assessment & Treasury (PASTO)', value: 24, color: '#0284C7' },
      { name: 'Provincial Budget Office', value: 22, color: '#F97316' },
      { name: 'Correctional & Security (PCSMO)', value: 20, color: '#6366F1' },
      { name: 'Environment & Natural Resources', value: 18, color: '#059669' },
      { name: 'General Services Office (PGSO)', value: 16, color: '#D97706' },
      { name: 'Planning & Development (PPDO)', value: 15, color: '#8B5CF6' },
      { name: 'Provincial Accounting Office', value: 14, color: '#EC4899' },
      { name: 'D.O.P. Memorial Hospital', value: 13, color: '#0D9488' },
      { name: 'Provincial Legal Office', value: 11, color: '#7C3AED' },
      { name: 'Human Resource Mgt (PHRMO)', value: 9, color: '#64748B' },
    ],
  };

  // 2. Patient Classification Breakdown: 4 Core Employment Categories
  const s1Chart2 = {
    type: 'donut',
    title: 'Patient Classification Breakdown',
    subtitle: 'Distribution across official public sector employment categories',
    tag: 'Employment Status',
    data: [
      {
        name: 'Permanent',
        value: 145,
        pct: 37.4,
        color: '#0A594D', // Primary Deep Teal
        desc: 'Permanent plantilla civil service personnel',
      },
      {
        name: 'Contract of Service (COS)',
        value: 98,
        pct: 25.3,
        color: '#37AF9B', // Vibrant Teal
        desc: 'Contract of service project appointments',
      },
      {
        name: 'Job Order (JO)',
        value: 112,
        pct: 28.9,
        color: '#F59E0B', // Amber / Gold
        desc: 'Job order operational & support workforce',
      },
      {
        name: 'Casual',
        value: 33,
        pct: 8.5,
        color: '#64748B', // Soft Slate / Blue-gray
        desc: 'Temporary / casual appointment employees',
      },
    ],
  };

  // 3. Asia-Pacific BMI Distribution (Transferred to Station 1)
  const s1Chart3 = {
    type: 'bar',
    title: 'Asia-Pacific BMI Classification',
    subtitle: 'WHO Western Pacific Region cutoff metrics evaluated during registration triage',
    tag: 'Nutritional Triage',
    data: [
      { name: 'Underweight', value: 21, pct: 5.4, color: THEME.accentAmber, subtext: '< 18.5 kg/m²' },
      { name: 'Normal', value: 138, pct: 35.7, color: THEME.accentEmerald, subtext: '18.5 – 22.9 kg/m²' },
      { name: 'Overweight', value: 95, pct: 24.5, color: THEME.accentAmber, subtext: '23.0 – 24.9 kg/m²' },
      { name: 'Obese Class I', value: 97, pct: 25.0, color: THEME.accentRose, subtext: '25.0 – 29.9 kg/m²' },
      { name: 'Obese Class II', value: 37, pct: 9.4, color: '#991B1B', subtext: '≥ 30.0 kg/m²' },
    ],
  };

  // 4. Blood Pressure Stage Distribution (Transferred to Station 1)
  const s1Chart4 = {
    type: 'donut',
    title: 'Blood Pressure Stage Distribution',
    subtitle: 'ACC/AHA 2017 Guidelines measured during intake screening',
    tag: 'Cardiovascular Risk',
    data: [
      { name: 'Normal (<120/<80)', value: 155, pct: 39.9, color: THEME.accentEmerald, desc: 'Optimal cardiovascular status' },
      { name: 'Elevated (120-129)', value: 60, pct: 15.5, color: THEME.accentAmber, desc: 'Lifestyle intervention indicated' },
      { name: 'Stage 1 HTN', value: 99, pct: 25.5, color: '#EA580C', desc: '130-139 / 80-89 mmHg' },
      { name: 'Stage 2 HTN', value: 62, pct: 16.0, color: THEME.accentRose, desc: '≥ 140 / ≥ 90 mmHg' },
      { name: 'Hypertensive Crisis', value: 12, pct: 3.1, color: '#7F1D1D', desc: '> 180 and/or > 120 mmHg' },
    ],
  };

  // ==========================================
  // STATION 2: STRICTLY 7-ASPECT WELLNESS DATA
  // ==========================================
  const s2Total = 336;
  const s2Kpis = [
    {
      label: 'Total Assessments Completed',
      value: s2Total,
      badgeTone: 'positive',
      icon: Activity,
    },
    {
      label: 'Average Global Wellness Score',
      value: '74.6 / 100',
      badgeTone: 'positive',
      icon: Sparkles,
    },
    {
      label: 'Highest Scoring Aspect',
      value: 'Physical (88 pts)',
      badgeTone: 'positive',
      icon: CheckCircle2,
    },
    {
      label: 'Lowest Scoring Aspect',
      value: 'Financial (60 pts)',
      badgeTone: 'warning',
      icon: AlertCircle,
    },
  ];

  // Chart 1: Average scores across all 7 dimensions of wellness
  const s2Chart1 = {
    type: 'bar',
    title: '7 Aspects of Wellness (Average Assessment Scores)',
    subtitle: 'Holistic population well-being evaluation across 7 core dimensions (0–100 Scale)',
    tag: 'Wellness Dimensions',
    domain: [0, 100],
    ticks: [0, 20, 40, 60, 80, 100],
    yUnit: ' pts',
    data: [
      { name: 'Spiritual', value: 82, color: THEME.accentEmerald, subtext: 'High purpose & values' },
      { name: 'Psychological', value: 74, color: THEME.vibrantTeal, subtext: 'Emotional resilience' },
      { name: 'Mental', value: 68, color: THEME.accentBlue, subtext: 'Work stress & cognitive load' },
      { name: 'Emotional', value: 71, color: '#14B8A6', subtext: 'Interpersonal balance' },
      { name: 'Physical', value: 88, color: THEME.deepTeal, subtext: 'Highest scoring dimension' },
      { name: 'Financial', value: 60, color: THEME.accentAmber, subtext: 'Lowest scoring dimension' },
      { name: 'Social', value: 79, color: '#8B5CF6', subtext: 'Team & community bonding' },
    ],
  };

  // Chart 2: At-Risk patients scoring critically low (< 50) per aspect
  const s2Chart2 = {
    type: 'horizontal-bar',
    title: 'At-Risk Patients by Wellness Aspect (Score < 50)',
    subtitle: 'Number of surveyed individuals scoring critically low in each respective category',
    tag: 'Priority Interventions',
    data: [
      { name: 'Financial Wellness', value: 68, color: THEME.accentRose, subtext: 'Economic distress & debt concerns' },
      { name: 'Mental Well-being', value: 42, color: '#F97316', subtext: 'Chronic fatigue & cognitive strain' },
      { name: 'Emotional Health', value: 36, color: THEME.accentAmber, subtext: 'Stress management deficits' },
      { name: 'Psychological', value: 28, color: '#EAB308', subtext: 'Anxiety & adjustment strain' },
      { name: 'Social Wellness', value: 22, color: '#8B5CF6', subtext: 'Workplace & community isolation' },
      { name: 'Spiritual Health', value: 14, color: '#64748B', subtext: 'Value misalignment & burnout' },
      { name: 'Physical Wellness', value: 11, color: '#0D9488', subtext: 'Severe mobility / vitality limits' },
    ],
  };

  // ==========================================
  // STATION 3: CONSULTATION DATA
  // ==========================================
  const s3Total = 295;
  const s3Kpis = [
    {
      label: 'Consultations Completed',
      value: s3Total,
      badgeTone: 'positive',
      icon: Stethoscope,
    },
    {
      label: 'Prescription Issuance Rate',
      value: '67.8%',
      badgeTone: 'positive',
      icon: Pill,
    },
    {
      label: 'Diagnostic Labs Ordered',
      value: '42.0%',
      badgeTone: 'warning',
      icon: FlaskConical,
    },
    {
      label: 'Urgent Referrals Flagged',
      value: 19,
      badgeTone: 'alert',
      icon: TriangleAlert,
    },
  ];

  // Mock raw patient histories from free-text intake forms (varying casing & spacing)
  const MOCK_PATIENT_HISTORIES = [
    // Hypertension cases
    { condition: 'hypertension', drug: 'losartan' },
    { condition: 'HYPERTENSION', drug: 'LOSARTAN' },
    { condition: 'Hypertension', drug: 'Amlodipine' },
    { condition: 'hypertension ', drug: 'amlodipine' },
    { condition: 'HYPERTENSION', drug: 'Losartan' },
    { condition: 'hypertension', drug: 'losartan' },
    { condition: 'Hypertension', drug: 'Amlodipine' },
    { condition: 'hypertension', drug: 'Amlodipine' },
    { condition: 'HYPERTENSION', drug: 'losartan' },
    { condition: 'Hypertension', drug: 'Losartan' },

    // Diabetes cases
    { condition: 'diabetes', drug: 'metformin' },
    { condition: 'DIABETES', drug: 'METFORMIN' },
    { condition: 'Diabetes', drug: 'Metformin' },
    { condition: 'diabetes', drug: 'metformin' },
    { condition: 'DIABETES', drug: 'Metformin' },
    { condition: 'Diabetes', drug: 'metformin' },
    { condition: 'diabetes', drug: 'glimepiride' },

    // Asthma cases
    { condition: 'asthma', drug: 'salbutamol' },
    { condition: 'ASTHMA', drug: 'SALBUTAMOL' },
    { condition: 'Asthma', drug: 'Salbutamol' },
    { condition: 'asthma', drug: 'salbutamol' },
    { condition: 'Asthma', drug: 'budesonide' },

    // Dyslipidemia cases
    { condition: 'dyslipidemia', drug: 'atorvastatin' },
    { condition: 'DYSLIPIDEMIA', drug: 'ATORVASTATIN' },
    { condition: 'Dyslipidemia', drug: 'Atorvastatin' },
    { condition: 'dyslipidemia', drug: 'simvastatin' },

    // Arthritis cases
    { condition: 'arthritis', drug: 'celecoxib' },
    { condition: 'ARTHRITIS', drug: 'CELECOXIB' },
    { condition: 'Arthritis', drug: 'Celecoxib' },

    // GERD cases
    { condition: 'gerd', drug: 'omeprazole' },
    { condition: 'GERD', drug: 'OMEPRAZOLE' },
    { condition: 'Gerd', drug: 'Omeprazole' },

    // Allergic Rhinitis cases
    { condition: 'allergic rhinitis', drug: 'cetirizine' },
    { condition: 'ALLERGIC RHINITIS', drug: 'CETIRIZINE' },
  ];

  /**
   * Case-insensitive aggregation utility for free-text medical entries using Array.prototype.reduce.
   * Standardizes raw text by trimming whitespace, converting to lowercase for grouping,
   * and capitalizing the first letter for elegant clinical display.
   * Outputs an aggregated array with { name: 'String', count: Number, value: Number }
   */
  const aggregateFreeText = (rawData, key, multiplier = 1) => {
    if (!Array.isArray(rawData)) return [];

    const grouped = rawData.reduce((acc, item) => {
      const rawValue = item?.[key];
      if (!rawValue || typeof rawValue !== 'string') return acc;

      const trimmed = rawValue.trim();
      if (!trimmed) return acc;

      const normalizedKey = trimmed.toLowerCase();
      // Capitalize first letter for display (preserving known medical abbreviations)
      const displayName =
        normalizedKey === 'gerd'
          ? 'GERD'
          : normalizedKey.charAt(0).toUpperCase() + normalizedKey.slice(1);

      if (!acc[normalizedKey]) {
        acc[normalizedKey] = {
          name: displayName,
          rawCount: 0,
        };
      }
      acc[normalizedKey].rawCount += 1;
      return acc;
    }, {});

    return Object.values(grouped)
      .map((item) => {
        const finalCount = Math.round(item.rawCount * multiplier);
        return {
          name: item.name,
          count: finalCount,
          value: finalCount,
        };
      })
      .sort((a, b) => b.count - a.count);
  };

  const CONDITION_PALETTE = [
    THEME.deepTeal,
    THEME.vibrantTeal,
    THEME.accentBlue,
    THEME.accentAmber,
    '#EC4899',
    '#8B5CF6',
    THEME.accentEmerald,
  ];

  const aggregatedConditions = aggregateFreeText(
    MOCK_PATIENT_HISTORIES,
    'condition',
    12
  ).map((entry, idx) => ({
    ...entry,
    color: CONDITION_PALETTE[idx % CONDITION_PALETTE.length],
  }));

  const DRUG_PALETTE = [
    THEME.deepTeal,
    THEME.vibrantTeal,
    THEME.accentBlue,
    '#14B8A6',
    THEME.accentAmber,
    '#EC4899',
    '#8B5CF6',
    THEME.accentEmerald,
  ];

  const aggregatedDrugs = aggregateFreeText(
    MOCK_PATIENT_HISTORIES,
    'drug',
    12
  ).map((entry, idx) => ({
    ...entry,
    color: DRUG_PALETTE[idx % DRUG_PALETTE.length],
  }));

  // Chart 1: Past Medical History (Horizontal Bar Chart)
  const s3Chart1 = {
    type: 'horizontal-bar',
    layout: 'vertical',
    title: 'Past & Recent Medical History',
    subtitle: 'Standardized case-insensitive aggregation of patient self-reported medical conditions',
    tag: 'Medical History',
    barColor: THEME.deepTeal,
    yAxisWidth: 120,
    data: aggregatedConditions,
  };

  // Chart 2: Maintenance Medication Tracking (Line Chart)
  const s3Chart2 = {
    type: 'line',
    title: 'Maintenance Medication Tracking',
    subtitle: 'Active chronic pharmacotherapy utilization tracked across patient intake records',
    tag: 'Pharmacotherapy',
    lineColor: THEME.deepTeal,
    data: aggregatedDrugs,
  };

  // ------------------------------------------
  // STATION 3: LIFESTYLE & SOCIAL HISTORY DATA
  // ------------------------------------------
  // Social History 1: Tobacco & Smoking Profile
  const smokingData = [
    { name: 'Non-Smoker', value: 208, pct: 70.5, color: THEME.deepTeal },
    { name: 'Cigarettes Only', value: 44, pct: 14.9, color: THEME.accentAmber },
    { name: 'E-Cigarette / Vape', value: 28, pct: 9.5, color: THEME.vibrantTeal },
  ];

  // Social History 2: Exercise Free-Text Entries (Aggregated with case-insensitive logic)
  const MOCK_EXERCISE_INPUTS = [
    { exercise: 'Jogging' },
    { exercise: 'jogging' },
    { exercise: 'JOGGING' },
    { exercise: 'Walking' },
    { exercise: 'walking' },
    { exercise: 'WALKING' },
    { exercise: 'walking' },
    { exercise: 'Basketball' },
    { exercise: 'basketball' },
    { exercise: 'BASKETBALL' },
    { exercise: 'Cycling' },
    { exercise: 'cycling' },
    { exercise: 'Cycling' },
    { exercise: 'Badminton' },
    { exercise: 'badminton' },
    { exercise: 'Swimming' },
    { exercise: 'swimming' },
    { exercise: 'Gym / Lifting' },
    { exercise: 'gym / lifting' },
    { exercise: 'Zumba' },
    { exercise: 'zumba' },
  ];

  const EXERCISE_PALETTE = [
    THEME.deepTeal,
    THEME.vibrantTeal,
    THEME.accentBlue,
    THEME.accentAmber,
    '#8B5CF6',
  ];

  const exerciseData = aggregateFreeText(
    MOCK_EXERCISE_INPUTS,
    'exercise',
    8
  ).slice(0, 5).map((item, idx) => ({
    ...item,
    color: EXERCISE_PALETTE[idx % EXERCISE_PALETTE.length],
  }));

  // Social History 3: Alcohol Consumption Frequency
  const alcoholData = [
    { name: 'Non-Drinker', value: 152, pct: 51.5, color: THEME.deepTeal },
    { name: 'Occasional', value: 98, pct: 33.2, color: THEME.vibrantTeal },
    { name: 'Weekly', value: 36, pct: 12.2, color: THEME.accentAmber },
    { name: 'Frequent/Daily', value: 9, pct: 3.1, color: THEME.accentRose },
  ];

  // Recommended Diagnostic & Laboratory Tests (Strictly Top 10 by order volume)
  const DIAGNOSTIC_TESTS_RAW = [
    { name: 'Lipid Profile', count: 88, category: 'Clinical Chemistry' },
    { name: 'CBC', count: 82, category: 'Hematology' },
    { name: 'FBS', count: 76, category: 'Clinical Chemistry' },
    { name: 'U/A (Urinalysis)', count: 68, category: 'Clinical Microscopy' },
    { name: 'Crea (Creatinine)', count: 54, category: 'Renal Function' },
    { name: 'Chest Xray', count: 48, category: 'Radiology' },
    { name: 'SGPT/SGOT', count: 42, category: 'Hepatic Enzymes' },
    { name: '12-Lead ECG', count: 38, category: 'Cardiology' },
    { name: 'HBA1c', count: 26, category: 'Glycemic Control' },
    { name: 'SUA (Uric Acid)', count: 22, category: 'Clinical Chemistry' },
    { name: 'BUN', count: 18, category: 'Renal Function' },
    { name: 'Electrolytes (NaK)', count: 15, category: 'Clinical Chemistry' },
  ];

  const top10Diagnostics = DIAGNOSTIC_TESTS_RAW
    .map((item) => ({ ...item, value: item.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Prescribed Medications from Management / Treatment Form (Case-Insensitive Aggregation)
  const MOCK_PRESCRIBED_MEDICATIONS = [
    // Losartan
    { medication: 'Losartan' },
    { medication: 'losartan' },
    { medication: 'LOSARTAN' },
    { medication: 'Losartan' },
    { medication: 'losartan' },
    { medication: 'Losartan' },
    { medication: 'LOSARTAN' },
    { medication: 'losartan' },
    { medication: ' Losartan ' },

    // Amlodipine
    { medication: 'Amlodipine' },
    { medication: 'amlodipine' },
    { medication: 'AMLODIPINE' },
    { medication: 'Amlodipine' },
    { medication: 'amlodipine' },
    { medication: 'Amlodipine' },
    { medication: 'AMLODIPINE' },
    { medication: 'amlodipine' },

    // Metformin
    { medication: 'Metformin' },
    { medication: 'metformin' },
    { medication: 'METFORMIN' },
    { medication: 'Metformin' },
    { medication: 'metformin' },
    { medication: 'METFORMIN' },
    { medication: 'Metformin' },

    // Paracetamol
    { medication: 'Paracetamol' },
    { medication: 'paracetamol' },
    { medication: 'PARACETAMOL' },
    { medication: 'Paracetamol' },
    { medication: 'paracetamol' },
    { medication: 'PARACETAMOL' },

    // Amoxicillin
    { medication: 'Amoxicillin' },
    { medication: 'amoxicillin' },
    { medication: 'AMOXICILLIN' },
    { medication: 'Amoxicillin' },
    { medication: 'amoxicillin' },

    // Omeprazole
    { medication: 'Omeprazole' },
    { medication: 'omeprazole' },
    { medication: 'OMEPRAZOLE' },
    { medication: 'Omeprazole' },

    // Cetirizine
    { medication: 'Cetirizine' },
    { medication: 'cetirizine' },
    { medication: 'CETIRIZINE' },
    { medication: 'Cetirizine' },

    // Salbutamol
    { medication: 'Salbutamol' },
    { medication: 'salbutamol' },
    { medication: 'SALBUTAMOL' },

    // Atorvastatin
    { medication: 'Atorvastatin' },
    { medication: 'atorvastatin' },
    { medication: 'ATORVASTATIN' },

    // Mefenamic Acid
    { medication: 'Mefenamic Acid' },
    { medication: 'mefenamic acid' },
    { medication: 'MEFENAMIC ACID' },

    // Additional low frequency entries to ensure strictly Top 10 slicing
    { medication: 'Ciprofloxacin' },
    { medication: 'ciprofloxacin' },
    { medication: 'Ascorbic Acid' },
    { medication: 'Co-amoxiclav' },
  ];

  const top10PrescribedMedications = aggregateFreeText(
    MOCK_PRESCRIBED_MEDICATIONS,
    'medication',
    9
  )
    .slice(0, 10)
    .map((item, idx) => ({
      ...item,
      color: idx < 3 ? THEME.deepTeal : idx < 6 ? THEME.vibrantTeal : '#0EA5E9',
    }));

  // ==========================================
  // STATION 4: DENTAL ASSESSMENT DATA
  // ==========================================
  const s4Total = 276;
  const dentalKpis = [
    {
      label: 'DENTAL SCREENINGS',
      value: s4Total,
      badgeTone: 'positive',
      icon: Smile,
    },
    {
      label: 'ACTIVE DENTAL CARIES RATE',
      value: '57.2%',
      badgeTone: 'alert',
      icon: ShieldAlert,
    },
    {
      label: 'PERIODONTAL / GINGIVITIS',
      value: '33.7%',
      badgeTone: 'warning',
      icon: Activity,
    },
    {
      label: 'RESTORATIVE & EXTRACTION NEEDED',
      value: 114,
      badgeTone: 'warning',
      icon: Wrench,
    },
  ];

  const oralHygieneData = [
    { name: 'Good', value: 102, pct: 37.0, color: THEME.accentEmerald },
    { name: 'Fair', value: 118, pct: 42.8, color: THEME.accentAmber },
    { name: 'Poor', value: 56, pct: 20.3, color: THEME.accentRose },
  ];

  const gumConditionData = [
    { name: 'Healthy', value: 142, pct: 51.4, color: THEME.accentEmerald },
    { name: 'Gingivitis', value: 93, pct: 33.7, color: THEME.accentAmber },
    { name: 'Suspected Periodontal Problem', value: 41, pct: 14.9, color: THEME.accentRose },
  ];

  // ==========================================
  // STATION 5: VISION SCREENING DATA
  // ==========================================
  const s5Total = 268;
  const visionKpis = [
    {
      label: 'VISION SCREENINGS PERFORMED',
      value: s5Total,
      badgeTone: 'positive',
      icon: Eye,
    },
    {
      label: 'REPORTED EYE PAIN / DISCOMFORT',
      value: '14.2%',
      badgeTone: 'alert',
      icon: AlertCircle,
    },
    {
      label: 'NEAR VISION DIFFICULTY (PRESBYOPIA RISK)',
      value: 92,
      badgeTone: 'warning',
      icon: Glasses,
    },
    {
      label: 'DISTANT VISION DIFFICULTY (MYOPIA RISK)',
      value: 78,
      badgeTone: 'warning',
      icon: Activity,
    },
  ];

  const visionSymptomsData = [
    { name: 'History of Eye Problems', value: 52, yesCount: 52, pct: 19.4, color: THEME.deepTeal },
    { name: 'Eye Pain / Discomfort', value: 38, yesCount: 38, pct: 14.2, color: THEME.accentRose },
    { name: 'Blurred Vision', value: 112, yesCount: 112, pct: 41.8, color: THEME.accentAmber },
    { name: 'Difficulty Seeing Near Objects', value: 92, yesCount: 92, pct: 34.3, color: THEME.vibrantTeal },
    { name: 'Difficulty Seeing Distant Objects', value: 78, yesCount: 78, pct: 29.1, color: '#0EA5E9' },
  ];

  // Quick navigation anchor scroll helper
  const scrollToStation = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            <span className="h-3 w-3 rounded-full bg-[#0A594D] animate-pulse" />
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
        <div className="sticky top-3 z-30 mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white/95 p-2.5 shadow-sm border border-slate-200/80 backdrop-blur-md">
          {/* Left: Quick Jump Navigation Links */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-6">
            <span className="text-xs font-semibold text-slate-400 px-1 uppercase tracking-wider">
              Quick Jump:
            </span>
            {[
              { id: 'station-1', label: '1. Registration & Vitals' },
              { id: 'station-2', label: '2. Wellness Assessment' },
              { id: 'station-3', label: '3. Consultation' },
              { id: 'station-4', label: '4. Dental' },
              { id: 'station-5', label: '5. Vision' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => scrollToStation(st.id)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-[#0A594D]/10 hover:text-[#0A594D] active:scale-95 cursor-pointer"
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Right: Master Download PDF Report Action Button */}
          <button
            type="button"
            onClick={() => setIsDownloadModalOpen(true)}
            className="flex items-center gap-2 bg-[#0A594D] hover:bg-[#07463c] text-white px-4 py-2 rounded-md font-medium text-xs sm:text-sm transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <Download size={16} />
            <span>Download PDF Report</span>
          </button>
        </div>

        {/* ==========================================
            STATION 1: REGISTRATION & VITALS SECTION
        =========================================== */}
        <div id="station-1" ref={station1Ref}>
          <StationReportSection
            stationNumber={1}
            stationName="Registration & Vitals"
            stationSubtitle="Patient intake volume, triage vital signs, BMI classification, and cardiovascular staging"
            kpis={s1Kpis}
            chartData1={s1Chart1}
            chartData2={s1Chart2}
            chartData3={s1Chart3}
            chartData4={s1Chart4}
            chart1Ref={agencyChartRef}
            chart2Ref={classificationChartRef}
            chart3Ref={bmiChartRef}
            chart4Ref={bpChartRef}
            stacked={true}
          />
        </div>

        {/* ==========================================
            STATION 2: WELLNESS ASSESSMENT SECTION
        =========================================== */}
        <div id="station-2" ref={station2Ref}>
          <StationReportSection
            stationNumber={2}
            stationName="Wellness Assessment"
            stationSubtitle="Holistic screening across the 7 core dimensions of employee and community wellness"
            kpis={s2Kpis}
            chartData1={s2Chart1}
            chartData2={s2Chart2}
            chart1Ref={wellnessScoresChartRef}
            chart2Ref={wellnessAtRiskChartRef}
            stacked={true}
          />
        </div>

        {/* ==========================================
            STATION 3: CONSULTATION SECTION
        =========================================== */}
        <div id="station-3" ref={station3Ref}>
          <StationReportSection
            stationNumber={3}
            stationName="Consultation"
            stationSubtitle="Attending physician impressions, primary clinical morbidity, pharmacotherapy, and care plan outcomes"
            kpis={s3Kpis}
            chartData1={s3Chart1}
            chartData2={s3Chart2}
            chart1Ref={medicalHistoryRef}
            chart2Ref={maintenanceDrugRef}
            stacked={true}
          >
            {/* Lifestyle Risk & Social History (Nested inside Station 3 Master Card) */}
            <div
              ref={socialHistoryRef}
              className="w-full rounded-xl border border-slate-100 bg-slate-50/40 p-5 flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4 border-b border-slate-200/70 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Lifestyle Risk & Social History
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Patient tobacco use, physical activity engagement, and alcohol intake distribution
                  </p>
                </div>
                <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 shadow-2xs">
                  Social Risk Profile
                </span>
              </div>

              {/* 3-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1: Tobacco & Smoking */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200/70 bg-white p-4 shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-900">Tobacco & Smoking Profile</h4>
                      <span className="rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        Nicotine Intake
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Cigarettes vs. electronic vaping distribution</p>
                    <div className="w-full h-52 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={smokingData}
                            cx="50%"
                            cy="50%"
                            innerRadius={46}
                            outerRadius={72}
                            paddingAngle={3}
                            dataKey="value"
                            nameKey="name"
                          >
                            {smokingData.map((entry, idx) => (
                              <Cell key={`smoke-${idx}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<SocialChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs mt-2">
                    {smokingData.map((entry, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] gap-1">
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="truncate text-slate-700" title={entry.name}>{entry.name}</span>
                        </div>
                        <span className="font-semibold text-slate-900 tabular-nums shrink-0">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Physical Activity & Exercise */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200/70 bg-white p-4 shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-900">Physical Activity Engagement</h4>
                      <span className="rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        Top 5 Activities
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Case-insensitive aggregation of free-text inputs</p>
                    <div className="w-full h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={exerciseData}
                          margin={{ top: 8, right: 32, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid horizontal={false} stroke="#E2E8F0" />
                          <XAxis
                            type="number"
                            stroke="#64748B"
                            tickLine={false}
                            axisLine={false}
                            fontSize={10}
                            allowDecimals={false}
                          />
                          <YAxis
                            dataKey="name"
                            type="category"
                            stroke="#64748B"
                            tickLine={false}
                            axisLine={false}
                            fontSize={11}
                            width={88}
                          />
                          <Tooltip content={<SocialChartTooltip />} cursor={{ fill: '#F8FAFC' }} />
                          <Bar dataKey="value" fill={THEME.deepTeal} radius={[0, 4, 4, 0]} maxBarSize={22}>
                            {exerciseData.map((entry, idx) => (
                              <Cell key={`ex-${idx}`} fill={entry.color} />
                            ))}
                            <LabelList dataKey="value" position="right" fontSize={10} fontWeight={600} fill="#334155" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-600 mt-2">
                    <span>Top: <strong className="text-slate-900">{exerciseData[0]?.name || 'N/A'}</strong></span>
                  </div>
                </div>

                {/* Column 3: Alcohol Consumption */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200/70 bg-white p-4 shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-900">Alcohol Consumption Frequency</h4>
                      <span className="rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        Intake Cadence
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Categorical patient intake frequency breakdown</p>
                    <div className="w-full h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={alcoholData}
                          margin={{ top: 18, right: 12, left: -22, bottom: 0 }}
                        >
                          <CartesianGrid vertical={false} stroke="#E2E8F0" />
                          <XAxis
                            dataKey="name"
                            stroke="#64748B"
                            tickLine={false}
                            axisLine={false}
                            fontSize={10}
                            interval={0}
                          />
                          <YAxis
                            stroke="#64748B"
                            tickLine={false}
                            axisLine={false}
                            fontSize={10}
                            allowDecimals={false}
                          />
                          <Tooltip content={<SocialChartTooltip />} cursor={{ fill: '#F8FAFC' }} />
                          <Bar dataKey="value" fill={THEME.deepTeal} radius={[4, 4, 0, 0]} maxBarSize={30}>
                            {alcoholData.map((entry, idx) => (
                              <Cell key={`alc-${idx}`} fill={entry.color} />
                            ))}
                            <LabelList dataKey="value" position="top" fontSize={10} fontWeight={600} fill="#334155" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs mt-2">
                    {alcoholData.map((entry, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] gap-1">
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="truncate text-slate-700" title={entry.name}>{entry.name}</span>
                        </div>
                        <span className="font-semibold text-slate-900 tabular-nums shrink-0">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Diagnostic & Laboratory Tests (Horizontal Bar Chart) */}
            <div
              ref={diagnosticsChartRef}
              className="w-full rounded-xl border border-slate-100 bg-slate-50/40 p-5 flex flex-col justify-between transition-colors hover:border-[#37AF9B]/30 hover:bg-slate-50/60"
            >
              {/* Card Header */}
              <div className="mb-4 border-b border-slate-200/70 pb-3">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  Recommended Diagnostic & Laboratory Tests
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Top 10 physician-ordered laboratory investigations and diagnostic imaging from consultation
                </p>
              </div>

              {/* Chart Rendering */}
              <div className="w-full h-80" style={{ marginTop: '0.5rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={top10Diagnostics}
                    margin={{ top: 10, right: 36, left: 16, bottom: 5 }}
                  >
                    <CartesianGrid horizontal={false} stroke="#E2E8F0" />
                    <XAxis
                      type="number"
                      stroke="#64748B"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      allowDecimals={false}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      interval={0}
                      width={140}
                      tick={{ fontSize: 12, fill: '#64748B' }}
                      stroke="#64748B"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<DiagnosticTooltip />} cursor={{ fill: '#F8FAFC' }} />
                    <Bar
                      dataKey="value"
                      fill={THEME.deepTeal}
                      radius={[0, 4, 4, 0]}
                      maxBarSize={22}
                    >
                      {top10Diagnostics.map((entry, index) => (
                        <Cell
                          key={`diag-cell-${index}`}
                          fill={index < 3 ? THEME.deepTeal : index < 6 ? THEME.vibrantTeal : '#0EA5E9'}
                        />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="right"
                        fill="#334155"
                        fontSize={11}
                        fontWeight={600}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Standard 4-Column Legend */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2.5 pt-3 border-t border-slate-200/80 text-xs mt-3 max-h-48 overflow-y-auto">
                {top10Diagnostics.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] gap-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: i < 3 ? THEME.deepTeal : i < 6 ? THEME.vibrantTeal : '#0EA5E9' }}
                      />
                      <span className="truncate text-slate-700" title={entry.name}>
                        {entry.name}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Prescribed Medications (Inventory Demand) */}
            <div
              ref={treatmentMedicationRef}
              className="w-full rounded-xl border border-slate-100 bg-slate-50/40 p-5 flex flex-col justify-between transition-colors hover:border-[#37AF9B]/30 hover:bg-slate-50/60"
            >
              {/* Card Header */}
              <div className="mb-4 border-b border-slate-200/70 pb-3">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  Top Prescribed Medications (Inventory Demand)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Top 10 generic medications prescribed during management and treatment for pharmacy inventory forecasting
                </p>
              </div>

              {/* Chart Rendering */}
              <div className="w-full h-80" style={{ marginTop: '0.5rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={top10PrescribedMedications}
                    margin={{ top: 10, right: 36, left: 16, bottom: 5 }}
                  >
                    <CartesianGrid horizontal={false} stroke="#E2E8F0" />
                    <XAxis
                      type="number"
                      stroke="#64748B"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      allowDecimals={false}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      interval={0}
                      width={140}
                      tick={{ fontSize: 12, fill: '#64748B' }}
                      stroke="#64748B"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<MedicationDemandTooltip />} cursor={{ fill: '#F8FAFC' }} />
                    <Bar
                      dataKey="value"
                      fill={THEME.deepTeal}
                      radius={[0, 4, 4, 0]}
                      maxBarSize={22}
                    >
                      {top10PrescribedMedications.map((entry, index) => (
                        <Cell
                          key={`rx-med-cell-${index}`}
                          fill={entry.color}
                        />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="right"
                        fill="#334155"
                        fontSize={11}
                        fontWeight={600}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Standard 4-Column Legend */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2.5 pt-3 border-t border-slate-200/80 text-xs mt-3 max-h-48 overflow-y-auto">
                {top10PrescribedMedications.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] gap-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="truncate text-slate-700" title={entry.name}>
                        {entry.name}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </StationReportSection>
        </div>

        {/* ==========================================
            STATION 4: DENTAL ASSESSMENT SECTION
        =========================================== */}
        <div id="station-4" ref={station4Ref}>
          <section className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 md:p-8 mb-10 transition-all">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4 mb-8">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0A594D] text-xs font-bold text-white shadow-2xs">
                    4
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Station 4: Dental Assessment Graphical Reports
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500 pl-10 max-w-2xl">
                  Oral hygiene indexing, caries prevalence, periodontal evaluation, and recommended dental interventions
                </p>
              </div>
            </div>

            {/* 1. Top KPI Summary (4-Column Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {dentalKpis.map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 shadow-2xs transition-all hover:bg-slate-50 hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        {kpi.label}
                      </p>
                      {Icon && (
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A594D]/10 text-[#0A594D]">
                          <Icon size={16} strokeWidth={2.2} />
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                      {kpi.value}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* 2. Chart 1: Oral Hygiene Status (Donut Chart) */}
            <div
              ref={oralHygieneRef}
              className="w-full bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8"
            >
              <div className="mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Oral Hygiene Status Distribution
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Categorical distribution of patient oral hygiene status based on plaque and calculus evaluation
                </p>
              </div>

              <div className="w-full h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={oralHygieneData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                    >
                      {oralHygieneData.map((entry, idx) => (
                        <Cell key={`oh-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<SocialChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Flex-Wrap Legend */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-slate-100 text-xs mt-3">
                {oralHygieneData.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-slate-700 font-medium">{entry.name}</span>
                    <span className="text-slate-400">({entry.pct}%)</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Chart 2: Gum Condition (Vertical Bar Chart) */}
            <div
              ref={gumConditionRef}
              className="w-full bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8"
            >
              <div className="mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Periodontal & Gum Condition Assessment
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clinical assessment of periodontal health, tracking the prevalence of gingivitis and suspected periodontal disease
                </p>
              </div>

              <div className="w-full h-80" style={{ marginTop: '0.5rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={gumConditionData}
                    margin={{ top: 20, right: 24, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748B"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      interval={0}
                    />
                    <YAxis
                      stroke="#64748B"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      allowDecimals={false}
                    />
                    <Tooltip content={<SocialChartTooltip />} cursor={{ fill: '#F8FAFC' }} />
                    <Bar
                      dataKey="value"
                      fill={THEME.deepTeal}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    >
                      {gumConditionData.map((entry, index) => (
                        <Cell key={`gc-cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="top"
                        fill="#334155"
                        fontSize={11}
                        fontWeight={600}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 4-Column Grid Custom Legend for clean alignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-100 text-xs mt-3">
                {gumConditionData.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] gap-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="truncate text-slate-700" title={entry.name}>
                        {entry.name}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                      {entry.value} ({entry.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ==========================================
            STATION 5: VISION SCREENING SECTION
        =========================================== */}
        <div id="station-5" ref={station5Ref}>
          <section className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 md:p-8 mb-10 transition-all">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4 mb-8">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0A594D] text-xs font-bold text-white shadow-2xs">
                    5
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Station 5: Vision Screening Graphical Reports
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500 pl-10 max-w-2xl">
                  Prevalence of reported ocular symptoms, history of eye conditions, and visual acuity impairment screening
                </p>
              </div>
            </div>

            {/* 1. Top KPI Summary (4-Column Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {visionKpis.map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 shadow-2xs transition-all hover:bg-slate-50 hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        {kpi.label}
                      </p>
                      {Icon && (
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A594D]/10 text-[#0A594D]">
                          <Icon size={16} strokeWidth={2.2} />
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                      {kpi.value}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* 2. Chart 1: Visual Symptoms Prevalence (Vertical Bar Chart) */}
            <div
              ref={visionSymptomsRef}
              className="w-full bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8"
            >
              <div className="mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Prevalence of Reported Visual Symptoms
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribution of positive responses across the 5 primary ocular symptom screening categories
                </p>
              </div>

              <div className="w-full h-80" style={{ marginTop: '0.5rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={visionSymptomsData}
                    margin={{ top: 20, right: 24, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748B"
                      tickLine={false}
                      axisLine={false}
                      fontSize={10}
                      interval={0}
                    />
                    <YAxis
                      stroke="#64748B"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      allowDecimals={false}
                    />
                    <Tooltip content={<SocialChartTooltip />} cursor={{ fill: '#F8FAFC' }} />
                    <Bar
                      dataKey="value"
                      fill={THEME.deepTeal}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={44}
                    >
                      {visionSymptomsData.map((entry, index) => (
                        <Cell key={`vs-cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="top"
                        fill="#334155"
                        fontSize={11}
                        fontWeight={600}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Standard Custom Legend */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 pt-4 border-t border-slate-100 text-sm mt-4">
                {visionSymptomsData.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center justify-start gap-2.5 text-sm text-slate-700">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span>{entry.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                      {entry.value} ({entry.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Custom Report Download Modal */}
        {isDownloadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Download Custom Report</h3>
              <p className="text-sm text-gray-500 mb-4">
                Enter the stations you want to include in the PDF. Use commas for specific stations (e.g., <strong>1, 3, 5</strong>) or hyphens for a range (e.g., <strong>1-4</strong>). Leave blank to download all.
              </p>
              <input 
                type="text" 
                placeholder="e.g. 1-3, 5" 
                value={stationSelection}
                onChange={(e) => setStationSelection(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 mb-6 focus:ring-2 focus:ring-[#37AF9B] focus:border-transparent outline-none"
              />
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsDownloadModalOpen(false)}
                  disabled={isGeneratingPDF}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={generatePDF}
                  disabled={isGeneratingPDF}
                  className="px-4 py-2 bg-[#0A594D] hover:bg-[#07463c] text-white rounded-md font-medium transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    'Generate PDF'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
