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

            modelBuilder.Entity<WellnessForm>(entity =>
            {
                entity.ToTable("WellnessForm");
                entity.HasKey(w => w.FormID);
                entity.Property(w => w.Status)
                    .HasMaxLength(20)
                    .IsUnicode(false)
                    .HasDefaultValue("Draft")
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

                // optional: a draft may not have a physician assigned yet
                entity.HasOne<Physician>()
                    .WithMany()
                    .HasForeignKey(w => w.PhysicianID)
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
