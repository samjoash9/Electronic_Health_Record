/**
 * Which table an account authenticated against. Drives routing and route guards,
 * so these values must stay in sync with homeRouteFor().
 */
export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
};

/**
 * Permission tier *within* the Admin table, mirroring Admin.Role on the server.
 * Deliberately separate from ROLES: an admin and a superadmin both sign in as
 * ROLES.ADMIN and land on the same routes, they just differ in what they may do.
 */
export const ADMIN_ROLES = {
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
};

export function isSuperAdmin(user) {
  return user?.role === ROLES.ADMIN && user?.adminRole === ADMIN_ROLES.SUPERADMIN;
}

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
 * AssessmentCategory has no colour column and will not gain one. Each category
 * gets its own soft accent so the four sections stay visually distinct at a
 * glance; icons reinforce the same grouping. Unknown names fall back to
 * neutral so a newly seeded category still renders.
 */
export const CATEGORY_STYLES = {
  'Mental Health':    { header: 'bg-violet-50 border-violet-200', title: 'text-violet-700', icon: 'Brain' },
  'Physical Health':  { header: 'bg-blue-50 border-blue-200', title: 'text-blue-700', icon: 'HeartPulse' },
  'Spiritual Health': { header: 'bg-amber-50 border-amber-200', title: 'text-amber-700', icon: 'Sparkles' },
  'Social Health':    { header: 'bg-rose-50 border-rose-200', title: 'text-rose-700', icon: 'Users' },
};

export const NEUTRAL_CATEGORY_STYLE = {
  header: 'bg-gray-50 border-gray-300',
  title: 'text-gray-700',
  icon: 'ClipboardList',
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

export const STATUS_LABEL = {
  [FORM_STATUS.PENDING_ASSESSMENT]: 'Pending Assessment',
  [FORM_STATUS.PENDING_CONSULTATION]: 'Pending Consultation',
  [FORM_STATUS.COMPLETED]: 'Completed',
  [FORM_STATUS.CANCELLED]: 'Cancelled',
};

export const STATUS_TONE = {
  [FORM_STATUS.PENDING_ASSESSMENT]: 'info',
  [FORM_STATUS.PENDING_CONSULTATION]: 'warn',
  [FORM_STATUS.COMPLETED]: 'success',
  [FORM_STATUS.CANCELLED]: 'danger',
};
