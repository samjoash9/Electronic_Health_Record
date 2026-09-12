/**
 * Which table an account authenticated against. Drives routing and route guards,
 * so these values must stay in sync with homeRouteFor().
 */
export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
};

// Doctors are deliberately absent: each doctor is assigned one of stations 3-5
// by an admin at onboarding, so homeRouteFor() derives their landing route from
// the station on their account instead of a fixed path.
export const ROLE_HOME_PATH = {
    [ROLES.ADMIN]: '/dashboard',
    [ROLES.PATIENT]: '/my-record',
};

/**
 * The desks a doctor can be assigned to. One list, used by the onboarding form,
 * the doctors table and the station filter, so a new station is added once.
 * Stations 1-2 are admin desks and are never assignable to a doctor.
 */
export const DOCTOR_STATIONS = [
  { value: 3, label: 'Station 3 — Consultation', subtitle: 'Consultation' },
  { value: 4, label: 'Station 4 — Dental', subtitle: 'Dental' },
  { value: 5, label: 'Station 5 — Vision', subtitle: 'Vision' },
];

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
  PENDING_DENTAL: 'PendingDental',
  PENDING_VISION: 'PendingVision',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const STATIONS = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
  SIX: 6,
};

/**
 * AssessmentCategory has no colour column and will not gain one. Each category
 * gets its own soft accent so the seven sections stay visually distinct at a
 * glance; icons reinforce the same grouping. Unknown names fall back to
 * neutral so a newly seeded category still renders.
 */
