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
