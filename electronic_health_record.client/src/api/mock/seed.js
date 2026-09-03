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
      name: 'Mental Health',
      displayOrder: 1,
      questions: [
        q(101, 'How would you rate your current stress level?', 1, [
          ['None', 4], ['Mild', 3], ['Moderate', 2], ['Severe', 1],
        ]),
        // Scores deliberately do not follow display order: 7-8 hrs is healthiest.
        q(102, 'How many hours of sleep do you get on average?', 2, [
          ['Less than 5 hrs', 1], ['5-6 hrs', 2], ['7-8 hrs', 4], ['More than 8 hrs', 3],
        ]),
        q(103, 'How would you describe your general mood lately?', 3, [
          ['Very Good', 4], ['Good', 3], ['Fair', 2], ['Poor', 1],
        ]),
        q(104, 'Do you experience frequent anxiety or worry?', 4, [
          ['Never', 4], ['Rarely', 3], ['Sometimes', 2], ['Often', 1],
        ]),
        q(105, 'Do you have difficulty concentrating or focusing?', 5, [
          ['Never', 4], ['Rarely', 3], ['Sometimes', 2], ['Often', 1],
        ]),
      ],
    },
    {
      categoryID: 2,
      name: 'Physical Health',
      displayOrder: 2,
      questions: [
        q(201, 'Do you experience any chronic pain?', 1, [
          ['None', 4], ['Mild', 3], ['Moderate', 2], ['Severe', 1],
        ]),
        q(202, 'How often do you feel fatigued during the day?', 2, [
          ['Never', 4], ['Rarely', 3], ['Sometimes', 2], ['Always', 1],
        ]),
        q(203, 'How is your appetite?', 3, [
          ['Very Good', 4], ['Good', 3], ['Fair', 2], ['Poor', 1],
        ]),
        q(204, 'How regular are your bowel movements?', 4, [
          ['Very Regular', 4], ['Regular', 3], ['Irregular', 2], ['Very Irregular', 1],
        ]),
        q(205, 'Do you experience any urinary problems?', 5, [
          ['None', 4], ['Mild', 3], ['Moderate', 2], ['Severe', 1],
        ]),
      ],
    },
    {
      categoryID: 3,
      name: 'Spiritual Health',
      displayOrder: 3,
      questions: [
        q(301, 'Do you have a clear sense of purpose in life?', 1, [
          ['Strongly Agree', 4], ['Agree', 3], ['Disagree', 2], ['Strongly Disagree', 1],
        ]),
        q(302, 'Do you feel inner peace most of the time?', 2, [
          ['Always', 4], ['Often', 3], ['Rarely', 2], ['Never', 1],
        ]),
        q(303, 'Do you regularly practice gratitude?', 3, [
          ['Always', 4], ['Often', 3], ['Rarely', 2], ['Never', 1],
        ]),
      ],
    },
    {
      categoryID: 4,
      name: 'Social Health',
      displayOrder: 4,
      questions: [
        q(401, 'How would you rate your relationships with family and friends?', 1, [
          ['Excellent', 4], ['Good', 3], ['Fair', 2], ['Poor', 1],
        ]),
        q(402, 'How satisfied are you with your work-life balance?', 2, [
          ['Very Satisfied', 4], ['Satisfied', 3], ['Unsatisfied', 2], ['Very Unsatisfied', 1],
        ]),
        q(403, 'Do you have people you can rely on for support?', 3, [
          ['Always', 4], ['Most of the time', 3], ['Rarely', 2], ['Never', 1],
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
    { conditionID: 3, conditionName: 'STROKE', conditionType: 'Family' },
    { conditionID: 4, conditionName: 'DIABETES MELLITUS', conditionType: 'Family' },
    { conditionID: 5, conditionName: 'CANCER (Breast/Ovarian/Colon, etc.)', conditionType: 'Family' },
    { conditionID: 6, conditionName: 'TUBERCULOSIS', conditionType: 'Family' },
    { conditionID: 7, conditionName: 'BRONCHIAL ASTHMA', conditionType: 'Family' },
  ];
}

export function buildSeed() {
  return {
    admins: [
      {
        adminID: 1,
        username: 'admin',
        role: 'superadmin',
        contactNo: '09170000001',
        password: 'password123',
        fullName: 'System Administrator',
        isActive: true,
      },
      {
        adminID: 2,
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
        isActive: true,
      },
    ],
    employees: buildEmployees(),
    patients: [],
    patientAccounts: [],
    forms: [],
    familyMedicalHistory: [],
    pastMedicalHistory: [],
    socialHistory: [],
    assessmentAnswers: [],
    assessmentCategories: buildAssessmentCategories(),
    medicalConditions: buildMedicalConditions(),
    nextIds: {
      patientID: 1,
      patientAccountID: 1,
      formID: 1,
      fmhID: 1,
      pmhID: 1,
      socialHistoryID: 1,
      answerID: 1,
    },
  };
}