export const CATEGORY_STYLES = {
  Spiritual:     { header: 'bg-amber-50 border-amber-200', title: 'text-amber-700', icon: 'Sparkles' },
  Psychological: { header: 'bg-indigo-50 border-indigo-200', title: 'text-indigo-700', icon: 'BrainCircuit' },
  Mental:        { header: 'bg-violet-50 border-violet-200', title: 'text-violet-700', icon: 'Brain' },
  Emotional:     { header: 'bg-pink-50 border-pink-200', title: 'text-pink-700', icon: 'HeartHandshake' },
  Physical:      { header: 'bg-blue-50 border-blue-200', title: 'text-blue-700', icon: 'HeartPulse' },
  Financial:     { header: 'bg-emerald-50 border-emerald-200', title: 'text-emerald-700', icon: 'Landmark' },
  Social:        { header: 'bg-rose-50 border-rose-200', title: 'text-rose-700', icon: 'Users' },
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
 * for the condition name. Every condition except Hypertension reveals a
 * specify field once checked (label varies via conditionTypeLabel, default
 * "Specific type"); Hypertension is the only bare condition — it's binary
 * (has it or not) with no clinically meaningful subtype for a family-history
 * screen. The field-revealing conditions are ordered last (before Others) so
 * their taller tiles don't shift the grid alignment of the bare tile above
 * them. Respiratory Illness merges what used to be two separate conditions
 * (Tuberculosis and Bronchial Asthma) under conditionID 6; Bronchial
 * Asthma's old catalog id (7) is retired, not reused.
 */
export const FAMILY_CONDITIONS = [
  { conditionID: 1, name: 'NONE', exclusive: true },
  { conditionID: 2, name: 'HYPERTENSION' },
  { conditionID: 3, name: 'MENTAL HEALTH CONDITION', hasConditionType: true, conditionTypePlaceholder: 'e.g. specify condition' },
  { conditionID: 4, name: 'DIABETES MELLITUS', hasConditionType: true, conditionTypePlaceholder: 'e.g. Type 1, Type 2' },
  { conditionID: 5, name: 'CANCER (Breast/Ovarian/Colon, etc.)', hasConditionType: true, conditionTypePlaceholder: 'e.g. Breast, Colon' },
  {
    conditionID: 6, name: 'RESPIRATORY ILLNESS', hasConditionType: true,
    conditionTypeLabel: 'Please specify', conditionTypePlaceholder: 'e.g. Tuberculosis, Asthma',
  },
  {
    conditionID: 8, name: 'KIDNEY DISEASE', hasConditionType: true,
    conditionTypeLabel: 'Please specify', conditionTypePlaceholder: 'e.g. specify condition',
  },
  {
    conditionID: 9, name: 'LIVER DISEASE', hasConditionType: true,
    conditionTypeLabel: 'Please specify', conditionTypePlaceholder: 'e.g. specify condition',
  },
  {
    conditionID: 10, name: 'ARTHRITIS', hasConditionType: true,
    conditionTypeLabel: 'Please specify', conditionTypePlaceholder: 'e.g. specify condition',
  },
  {
    conditionID: 11, name: 'REPRODUCTIVE HEALTH PROBLEM', hasConditionType: true,
    conditionTypeLabel: 'Please specify', conditionTypePlaceholder: 'e.g. specify condition',
  },
  { conditionID: null, name: 'Others (Please Specify)', isOther: true },
];

/**
 * Station 3's orderable tests. The thyroid panel (TT3/TT4/TSH) is read as one
 * group by physicians, so THYROID_PANEL keeps those three on a row of their own
 * at every breakpoint -- see DiagnosticTestGrid in AssessmentPlanSection.jsx.
 * They are listed here in the same order so the stored comma-joined string
 * still follows this array.
 */
export const THYROID_PANEL = ['TT3', 'TT4', 'TSH'];

/**
 * Price list for the orderable tests, in PHP. A null price is one the office
 * has not fixed a rate for: the tile shows a dash and reveals an optional
 * amount box, so the doctor can quote it per form without it being mistaken
 * for free. SGPT/SGOT is one order covering both enzymes at 250.00 each.
 *
 * `was` records a name this test used to be stored under. The chosen tests are
 * persisted as a comma-joined string of these names, so a form saved before a
 * rename still pre-checks its boxes -- see splitValue in AssessmentPlanSection.
 */
export const DIAGNOSTIC_TEST_CATALOG = [
  { name: 'CBC', price: 180 },
  { name: 'BT', price: 100 },
  { name: 'U/A', price: 130 },
  { name: 'SE', price: 50 },
  { name: 'RBS', price: 120 },
  { name: 'FBS', price: 120 },
  { name: 'Lipid Profile', price: 900, was: 'Liquid Profile' },
  { name: 'Crea', price: 230 },
  { name: 'SGPT/SGOT', price: 500 },
  { name: 'SUA', price: 200 },
  { name: 'ASO', price: 180 },
  { name: 'NaK', price: 800 },
  { name: 'BUN', price: 300 },
  { name: 'HCV', price: null, was: 'HVC' },
  { name: 'Tumor Markers CA 125', price: null },
  { name: 'TT3', price: 650 },
  { name: 'TT4', price: 650 },
  { name: 'TSH', price: null },
  { name: 'Drug Test', price: 250 },
  { name: 'H. Pylori', price: 450 },
  { name: 'HBA1c', price: 900 },
  { name: 'ECG', price: null },
  { name: 'UTZ', price: null },
  { name: 'Chest Xray', price: 220 },
  { name: 'Papsmear', price: 400 },
];

export const DIAGNOSTIC_TESTS = DIAGNOSTIC_TEST_CATALOG.map((t) => t.name);

/**
 * The password every account provisioned at Station 1 starts on, mirroring
 * WellnessFormsController.DefaultPatientPassword on the server. Only ever
 * displayed to the admin doing the registering, so they can read it out to the
 * patient — the patient is forced to replace it on first sign-in.
 */
export const DEFAULT_PATIENT_PASSWORD = 'password123';

export const SEX_OPTIONS = ['Male', 'Female'];

export const CIVIL_STATUS_OPTIONS = [
  'Single', 'Married', 'Widowed', 'Separated', 'Divorced',
];

export const STATUS_LABEL = {
  [FORM_STATUS.PENDING_ASSESSMENT]: 'Pending Assessment',
  [FORM_STATUS.PENDING_CONSULTATION]: 'Pending Consultation',
  [FORM_STATUS.PENDING_DENTAL]: 'Pending Dental',
  [FORM_STATUS.PENDING_VISION]: 'Pending Vision',
  [FORM_STATUS.COMPLETED]: 'Completed',
  [FORM_STATUS.CANCELLED]: 'Cancelled',
};

export const STATUS_TONE = {
  [FORM_STATUS.PENDING_ASSESSMENT]: 'info',
  [FORM_STATUS.PENDING_CONSULTATION]: 'warn',
  [FORM_STATUS.PENDING_DENTAL]: 'warn',
  [FORM_STATUS.PENDING_VISION]: 'warn',
  [FORM_STATUS.COMPLETED]: 'success',
  [FORM_STATUS.CANCELLED]: 'danger',
};

/**
 * Station 4's dental screening. Each indicator is single-select and carries its
 * own free-text remarks field for the doctor.
 *
 * Option strings are duplicated in the CK_DentalAssessment_* check constraints
 * in ElectronicHealthRecordDbContext.cs. This array is the client's copy; the
 * server does not serve the list. A mismatch fails the insert at submit time,
 * not at build time, so edit both together. The en dashes in '6–12 months',
 * 'Present – refer for evaluation', 'Yes – satisfactory' and
 * 'Yes – needs assessment' are U+2013, not hyphens.
 */
export const DENTAL_INDICATORS = [
  {
    name: 'oralHygieneStatus',
    label: 'Oral Hygiene Status',
    options: ['Good', 'Fair', 'Poor'],
    remarksPlaceholder: 'e.g. heavy plaque along the lower incisors',
  },
  {
    name: 'dentalCaries',
    label: 'Presence of Dental Caries',
    options: ['None', 'Present'],
    remarksPlaceholder: 'e.g. two carious molars, lower left',
  },
  {
    name: 'gumCondition',
    label: 'Gum Condition',
    options: ['Healthy', 'Gingivitis', 'Suspected Periodontal Problem'],
    remarksPlaceholder: 'e.g. bleeding on probing, upper anterior',
  },
  {
    name: 'toothStatus',
    label: 'Tooth Status',
    options: ['Complete/Functional', 'Missing Teeth', 'Needs Dental Treatment'],
    remarksPlaceholder: 'e.g. missing upper right first molar',
  },
  {
    name: 'toothachePain',
    label: 'Toothache / Dental Pain',
    options: ['No', 'Yes'],
    remarksPlaceholder: 'e.g. intermittent pain on cold, two weeks',
  },
  {
    name: 'oralLesions',
    label: 'Oral Lesions / Abnormalities',
    options: ['None', 'Present – refer for evaluation'],
    remarksPlaceholder: 'e.g. white patch on buccal mucosa',
  },
  {
    name: 'dentureUse',
    label: 'Denture / Prosthesis Use',
    options: ['None', 'Yes – satisfactory', 'Yes – needs assessment'],
    remarksPlaceholder: 'e.g. upper partial denture, loose fit',
  },
  {
    name: 'dentalTreatmentNeed',
    label: 'Dental Treatment Need',
    options: ['None', 'Preventive Care', 'Restorative Treatment', 'Extraction', 'Other'],
    remarksPlaceholder: 'Specify if Other, e.g. orthodontic referral',
  },
  {
    name: 'lastDentalVisit',
    label: 'Last Dental Visit',
    options: ['Within 6 months', '6–12 months', 'More than 1 year', 'Never'],
    remarksPlaceholder: 'e.g. last cleaning March 2025',
  },
  {
    name: 'dentalReferral',
    label: 'Dental Referral',
    options: ['Not needed', 'Routine referral', 'Urgent referral'],
    remarksPlaceholder: 'e.g. refer to district hospital dental clinic',
  },
];

/**
 * Station 5's vision screening. Ten Yes/No-style single-selects, two free-text
 * acuity readings (visualAcuityRightEye / visualAcuityLeftEye, type: 'text'),
 * and one single-select-with-specify (eyeConditionIdentified, type: 'choice',
 * hasOther: true reveals an eyeConditionOther free-text field when "Other" is
 * picked -- same pattern as FAMILY_CONDITIONS' isOther entries).
 *
 * Option strings are duplicated in the CK_VisionAssessment_* check constraints
 * in ElectronicHealthRecordDbContext.cs. This array is the client's copy; the
 * server does not serve the list. A mismatch fails the insert at submit time,
 * not at build time, so edit both together.
 */
export const VISION_INDICATORS = [
  {
    name: 'historyOfEyeProblems',
    label: 'History of Eye Problems',
    type: 'choice',
    options: ['No', 'Yes'],
    remarksPlaceholder: 'e.g. cataract surgery, left eye, 2019',
  },
  {
    name: 'eyePainDiscomfort',
    label: 'Eye Pain / Discomfort',
    type: 'choice',
    options: ['No', 'Yes'],
    remarksPlaceholder: 'e.g. intermittent stinging, both eyes',
  },
  {
    name: 'blurredVision',
    label: 'Blurred Vision',
    type: 'choice',
    options: ['No', 'Yes'],
    remarksPlaceholder: 'e.g. worse toward end of shift',
  },
  {
    name: 'difficultySeeingNear',
    label: 'Difficulty Seeing Near Objects',
    type: 'choice',
    options: ['No', 'Yes'],
    remarksPlaceholder: 'e.g. trouble reading fine print',
  },
  {
    name: 'difficultySeeingDistant',
    label: 'Difficulty Seeing Distant Objects',
    type: 'choice',
    options: ['No', 'Yes'],
    remarksPlaceholder: 'e.g. trouble reading road signs',
  },
  {
    name: 'headacheEyeStrain',
    label: 'Headache / Eye Strain',
    type: 'choice',
    options: ['No', 'Yes'],
    remarksPlaceholder: 'e.g. after prolonged screen use',
  },
  {
    name: 'usesEyeglassesContactLenses',
    label: 'Uses Eyeglasses / Contact Lenses',
    type: 'choice',
    options: ['No', 'Yes'],
    remarksPlaceholder: 'e.g. reading glasses only',
  },
  {
    name: 'visualAcuityRightEye',
    label: 'Visual Acuity – Right Eye',
    type: 'text',
    placeholder: 'e.g. 20/20',
    remarksPlaceholder: 'e.g. with corrective lenses',
  },
  {
    name: 'visualAcuityLeftEye',
    label: 'Visual Acuity – Left Eye',
    type: 'text',
    placeholder: 'e.g. 20/20',
    remarksPlaceholder: 'e.g. with corrective lenses',
  },
  {
    name: 'eyeConditionIdentified',
    label: 'Eye Condition Identified',
    type: 'choice',
    options: ['None', 'Refractive error', 'Other'],
    hasOther: true,
    // Not `${name}Other` -- VisionAssessment.EyeConditionOther on the server
    // doesn't repeat "Identified", so the specify field's name is spelled out
    // rather than derived.
    otherFieldName: 'eyeConditionOther',
    otherPlaceholder: 'e.g. glaucoma, cataract',
    remarksPlaceholder: 'e.g. suspected early-stage, recommend monitoring',
  },
  {
    name: 'correctiveLensesRecommended',
    label: 'Corrective Lenses Recommended',
    type: 'choice',
    options: ['No', 'Yes'],
    remarksPlaceholder: 'e.g. reading glasses, +1.00',
  },
  {
    name: 'referralToEyeSpecialist',
    label: 'Referral to Eye Specialist Needed',
    type: 'choice',
    options: ['No', 'Yes'],
    remarksPlaceholder: 'e.g. refer to ophthalmologist for glaucoma screening',
  },
  {
    name: 'followUpConsultationAdvised',
    label: 'Follow-up Consultation Advised',
    type: 'choice',
    options: ['No', 'Yes'],
    remarksPlaceholder: 'e.g. recheck acuity in 6 months',
  },
];
