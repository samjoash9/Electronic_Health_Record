// Test data for the Health Reports sections, shaped exactly like
// GET /api/health-reports/station{n}. Every name and number is invented.

// 10 patients over 12 visits. One patient's latest visit has no BMI, so the
// BMI classes add up to 9 while the BP stages add up to all 10.
export const STATION1_HEALTH = {
  visits: 12,
  patients: 10,
  bmi: { underweight: 1, normal: 3, overweight: 2, obese1: 2, obese2: 1 },
  bp: { normal: 4, elevated: 2, stage1: 2, stage2: 1, crisis: 1 },
  byOffice: [
    { office: 'PROVINCIAL HEALTH OFFICE', patients: 6 },
    { office: 'PROVINCIAL ENGINEERING OFFICE', patients: 3 },
    { office: null, patients: 1 },
  ],
};

// 12 assessments from 10 patients, aspects in DisplayOrder. Emotional has no
// answers (the older four-aspect questionnaire), so it has no score.
export const STATION2_HEALTH = {
  assessments: 12,
  patients: 10,
  overallScore: 71.4,
  aspects: [
    { category: 'Spiritual', score: 82.5, patients: 10, atRisk: 0 },
    { category: 'Psychological', score: 74, patients: 8, atRisk: 1 },
    { category: 'Mental', score: 66.3, patients: 10, atRisk: 2 },
    { category: 'Emotional', score: null, patients: 0, atRisk: 0 },
    { category: 'Physical', score: 90, patients: 10, atRisk: 0 },
    { category: 'Financial', score: 48.8, patients: 8, atRisk: 4 },
    { category: 'Social', score: 77.5, patients: 10, atRisk: 1 },
  ],
};

// 12 consultations from 10 patients; 8 prescribed something, 5 ordered labs.
// Lists come ranked and capped, as the server sends them.
export const STATION3_HEALTH = {
  consultations: 12,
  patients: 10,
  withPrescription: 8,
  withLabs: 5,
  conditions: [
    { name: 'Hypertension', patients: 4 },
    { name: 'Diabetes', patients: 2 },
  ],
  maintenanceDrugs: [
    { name: 'Amlodipine', patients: 3 },
    { name: 'Metformin', patients: 2 },
  ],
  smoking: { nonSmoker: 6, cigarette: 2, ecig: 1, both: 1, unspecified: 0 },
  exercise: {
    patients: 6,
    top: [
      { name: 'Walking', patients: 4 },
      { name: 'Jogging', patients: 2 },
    ],
  },
  alcohol: { never: 5, occasional: 3, weekly: 1, frequent: 1 },
  labs: [
    { name: 'CBC', orders: 5 },
    { name: 'Lipid Profile', orders: 3 },
    { name: 'FBS', orders: 2 },
    { name: 'Urinalysis', orders: 1 },
  ],
  medications: [
    { name: 'Losartan', orders: 4 },
    { name: 'Paracetamol', orders: 3 },
  ],
};

// 12 dental screenings from 10 patients. One left gum condition unanswered,
// so the gum tally adds up to 9.
export const STATION4_HEALTH = {
  screenings: 12,
  patients: 10,
  hygiene: { good: 4, fair: 4, poor: 2 },
  gum: { healthy: 5, gingivitis: 3, periodontal: 1 },
  caries: { none: 4, present: 6 },
  treatmentNeed: { none: 2, preventive: 3, restorative: 3, extraction: 1, other: 1 },
};

// 12 vision screenings from 10 patients. Two left near vision unanswered.
export const STATION5_HEALTH = {
  screenings: 12,
  patients: 10,
  symptoms: {
    history: { yes: 2, answered: 10 },
    eyePain: { yes: 1, answered: 10 },
    blurred: { yes: 4, answered: 10 },
    near: { yes: 3, answered: 8 },
    distant: { yes: 2, answered: 10 },
  },
};
