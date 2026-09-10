using Microsoft.EntityFrameworkCore;
using Electronic_Health_Record.Server.Models;

namespace Electronic_Health_Record.Server.Data
{
    public class ElectronicHealthRecordDbContext : DbContext
    {
        public ElectronicHealthRecordDbContext(DbContextOptions<ElectronicHealthRecordDbContext> options)
            : base(options)
        {
        }

        public DbSet<Patient> Patients => Set<Patient>();
        public DbSet<Employee> Employees => Set<Employee>();
        public DbSet<Physician> Physicians => Set<Physician>();
        public DbSet<Admin> Admins => Set<Admin>();
        public DbSet<AdminSession> AdminSessions => Set<AdminSession>();
        public DbSet<WellnessForm> WellnessForms => Set<WellnessForm>();
        public DbSet<MedicalCondition> MedicalConditions => Set<MedicalCondition>();
        public DbSet<SocialHistory> SocialHistories => Set<SocialHistory>();
        public DbSet<FamilyMedicalHistory> FamilyMedicalHistories => Set<FamilyMedicalHistory>();
        public DbSet<PastMedicalHistory> PastMedicalHistories => Set<PastMedicalHistory>();
        public DbSet<Exercise> Exercises => Set<Exercise>();
        public DbSet<DentalAssessment> DentalAssessments => Set<DentalAssessment>();
        public DbSet<VisionAssessment> VisionAssessments => Set<VisionAssessment>();
        public DbSet<PhysicianSession> PhysicianSessions => Set<PhysicianSession>();
        public DbSet<PatientAccount> PatientAccounts => Set<PatientAccount>();
        public DbSet<PatientSession> PatientSessions => Set<PatientSession>();
        public DbSet<AssessmentCategory> AssessmentCategories => Set<AssessmentCategory>();
        public DbSet<AssessmentQuestion> AssessmentQuestions => Set<AssessmentQuestion>();
        public DbSet<AssessmentOption> AssessmentOptions => Set<AssessmentOption>();
        public DbSet<AssessmentAnswer> AssessmentAnswers => Set<AssessmentAnswer>();
        public DbSet<WellnessFormAuditLog> WellnessFormAuditLogs => Set<WellnessFormAuditLog>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Patient>(entity =>
            {
                entity.ToTable("Patient");
                entity.HasKey(p => p.PatientID);
                entity.Property(p => p.ExternalEmployeeId).HasMaxLength(50).IsRequired();
                entity.HasIndex(p => p.ExternalEmployeeId).IsUnique();
                entity.Property(p => p.Surname).HasMaxLength(50).IsRequired();
                entity.Property(p => p.FirstName).HasMaxLength(50).IsRequired();
                entity.Property(p => p.MiddleName).HasMaxLength(50);
                entity.Property(p => p.Birthdate).HasColumnType("date");
                // Wire value is the full word ("Male"/"Female"), not an M/F code --
                // see SEX_OPTIONS in src/lib/constants.js.
                entity.Property(p => p.Sex).HasMaxLength(10).IsUnicode(false).IsRequired();
                entity.Property(p => p.CivilStatus).HasMaxLength(20).IsUnicode(false).IsRequired();
                entity.Property(p => p.Address).HasMaxLength(255);
                entity.Property(p => p.AgencyOffice).HasMaxLength(100);
                entity.Property(p => p.Position).HasMaxLength(50);
                entity.Property(p => p.ContactNo).HasMaxLength(20).IsUnicode(false);
                entity.Property(p => p.LastSyncedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(p => p.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(p => p.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");
                // Station 1 employee search by name
                entity.HasIndex(p => new { p.Surname, p.FirstName });
            });

            // Local stand-in for the external HR API -- see Services/IEmployeeDirectory.
            modelBuilder.Entity<Employee>(entity =>
            {
                entity.ToTable("Employee");
                entity.HasKey(e => e.EmployeeID);
                entity.Property(e => e.ExternalEmployeeId).HasMaxLength(50).IsRequired();
                entity.HasIndex(e => e.ExternalEmployeeId).IsUnique();
                entity.Property(e => e.Surname).HasMaxLength(50).IsRequired();
                entity.Property(e => e.FirstName).HasMaxLength(50).IsRequired();
                entity.Property(e => e.MiddleName).HasMaxLength(50);
                entity.Property(e => e.Birthdate).HasColumnType("date");
                entity.Property(e => e.Sex).HasMaxLength(10).IsUnicode(false).IsRequired();
                entity.Property(e => e.CivilStatus).HasMaxLength(20).IsUnicode(false).IsRequired();
                entity.Property(e => e.Address).HasMaxLength(255);
                entity.Property(e => e.AgencyOffice).HasMaxLength(100);
                entity.Property(e => e.Position).HasMaxLength(50);
                entity.Property(e => e.ContactNo).HasMaxLength(20).IsUnicode(false);
                // Existing rows all came from the seeded HR stand-in, so false.
                entity.Property(e => e.IsLocallyAdded).HasDefaultValue(false).IsRequired();
                entity.HasIndex(e => new { e.Surname, e.FirstName });
            });

            modelBuilder.Entity<Physician>(entity =>
            {
                entity.ToTable("Physician");
                entity.HasKey(p => p.PhysicianID);
                entity.Property(p => p.Username).HasMaxLength(30).IsRequired();
                entity.HasIndex(p => p.Username).IsUnique();
                entity.Property(p => p.PasswordHash).HasMaxLength(255).IsRequired();
                // Onboarded doctors start on an admin-issued password, so the safe
                // default for a row nobody set this on is "still owes a change".
                entity.Property(p => p.MustChangePassword).HasDefaultValue(true).IsRequired();
                entity.Property(p => p.Surname).HasMaxLength(50).IsRequired();
                entity.Property(p => p.FirstName).HasMaxLength(50).IsRequired();
                entity.Property(p => p.MiddleName).HasMaxLength(50);
                entity.Property(p => p.PRCLicenseNo).HasMaxLength(20).IsRequired();
                entity.HasIndex(p => p.PRCLicenseNo).IsUnique();
                entity.Property(p => p.ContactNo).HasMaxLength(20).IsUnicode(false);
                entity.Property(p => p.IsActive).HasDefaultValue(true).IsRequired();
                entity.Property(p => p.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(p => p.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");
            });

            modelBuilder.Entity<Admin>(entity =>
            {
                entity.ToTable("Admin", t => t.HasCheckConstraint(
                    "CK_Admin_Role", "Role IN ('admin', 'superadmin')"));
                entity.HasKey(a => a.AdminID);
                entity.Property(a => a.Username).HasMaxLength(30).IsRequired();
                entity.Property(a => a.Role)
                    .HasMaxLength(20)
                    .IsUnicode(false)
                    .HasDefaultValue(AdminRoles.Admin)
                    .IsRequired();
                // shared office lines are common, so this is deliberately not unique
                entity.Property(a => a.ContactNo).HasMaxLength(20).IsUnicode(false);
                entity.Property(a => a.PasswordHash).HasMaxLength(255).IsRequired();
                // Onboarded admins start on a superadmin-issued password, so the safe
                // default for a row nobody set this on is "still owes a change".
                entity.Property(a => a.MustChangePassword).HasDefaultValue(true).IsRequired();
                entity.Property(a => a.FullName).HasMaxLength(100).IsRequired();
                entity.Property(a => a.IsActive).HasDefaultValue(true).IsRequired();
                entity.Property(a => a.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(a => a.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.HasIndex(a => a.Username).IsUnique();
            });

            modelBuilder.Entity<AdminSession>(entity =>
            {
                entity.ToTable("AdminSession");
                entity.HasKey(s => s.SessionID);
                entity.Property(s => s.TokenHash).HasColumnType("char(64)").IsRequired();
                entity.Property(s => s.ExpiresAt).IsRequired();
                entity.Property(s => s.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.HasIndex(s => s.TokenHash).IsUnique();

                entity.HasOne<Admin>()
                    .WithMany()
                    .HasForeignKey(s => s.AdminID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Doctors log in at Station 3, so they need sessions of their own.
            // Same shape and lifetime rules as AdminSession.
            modelBuilder.Entity<PhysicianSession>(entity =>
            {
                entity.ToTable("PhysicianSession");
                entity.HasKey(s => s.SessionID);
                entity.Property(s => s.TokenHash).HasColumnType("char(64)").IsRequired();
                entity.Property(s => s.ExpiresAt).IsRequired();
                entity.Property(s => s.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.HasIndex(s => s.TokenHash).IsUnique();

                entity.HasOne<Physician>()
                    .WithMany()
                    .HasForeignKey(s => s.PhysicianID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Provisioned when Station 1 first registers an employee; the patient
            // activates it later to check the status of their form.
            modelBuilder.Entity<PatientAccount>(entity =>
            {
                entity.ToTable("PatientAccount", t =>
                {
                    t.HasCheckConstraint(
                        "CK_PatientAccount_Activation",
                        "Status <> 'Active' OR (PasswordHash IS NOT NULL AND ActivatedAt IS NOT NULL)");
                    // A rotation can only be owed on a password that exists, so a
                    // provisioned account with no hash can never carry the flag.
                    t.HasCheckConstraint(
                        "CK_PatientAccount_MustChangePassword",
                        "MustChangePassword = 0 OR PasswordHash IS NOT NULL");
                });
                entity.HasKey(a => a.PatientAccountID);
                entity.Property(a => a.Username).HasMaxLength(30).IsRequired();
                entity.HasIndex(a => a.Username).IsUnique();
                entity.Property(a => a.PasswordHash).HasMaxLength(255);
                // Unlike Admin and Physician this defaults to false: a provisioned
                // account has no password yet, so nothing is owed until an admin
                // issues a default or resets one.
                entity.Property(a => a.MustChangePassword).HasDefaultValue(false).IsRequired();
                entity.Property(a => a.Status)
                    .HasMaxLength(20)
                    .IsUnicode(false)
                    .HasDefaultValue("Provisioned")
                    .IsRequired();
                entity.Property(a => a.ProvisionedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(a => a.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(a => a.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");

                // one account per employee, reused across every visit
                entity.HasOne<Patient>()
                    .WithOne()
                    .HasForeignKey<PatientAccount>(a => a.PatientID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<PatientSession>(entity =>
            {
                entity.ToTable("PatientSession");
                entity.HasKey(s => s.SessionID);
                entity.Property(s => s.TokenHash).HasColumnType("char(64)").IsRequired();
                entity.Property(s => s.ExpiresAt).IsRequired();
                entity.Property(s => s.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.HasIndex(s => s.TokenHash).IsUnique();

                entity.HasOne<PatientAccount>()
                    .WithMany()
                    .HasForeignKey(s => s.PatientAccountID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<WellnessForm>(entity =>
            {
                entity.ToTable("WellnessForm", t =>
                {
                    t.HasCheckConstraint("CK_WellnessForm_Status",
                        "Status IN ('PendingAssessment', 'PendingConsultation', 'PendingDental', 'PendingVision', 'Completed', 'Cancelled')");
                    t.HasCheckConstraint("CK_WellnessForm_CurrentStation",
                        "CurrentStation IN (1, 2, 3, 4, 5)");
                    // a completed form must be signed by a named physician
                    t.HasCheckConstraint("CK_WellnessForm_CompletedIsSigned",
                        "Status <> 'Completed' OR (PhysicianID IS NOT NULL AND Signature IS NOT NULL AND SignedAt IS NOT NULL)");
                    // Station 4 owns the transition to Completed, so a completed
                    // form carries the dentist's signature as well as the
                    // physician's. CK_WellnessForm_CompletedIsSigned above still
                    // holds: Station 3 runs strictly before completion now.
                    // CurrentStation < 4 exempts forms completed before the
                    // dental station existed (Station 3 used to complete the
                    // form directly) -- those rows can never gain dental data.
                    t.HasCheckConstraint("CK_WellnessForm_CompletedIsDentalSigned",
                        "Status <> 'Completed' OR CurrentStation < 4 OR (DentistID IS NOT NULL AND DentalSignature IS NOT NULL AND DentalSignedAt IS NOT NULL)");
                    // Station 5 now owns the transition to Completed, so a
                    // completed form carries the optometrist's signature too.
                    // CurrentStation < 5 exempts forms completed before the
                    // vision station existed (Station 4 used to complete the
                    // form directly) -- those rows can never gain vision data.
                    t.HasCheckConstraint("CK_WellnessForm_CompletedIsVisionSigned",
                        "Status <> 'Completed' OR CurrentStation < 5 OR (OptometristID IS NOT NULL AND VisionSignature IS NOT NULL AND VisionSignedAt IS NOT NULL)");
                });
                entity.HasKey(w => w.FormID);
                entity.Property(w => w.Status)
                    .HasMaxLength(20)
                    .IsUnicode(false)
                    .HasDefaultValue("PendingAssessment")
                    .IsRequired();
                entity.Property(w => w.CurrentStation).HasDefaultValue((byte)1).IsRequired();
                entity.Property(w => w.RowVersion).IsRowVersion();
                entity.Property(w => w.FormDate)
                    .HasColumnType("date")
                    .HasDefaultValueSql("CAST(SYSDATETIME() AS date)");
                entity.Property(w => w.WeightKg).HasPrecision(5, 2);
                entity.Property(w => w.HeightCm).HasPrecision(5, 2);
                entity.Property(w => w.BMI).HasPrecision(5, 2);
                entity.Property(w => w.IdealBMI).HasPrecision(5, 2);
                entity.Property(w => w.TempCelsius).HasPrecision(3, 1);
                // free-text clinical fields: doctors run past a few hundred characters
                entity.Property(w => w.RecommendedDiagnosticTest);
                entity.Property(w => w.ImpressionClinical);
                entity.Property(w => w.ManagementTreatment);
                entity.Property(w => w.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(w => w.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");

                entity.HasOne<Patient>()
                    .WithMany()
                    .HasForeignKey(w => w.PatientID)
                    .OnDelete(DeleteBehavior.Restrict);

                // optional: a draft may not have a physician assigned yet
                entity.HasOne<Physician>()
                    .WithMany()
                    .HasForeignKey(w => w.PhysicianID)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<Admin>()
                    .WithMany()
                    .HasForeignKey(w => w.Station1AdminID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<Admin>()
                    .WithMany()
                    .HasForeignKey(w => w.Station2AdminID)
                    .OnDelete(DeleteBehavior.Restrict);

                // optional: only set once Station 4 submits
                entity.HasOne<Physician>()
                    .WithMany()
                    .HasForeignKey(w => w.DentistID)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                // optional: only set once Station 5 submits
                entity.HasOne<Physician>()
                    .WithMany()
                    .HasForeignKey(w => w.OptometristID)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<Admin>()
                    .WithMany()
                    .HasForeignKey(w => w.CreatedByAdminID)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne<Admin>()
                    .WithMany()
                    .HasForeignKey(w => w.UpdatedByAdminID)
                    .OnDelete(DeleteBehavior.Restrict);

                // each station lists the forms waiting for it, newest first
                entity.HasIndex(w => new { w.Status, w.FormDate })
                    .HasDatabaseName("IX_WellnessForm_Status_FormDate");
                // patient portal: "my visits, newest first"
                entity.HasIndex(w => new { w.PatientID, w.FormDate })
                    .HasDatabaseName("IX_WellnessForm_PatientID_FormDate");
            });

            modelBuilder.Entity<MedicalCondition>(entity =>
            {
                entity.ToTable("MedicalCondition");
                entity.HasKey(c => c.ConditionID);
                entity.Property(c => c.ConditionName).HasMaxLength(50).IsRequired();
                entity.HasIndex(c => c.ConditionName).IsUnique();
                entity.Property(c => c.ConditionType).HasMaxLength(100).IsRequired(false);

                // The fixed condition list Station 3's family-history checkbox grid
                // binds to. IDs, names, and order must match FAMILY_CONDITIONS in
                // src/lib/constants.js exactly -- the client hardcodes that array
                // rather than reading it from /api/medicalconditions, so any drift
                // here silently desyncs the form. "NONE" (id 1) and "Others" are
                // handled client-side (Others sends ConditionID null with free text
                // in ConditionOther), so this table only needs the 10 named conditions.
                // ConditionID 6 used to be "TUBERCULOSIS" alone; it now covers what
                // was id 7 ("BRONCHIAL ASTHMA") too under one merged
                // "RESPIRATORY ILLNESS" condition, so id 7 is retired, not reused.
                entity.HasData(
                    new MedicalCondition { ConditionID = 1, ConditionName = "NONE" },
                    new MedicalCondition { ConditionID = 2, ConditionName = "HYPERTENSION (Heart Attack)" },
                    new MedicalCondition { ConditionID = 3, ConditionName = "MENTAL HEALTH CONDITION" },
                    new MedicalCondition { ConditionID = 4, ConditionName = "DIABETES MELLITUS" },
                    new MedicalCondition { ConditionID = 5, ConditionName = "CANCER (Breast/Ovarian/Colon, etc.)" },
                    new MedicalCondition { ConditionID = 6, ConditionName = "RESPIRATORY ILLNESS" },
                    new MedicalCondition { ConditionID = 8, ConditionName = "KIDNEY DISEASE" },
                    new MedicalCondition { ConditionID = 9, ConditionName = "LIVER DISEASE" },
                    new MedicalCondition { ConditionID = 10, ConditionName = "ARTHRITIS" },
                    new MedicalCondition { ConditionID = 11, ConditionName = "REPRODUCTIVE HEALTH PROBLEM" }
                );
            });

            modelBuilder.Entity<SocialHistory>(entity =>
            {
                entity.ToTable("SocialHistory");
                entity.HasKey(s => s.SocialHistoryID);
                entity.Property(s => s.CigaretteSticksPerDay).HasMaxLength(20);
                entity.Property(s => s.CigaretteFrequency).HasMaxLength(50);
                entity.Property(s => s.CigaretteYearStarted).HasMaxLength(4);
                entity.Property(s => s.CigarettePuffsPerDay).HasMaxLength(20);
                entity.Property(s => s.EcigPodsPerMonth).HasMaxLength(20);
                entity.Property(s => s.EcigFrequency).HasMaxLength(50);
                entity.Property(s => s.EcigYearStarted).HasMaxLength(4);
                entity.Property(s => s.EcigPuffsPerDay).HasMaxLength(20);
                entity.Property(s => s.AlcoholType).HasMaxLength(50);
                entity.Property(s => s.DrinkFrequency).HasMaxLength(50);
                entity.Property(s => s.DrinksPerSession).HasMaxLength(20);
                entity.Property(s => s.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(s => s.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");

                entity.HasOne<WellnessForm>()
                    .WithOne()
                    .HasForeignKey<SocialHistory>(s => s.FormID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Exercise>(entity =>
            {
                entity.ToTable("Exercise");
                entity.HasKey(e => e.ExerciseID);
                entity.Property(e => e.ExerciseType).IsRequired().HasMaxLength(100);
                entity.Property(e => e.ExerciseFrequency).HasMaxLength(50);
                entity.Property(e => e.ExerciseYearStarted).HasMaxLength(4);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");

                entity.HasOne<WellnessForm>()
                    .WithMany()
                    .HasForeignKey(e => e.FormID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<DentalAssessment>(entity =>
            {
                // Option text is duplicated from DENTAL_INDICATORS in
                // src/lib/constants.js. The client hardcodes that array rather
                // than fetching it, so these strings and that file must stay in
                // lockstep -- a mismatch fails the insert at submit time rather
                // than at build time. The en dashes in '6–12 months',
                // 'Present – refer for evaluation', 'Yes – satisfactory' and
                // 'Yes – needs assessment' are U+2013, not hyphens.
                entity.ToTable("DentalAssessment", t =>
                {
                    t.HasCheckConstraint("CK_DentalAssessment_OralHygieneStatus",
                        "OralHygieneStatus IS NULL OR OralHygieneStatus IN ('Good', 'Fair', 'Poor')");
                    t.HasCheckConstraint("CK_DentalAssessment_DentalCaries",
                        "DentalCaries IS NULL OR DentalCaries IN ('None', 'Present')");
                    t.HasCheckConstraint("CK_DentalAssessment_GumCondition",
                        "GumCondition IS NULL OR GumCondition IN ('Healthy', 'Gingivitis', 'Suspected Periodontal Problem')");
                    t.HasCheckConstraint("CK_DentalAssessment_ToothStatus",
                        "ToothStatus IS NULL OR ToothStatus IN ('Complete/Functional', 'Missing Teeth', 'Needs Dental Treatment')");
                    t.HasCheckConstraint("CK_DentalAssessment_ToothachePain",
                        "ToothachePain IS NULL OR ToothachePain IN ('No', 'Yes')");
                    t.HasCheckConstraint("CK_DentalAssessment_OralLesions",
                        "OralLesions IS NULL OR OralLesions IN ('None', 'Present – refer for evaluation')");
                    t.HasCheckConstraint("CK_DentalAssessment_DentureUse",
                        "DentureUse IS NULL OR DentureUse IN ('None', 'Yes – satisfactory', 'Yes – needs assessment')");
                    t.HasCheckConstraint("CK_DentalAssessment_DentalTreatmentNeed",
                        "DentalTreatmentNeed IS NULL OR DentalTreatmentNeed IN ('None', 'Preventive Care', 'Restorative Treatment', 'Extraction', 'Other')");
                    t.HasCheckConstraint("CK_DentalAssessment_LastDentalVisit",
                        "LastDentalVisit IS NULL OR LastDentalVisit IN ('Within 6 months', '6–12 months', 'More than 1 year', 'Never')");
                    t.HasCheckConstraint("CK_DentalAssessment_DentalReferral",
                        "DentalReferral IS NULL OR DentalReferral IN ('Not needed', 'Routine referral', 'Urgent referral')");
                });
                entity.HasKey(d => d.DentalAssessmentID);

                entity.Property(d => d.OralHygieneStatus).HasMaxLength(50);
                entity.Property(d => d.DentalCaries).HasMaxLength(50);
                entity.Property(d => d.GumCondition).HasMaxLength(50);
                entity.Property(d => d.ToothStatus).HasMaxLength(50);
                entity.Property(d => d.ToothachePain).HasMaxLength(50);
                entity.Property(d => d.OralLesions).HasMaxLength(50);
                entity.Property(d => d.DentureUse).HasMaxLength(50);
                entity.Property(d => d.DentalTreatmentNeed).HasMaxLength(50);
                entity.Property(d => d.LastDentalVisit).HasMaxLength(50);
                entity.Property(d => d.DentalReferral).HasMaxLength(50);

                entity.Property(d => d.OralHygieneStatusRemarks).HasMaxLength(300);
                entity.Property(d => d.DentalCariesRemarks).HasMaxLength(300);
                entity.Property(d => d.GumConditionRemarks).HasMaxLength(300);
                entity.Property(d => d.ToothStatusRemarks).HasMaxLength(300);
                entity.Property(d => d.ToothachePainRemarks).HasMaxLength(300);
                entity.Property(d => d.OralLesionsRemarks).HasMaxLength(300);
                entity.Property(d => d.DentureUseRemarks).HasMaxLength(300);
                entity.Property(d => d.DentalTreatmentNeedRemarks).HasMaxLength(300);
                entity.Property(d => d.LastDentalVisitRemarks).HasMaxLength(300);
                entity.Property(d => d.DentalReferralRemarks).HasMaxLength(300);

                entity.Property(d => d.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(d => d.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");

                // one dental screening per form, same shape as SocialHistory
                entity.HasOne<WellnessForm>()
                    .WithOne()
                    .HasForeignKey<DentalAssessment>(d => d.FormID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<VisionAssessment>(entity =>
            {
                // Option text is duplicated from VISION_INDICATORS in
                // src/lib/constants.js. The client hardcodes that array rather
                // than fetching it, so these strings and that file must stay in
                // lockstep -- a mismatch fails the insert at submit time rather
                // than at build time.
                entity.ToTable("VisionAssessment", t =>
                {
                    t.HasCheckConstraint("CK_VisionAssessment_HistoryOfEyeProblems",
                        "HistoryOfEyeProblems IS NULL OR HistoryOfEyeProblems IN ('No', 'Yes')");
                    t.HasCheckConstraint("CK_VisionAssessment_EyePainDiscomfort",
                        "EyePainDiscomfort IS NULL OR EyePainDiscomfort IN ('No', 'Yes')");
                    t.HasCheckConstraint("CK_VisionAssessment_BlurredVision",
                        "BlurredVision IS NULL OR BlurredVision IN ('No', 'Yes')");
                    t.HasCheckConstraint("CK_VisionAssessment_DifficultySeeingNear",
                        "DifficultySeeingNear IS NULL OR DifficultySeeingNear IN ('No', 'Yes')");
                    t.HasCheckConstraint("CK_VisionAssessment_DifficultySeeingDistant",
                        "DifficultySeeingDistant IS NULL OR DifficultySeeingDistant IN ('No', 'Yes')");
                    t.HasCheckConstraint("CK_VisionAssessment_HeadacheEyeStrain",
                        "HeadacheEyeStrain IS NULL OR HeadacheEyeStrain IN ('No', 'Yes')");
                    t.HasCheckConstraint("CK_VisionAssessment_UsesEyeglassesContactLenses",
                        "UsesEyeglassesContactLenses IS NULL OR UsesEyeglassesContactLenses IN ('No', 'Yes')");
                    // VisualAcuityRightEye / VisualAcuityLeftEye are free text
                    // (e.g. "20/20"), so no CHECK constraint constrains them.
                    t.HasCheckConstraint("CK_VisionAssessment_EyeConditionIdentified",
                        "EyeConditionIdentified IS NULL OR EyeConditionIdentified IN ('None', 'Refractive error', 'Other')");
                    t.HasCheckConstraint("CK_VisionAssessment_CorrectiveLensesRecommended",
                        "CorrectiveLensesRecommended IS NULL OR CorrectiveLensesRecommended IN ('No', 'Yes')");
                    t.HasCheckConstraint("CK_VisionAssessment_ReferralToEyeSpecialist",
                        "ReferralToEyeSpecialist IS NULL OR ReferralToEyeSpecialist IN ('No', 'Yes')");
                    t.HasCheckConstraint("CK_VisionAssessment_FollowUpConsultationAdvised",
                        "FollowUpConsultationAdvised IS NULL OR FollowUpConsultationAdvised IN ('No', 'Yes')");
                });
                entity.HasKey(v => v.VisionAssessmentID);

                entity.Property(v => v.HistoryOfEyeProblems).HasMaxLength(50);
                entity.Property(v => v.EyePainDiscomfort).HasMaxLength(50);
                entity.Property(v => v.BlurredVision).HasMaxLength(50);
                entity.Property(v => v.DifficultySeeingNear).HasMaxLength(50);
                entity.Property(v => v.DifficultySeeingDistant).HasMaxLength(50);
                entity.Property(v => v.HeadacheEyeStrain).HasMaxLength(50);
                entity.Property(v => v.UsesEyeglassesContactLenses).HasMaxLength(50);
                entity.Property(v => v.VisualAcuityRightEye).HasMaxLength(50);
                entity.Property(v => v.VisualAcuityLeftEye).HasMaxLength(50);
                entity.Property(v => v.EyeConditionIdentified).HasMaxLength(50);
                entity.Property(v => v.EyeConditionOther).HasMaxLength(100);
                entity.Property(v => v.CorrectiveLensesRecommended).HasMaxLength(50);
                entity.Property(v => v.ReferralToEyeSpecialist).HasMaxLength(50);
                entity.Property(v => v.FollowUpConsultationAdvised).HasMaxLength(50);

                entity.Property(v => v.HistoryOfEyeProblemsRemarks).HasMaxLength(300);
                entity.Property(v => v.EyePainDiscomfortRemarks).HasMaxLength(300);
                entity.Property(v => v.BlurredVisionRemarks).HasMaxLength(300);
                entity.Property(v => v.DifficultySeeingNearRemarks).HasMaxLength(300);
                entity.Property(v => v.DifficultySeeingDistantRemarks).HasMaxLength(300);
                entity.Property(v => v.HeadacheEyeStrainRemarks).HasMaxLength(300);
                entity.Property(v => v.UsesEyeglassesContactLensesRemarks).HasMaxLength(300);
                entity.Property(v => v.VisualAcuityRightEyeRemarks).HasMaxLength(300);
                entity.Property(v => v.VisualAcuityLeftEyeRemarks).HasMaxLength(300);
                entity.Property(v => v.EyeConditionIdentifiedRemarks).HasMaxLength(300);
                entity.Property(v => v.CorrectiveLensesRecommendedRemarks).HasMaxLength(300);
                entity.Property(v => v.ReferralToEyeSpecialistRemarks).HasMaxLength(300);
                entity.Property(v => v.FollowUpConsultationAdvisedRemarks).HasMaxLength(300);

                entity.Property(v => v.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(v => v.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");

                // one vision screening per form, same shape as SocialHistory / DentalAssessment
                entity.HasOne<WellnessForm>()
                    .WithOne()
                    .HasForeignKey<VisionAssessment>(v => v.FormID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<FamilyMedicalHistory>(entity =>
            {
                entity.ToTable("FamilyMedicalHistory");
                entity.HasKey(f => f.FMHID);
                entity.Property(f => f.ConditionOther).HasMaxLength(100);
                entity.Property(f => f.IsNone).HasDefaultValue(false);
                entity.Property(f => f.ConditionType).HasMaxLength(300);
                entity.Property(f => f.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(f => f.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");

                entity.HasOne<WellnessForm>()
                    .WithMany()
                    .HasForeignKey(f => f.FormID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<MedicalCondition>()
                    .WithMany()
                    .HasForeignKey(f => f.ConditionID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<PastMedicalHistory>(entity =>
            {
                entity.ToTable("PastMedicalHistory");
                entity.HasKey(p => p.PMHID);
                entity.Property(p => p.ConditionOther).HasMaxLength(100);
                entity.Property(p => p.MaintenanceDrugGeneric).HasMaxLength(100);
                entity.Property(p => p.Dosage).HasMaxLength(20);
                entity.Property(p => p.Frequency).HasMaxLength(50);
                entity.Property(p => p.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(p => p.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");

                entity.HasOne<WellnessForm>()
                    .WithMany()
                    .HasForeignKey(p => p.FormID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<MedicalCondition>()
                    .WithMany()
                    .HasForeignKey(p => p.ConditionID)
                    .OnDelete(DeleteBehavior.Restrict);
            });
            modelBuilder.Entity<AssessmentCategory>(entity =>
            {
                entity.ToTable("AssessmentCategory");
                entity.HasKey(c => c.CategoryID);
                entity.Property(c => c.Name).HasMaxLength(50).IsRequired();
                entity.HasIndex(c => c.Name).IsUnique();

                // Renamed from the original "X Health" names and expanded from four
                // sections to seven; CategoryIDs 1-4 keep their original identity
                // (existing questions/answers still resolve) and only gain new
                // DisplayOrder values, 5-7 are new sections appended after them.
                entity.HasData(
                    new AssessmentCategory { CategoryID = 3, Name = "Spiritual", DisplayOrder = 1 },
                    new AssessmentCategory { CategoryID = 5, Name = "Psychological", DisplayOrder = 2 },
                    new AssessmentCategory { CategoryID = 1, Name = "Mental", DisplayOrder = 3 },
                    new AssessmentCategory { CategoryID = 6, Name = "Emotional", DisplayOrder = 4 },
                    new AssessmentCategory { CategoryID = 2, Name = "Physical", DisplayOrder = 5 },
                    new AssessmentCategory { CategoryID = 7, Name = "Financial", DisplayOrder = 6 },
                    new AssessmentCategory { CategoryID = 4, Name = "Social", DisplayOrder = 7 }
                );
            });

            // Question rows are append-only: to reword one, set IsActive = false on
            // the old row and insert a new one, so historical forms keep rendering
            // the exact text the patient actually answered.
            modelBuilder.Entity<AssessmentQuestion>(entity =>
            {
                entity.ToTable("AssessmentQuestion");
                entity.HasKey(q => q.QuestionID);
                entity.Property(q => q.QuestionText).HasMaxLength(300).IsRequired();
                entity.Property(q => q.IsActive).HasDefaultValue(true).IsRequired();
                entity.Property(q => q.CreatedAt).HasDefaultValueSql("SYSDATETIME()");

                entity.HasOne<AssessmentCategory>()
                    .WithMany()
                    .HasForeignKey(q => q.CategoryID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasData(
                    new AssessmentQuestion { QuestionID =  1, CategoryID = 1, QuestionText = "How would you rate your current stress level?", DisplayOrder = 1, IsActive = true },
                    new AssessmentQuestion { QuestionID =  2, CategoryID = 1, QuestionText = "How many hours of sleep do you get on average?", DisplayOrder = 2, IsActive = true },
                    new AssessmentQuestion { QuestionID =  3, CategoryID = 1, QuestionText = "How would you describe your general mood lately?", DisplayOrder = 3, IsActive = true },
                    new AssessmentQuestion { QuestionID =  4, CategoryID = 1, QuestionText = "Do you experience frequent anxiety or worry?", DisplayOrder = 4, IsActive = true },
                    new AssessmentQuestion { QuestionID =  5, CategoryID = 1, QuestionText = "Do you have difficulty concentrating or focusing?", DisplayOrder = 5, IsActive = true },
                    new AssessmentQuestion { QuestionID =  6, CategoryID = 2, QuestionText = "Do you experience any chronic pain?", DisplayOrder = 1, IsActive = true },
                    new AssessmentQuestion { QuestionID =  7, CategoryID = 2, QuestionText = "How often do you feel fatigued during the day?", DisplayOrder = 2, IsActive = true },
                    new AssessmentQuestion { QuestionID =  8, CategoryID = 2, QuestionText = "How is your appetite?", DisplayOrder = 3, IsActive = true },
                    new AssessmentQuestion { QuestionID =  9, CategoryID = 2, QuestionText = "How regular are your bowel movements?", DisplayOrder = 4, IsActive = true },
                    new AssessmentQuestion { QuestionID = 10, CategoryID = 2, QuestionText = "Do you experience any urinary problems?", DisplayOrder = 5, IsActive = true },
                    new AssessmentQuestion { QuestionID = 11, CategoryID = 3, QuestionText = "Do you have a clear sense of purpose in life?", DisplayOrder = 1, IsActive = true },
                    new AssessmentQuestion { QuestionID = 12, CategoryID = 3, QuestionText = "Do you feel inner peace most of the time?", DisplayOrder = 2, IsActive = true },
                    new AssessmentQuestion { QuestionID = 13, CategoryID = 3, QuestionText = "Do you regularly practice gratitude?", DisplayOrder = 3, IsActive = true },
                    new AssessmentQuestion { QuestionID = 14, CategoryID = 4, QuestionText = "How would you rate your relationships with family and friends?", DisplayOrder = 1, IsActive = true },
                    new AssessmentQuestion { QuestionID = 15, CategoryID = 4, QuestionText = "How satisfied are you with your work-life balance?", DisplayOrder = 2, IsActive = true },
                    new AssessmentQuestion { QuestionID = 16, CategoryID = 4, QuestionText = "Do you have people you can rely on for support?", DisplayOrder = 3, IsActive = true },

                    // Spiritual (CategoryID 3) padded from three to five questions.
                    new AssessmentQuestion { QuestionID = 17, CategoryID = 3, QuestionText = "Do you find comfort in your faith or personal beliefs?", DisplayOrder = 4, IsActive = true },
                    new AssessmentQuestion { QuestionID = 18, CategoryID = 3, QuestionText = "Do you feel connected to something greater than yourself?", DisplayOrder = 5, IsActive = true },

                    // Social (CategoryID 4) padded from three to five questions.
                    new AssessmentQuestion { QuestionID = 19, CategoryID = 4, QuestionText = "How often do you feel isolated or left out?", DisplayOrder = 4, IsActive = true },
                    new AssessmentQuestion { QuestionID = 20, CategoryID = 4, QuestionText = "How often do you take part in social or community activities?", DisplayOrder = 5, IsActive = true },

                    // Psychological (CategoryID 5) — new section.
                    new AssessmentQuestion { QuestionID = 21, CategoryID = 5, QuestionText = "How would you rate your overall sense of self-worth?", DisplayOrder = 1, IsActive = true },
                    new AssessmentQuestion { QuestionID = 22, CategoryID = 5, QuestionText = "How well do you bounce back after a setback?", DisplayOrder = 2, IsActive = true },
                    new AssessmentQuestion { QuestionID = 23, CategoryID = 5, QuestionText = "How confident are you in making everyday decisions?", DisplayOrder = 3, IsActive = true },
                    new AssessmentQuestion { QuestionID = 24, CategoryID = 5, QuestionText = "Do you feel in control of your thoughts and reactions?", DisplayOrder = 4, IsActive = true },
                    new AssessmentQuestion { QuestionID = 25, CategoryID = 5, QuestionText = "How would you describe your outlook on the future?", DisplayOrder = 5, IsActive = true },

                    // Emotional (CategoryID 6) — new section.
                    new AssessmentQuestion { QuestionID = 26, CategoryID = 6, QuestionText = "How comfortable are you expressing your feelings to others?", DisplayOrder = 1, IsActive = true },
                    new AssessmentQuestion { QuestionID = 27, CategoryID = 6, QuestionText = "How often do you experience sudden mood swings?", DisplayOrder = 2, IsActive = true },
                    new AssessmentQuestion { QuestionID = 28, CategoryID = 6, QuestionText = "Do you have someone you can turn to when you feel emotionally overwhelmed?", DisplayOrder = 3, IsActive = true },
                    new AssessmentQuestion { QuestionID = 29, CategoryID = 6, QuestionText = "How often do you feel overwhelmed by your emotions?", DisplayOrder = 4, IsActive = true },
                    new AssessmentQuestion { QuestionID = 30, CategoryID = 6, QuestionText = "How often do you feel joy or contentment in daily life?", DisplayOrder = 5, IsActive = true },

                    // Financial (CategoryID 7) — new section.
                    new AssessmentQuestion { QuestionID = 31, CategoryID = 7, QuestionText = "How often do you feel stressed about money?", DisplayOrder = 1, IsActive = true },
                    new AssessmentQuestion { QuestionID = 32, CategoryID = 7, QuestionText = "How well can you meet your monthly expenses?", DisplayOrder = 2, IsActive = true },
                    new AssessmentQuestion { QuestionID = 33, CategoryID = 7, QuestionText = "Do you have savings set aside for emergencies?", DisplayOrder = 3, IsActive = true },
                    new AssessmentQuestion { QuestionID = 34, CategoryID = 7, QuestionText = "How often do you worry about outstanding debts?", DisplayOrder = 4, IsActive = true },
                    new AssessmentQuestion { QuestionID = 35, CategoryID = 7, QuestionText = "How confident are you in your financial future?", DisplayOrder = 5, IsActive = true }
                );
            });

            modelBuilder.Entity<AssessmentOption>(entity =>
            {
                entity.ToTable("AssessmentOption", t => t.HasCheckConstraint(
                    "CK_AssessmentOption_Score", "Score BETWEEN 1 AND 4"));
                entity.HasKey(o => o.OptionID);
                entity.Property(o => o.OptionText).HasMaxLength(100).IsRequired();

                entity.HasOne<AssessmentQuestion>()
                    .WithMany()
                    .HasForeignKey(o => o.QuestionID)
                    .OnDelete(DeleteBehavior.Restrict);

                // Score is 4 = best/healthiest down to 1 = worst on every question, so a
                // category score is just SUM(Score) and higher always means better.
                // NOTE: this is NOT the same as display order. Q2 (hours of sleep) scores
                // "7-8 hrs" highest and "More than 8 hrs" below it, so a score must never
                // be derived from an option position.
                entity.HasData(
                    new AssessmentOption { OptionID =  1, QuestionID =  1, OptionText = "None", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID =  2, QuestionID =  1, OptionText = "Mild", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID =  3, QuestionID =  1, OptionText = "Moderate", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID =  4, QuestionID =  1, OptionText = "Severe", Score = 1, DisplayOrder = 4 },
                    new AssessmentOption { OptionID =  5, QuestionID =  2, OptionText = "Less than 5 hrs", Score = 1, DisplayOrder = 1 },
                    new AssessmentOption { OptionID =  6, QuestionID =  2, OptionText = "5-6 hrs", Score = 2, DisplayOrder = 2 },
                    new AssessmentOption { OptionID =  7, QuestionID =  2, OptionText = "7-8 hrs", Score = 4, DisplayOrder = 3 },
                    new AssessmentOption { OptionID =  8, QuestionID =  2, OptionText = "More than 8 hrs", Score = 3, DisplayOrder = 4 },
                    new AssessmentOption { OptionID =  9, QuestionID =  3, OptionText = "Very Good", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 10, QuestionID =  3, OptionText = "Good", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 11, QuestionID =  3, OptionText = "Fair", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 12, QuestionID =  3, OptionText = "Poor", Score = 1, DisplayOrder = 4 },
                    new AssessmentOption { OptionID = 13, QuestionID =  4, OptionText = "Never", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 14, QuestionID =  4, OptionText = "Rarely", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 15, QuestionID =  4, OptionText = "Sometimes", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 16, QuestionID =  4, OptionText = "Often", Score = 1, DisplayOrder = 4 },
                    new AssessmentOption { OptionID = 17, QuestionID =  5, OptionText = "Never", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 18, QuestionID =  5, OptionText = "Rarely", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 19, QuestionID =  5, OptionText = "Sometimes", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 20, QuestionID =  5, OptionText = "Often", Score = 1, DisplayOrder = 4 },
                    new AssessmentOption { OptionID = 21, QuestionID =  6, OptionText = "None", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 22, QuestionID =  6, OptionText = "Mild", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 23, QuestionID =  6, OptionText = "Moderate", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 24, QuestionID =  6, OptionText = "Severe", Score = 1, DisplayOrder = 4 },
                    new AssessmentOption { OptionID = 25, QuestionID =  7, OptionText = "Never", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 26, QuestionID =  7, OptionText = "Rarely", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 27, QuestionID =  7, OptionText = "Sometimes", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 28, QuestionID =  7, OptionText = "Always", Score = 1, DisplayOrder = 4 },
                    new AssessmentOption { OptionID = 29, QuestionID =  8, OptionText = "Very Good", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 30, QuestionID =  8, OptionText = "Good", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 31, QuestionID =  8, OptionText = "Fair", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 32, QuestionID =  8, OptionText = "Poor", Score = 1, DisplayOrder = 4 },
                    new AssessmentOption { OptionID = 33, QuestionID =  9, OptionText = "Very Regular", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 34, QuestionID =  9, OptionText = "Regular", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 35, QuestionID =  9, OptionText = "Irregular", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 36, QuestionID =  9, OptionText = "Very Irregular", Score = 1, DisplayOrder = 4 },
                    new AssessmentOption { OptionID = 37, QuestionID = 10, OptionText = "None", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 38, QuestionID = 10, OptionText = "Mild", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 39, QuestionID = 10, OptionText = "Moderate", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 40, QuestionID = 10, OptionText = "Severe", Score = 1, DisplayOrder = 4 },
                    new AssessmentOption { OptionID = 41, QuestionID = 11, OptionText = "Strongly Agree", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 42, QuestionID = 11, OptionText = "Agree", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 43, QuestionID = 11, OptionText = "Disagree", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 44, QuestionID = 11, OptionText = "Strongly Disagree", Score = 1, DisplayOrder = 4 },
                    new AssessmentOption { OptionID = 45, QuestionID = 12, OptionText = "Always", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 46, QuestionID = 12, OptionText = "Often", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 47, QuestionID = 12, OptionText = "Rarely", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 48, QuestionID = 12, OptionText = "Never", Score = 1, DisplayOrder = 4 },
                    new AssessmentOption { OptionID = 49, QuestionID = 13, OptionText = "Always", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 50, QuestionID = 13, OptionText = "Often", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 51, QuestionID = 13, OptionText = "Rarely", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 52, QuestionID = 13, OptionText = "Never", Score = 1, DisplayOrder = 4 },
                    new AssessmentOption { OptionID = 53, QuestionID = 14, OptionText = "Excellent", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 54, QuestionID = 14, OptionText = "Good", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 55, QuestionID = 14, OptionText = "Fair", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 56, QuestionID = 14, OptionText = "Poor", Score = 1, DisplayOrder = 4 },
                    new AssessmentOption { OptionID = 57, QuestionID = 15, OptionText = "Very Satisfied", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 58, QuestionID = 15, OptionText = "Satisfied", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 59, QuestionID = 15, OptionText = "Unsatisfied", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 60, QuestionID = 15, OptionText = "Very Unsatisfied", Score = 1, DisplayOrder = 4 },
                    new AssessmentOption { OptionID = 61, QuestionID = 16, OptionText = "Always", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 62, QuestionID = 16, OptionText = "Most of the time", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 63, QuestionID = 16, OptionText = "Rarely", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 64, QuestionID = 16, OptionText = "Never", Score = 1, DisplayOrder = 4 },

                    // Question 17 (Spiritual): comfort in faith or personal beliefs.
                    new AssessmentOption { OptionID = 65, QuestionID = 17, OptionText = "Always", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 66, QuestionID = 17, OptionText = "Often", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 67, QuestionID = 17, OptionText = "Rarely", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 68, QuestionID = 17, OptionText = "Never", Score = 1, DisplayOrder = 4 },

                    // Question 18 (Spiritual): connected to something greater.
                    new AssessmentOption { OptionID = 69, QuestionID = 18, OptionText = "Strongly Agree", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 70, QuestionID = 18, OptionText = "Agree", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 71, QuestionID = 18, OptionText = "Disagree", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 72, QuestionID = 18, OptionText = "Strongly Disagree", Score = 1, DisplayOrder = 4 },

                    // Question 19 (Social): feeling isolated or left out.
                    new AssessmentOption { OptionID = 73, QuestionID = 19, OptionText = "Never", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 74, QuestionID = 19, OptionText = "Rarely", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 75, QuestionID = 19, OptionText = "Sometimes", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 76, QuestionID = 19, OptionText = "Often", Score = 1, DisplayOrder = 4 },

                    // Question 20 (Social): social or community participation.
                    new AssessmentOption { OptionID = 77, QuestionID = 20, OptionText = "Often", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 78, QuestionID = 20, OptionText = "Sometimes", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 79, QuestionID = 20, OptionText = "Rarely", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 80, QuestionID = 20, OptionText = "Never", Score = 1, DisplayOrder = 4 },

                    // Question 21 (Psychological): sense of self-worth.
                    new AssessmentOption { OptionID = 81, QuestionID = 21, OptionText = "Very Good", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 82, QuestionID = 21, OptionText = "Good", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 83, QuestionID = 21, OptionText = "Fair", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 84, QuestionID = 21, OptionText = "Poor", Score = 1, DisplayOrder = 4 },

                    // Question 22 (Psychological): bouncing back after a setback.
                    new AssessmentOption { OptionID = 85, QuestionID = 22, OptionText = "Very Well", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 86, QuestionID = 22, OptionText = "Well", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 87, QuestionID = 22, OptionText = "Poorly", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 88, QuestionID = 22, OptionText = "Very Poorly", Score = 1, DisplayOrder = 4 },

                    // Question 23 (Psychological): confidence in everyday decisions.
                    new AssessmentOption { OptionID = 89, QuestionID = 23, OptionText = "Very Confident", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 90, QuestionID = 23, OptionText = "Confident", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 91, QuestionID = 23, OptionText = "Unsure", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 92, QuestionID = 23, OptionText = "Very Unsure", Score = 1, DisplayOrder = 4 },

                    // Question 24 (Psychological): control of thoughts and reactions.
                    new AssessmentOption { OptionID = 93, QuestionID = 24, OptionText = "Always", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 94, QuestionID = 24, OptionText = "Often", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 95, QuestionID = 24, OptionText = "Rarely", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 96, QuestionID = 24, OptionText = "Never", Score = 1, DisplayOrder = 4 },

                    // Question 25 (Psychological): outlook on the future.
                    new AssessmentOption { OptionID = 97, QuestionID = 25, OptionText = "Very Positive", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 98, QuestionID = 25, OptionText = "Positive", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 99, QuestionID = 25, OptionText = "Negative", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 100, QuestionID = 25, OptionText = "Very Negative", Score = 1, DisplayOrder = 4 },

                    // Question 26 (Emotional): comfort expressing feelings to others.
                    new AssessmentOption { OptionID = 101, QuestionID = 26, OptionText = "Very Comfortable", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 102, QuestionID = 26, OptionText = "Comfortable", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 103, QuestionID = 26, OptionText = "Uncomfortable", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 104, QuestionID = 26, OptionText = "Very Uncomfortable", Score = 1, DisplayOrder = 4 },

                    // Question 27 (Emotional): sudden mood swings.
                    new AssessmentOption { OptionID = 105, QuestionID = 27, OptionText = "Never", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 106, QuestionID = 27, OptionText = "Rarely", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 107, QuestionID = 27, OptionText = "Sometimes", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 108, QuestionID = 27, OptionText = "Often", Score = 1, DisplayOrder = 4 },

                    // Question 28 (Emotional): support when emotionally overwhelmed.
                    new AssessmentOption { OptionID = 109, QuestionID = 28, OptionText = "Always", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 110, QuestionID = 28, OptionText = "Most of the time", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 111, QuestionID = 28, OptionText = "Rarely", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 112, QuestionID = 28, OptionText = "Never", Score = 1, DisplayOrder = 4 },

                    // Question 29 (Emotional): feeling overwhelmed by emotions.
                    new AssessmentOption { OptionID = 113, QuestionID = 29, OptionText = "Never", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 114, QuestionID = 29, OptionText = "Rarely", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 115, QuestionID = 29, OptionText = "Sometimes", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 116, QuestionID = 29, OptionText = "Often", Score = 1, DisplayOrder = 4 },

                    // Question 30 (Emotional): joy or contentment in daily life.
                    new AssessmentOption { OptionID = 117, QuestionID = 30, OptionText = "Often", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 118, QuestionID = 30, OptionText = "Sometimes", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 119, QuestionID = 30, OptionText = "Rarely", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 120, QuestionID = 30, OptionText = "Never", Score = 1, DisplayOrder = 4 },

                    // Question 31 (Financial): stress about money.
                    new AssessmentOption { OptionID = 121, QuestionID = 31, OptionText = "Never", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 122, QuestionID = 31, OptionText = "Rarely", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 123, QuestionID = 31, OptionText = "Sometimes", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 124, QuestionID = 31, OptionText = "Often", Score = 1, DisplayOrder = 4 },

                    // Question 32 (Financial): meeting monthly expenses.
                    new AssessmentOption { OptionID = 125, QuestionID = 32, OptionText = "Very Well", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 126, QuestionID = 32, OptionText = "Well", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 127, QuestionID = 32, OptionText = "Poorly", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 128, QuestionID = 32, OptionText = "Very Poorly", Score = 1, DisplayOrder = 4 },

                    // Question 33 (Financial): savings for emergencies.
                    new AssessmentOption { OptionID = 129, QuestionID = 33, OptionText = "Always", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 130, QuestionID = 33, OptionText = "Often", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 131, QuestionID = 33, OptionText = "Rarely", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 132, QuestionID = 33, OptionText = "Never", Score = 1, DisplayOrder = 4 },

                    // Question 34 (Financial): worry about outstanding debts.
                    new AssessmentOption { OptionID = 133, QuestionID = 34, OptionText = "Never", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 134, QuestionID = 34, OptionText = "Rarely", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 135, QuestionID = 34, OptionText = "Sometimes", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 136, QuestionID = 34, OptionText = "Often", Score = 1, DisplayOrder = 4 },

                    // Question 35 (Financial): confidence in financial future.
                    new AssessmentOption { OptionID = 137, QuestionID = 35, OptionText = "Very Confident", Score = 4, DisplayOrder = 1 },
                    new AssessmentOption { OptionID = 138, QuestionID = 35, OptionText = "Confident", Score = 3, DisplayOrder = 2 },
                    new AssessmentOption { OptionID = 139, QuestionID = 35, OptionText = "Unsure", Score = 2, DisplayOrder = 3 },
                    new AssessmentOption { OptionID = 140, QuestionID = 35, OptionText = "Very Unsure", Score = 1, DisplayOrder = 4 }
                );
            });

            modelBuilder.Entity<AssessmentAnswer>(entity =>
            {
                entity.ToTable("AssessmentAnswer");
                entity.HasKey(a => a.AnswerID);
                entity.Property(a => a.CreatedAt).HasDefaultValueSql("SYSDATETIME()");

                entity.HasOne<WellnessForm>()
                    .WithMany()
                    .HasForeignKey(a => a.FormID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<AssessmentQuestion>()
                    .WithMany()
                    .HasForeignKey(a => a.QuestionID)
                    .OnDelete(DeleteBehavior.Restrict);

                // NOTE: this FK proves the option exists, but not that it belongs to
                // QuestionID. The API must check that when saving Station 2.
                entity.HasOne<AssessmentOption>()
                    .WithMany()
                    .HasForeignKey(a => a.OptionID)
                    .OnDelete(DeleteBehavior.Restrict);

                // one answer per question per form
                entity.HasIndex(a => new { a.FormID, a.QuestionID }).IsUnique();
            });

            // Append-only record of every station hand-off. ActorType + ActorID is
            // deliberately a loose reference rather than an FK: the three actor kinds
            // live in three different tables, and audit rows must survive removal of
            // the actor row.
            modelBuilder.Entity<WellnessFormAuditLog>(entity =>
            {
                entity.ToTable("WellnessFormAuditLog", t => t.HasCheckConstraint(
                    "CK_WellnessFormAuditLog_ActorType",
                    "ActorType IN ('Admin', 'Physician', 'Patient', 'System')"));
                entity.HasKey(l => l.LogID);
                entity.Property(l => l.ActorType).HasMaxLength(20).IsUnicode(false).IsRequired();
                entity.Property(l => l.Action).HasMaxLength(50).IsUnicode(false).IsRequired();
                entity.Property(l => l.Details).HasMaxLength(500);
                entity.Property(l => l.OccurredAt).HasDefaultValueSql("SYSDATETIME()");

                entity.HasOne<WellnessForm>()
                    .WithMany()
                    .HasForeignKey(l => l.FormID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(l => l.FormID);
            });
        }
    }
}
