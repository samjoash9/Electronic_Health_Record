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
        public DbSet<Physician> Physicians => Set<Physician>();
        public DbSet<Admin> Admins => Set<Admin>();
        public DbSet<AdminSession> AdminSessions => Set<AdminSession>();
        public DbSet<WellnessForm> WellnessForms => Set<WellnessForm>();
        public DbSet<MedicalCondition> MedicalConditions => Set<MedicalCondition>();
        public DbSet<SocialHistory> SocialHistories => Set<SocialHistory>();
        public DbSet<FamilyMedicalHistory> FamilyMedicalHistories => Set<FamilyMedicalHistory>();
        public DbSet<PastMedicalHistory> PastMedicalHistories => Set<PastMedicalHistory>();
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
                entity.Property(p => p.Sex).HasColumnType("char(1)").IsRequired();
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

            modelBuilder.Entity<Physician>(entity =>
            {
                entity.ToTable("Physician");
                entity.HasKey(p => p.PhysicianID);
                entity.Property(p => p.Surname).HasMaxLength(50).IsRequired();
                entity.Property(p => p.FirstName).HasMaxLength(50).IsRequired();
                entity.Property(p => p.MiddleName).HasMaxLength(50);
                entity.Property(p => p.PRCLicenseNo).HasMaxLength(20).IsRequired();
                entity.HasIndex(p => p.PRCLicenseNo).IsUnique();
                entity.Property(p => p.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(p => p.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");
            });

            modelBuilder.Entity<Admin>(entity =>
            {
                entity.ToTable("Admin");
                entity.HasKey(a => a.AdminID);
                entity.Property(a => a.Username).HasMaxLength(30).IsRequired();
                entity.Property(a => a.Email).HasMaxLength(255).IsRequired();
                entity.Property(a => a.PasswordHash).HasMaxLength(255).IsRequired();
                entity.Property(a => a.FullName).HasMaxLength(100).IsRequired();
                entity.Property(a => a.IsActive).HasDefaultValue(true).IsRequired();
                entity.Property(a => a.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(a => a.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.HasIndex(a => a.Username).IsUnique();
                entity.HasIndex(a => a.Email).IsUnique();
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
                entity.ToTable("PatientAccount", t => t.HasCheckConstraint(
                    "CK_PatientAccount_Activation",
                    "Status <> 'Active' OR (PasswordHash IS NOT NULL AND ActivatedAt IS NOT NULL)"));
                entity.HasKey(a => a.PatientAccountID);
                entity.Property(a => a.PasswordHash).HasMaxLength(255);
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
                        "Status IN ('PendingAssessment', 'PendingConsultation', 'Completed', 'Cancelled')");
                    t.HasCheckConstraint("CK_WellnessForm_CurrentStation",
                        "CurrentStation IN (1, 2, 3)");
                    // a completed form must be signed by a named physician
                    t.HasCheckConstraint("CK_WellnessForm_CompletedIsSigned",
                        "Status <> 'Completed' OR (PhysicianID IS NOT NULL AND Signature IS NOT NULL AND SignedAt IS NOT NULL)");
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

                // the fixed condition list the wellness form checkbox grids bind to;
                // the frontend sends back the matching ConditionID
                entity.HasData(
                    new MedicalCondition { ConditionID = 1, ConditionName = "Hypertension" },
                    new MedicalCondition { ConditionID = 2, ConditionName = "Stroke" },
                    new MedicalCondition { ConditionID = 3, ConditionName = "Diabetes Mellitus" },
                    new MedicalCondition { ConditionID = 4, ConditionName = "Tuberculosis" },
                    new MedicalCondition { ConditionID = 5, ConditionName = "Bronchial Asthma" },
                    new MedicalCondition { ConditionID = 6, ConditionName = "Cancer" }
                );
            });

            modelBuilder.Entity<SocialHistory>(entity =>
            {
                entity.ToTable("SocialHistory");
                entity.HasKey(s => s.SocialHistoryID);
                entity.Property(s => s.AlcoholType).HasMaxLength(50);
                entity.Property(s => s.DrinkFrequency).HasMaxLength(50);
                entity.Property(s => s.DrinksPerSession).HasMaxLength(20);
                entity.Property(s => s.DrunkFrequency).HasMaxLength(50);
                entity.Property(s => s.ExerciseFrequency).HasMaxLength(50);
                entity.Property(s => s.ExerciseType).HasMaxLength(100);
                entity.Property(s => s.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(s => s.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");

                entity.HasOne<WellnessForm>()
                    .WithOne()
                    .HasForeignKey<SocialHistory>(s => s.FormID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<FamilyMedicalHistory>(entity =>
            {
                entity.ToTable("FamilyMedicalHistory");
                entity.HasKey(f => f.FMHID);
                entity.Property(f => f.ConditionOther).HasMaxLength(100);
                entity.Property(f => f.IsNone).HasDefaultValue(false);
                entity.Property(f => f.FamilyMembers).HasMaxLength(300);
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

                entity.HasData(
                    new AssessmentCategory { CategoryID = 1, Name = "Mental Health", DisplayOrder = 1 },
                    new AssessmentCategory { CategoryID = 2, Name = "Physical Health", DisplayOrder = 2 },
                    new AssessmentCategory { CategoryID = 3, Name = "Spiritual Health", DisplayOrder = 3 },
                    new AssessmentCategory { CategoryID = 4, Name = "Social Health", DisplayOrder = 4 }
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
                    new AssessmentQuestion { QuestionID = 16, CategoryID = 4, QuestionText = "Do you have people you can rely on for support?", DisplayOrder = 3, IsActive = true }
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
                    new AssessmentOption { OptionID = 64, QuestionID = 16, OptionText = "Never", Score = 1, DisplayOrder = 4 }
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
