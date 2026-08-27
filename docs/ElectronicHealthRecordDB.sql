-- Electronic Health Record - full schema, runnable.
-- Matches EF migrations through 20260826012402_AddWellnessFormStatusAndNullablePhysician.
-- Run against an empty database. Tables are created parent-first so the FKs resolve.


/*
CREATE TABLE Patient (
	PatientID INT PRIMARY KEY IDENTITY(1, 1),
	Surname NVARCHAR(50) NOT NULL,
	FirstName NVARCHAR(50) NOT NULL,
	MiddleName NVARCHAR(50) NULL,
	Birthdate DATE NOT NULL,
	Sex CHAR(1) NOT NULL,
	CivilStatus VARCHAR(20) NOT NULL,
	Address NVARCHAR(255) NULL,
	AgencyOffice NVARCHAR(100) NULL,
	Position NVARCHAR(50) NULL,
	ContactNo VARCHAR(20) NULL,
	CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
	UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE Physician (
	PhysicianID INT PRIMARY KEY IDENTITY(1, 1),
	Surname NVARCHAR(50) NOT NULL,
	FirstName NVARCHAR(50) NOT NULL,
	MiddleName NVARCHAR(50) NULL,
	PRCLicenseNo NVARCHAR(20) NOT NULL UNIQUE,
	CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
	UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE Admin (
	AdminID INT PRIMARY KEY IDENTITY(1, 1),
	Username NVARCHAR(30) NOT NULL UNIQUE,
	Email NVARCHAR(255) NOT NULL UNIQUE,
	PasswordHash NVARCHAR(255) NOT NULL,
	FullName NVARCHAR(100) NOT NULL,
	IsActive BIT NOT NULL DEFAULT 1,
	LastLoginAt DATETIME2 NULL,
	CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
	UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE AdminSession (
	SessionID INT PRIMARY KEY IDENTITY(1, 1),
	AdminID INT NOT NULL,
	TokenHash CHAR(64) NOT NULL UNIQUE,
	ExpiresAt DATETIME2 NOT NULL,
	RevokedAt DATETIME2 NULL,
	CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

	CONSTRAINT FK_AdminSession_Admin
		FOREIGN KEY (AdminID)
			REFERENCES Admin(AdminID)
);

CREATE TABLE MedicalCondition (
	ConditionID INT PRIMARY KEY IDENTITY(1, 1),
	ConditionName NVARCHAR(50) UNIQUE NOT NULL,
	ConditionType NVARCHAR(100) NULL
);

-- fixed condition list the wellness form checkbox grids bind to.
-- seeded by the EF migration; IDs are stable and referenced by
-- FamilyMedicalHistory.ConditionID / PastMedicalHistory.ConditionID.
SET IDENTITY_INSERT MedicalCondition ON;
INSERT INTO MedicalCondition (ConditionID, ConditionName, ConditionType) VALUES
	(1, 'Hypertension', NULL),
	(2, 'Stroke', NULL),
	(3, 'Diabetes Mellitus', NULL),
	(4, 'Tuberculosis', NULL),
	(5, 'Bronchial Asthma', NULL),
	(6, 'Cancer', NULL);
SET IDENTITY_INSERT MedicalCondition OFF;

CREATE TABLE WellnessForm (
	FormID INT PRIMARY KEY IDENTITY(1, 1),
	PatientID INT NOT NULL,
	-- NULL while the form is still a draft and no physician has been assigned yet
	PhysicianID INT NULL,
	-- 'Draft' (Save as Draft) or 'Submitted' (Submit)
	-- NOTE: on a DB built by EF migrations this column sits last physically,
	-- because it was added by ALTER TABLE. Listed here for readability.
	Status VARCHAR(20) NOT NULL DEFAULT 'Draft',
	FormDate DATE NOT NULL DEFAULT CAST(SYSDATETIME() AS DATE),
	-- DECIMAL -> 5 digits, 2 floating points (999.99kg max)
	WeightKg DECIMAL(5, 2) NULL,
	HeightCm DECIMAL(5, 2) NULL,
	BMI DECIMAL(5, 2) NULL,
	IdealBMI DECIMAL(5, 2) NULL,
	BPSystolic SMALLINT NULL,
	BPDiastolic SMALLINT NULL,
	-- 3 digits, 1 floating point (36.5, 99.9)
	TempCelsius DECIMAL(3, 1) NULL,
	HeartRate SMALLINT NULL,
	RespRate SMALLINT NULL,
	RecommendedDiagnosticTest NVARCHAR(150) NULL,
	ImpressionClinical NVARCHAR(300) NULL,
	ManagementTreatment NVARCHAR(300) NULL,

	CreatedByAdminID INT NULL,
	UpdatedByAdminID INT NULL,

	CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
	UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

	-- FOREIGN KEYS (PatientID & PhysicianID)
	CONSTRAINT FK_WellnessForm_Patient
		FOREIGN KEY (PatientID)
			REFERENCES Patient(PatientID),

	CONSTRAINT FK_WellnessForm_Physician
		FOREIGN KEY (PhysicianID)
			REFERENCES Physician(PhysicianID),

	CONSTRAINT FK_WellnessForm_CreatedByAdmin
		FOREIGN KEY (CreatedByAdminID)
			REFERENCES Admin(AdminID)
			ON DELETE SET NULL,

	CONSTRAINT FK_WellnessForm_UpdatedByAdmin
		FOREIGN KEY (UpdatedByAdminID)
			REFERENCES Admin(AdminID)
			ON DELETE NO ACTION
);

CREATE TABLE SocialHistory (
	SocialHistoryID INT PRIMARY KEY IDENTITY(1, 1),
	FormID INT NOT NULL UNIQUE,
	SmokingSticksPerDay SMALLINT NULL,
	AlcoholType NVARCHAR(50) NULL,
	DrinkFrequency NVARCHAR(50) NULL,
	DrinksPerSession NVARCHAR(20) NULL,
	HasBeenDrunk BIT NULL,
	DrunkFrequency NVARCHAR(50) NULL,
	ExerciseFrequency NVARCHAR(50) NULL,
	-- may contain many exercise types
	ExerciseType NVARCHAR(100) NULL,

	CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
	UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

	CONSTRAINT FK_SocialHistory_WellnessForm
		FOREIGN KEY (FormID)
			REFERENCES WellnessForm(FormID)
);

CREATE TABLE FamilyMedicalHistory (
	FMHID INT PRIMARY KEY IDENTITY(1, 1),
	FormID INT NOT NULL,
	ConditionID INT NULL,
	ConditionOther NVARCHAR(100) NULL,
	IsNone BIT NULL DEFAULT 0,

	CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
	UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

	CONSTRAINT FK_FMH_WellnessForm
		FOREIGN KEY (FormID)
			REFERENCES WellnessForm(FormID),
	CONSTRAINT FK_FMH_Condition
		FOREIGN KEY (ConditionID)
			REFERENCES MedicalCondition (ConditionID)
);

CREATE TABLE PastMedicalHistory (
	PMHID INT PRIMARY KEY IDENTITY(1, 1),
	FormID INT NOT NULL,
	ConditionID INT NULL,

	ConditionOther NVARCHAR(100) NULL,
	YearDiagnosed SMALLINT NULL,
	MaintenanceDrugGeneric NVARCHAR(100) NULL,
	Dosage NVARCHAR(20) NULL,
	Frequency NVARCHAR(50) NULL,

	CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
	UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

	CONSTRAINT FK_PMH_WellnessForm
		FOREIGN KEY (FormID)
			REFERENCES WellnessForm (FormID),
	CONSTRAINT FK_PMH_Condition
		FOREIGN KEY (ConditionID)
			REFERENCES MedicalCondition (ConditionID)
);

-- Non-key indexes created by EF for the FK columns.
CREATE INDEX IX_AdminSession_AdminID ON AdminSession (AdminID);
CREATE INDEX IX_WellnessForm_PatientID ON WellnessForm (PatientID);
CREATE INDEX IX_WellnessForm_PhysicianID ON WellnessForm (PhysicianID);
CREATE INDEX IX_WellnessForm_CreatedByAdminID ON WellnessForm (CreatedByAdminID);
CREATE INDEX IX_WellnessForm_UpdatedByAdminID ON WellnessForm (UpdatedByAdminID);
CREATE INDEX IX_FamilyMedicalHistory_FormID ON FamilyMedicalHistory (FormID);
CREATE INDEX IX_FamilyMedicalHistory_ConditionID ON FamilyMedicalHistory (ConditionID);
CREATE INDEX IX_PastMedicalHistory_FormID ON PastMedicalHistory (FormID);
CREATE INDEX IX_PastMedicalHistory_ConditionID ON PastMedicalHistory (ConditionID);

*/