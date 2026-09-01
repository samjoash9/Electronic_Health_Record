-- Electronic Health Record - full schema, runnable.
-- Matches EF migrations through 20260901053000_RemovePasswordAlgo.
-- Run against an empty database. Tables are created parent-first so the FKs resolve.
--
-- Roles: staff accounts (SuperAdmin, Admin) live in Admin; physicians live in Physician with
-- their own optional credentials. A wellness form goes Draft -> PendingSignature -> Signed, and
-- only the assigned physician may sign it. See docs/role-based-access-spec.pdf.


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

-- Two things at once: a directory entry (name + PRC licence, created from the Doctors page)
-- and, optionally, a login account. Being in this table IS the Physician role.
CREATE TABLE Physician (
	PhysicianID INT PRIMARY KEY IDENTITY(1, 1),
	Surname NVARCHAR(50) NOT NULL,
	FirstName NVARCHAR(50) NOT NULL,
	MiddleName NVARCHAR(50) NULL,
	PRCLicenseNo NVARCHAR(20) NOT NULL UNIQUE,

	-- credentials: NULL until a SuperAdmin grants portal access. A physician without them can
	-- be assigned a form but can never sign one.
	Username NVARCHAR(30) NULL,
	Email NVARCHAR(255) NULL,
	PasswordHash NVARCHAR(255) NULL,
	IsActive BIT NOT NULL DEFAULT 1,
	MustChangePassword BIT NOT NULL DEFAULT 0,
	LastLoginAt DATETIME2 NULL,

	CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
	UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

	-- all three credential columns together, or none of them
	CONSTRAINT CK_Physician_CredentialSet CHECK (
		(Username IS NULL AND Email IS NULL AND PasswordHash IS NULL)
		OR (Username IS NOT NULL AND Email IS NOT NULL AND PasswordHash IS NOT NULL)
	)
);

-- filtered so the many credential-less directory rows do not collide on NULL
CREATE UNIQUE INDEX UQ_Physician_Username ON Physician(Username) WHERE Username IS NOT NULL;
CREATE UNIQUE INDEX UQ_Physician_Email    ON Physician(Email)    WHERE Email    IS NOT NULL;

-- Staff accounts only. 'Physician' is deliberately not a legal Role: that is what structurally
-- prevents a staff account from ever presenting a physician identity to the signing endpoint.
CREATE TABLE Admin (
	AdminID INT PRIMARY KEY IDENTITY(1, 1),
	Username NVARCHAR(30) NOT NULL UNIQUE,
	Email NVARCHAR(255) NOT NULL UNIQUE,
	-- The hash identifies its own scheme, so there is no companion "algorithm" column:
	--   64 lowercase hex chars     -> legacy unsalted SHA-256 (what DbSeeder writes)
	--   84-char Base64 'AQAAAA...' -> PBKDF2, via ASP.NET's PasswordHasher<T>
	-- Login can verify a legacy hash and rewrite it in place, with no password reset.
	PasswordHash NVARCHAR(255) NOT NULL,
	FullName NVARCHAR(100) NOT NULL,
	Role VARCHAR(20) NOT NULL DEFAULT 'Admin',
	IsActive BIT NOT NULL DEFAULT 1,
	MustChangePassword BIT NOT NULL DEFAULT 0,
	LastLoginAt DATETIME2 NULL,
	CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
	UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

	CONSTRAINT CK_Admin_Role CHECK (Role IN ('SuperAdmin', 'Admin'))
);

