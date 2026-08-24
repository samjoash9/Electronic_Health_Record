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
        public DbSet<WellnessForm> WellnessForms => Set<WellnessForm>();
        public DbSet<MedicalCondition> MedicalConditions => Set<MedicalCondition>();
        public DbSet<SocialHistory> SocialHistories => Set<SocialHistory>();
        public DbSet<FamilyMedicalHistory> FamilyMedicalHistories => Set<FamilyMedicalHistory>();
        public DbSet<PastMedicalHistory> PastMedicalHistories => Set<PastMedicalHistory>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Patient>(entity =>
            {
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
                entity.HasKey(p => p.PhysicianID);
                entity.Property(p => p.Surname).HasMaxLength(50).IsRequired();
                entity.Property(p => p.FirstName).HasMaxLength(50).IsRequired();
                entity.Property(p => p.MiddleName).HasMaxLength(50);
                entity.Property(p => p.PRCLicenseNo).HasMaxLength(20).IsRequired();
                entity.HasIndex(p => p.PRCLicenseNo).IsUnique();
                entity.Property(p => p.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
                entity.Property(p => p.UpdatedAt).HasDefaultValueSql("SYSDATETIME()");
            });

            modelBuilder.Entity<WellnessForm>(entity =>
            {
                entity.HasKey(w => w.FormID);
                entity.Property(w => w.FormDate).HasColumnType("date");
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

                entity.HasOne<Physician>()
                    .WithMany()
                    .HasForeignKey(w => w.PhysicianID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<MedicalCondition>(entity =>
            {
                entity.HasKey(c => c.ConditionID);
                entity.Property(c => c.ConditionName).HasMaxLength(50).IsRequired();
                entity.HasIndex(c => c.ConditionName).IsUnique();
                entity.Property(c => c.ConditionType).HasMaxLength(100);
            });

            modelBuilder.Entity<SocialHistory>(entity =>
            {
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
                entity.HasKey(f => f.FMHID);
                entity.Property(f => f.ConditionOther).HasMaxLength(100);
                entity.Property(f => f.FamilyMember).HasMaxLength(50);
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
