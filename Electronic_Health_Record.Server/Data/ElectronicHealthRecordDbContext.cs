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
        public DbSet<UserSession> UserSessions => Set<UserSession>();
        public DbSet<WellnessForm> WellnessForms => Set<WellnessForm>();
        public DbSet<MedicalCondition> MedicalConditions => Set<MedicalCondition>();
        public DbSet<SocialHistory> SocialHistories => Set<SocialHistory>();
        public DbSet<FamilyMedicalHistory> FamilyMedicalHistories => Set<FamilyMedicalHistory>();
        public DbSet<PastMedicalHistory> PastMedicalHistories => Set<PastMedicalHistory>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Patient>(entity =>
            {
                entity.ToTable("Patient");
                entity.HasKey(p => p.PatientID);
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
                entity.Property(p => p.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(p => p.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");
            });

            modelBuilder.Entity<Physician>(entity =>
            {
                entity.ToTable("Physician", t =>
                {
                    // credentials arrive as a complete set or not at all: a row is either a
                    // directory-only entry or a full login account, never half of one
                    t.HasCheckConstraint(
                        "CK_Physician_CredentialSet",
                        "([Username] IS NULL AND [Email] IS NULL AND [PasswordHash] IS NULL AND [PasswordAlgo] IS NULL)" +
                        " OR ([Username] IS NOT NULL AND [Email] IS NOT NULL AND [PasswordHash] IS NOT NULL AND [PasswordAlgo] IS NOT NULL)");
                });
                entity.HasKey(p => p.PhysicianID);
                entity.Property(p => p.Surname).HasMaxLength(50).IsRequired();
                entity.Property(p => p.FirstName).HasMaxLength(50).IsRequired();
                entity.Property(p => p.MiddleName).HasMaxLength(50);
                entity.Property(p => p.PRCLicenseNo).HasMaxLength(20).IsRequired();
                entity.HasIndex(p => p.PRCLicenseNo).IsUnique();

                // login credentials; null on a directory-only row, which is why the unique
                // indexes below are filtered -- many nulls must not collide with each other
                entity.Property(p => p.Username).HasMaxLength(30);
                entity.Property(p => p.Email).HasMaxLength(255);
                entity.Property(p => p.PasswordHash).HasMaxLength(255);
                entity.Property(p => p.PasswordAlgo).HasMaxLength(20).IsUnicode(false);
                entity.Property(p => p.IsActive).HasDefaultValue(true).IsRequired();
                entity.Property(p => p.MustChangePassword).HasDefaultValue(false).IsRequired();

                entity.HasIndex(p => p.Username)
                    .IsUnique()
                    .HasFilter("[Username] IS NOT NULL")
                    .HasDatabaseName("UQ_Physician_Username");
                entity.HasIndex(p => p.Email)
                    .IsUnique()
                    .HasFilter("[Email] IS NOT NULL")
                    .HasDatabaseName("UQ_Physician_Email");

                entity.Property(p => p.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(p => p.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");
            });

            modelBuilder.Entity<Admin>(entity =>
            {
                entity.ToTable("Admin", t =>
                {
                    // "Physician" is deliberately not a legal value: physicians live in their own
                    // table, so no staff account can ever satisfy the signing check
                    t.HasCheckConstraint("CK_Admin_Role", "[Role] IN ('SuperAdmin','Admin')");
                });
                entity.HasKey(a => a.AdminID);
                entity.Property(a => a.Username).HasMaxLength(30).IsRequired();
                entity.Property(a => a.Email).HasMaxLength(255).IsRequired();
                entity.Property(a => a.PasswordHash).HasMaxLength(255).IsRequired();
                entity.Property(a => a.PasswordAlgo)
                    .HasMaxLength(20)
                    .IsUnicode(false)
                    .HasDefaultValue(PasswordAlgorithms.Sha256Legacy)
                    .IsRequired();
                entity.Property(a => a.FullName).HasMaxLength(100).IsRequired();
                entity.Property(a => a.Role)
                    .HasMaxLength(20)
                    .IsUnicode(false)
                    .HasDefaultValue(Roles.Admin)
                    .IsRequired();
                entity.Property(a => a.IsActive).HasDefaultValue(true).IsRequired();
                entity.Property(a => a.MustChangePassword).HasDefaultValue(false).IsRequired();
                entity.Property(a => a.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(a => a.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.HasIndex(a => a.Username).IsUnique();
                entity.HasIndex(a => a.Email).IsUnique();
            });

            modelBuilder.Entity<UserSession>(entity =>
            {
                entity.ToTable("UserSession", t =>
                {
                    // a session belongs to a staff account or a physician account, never both
                    // and never neither. spelled out longhand because T-SQL has no boolean type:
                    // "([AdminID] IS NULL) <> ([PhysicianID] IS NULL)" cannot compare two predicates.
                    t.HasCheckConstraint(
                        "CK_UserSession_ExactlyOnePrincipal",
                        "([AdminID] IS NOT NULL AND [PhysicianID] IS NULL)" +
                        " OR ([AdminID] IS NULL AND [PhysicianID] IS NOT NULL)");
                });
                entity.HasKey(s => s.SessionID);
                // char(64) is the exact width of SHA-256 rendered as lowercase hex
                entity.Property(s => s.TokenHash).HasColumnType("char(64)").IsRequired();
                entity.Property(s => s.ExpiresAt).IsRequired();
                entity.Property(s => s.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.HasIndex(s => s.TokenHash).IsUnique();

                entity.HasOne<Admin>()
                    .WithMany()
                    .HasForeignKey(s => s.AdminID)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<Physician>()
                    .WithMany()
                    .HasForeignKey(s => s.PhysicianID)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<WellnessForm>(entity =>
            {
                entity.ToTable("WellnessForm", t =>
                {
                    t.HasCheckConstraint(
                        "CK_WellnessForm_Status",
                        "[Status] IN ('Draft','PendingSignature','Signed')");

                    // once a form leaves Draft it has been routed to a named physician
                    t.HasCheckConstraint(
                        "CK_WellnessForm_AssignedWhenPending",
                        "[Status] = 'Draft' OR [AssignedPhysicianID] IS NOT NULL");

                    // a signed form is a finalised clinical record: it carries all four facts
                    // or none, so a partial write cannot fake an attestation
                    t.HasCheckConstraint(
                        "CK_WellnessForm_SignedIntegrity",
                        "[Status] <> 'Signed' OR ([AssignedPhysicianID] IS NOT NULL" +
                        " AND [SignedByPhysicianID] IS NOT NULL" +
                        " AND [Signature] IS NOT NULL AND [SignedAt] IS NOT NULL)");
                });
                entity.HasKey(w => w.FormID);
                entity.Property(w => w.Status)
                    .HasMaxLength(20)
                    .IsUnicode(false)
                    .HasDefaultValue(FormStatus.Draft)
                    .IsRequired();
                entity.Property(w => w.FormDate)
                    .HasColumnType("date")
                    .HasDefaultValueSql("CAST(SYSDATETIME() AS date)");
                entity.Property(w => w.WeightKg).HasPrecision(5, 2);
                entity.Property(w => w.HeightCm).HasPrecision(5, 2);
                entity.Property(w => w.BMI).HasPrecision(5, 2);
                entity.Property(w => w.IdealBMI).HasPrecision(5, 2);
                entity.Property(w => w.TempCelsius).HasPrecision(3, 1);
                entity.Property(w => w.RecommendedDiagnosticTest).HasMaxLength(150);
                entity.Property(w => w.ImpressionClinical).HasMaxLength(300);
                entity.Property(w => w.ManagementTreatment).HasMaxLength(300);
                entity.Property(w => w.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(w => w.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");

                entity.HasOne<Patient>()
                    .WithMany()
                    .HasForeignKey(w => w.PatientID)
                    .OnDelete(DeleteBehavior.Restrict);

                // who the Admin routed this form to. optional: a draft may not be assigned yet
                entity.HasOne<Physician>()
                    .WithMany()
                    .HasForeignKey(w => w.AssignedPhysicianID)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                // who actually signed. separate from the assignment so reassigning a form can
                // never rewrite the attestation on one already signed
                entity.HasOne<Physician>()
                    .WithMany()
                    .HasForeignKey(w => w.SignedByPhysicianID)
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

                // the physician's "awaiting my signature" queue
                entity.HasIndex(w => new { w.Status, w.AssignedPhysicianID })
                    .HasDatabaseName("IX_WellnessForm_Status_AssignedPhysicianID");
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
        }
    }
}
