export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
};

export const FORM_STATUS = {
  PENDING_ASSESSMENT: 'PendingAssessment',
  PENDING_CONSULTATION: 'PendingConsultation',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const STATIONS = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
};

/**
 * AssessmentCategory has no colour column and will not gain one. Colour is
 * presentation. Unknown names fall back to neutral so a newly seeded category
 * still renders.
 */
export const CATEGORY_STYLES = {
  'Mental Health':    { header: 'bg-purple-50 border-purple-300', title: 'text-purple-700' },
  'Physical Health':  { header: 'bg-rose-50 border-rose-300',     title: 'text-rose-700' },
  'Spiritual Health': { header: 'bg-amber-50 border-amber-300',   title: 'text-amber-700' },
  'Social Health':    { header: 'bg-sky-50 border-sky-300',       title: 'text-sky-700' },
};

export const NEUTRAL_CATEGORY_STYLE = {
  header: 'bg-gray-50 border-gray-300',
  title: 'text-gray-700',
};

export function categoryStyle(name) {
  return CATEGORY_STYLES[name] ?? NEUTRAL_CATEGORY_STYLE;
}

/**
 * Station 3 family medical history. "None" is exclusive: checking it clears
 * and disables every other option. "Others" reveals an extra free-text field
 * for the condition name.
 */
export const FAMILY_CONDITIONS = [
  { conditionID: 1, name: 'NONE', exclusive: true },
  { conditionID: 2, name: 'HYPERTENSION (Heart Attack)' },
  { conditionID: 3, name: 'STROKE' },
  { conditionID: 4, name: 'DIABETES MELLITUS' },
  { conditionID: 5, name: 'CANCER (Breast/Ovarian/Colon, etc.)' },
  { conditionID: 6, name: 'TUBERCULOSIS' },
  { conditionID: 7, name: 'BRONCHIAL ASTHMA' },
  { conditionID: null, name: 'Others (Please Specify)', isOther: true },
];

export const SEX_OPTIONS = ['Male', 'Female'];

export const CIVIL_STATUS_OPTIONS = [
  'Single', 'Married', 'Widowed', 'Separated', 'Divorced',
];
