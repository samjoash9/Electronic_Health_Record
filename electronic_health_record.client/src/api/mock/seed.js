function q(questionID, questionText, displayOrder, pairs) {
  return {
    questionID,
    questionText,
    displayOrder,
    isActive: true,
    options: pairs.map(([optionText, score], i) => ({
      optionID: questionID * 10 + i + 1,
      questionID,
      optionText,
      score,
      displayOrder: i + 1,
    })),
  };
}

function buildAssessmentCategories() {
  return [
    {
      categoryID: 1,
      name: 'Spiritual',
      displayOrder: 1,
      questions: [
        q(101, 'Do you have a clear sense of purpose in life?', 1, [
          ['Strongly Agree', 4], ['Agree', 3], ['Disagree', 2], ['Strongly Disagree', 1],
        ]),
        q(102, 'Do you feel inner peace most of the time?', 2, [
          ['Always', 4], ['Often', 3], ['Rarely', 2], ['Never', 1],
        ]),
        q(103, 'Do you regularly practice gratitude?', 3, [
          ['Always', 4], ['Often', 3], ['Rarely', 2], ['Never', 1],
        ]),
        q(104, 'Do you find comfort in your faith or personal beliefs?', 4, [
          ['Always', 4], ['Often', 3], ['Rarely', 2], ['Never', 1],
        ]),
        q(105, 'Do you feel connected to something greater than yourself?', 5, [
          ['Strongly Agree', 4], ['Agree', 3], ['Disagree', 2], ['Strongly Disagree', 1],
        ]),
      ],
    },
    {
      categoryID: 2,
      name: 'Psychological',
      displayOrder: 2,
      questions: [
        q(201, 'How would you rate your overall sense of self-worth?', 1, [
          ['Very Good', 4], ['Good', 3], ['Fair', 2], ['Poor', 1],
        ]),
        q(202, 'How well do you bounce back after a setback?', 2, [
          ['Very Well', 4], ['Well', 3], ['Poorly', 2], ['Very Poorly', 1],
        ]),
        q(203, 'How confident are you in making everyday decisions?', 3, [
          ['Very Confident', 4], ['Confident', 3], ['Unsure', 2], ['Very Unsure', 1],
        ]),
        q(204, 'Do you feel in control of your thoughts and reactions?', 4, [
          ['Always', 4], ['Often', 3], ['Rarely', 2], ['Never', 1],
        ]),
        q(205, 'How would you describe your outlook on the future?', 5, [
          ['Very Positive', 4], ['Positive', 3], ['Negative', 2], ['Very Negative', 1],
        ]),
      ],
    },
    {
      categoryID: 3,
      name: 'Mental',
      displayOrder: 3,
      questions: [
        q(301, 'How would you rate your current stress level?', 1, [
          ['None', 4], ['Mild', 3], ['Moderate', 2], ['Severe', 1],
        ]),
        // Scores deliberately do not follow display order: 7-8 hrs is healthiest.
        q(302, 'How many hours of sleep do you get on average?', 2, [
          ['Less than 5 hrs', 1], ['5-6 hrs', 2], ['7-8 hrs', 4], ['More than 8 hrs', 3],
        ]),
        q(303, 'How would you describe your general mood lately?', 3, [
          ['Very Good', 4], ['Good', 3], ['Fair', 2], ['Poor', 1],
        ]),
        q(304, 'Do you experience frequent anxiety or worry?', 4, [
          ['Never', 4], ['Rarely', 3], ['Sometimes', 2], ['Often', 1],
        ]),
        q(305, 'Do you have difficulty concentrating or focusing?', 5, [
          ['Never', 4], ['Rarely', 3], ['Sometimes', 2], ['Often', 1],
        ]),
      ],
    },
    {
      categoryID: 4,
      name: 'Emotional',
      displayOrder: 4,
      questions: [
        q(401, 'How comfortable are you expressing your feelings to others?', 1, [
          ['Very Comfortable', 4], ['Comfortable', 3], ['Uncomfortable', 2], ['Very Uncomfortable', 1],
        ]),
        q(402, 'How often do you experience sudden mood swings?', 2, [
          ['Never', 4], ['Rarely', 3], ['Sometimes', 2], ['Often', 1],
        ]),
        q(403, 'Do you have someone you can turn to when you feel emotionally overwhelmed?', 3, [
          ['Always', 4], ['Most of the time', 3], ['Rarely', 2], ['Never', 1],
        ]),
        q(404, 'How often do you feel overwhelmed by your emotions?', 4, [
          ['Never', 4], ['Rarely', 3], ['Sometimes', 2], ['Often', 1],
        ]),
        q(405, 'How often do you feel joy or contentment in daily life?', 5, [
          ['Often', 4], ['Sometimes', 3], ['Rarely', 2], ['Never', 1],
        ]),
      ],
    },
    {
      categoryID: 5,
      name: 'Physical',
      displayOrder: 5,
      questions: [
        q(501, 'Do you experience any chronic pain?', 1, [
          ['None', 4], ['Mild', 3], ['Moderate', 2], ['Severe', 1],
        ]),
        q(502, 'How often do you feel fatigued during the day?', 2, [
          ['Never', 4], ['Rarely', 3], ['Sometimes', 2], ['Always', 1],
        ]),
        q(503, 'How is your appetite?', 3, [
          ['Very Good', 4], ['Good', 3], ['Fair', 2], ['Poor', 1],
        ]),
        q(504, 'How regular are your bowel movements?', 4, [
          ['Very Regular', 4], ['Regular', 3], ['Irregular', 2], ['Very Irregular', 1],
        ]),
        q(505, 'Do you experience any urinary problems?', 5, [
          ['None', 4], ['Mild', 3], ['Moderate', 2], ['Severe', 1],
        ]),
      ],
    },
    {
      categoryID: 6,
      name: 'Financial',
      displayOrder: 6,
      questions: [
        q(601, 'How often do you feel stressed about money?', 1, [
          ['Never', 4], ['Rarely', 3], ['Sometimes', 2], ['Often', 1],
        ]),
        q(602, 'How well can you meet your monthly expenses?', 2, [
          ['Very Well', 4], ['Well', 3], ['Poorly', 2], ['Very Poorly', 1],
        ]),
        q(603, 'Do you have savings set aside for emergencies?', 3, [
          ['Always', 4], ['Often', 3], ['Rarely', 2], ['Never', 1],
        ]),
        q(604, 'How often do you worry about outstanding debts?', 4, [
          ['Never', 4], ['Rarely', 3], ['Sometimes', 2], ['Often', 1],
        ]),
        q(605, 'How confident are you in your financial future?', 5, [
          ['Very Confident', 4], ['Confident', 3], ['Unsure', 2], ['Very Unsure', 1],
        ]),
      ],
    },
    {
      categoryID: 7,
      name: 'Social',
      displayOrder: 7,
      questions: [
        q(701, 'How would you rate your relationships with family and friends?', 1, [
          ['Excellent', 4], ['Good', 3], ['Fair', 2], ['Poor', 1],
        ]),
        q(702, 'How satisfied are you with your work-life balance?', 2, [
          ['Very Satisfied', 4], ['Satisfied', 3], ['Unsatisfied', 2], ['Very Unsatisfied', 1],
        ]),
        q(703, 'Do you have people you can rely on for support?', 3, [
          ['Always', 4], ['Most of the time', 3], ['Rarely', 2], ['Never', 1],
        ]),
        q(704, 'How often do you feel isolated or left out?', 4, [
          ['Never', 4], ['Rarely', 3], ['Sometimes', 2], ['Often', 1],
        ]),
        q(705, 'How often do you take part in social or community activities?', 5, [
          ['Often', 4], ['Sometimes', 3], ['Rarely', 2], ['Never', 1],
        ]),
      ],
    },
  ];
}

