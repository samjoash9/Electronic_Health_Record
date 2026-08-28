using Electronic_Health_Record.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace Electronic_Health_Record.Server.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            var context = serviceProvider.GetRequiredService<ElectronicHealthRecordDbContext>();

            // Ensure the database is created / migrated
            if (context.Database.IsRelational())
            {
                await context.Database.MigrateAsync();
            }

            // Seed Admins
            if (!await context.Admins.AnyAsync())
            {
                var passwordHasher = new PasswordHasher<Admin>();

                var admin = new Admin
                {
                    Username = "admin",
                    Email = "admin@hospital.com",
                    FullName = "System Administrator",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                admin.PasswordHash = passwordHasher.HashPassword(admin, "password123");

                context.Admins.Add(admin);
                await context.SaveChangesAsync();
            }

            var currentAdmin = await context.Admins.FirstOrDefaultAsync(a => a.Username == "admin");

            // MedicalConditions come from the migration (HasData), so nothing to seed here

            // Seed Patients
            if (!await context.Patients.AnyAsync())
            {
                context.Patients.AddRange(
                    new Patient
                    {
                        Surname = "Doe",
                        FirstName = "John",
                        MiddleName = "Smith",
                        Birthdate = new DateTime(1980, 5, 15),
                        Sex = "M",
                        CivilStatus = "Married",
                        Address = "123 Main St, Springfield",
                        AgencyOffice = "HR",
                        Position = "Manager",
                        ContactNo = "09123456789",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Patient
                    {
                        Surname = "Roe",
                        FirstName = "Jane",
                        MiddleName = "Ann",
                        Birthdate = new DateTime(1992, 8, 25),
                        Sex = "F",
                        CivilStatus = "Single",
                        Address = "456 Oak St, Springfield",
                        AgencyOffice = "IT",
                        Position = "Developer",
                        ContactNo = "09876543210",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                );
                await context.SaveChangesAsync();
            }

            // Seed Physicians
            if (!await context.Physicians.AnyAsync())
            {
                context.Physicians.AddRange(
                    new Physician
                    {
                        Surname = "House",
                        FirstName = "Gregory",
                        MiddleName = "H.",
                        PRCLicenseNo = "PRC-12345",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Physician
                    {
                        Surname = "Grey",
                        FirstName = "Meredith",
                        MiddleName = "E.",
                        PRCLicenseNo = "PRC-67890",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                );
                await context.SaveChangesAsync();
            }

            // Seed WellnessForms with related records
            if (!await context.WellnessForms.AnyAsync())
            {
                var patient = await context.Patients.FirstAsync();
                var physician = await context.Physicians.FirstAsync();
                var conditionHypertension = await context.MedicalConditions.FirstAsync(c => c.ConditionName == "Hypertension");
                var conditionDiabetes = await context.MedicalConditions.FirstAsync(c => c.ConditionName == "Diabetes Mellitus");

                var form = new WellnessForm
                {
                    PatientID = patient.PatientID,
                    PhysicianID = physician.PhysicianID,
                    Status = "Submitted",
                    // a submitted form must be signed, so the seed carries a placeholder signature
                    Signature = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                    SignedAt = DateTime.UtcNow,
                    FormDate = DateTime.UtcNow.Date,
                    WeightKg = 75.5m,
                    HeightCm = 175.0m,
                    BMI = 24.65m,
                    IdealBMI = 22.0m,
                    BPSystolic = 120,
                    BPDiastolic = 80,
                    TempCelsius = 36.5m,
                    HeartRate = 72,
                    RespRate = 16,
                    RecommendedDiagnosticTest = "CBC, Urinalysis, FBS",
                    ImpressionClinical = "Generally healthy; pre-diabetic monitoring",
                    ManagementTreatment = "Maintain healthy diet, exercise regularly",
                    CreatedByAdminID = currentAdmin?.AdminID,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                context.WellnessForms.Add(form);
                await context.SaveChangesAsync();

                // SocialHistory
                context.SocialHistories.Add(new SocialHistory
                {
                    FormID = form.FormID,
                    SmokingSticksPerDay = 0,
                    AlcoholType = "Beer",
                    DrinkFrequency = "Occasional",
                    DrinksPerSession = "1-2",
                    HasBeenDrunk = false,
                    DrunkFrequency = "Never",
                    ExerciseFrequency = "3x a week",
                    ExerciseType = "Jogging",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

                // FamilyMedicalHistory
                context.FamilyMedicalHistories.Add(new FamilyMedicalHistory
                {
                    FormID = form.FormID,
                    ConditionID = conditionHypertension.ConditionID,
                    IsNone = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

                // PastMedicalHistory
                context.PastMedicalHistories.Add(new PastMedicalHistory
                {
                    FormID = form.FormID,
                    ConditionID = conditionDiabetes.ConditionID,
                    YearDiagnosed = 2020,
                    MaintenanceDrugGeneric = "Metformin",
                    Dosage = "500mg",
                    Frequency = "Once a day",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

                await context.SaveChangesAsync();
            }
        }

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            var builder = new StringBuilder();
            foreach (var b in bytes)
            {
                builder.Append(b.ToString("x2"));
            }
            return builder.ToString();
        }
    }
}
