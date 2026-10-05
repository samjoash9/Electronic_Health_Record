/**
 * PLACEHOLDER DATA for the Health Reports page, until a server endpoint
 * aggregates real Station 1 vitals. Every name and number here is invented.
 *
 * getSampleVitalsReport returns the shape that endpoint is meant to return,
 * so wiring it up should only mean swapping this call for an API call:
 *
 *   { total,
 *     bmi:   { underweight, normal, overweight, obese },
 *     bp:    { normal, elevated, stage1, stage2, crisis },
 *     intakeFlags: { fever, tachycardia, bradycardia, tachypnea },
 *     trend: [{ label, overweightPct, highBpPct }],     // last 12 months
 *     byOffice: [{ office, total, bmi }],               // always every office
 *     atRisk: [{ id, name, office, bmi, systolic, diastolic, lastVisit }] }
 *
 * Counts are per patient, from each patient's latest visit -- the same rule
 * as the dashboard's smoker and wellness charts.
 */
import { bpClass, isHighBp } from '../../lib/bloodPressure';

const OFFICES = [
  {
    office: 'PROVINCIAL HEALTH OFFICE',
    bmi: { underweight: 3, normal: 18, overweight: 10, obese: 11 },
    bp: { normal: 20, elevated: 7, stage1: 9, stage2: 5, crisis: 1 },
    intakeFlags: { fever: 1, tachycardia: 3, bradycardia: 2, tachypnea: 1 },
  },
  {
    office: 'PROVINCIAL ENGINEERING OFFICE',
    bmi: { underweight: 1, normal: 9, overweight: 10, obese: 18 },
    bp: { normal: 10, elevated: 6, stage1: 11, stage2: 9, crisis: 2 },
    intakeFlags: { fever: 1, tachycardia: 4, bradycardia: 1, tachypnea: 2 },
  },
  {
    office: "PROVINCIAL GOVERNOR'S OFFICE",
    bmi: { underweight: 2, normal: 11, overweight: 8, obese: 9 },
    bp: { normal: 13, elevated: 5, stage1: 7, stage2: 5, crisis: 0 },
    intakeFlags: { fever: 0, tachycardia: 2, bradycardia: 2, tachypnea: 1 },
  },
  {
    office: 'PROVINCIAL ACCOUNTING OFFICE',
    bmi: { underweight: 2, normal: 9, overweight: 6, obese: 7 },
    bp: { normal: 11, elevated: 4, stage1: 6, stage2: 3, crisis: 0 },
    intakeFlags: { fever: 1, tachycardia: 1, bradycardia: 1, tachypnea: 0 },
  },
  {
    office: 'PROVINCIAL CORRECTIONAL AND SECURITY MANAGEMENT OFFICE',
    bmi: { underweight: 1, normal: 8, overweight: 9, obese: 18 },
    bp: { normal: 8, elevated: 6, stage1: 10, stage2: 10, crisis: 2 },
    intakeFlags: { fever: 1, tachycardia: 4, bradycardia: 2, tachypnea: 2 },
  },
  {
    office: 'PROVINCIAL GENERAL SERVICES OFFICE',
    bmi: { underweight: 2, normal: 10, overweight: 8, obese: 14 },
    bp: { normal: 11, elevated: 5, stage1: 9, stage2: 8, crisis: 1 },
    intakeFlags: { fever: 1, tachycardia: 2, bradycardia: 1, tachypnea: 1 },
  },
  {
    office: 'PROVINCIAL SOCIAL WELFARE AND DEVELOPMENT OFFICE',
    bmi: { underweight: 2, normal: 10, overweight: 6, obese: 8 },
    bp: { normal: 12, elevated: 3, stage1: 7, stage2: 4, crisis: 0 },
    intakeFlags: { fever: 0, tachycardia: 2, bradycardia: 1, tachypnea: 1 },
  },
  {
    office: 'D.O.P. MEMORIAL HOSPITAL',
    bmi: { underweight: 1, normal: 7, overweight: 4, obese: 6 },
    bp: { normal: 9, elevated: 2, stage1: 4, stage2: 2, crisis: 1 },
    intakeFlags: { fever: 1, tachycardia: 1, bradycardia: 1, tachypnea: 0 },
  },
];

