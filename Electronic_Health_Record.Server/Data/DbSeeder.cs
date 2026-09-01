using Electronic_Health_Record.Server.Models;
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
                var admin = new Admin
                {
                    Username = "admin",
                    Email = "admin@hospital.com",
                    PasswordHash = HashPassword("password123"),
                    FullName = "System Administrator",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
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
                    },
                    new Patient
                    {
                        Surname = "Smith",
                        FirstName = "John",
                        MiddleName = "Michael",
                        Birthdate = new DateTime(1988, 3, 14),
                        Sex = "M",
                        CivilStatus = "Married",
                        Address = "123 Maple St, Springfield",
                        AgencyOffice = "Finance",
                        Position = "Accountant",
                        ContactNo = "09123456789",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Patient
                    {
                        Surname = "Garcia",
                        FirstName = "Maria",
                        MiddleName = "Elena",
                        Birthdate = new DateTime(1995, 11, 7),
                        Sex = "F",
                        CivilStatus = "Single",
                        Address = "789 Pine St, Springfield",
                        AgencyOffice = "HR",
                        Position = "HR Specialist",
                        ContactNo = "09234567890",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Patient
                    {
                        Surname = "Santos",
                        FirstName = "Carlos",
                        MiddleName = "Luis",
                        Birthdate = new DateTime(1990, 6, 18),
                        Sex = "M",
                        CivilStatus = "Single",
                        Address = "321 Cedar Ave, Springfield",
                        AgencyOffice = "Operations",
                        Position = "Operations Officer",
                        ContactNo = "09345678901",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Patient
                    {
                        Surname = "Reyes",
                        FirstName = "Angela",
                        MiddleName = "Marie",
                        Birthdate = new DateTime(1985, 1, 30),
                        Sex = "F",
                        CivilStatus = "Married",
                        Address = "654 Birch Road, Springfield",
                        AgencyOffice = "Administration",
                        Position = "Administrative Officer",
                        ContactNo = "09456789012",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Patient
                    {
                        Surname = "Dela Cruz",
                        FirstName = "Mark",
                        MiddleName = "Anthony",
                        Birthdate = new DateTime(1997, 9, 12),
                        Sex = "M",
                        CivilStatus = "Single",
                        Address = "987 Elm Street, Springfield",
                        AgencyOffice = "IT",
                        Position = "Software Engineer",
                        ContactNo = "09567890123",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Patient
                    {
                        Surname = "Mendoza",
                        FirstName = "Sofia",
                        MiddleName = "Grace",
                        Birthdate = new DateTime(1993, 4, 22),
                        Sex = "F",
                        CivilStatus = "Single",
                        Address = "147 Willow Lane, Springfield",
                        AgencyOffice = "Marketing",
                        Position = "Marketing Officer",
                        ContactNo = "09678901234",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Patient
                    {
                        Surname = "Villanueva",
                        FirstName = "Daniel",
                        MiddleName = "James",
                        Birthdate = new DateTime(1989, 12, 5),
                        Sex = "M",
                        CivilStatus = "Married",
                        Address = "258 Oak Avenue, Springfield",
                        AgencyOffice = "Legal",
                        Position = "Legal Officer",
                        ContactNo = "09789012345",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Patient
                    {
                        Surname = "Torres",
                        FirstName = "Patricia",
                        MiddleName = "Anne",
                        Birthdate = new DateTime(1996, 7, 16),
                        Sex = "F",
                        CivilStatus = "Single",
                        Address = "369 Maple Drive, Springfield",
                        AgencyOffice = "IT",
                        Position = "Systems Analyst",
                        ContactNo = "09890123456",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Patient
                    {
                        Surname = "Navarro",
                        FirstName = "Kevin",
                        MiddleName = "Paul",
                        Birthdate = new DateTime(1991, 2, 28),
                        Sex = "M",
                        CivilStatus = "Divorced",
                        Address = "741 Pine Avenue, Springfield",
                        AgencyOffice = "Procurement",
                        Position = "Procurement Officer",
                        ContactNo = "09901234567",
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
