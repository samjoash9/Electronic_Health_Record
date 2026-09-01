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

            // Seed staff accounts: one of each role, so the three-role flow is testable.
            // Checked per-account rather than behind a single AnyAsync guard, because a database
            // seeded before roles existed already has rows -- such a guard would skip the whole
            // block and leave that database with no SuperAdmin and no way to create one.
            await EnsureAdminAsync(context, "admin",  "admin@hospital.com",  "System Administrator", Roles.SuperAdmin);
            await EnsureAdminAsync(context, "intake", "intake@hospital.com", "Intake Officer",       Roles.Admin);

            var currentAdmin = await context.Admins.FirstAsync(a => a.Username == "admin");

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

            // Seed Physicians, keyed on the PRC licence number so an existing database gets the
            // new credential columns backfilled instead of being skipped wholesale.
            // The first two carry credentials so the signing flow is testable; the third is a
            // directory-only row, exercising the credential-less case the Doctors page produces.
            await EnsurePhysicianAsync(context, "PRC-12345", "House",    "Gregory", "H.", "ghouse");
            await EnsurePhysicianAsync(context, "PRC-67890", "Grey",     "Meredith", "E.", "mgrey");
            await EnsurePhysicianAsync(context, "PRC-24680", "Bautista", "Ramon",   "P.", username: null);

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
                    AssignedPhysicianID = physician.PhysicianID,
                    // a fully signed record: CK_WellnessForm_SignedIntegrity requires the assignee,
                    // the signer, the signature and the timestamp to all be present together
                    Status = FormStatus.Signed,
                    SignedByPhysicianID = physician.PhysicianID,
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
                    CreatedByAdminID = currentAdmin.AdminID,
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

            // A form sitting in a physician's signing queue: routed but not yet signed, so
            // Signature / SignedAt / SignedByPhysicianID stay null. Guarded on its own so an
            // existing database -- which already has forms and would skip the block above --
            // still gets something to exercise the sign flow against.
            if (!await context.WellnessForms.AnyAsync(f => f.Status == FormStatus.PendingSignature))
            {
                // only a physician with credentials can actually sign, so route it to one
                var signer = await context.Physicians
                    .FirstOrDefaultAsync(p => p.Username != null && p.IsActive);
                var pendingPatient = await context.Patients.OrderBy(p => p.PatientID).Skip(1).FirstOrDefaultAsync()
                    ?? await context.Patients.OrderBy(p => p.PatientID).FirstOrDefaultAsync();

                if (signer is not null && pendingPatient is not null)
                {
                    context.WellnessForms.Add(new WellnessForm
                    {
                        PatientID = pendingPatient.PatientID,
                        AssignedPhysicianID = signer.PhysicianID,
                        Status = FormStatus.PendingSignature,
                        FormDate = DateTime.UtcNow.Date,
                        WeightKg = 62.0m,
                        HeightCm = 163.0m,
                        BMI = 23.34m,
                        IdealBMI = 22.0m,
                        BPSystolic = 118,
                        BPDiastolic = 76,
                        TempCelsius = 36.7m,
                        HeartRate = 68,
                        RespRate = 15,
                        RecommendedDiagnosticTest = "CBC, Lipid Profile",
                        ImpressionClinical = "Within normal limits",
                        ManagementTreatment = "Routine annual follow-up",
                        CreatedByAdminID = currentAdmin.AdminID,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });

                    await context.SaveChangesAsync();
                }
            }
        }

        // Creates the staff account if it is missing, and corrects its role if it drifted.
        // Never touches an existing password.
        private static async Task EnsureAdminAsync(
            ElectronicHealthRecordDbContext context,
            string username, string email, string fullName, string role)
        {
            var admin = await context.Admins.FirstOrDefaultAsync(a => a.Username == username);

            if (admin is null)
            {
                // an unrelated account may already hold this email (Email is unique)
                if (await context.Admins.AnyAsync(a => a.Email == email))
                    return;

                context.Admins.Add(new Admin
                {
                    Username = username,
                    Email = email,
                    PasswordHash = HashPassword(SeedPassword),
                    FullName = fullName,
                    Role = role,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            else if (admin.Role != role)
            {
                admin.Role = role;
                admin.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                return;
            }

            await context.SaveChangesAsync();
        }

        // Creates the physician if the licence number is unknown, and grants credentials to an
        // existing credential-less row. Pass username: null for a directory-only entry.
        private static async Task EnsurePhysicianAsync(
            ElectronicHealthRecordDbContext context,
            string prcLicenseNo, string surname, string firstName, string? middleName, string? username)
        {
            var physician = await context.Physicians
                .FirstOrDefaultAsync(p => p.PRCLicenseNo == prcLicenseNo);

            if (physician is null)
            {
                physician = new Physician
                {
                    Surname = surname,
                    FirstName = firstName,
                    MiddleName = middleName,
                    PRCLicenseNo = prcLicenseNo,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                context.Physicians.Add(physician);
            }
            else if (username is null || physician.Username is not null)
            {
                // already present, and either it needs no login or it already has one
                return;
            }

            if (username is not null)
            {
                var email = $"{username}@hospital.com";

                // CK_Physician_CredentialSet requires all four together; the unique indexes on
                // Username and Email are filtered, so only non-null values can collide
                if (await context.Physicians.AnyAsync(p =>
                        p.PhysicianID != physician.PhysicianID &&
                        (p.Username == username || p.Email == email)))
                {
                    return;
                }

                physician.Username = username;
                physician.Email = email;
                physician.PasswordHash = HashPassword(SeedPassword);
                physician.MustChangePassword = true;
                physician.UpdatedAt = DateTime.UtcNow;
            }

            await context.SaveChangesAsync();
        }

        // Development seed credential only. Every seeded account lands with MustChangePassword
        // set where a real login is intended.
        private const string SeedPassword = "password123";

        // Unsalted SHA-256, and not fit for production password storage. Output is 64 lowercase
        // hex chars, which is how the authentication work will recognise a legacy hash -- PBKDF2
        // via PasswordHasher<T> produces 84-char Base64 starting "AQAAAA". So a legacy row can be
        // verified once and rewritten in the new format with no password reset, and no companion
        // "which algorithm" column is needed.
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