// Obese and stage 1 or worse at their latest visit.
const AT_RISK = [
  { id: 1, name: 'DELA CRUZ, JUAN M.', office: 'PROVINCIAL ENGINEERING OFFICE', bmi: 31.2, systolic: 148, diastolic: 96, lastVisit: '2026-09-28' },
  { id: 2, name: 'SANTOS, MARIA L.', office: 'PROVINCIAL CORRECTIONAL AND SECURITY MANAGEMENT OFFICE', bmi: 29.4, systolic: 162, diastolic: 101, lastVisit: '2026-09-30' },
  { id: 3, name: 'REYES, ANTONIO P.', office: 'PROVINCIAL ENGINEERING OFFICE', bmi: 27.8, systolic: 136, diastolic: 88, lastVisit: '2026-09-21' },
  { id: 4, name: 'GARCIA, ROSARIO T.', office: 'PROVINCIAL HEALTH OFFICE', bmi: 26.1, systolic: 134, diastolic: 82, lastVisit: '2026-10-01' },
  { id: 5, name: 'MENDOZA, CARLITO B.', office: 'PROVINCIAL CORRECTIONAL AND SECURITY MANAGEMENT OFFICE', bmi: 33.5, systolic: 184, diastolic: 112, lastVisit: '2026-10-02' },
  { id: 6, name: 'BAUTISTA, LIZA C.', office: 'PROVINCIAL GENERAL SERVICES OFFICE', bmi: 28.3, systolic: 144, diastolic: 92, lastVisit: '2026-09-15' },
  { id: 7, name: 'VILLANUEVA, RAMON D.', office: "PROVINCIAL GOVERNOR'S OFFICE", bmi: 25.9, systolic: 138, diastolic: 86, lastVisit: '2026-09-09' },
  { id: 8, name: 'AQUINO, TERESITA F.', office: 'PROVINCIAL SOCIAL WELFARE AND DEVELOPMENT OFFICE', bmi: 30.6, systolic: 152, diastolic: 94, lastVisit: '2026-08-27' },
  { id: 9, name: 'NAVARRO, EDGARDO S.', office: 'PROVINCIAL ENGINEERING OFFICE', bmi: 32.0, systolic: 158, diastolic: 99, lastVisit: '2026-09-18' },
  { id: 10, name: 'CASTILLO, MILAGROS R.', office: 'PROVINCIAL ACCOUNTING OFFICE', bmi: 27.1, systolic: 131, diastolic: 84, lastVisit: '2026-09-04' },
  { id: 11, name: 'RAMOS, BENJAMIN A.', office: 'PROVINCIAL CORRECTIONAL AND SECURITY MANAGEMENT OFFICE', bmi: 29.9, systolic: 146, diastolic: 90, lastVisit: '2026-09-25' },
  { id: 12, name: 'TORRES, GLORIA E.', office: 'D.O.P. MEMORIAL HOSPITAL', bmi: 28.8, systolic: 141, diastolic: 89, lastVisit: '2026-08-19' },
  { id: 13, name: 'FLORES, ROGELIO V.', office: 'PROVINCIAL GENERAL SERVICES OFFICE', bmi: 26.7, systolic: 133, diastolic: 87, lastVisit: '2026-09-11' },
  { id: 14, name: 'MORALES, CORAZON J.', office: 'PROVINCIAL HEALTH OFFICE', bmi: 30.2, systolic: 149, diastolic: 95, lastVisit: '2026-09-23' },
];

const TREND_LABELS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

// Percentage points above the latest month, oldest first: both measures
// drift down over the year, as a working wellness programme would show.
// The last offset is 0, so the trend ends on the snapshot the other cards show.
const OVERWEIGHT_OFFSETS = [3.1, 2.8, 3.4, 2.2, 1.9, 2.5, 1.6, 1.2, 0.9, 1.1, 0.4, 0];
const HIGH_BP_OFFSETS = [4.0, 3.6, 3.9, 2.9, 3.1, 2.4, 2.0, 1.7, 1.1, 0.8, 0.5, 0];

const sum = (values) => values.reduce((total, v) => total + v, 0);
const round1 = (n) => Math.round(n * 10) / 10;

const ZERO = {
  bmi: { underweight: 0, normal: 0, overweight: 0, obese: 0 },
  bp: { normal: 0, elevated: 0, stage1: 0, stage2: 0, crisis: 0 },
  intakeFlags: { fever: 0, tachycardia: 0, bradycardia: 0, tachypnea: 0 },
};

// Sums the rows key by key, starting from zero so an office with no rows
// still answers with every key.
function addCounts(rows, zero) {
  const out = { ...zero };
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) out[key] = (out[key] ?? 0) + value;
  }
  return out;
}

const totalOf = (bmi) => sum(Object.values(bmi));

function trendFor(bmi, bp, total) {
  const overweightNow = ((bmi.overweight + bmi.obese) / total) * 100;
  const highBpNow = ((bp.stage1 + bp.stage2 + bp.crisis) / total) * 100;
  return TREND_LABELS.map((label, i) => ({
    label,
    overweightPct: round1(overweightNow + OVERWEIGHT_OFFSETS[i]),
    highBpPct: round1(highBpNow + HIGH_BP_OFFSETS[i]),
  }));
}

const BY_OFFICE = OFFICES.map((o) => ({ office: o.office, total: totalOf(o.bmi), bmi: o.bmi }));

/** office: an agency office name, or null for every office. */
export function getSampleVitalsReport(office) {
  const rows = office ? OFFICES.filter((o) => o.office === office) : OFFICES;
  const bmi = addCounts(rows.map((o) => o.bmi), ZERO.bmi);
  const bp = addCounts(rows.map((o) => o.bp), ZERO.bp);
  const total = totalOf(bmi);
  const atRisk = AT_RISK
    .filter((p) => !office || p.office === office)
    .filter((p) => p.bmi >= 25 && isHighBp(bpClass(p.systolic, p.diastolic)));

  return {
    total,
    bmi,
    bp,
    intakeFlags: addCounts(rows.map((o) => o.intakeFlags), ZERO.intakeFlags),
    trend: total ? trendFor(bmi, bp, total) : [],
    byOffice: BY_OFFICE,
    atRisk,
  };
}