const SURNAMES = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza',
  'Torres', 'Tomas', 'Andres', 'Marquez', 'Romualdez', 'Mercado', 'Aquino',
  'Villanueva', 'Ramos', 'Del Rosario', 'Castillo', 'Flores', 'Rivera',
  'Gonzales', 'Domingo', 'Navarro', 'Salvador', 'Padilla', 'Corpuz',
  'Lazaro', 'Fernandez', 'Pascual', 'Manalo', 'Soriano', 'Valdez',
];

const FIRST_NAMES = [
  'Maria', 'Jose', 'Ana', 'Juan', 'Rosa', 'Pedro', 'Grace', 'Mark',
  'Liza', 'Ramon', 'Cristina', 'Danilo', 'Jenny', 'Arnel', 'Marites',
  'Rodel', 'Angeline', 'Nestor', 'Bernadette', 'Rolando', 'Charity',
  'Edgar', 'Michelle', 'Ferdinand', 'Katherine', 'Alvin', 'Roselle',
  'Christian', 'Divina', 'Emmanuel', 'Jocelyn', 'Noel',
];

const MIDDLE_INITIALS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'L', 'M', 'P', 'R', 'S', 'T', 'V'];

const AGENCIES = [
  'Provincial Health Office', 'Provincial Treasury Office',
  'Provincial Engineering Office', 'Provincial Agriculture Office',
  'Human Resource Management Office', 'Provincial Social Welfare Office',
  'Provincial Legal Office', 'Provincial Accounting Office',
];

const POSITIONS = [
  'Administrative Aide IV', 'Administrative Officer II', 'Nurse II',
  'Engineer I', 'Agriculturist II', 'Accountant I', 'Clerk III',
  'Draftsman II', 'Social Welfare Officer I', 'Legal Assistant',
];