-- One session table for both kinds of principal, so authenticating a request is a single
-- index seek rather than a union across two tables.
-- TokenHash is SHA-256 of the bearer token as lowercase hex (exactly 64 chars): the raw token
-- is returned to the client once at login and never stored, so a DB dump is not a session dump.
CREATE TABLE UserSession (
	SessionID INT PRIMARY KEY IDENTITY(1, 1),
	AdminID INT NULL,
	PhysicianID INT NULL,
	TokenHash CHAR(64) NOT NULL UNIQUE,
	ExpiresAt DATETIME2 NOT NULL,
	RevokedAt DATETIME2 NULL,
	CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

	CONSTRAINT FK_UserSession_Admin
		FOREIGN KEY (AdminID)
			REFERENCES Admin(AdminID),

	CONSTRAINT FK_UserSession_Physician
		FOREIGN KEY (PhysicianID)
			REFERENCES Physician(PhysicianID),

	-- exactly one principal. spelled out longhand because T-SQL has no boolean type, so the
	-- natural "(AdminID IS NULL) <> (PhysicianID IS NULL)" is a syntax error.
	CONSTRAINT CK_UserSession_ExactlyOnePrincipal CHECK (
		(AdminID IS NOT NULL AND PhysicianID IS NULL)
		OR (AdminID IS NULL AND PhysicianID IS NOT NULL)
	)
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
	-- who MUST sign: a routing decision the Admin makes and may change.
	-- NULL while the form is still a draft and nobody has been assigned yet.
	AssignedPhysicianID INT NULL,
	-- who DID sign: a clinical attestation, written once by the sign endpoint and never
	-- rewritten. Kept separate from the assignment so reassigning a signed form cannot
	-- silently forge its signer.
	SignedByPhysicianID INT NULL,
	-- 'Draft' -> 'PendingSignature' -> 'Signed'
	-- NOTE: on a DB built by EF migrations this column sits last physically,
	-- because it was added by ALTER TABLE. Listed here for readability.
	Status VARCHAR(20) NOT NULL DEFAULT 'Draft',
	-- the signing physician's signature as a base64 data URL, written only by the sign endpoint
	-- NOTE: like Status, these two sit last physically on an EF-migrated DB (added by ALTER TABLE).
	Signature NVARCHAR(MAX) NULL,
	SignedAt DATETIME2 NULL,
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

	-- FOREIGN KEYS
	CONSTRAINT FK_WellnessForm_Patient
		FOREIGN KEY (PatientID)
			REFERENCES Patient(PatientID),

	CONSTRAINT FK_WellnessForm_AssignedPhysician
		FOREIGN KEY (AssignedPhysicianID)
			REFERENCES Physician(PhysicianID),

	CONSTRAINT FK_WellnessForm_SignedByPhysician
		FOREIGN KEY (SignedByPhysicianID)
			REFERENCES Physician(PhysicianID),

	-- authorship is always staff: physicians sign forms, they never author them
	CONSTRAINT FK_WellnessForm_CreatedByAdmin
		FOREIGN KEY (CreatedByAdminID)
			REFERENCES Admin(AdminID)
			ON DELETE SET NULL,

	CONSTRAINT FK_WellnessForm_UpdatedByAdmin
		FOREIGN KEY (UpdatedByAdminID)
			REFERENCES Admin(AdminID)
			ON DELETE NO ACTION,

	CONSTRAINT CK_WellnessForm_Status
		CHECK (Status IN ('Draft', 'PendingSignature', 'Signed')),

	-- once a form leaves Draft it has been routed to a named physician
	CONSTRAINT CK_WellnessForm_AssignedWhenPending
		CHECK (Status = 'Draft' OR AssignedPhysicianID IS NOT NULL),

	-- a signed form is a finalised clinical record: it carries all four facts together, or
	-- none of them, so a partial write cannot fabricate an attestation
	CONSTRAINT CK_WellnessForm_SignedIntegrity
		CHECK (Status <> 'Signed' OR (
			AssignedPhysicianID IS NOT NULL
			AND SignedByPhysicianID IS NOT NULL
			AND Signature IS NOT NULL
			AND SignedAt IS NOT NULL
		))
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
CREATE INDEX IX_UserSession_AdminID ON UserSession (AdminID);
CREATE INDEX IX_UserSession_PhysicianID ON UserSession (PhysicianID);
CREATE INDEX IX_WellnessForm_PatientID ON WellnessForm (PatientID);
CREATE INDEX IX_WellnessForm_AssignedPhysicianID ON WellnessForm (AssignedPhysicianID);
CREATE INDEX IX_WellnessForm_SignedByPhysicianID ON WellnessForm (SignedByPhysicianID);
CREATE INDEX IX_WellnessForm_CreatedByAdminID ON WellnessForm (CreatedByAdminID);
CREATE INDEX IX_WellnessForm_UpdatedByAdminID ON WellnessForm (UpdatedByAdminID);
CREATE INDEX IX_FamilyMedicalHistory_FormID ON FamilyMedicalHistory (FormID);
CREATE INDEX IX_FamilyMedicalHistory_ConditionID ON FamilyMedicalHistory (ConditionID);
CREATE INDEX IX_PastMedicalHistory_FormID ON PastMedicalHistory (FormID);
CREATE INDEX IX_PastMedicalHistory_ConditionID ON PastMedicalHistory (ConditionID);

-- Serves the physician's "awaiting my signature" queue, the most frequent query in the new flow.
CREATE INDEX IX_WellnessForm_Status_AssignedPhysicianID
	ON WellnessForm (Status, AssignedPhysicianID);

*/