function buildEmployees() {
  const employees = [];
  for (let i = 0; i < 32; i += 1) {
    const year = 1968 + ((i * 7) % 36);
    const month = (i % 12) + 1;
    const day = ((i * 3) % 27) + 1;
    employees.push({
      externalEmployeeId: `PHO-${String(1001 + i)}`,
      surname: SURNAMES[i % SURNAMES.length],
      firstName: FIRST_NAMES[i % FIRST_NAMES.length],
      middleName: MIDDLE_INITIALS[i % MIDDLE_INITIALS.length],
      birthdate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      sex: i % 2 === 0 ? 'Female' : 'Male',
      civilStatus: ['Single', 'Married', 'Widowed', 'Separated'][i % 4],
      address: `${100 + i} Rizal Street, Barangay ${(i % 12) + 1}, Trece Martires City, Cavite`,
      agencyOffice: AGENCIES[i % AGENCIES.length],
      position: POSITIONS[i % POSITIONS.length],
      contactNo: `09${String(170000000 + i * 137).slice(0, 9)}`,
    });
  }
  return employees;
}

function buildMedicalConditions() {
  return [
    { conditionID: 1, conditionName: 'NONE', conditionType: 'Family' },
    { conditionID: 2, conditionName: 'HYPERTENSION (Heart Attack)', conditionType: 'Family' },
    { conditionID: 3, conditionName: 'MENTAL HEALTH CONDITION', conditionType: 'Family' },
    { conditionID: 4, conditionName: 'DIABETES MELLITUS', conditionType: 'Family' },
    { conditionID: 5, conditionName: 'CANCER (Breast/Ovarian/Colon, etc.)', conditionType: 'Family' },
    { conditionID: 6, conditionName: 'RESPIRATORY ILLNESS', conditionType: 'Family' },
    { conditionID: 8, conditionName: 'KIDNEY DISEASE', conditionType: 'Family' },
    { conditionID: 9, conditionName: 'LIVER DISEASE', conditionType: 'Family' },
    { conditionID: 10, conditionName: 'ARTHRITIS', conditionType: 'Family' },
    { conditionID: 11, conditionName: 'REPRODUCTIVE HEALTH PROBLEM', conditionType: 'Family' },
  ];
}

export function buildSeed() {
  return {
    admins: [
      {
        adminID: 1,
        username: 'superadmin',
        role: 'superadmin',
        contactNo: '09170000000',
        password: 'password123',
        fullName: 'System Developer',
        isActive: true,
      },
      {
        adminID: 2,
        username: 'admin',
        role: 'admin',
        contactNo: '09170000001',
        password: 'password123',
        fullName: 'System Administrator',
        isActive: true,
      },
      {
        adminID: 3,
        username: 'nurse1',
        role: 'admin',
        contactNo: '09170000002',
        password: 'password123',
        fullName: 'Corazon Dimaculangan',
        isActive: true,
      },
    ],
    physicians: [
      {
        physicianID: 1,
        username: 'doctor',
        password: 'password123',
        surname: 'Villaflor',
        firstName: 'Ernesto',
        middleName: 'B',
        prcLicenseNo: '0123456',
        contactNo: '09171234567',
        // settled account: the Station 3 fixtures are signed by this doctor, so
        // it must not sit behind a first-login password prompt
        mustChangePassword: false,
        isActive: true,
      },
      {
        physicianID: 2,
        username: 'mgrey',
        password: 'password123',
        surname: 'Grey',
        firstName: 'Meredith',
        middleName: 'E',
        prcLicenseNo: '0987654',
        contactNo: '09176789012',
        // freshly onboarded by an admin: still on the password they were handed
        mustChangePassword: true,
        isActive: true,
      },
    ],
    employees: buildEmployees(),
    patients: [
      {
        patientID: 1,
        externalEmployeeId: 'PHO-1001',
        surname: 'Santos',
        firstName: 'Maria',
        middleName: 'A',
        birthdate: '1968-01-02',
        sex: 'Female',
        civilStatus: 'Single',
        address: '100 Rizal Street, Barangay 1, Trece Martires City, Cavite',
        agencyOffice: 'Provincial Health Office',
        position: 'Administrative Aide IV',
        contactNo: '09170000000',
        lastSyncedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    patientAccounts: [
      {
        patientAccountID: 1,
        patientID: 1,
        username: 'pho1001',
        password: 'password123',
        status: 'Active',
        provisionedAt: new Date().toISOString(),
        activatedAt: new Date().toISOString(),
        lastLoginAt: null,
      },
    ],
    forms: [],
    familyMedicalHistory: [],
    pastMedicalHistory: [],
    socialHistory: [],
    exercise: [],
    dentalAssessments: [],
    visionAssessments: [],
    assessmentAnswers: [],
    assessmentCategories: buildAssessmentCategories(),
    medicalConditions: buildMedicalConditions(),
    wellnessFormAuditLogs: [],
    nextIds: {
      // 4: the three seeded admins above take 1-3.
      adminID: 4,
      patientID: 2,
      patientAccountID: 2,
      physicianID: 3,
      formID: 1,
      fmhID: 1,
      pmhID: 1,
      socialHistoryID: 1,
      exerciseID: 1,
      dentalAssessmentID: 1,
      visionAssessmentID: 1,
      answerID: 1,
      logID: 1,
    },
  };
}
