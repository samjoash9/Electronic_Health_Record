using Electronic_Health_Record.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Data
{
    public static class DbSeeder
    {
        // -----------------------------------------------------------------
        // CHANGED: Password hashing must match what AuthController verifies
        // with. AuthController.Login() uses ASP.NET Identity's
        // PasswordHasher<T>.VerifyHashedPassword(...) per entity type
        // (Admin, Physician, PatientAccount). The old HashPassword(string)
        // here produced a raw SHA256 hex string, which is a completely
        // different format from what PasswordHasher<T> expects (base64,
        // versioned, PBKDF2-based, salted). Login would fail for every
        // seeded account because VerifyHashedPassword would reject the
        // SHA256 hash outright.
        //
        // Fix: use the same PasswordHasher<T> instances, one per entity
        // type, exactly like AuthController does. One static instance per
        // type is enough since PasswordHasher<T> is stateless/thread-safe.
        // -----------------------------------------------------------------
        private static readonly PasswordHasher<Admin> AdminHasher = new();
        private static readonly PasswordHasher<Physician> PhysicianHasher = new();
        private static readonly PasswordHasher<PatientAccount> PatientHasher = new();

        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            var context = serviceProvider.GetRequiredService<ElectronicHealthRecordDbContext>();

            // Ensure the database is created / migrated
            if (context.Database.IsRelational())
            {
                await context.Database.MigrateAsync();
            }

            var now = DateTime.UtcNow;

            // Seed Admins
            if (!await context.Admins.AnyAsync())
            {
                // One of each tier, so the permission split has something to exercise
                // on a fresh development database. The MustChangePassword flags are
                // deliberately mixed so the forced-rotation flow can be exercised
                // without having to reset an account by hand first.
                context.Admins.AddRange(
                    new Admin
                    {
                        Username = "superadmin",
                        Role = AdminRoles.SuperAdmin,
                        ContactNo = "09170000000",
                        PasswordHash = HashPassword("password123"),
                        // settled account: logs straight in
                        MustChangePassword = false,
                        PasswordSetAt = now.AddDays(-30),
                        PasswordChangedAt = now.AddDays(-30),
                        FullName = "System Developer",
                        IsActive = true,
                        CreatedAt = now,
                        UpdatedAt = now
                    },
                    new Admin
                    {
                        Username = "admin",
                        Role = AdminRoles.Admin,
                        ContactNo = "09170000001",
                        PasswordHash = HashPassword("password123"),
                        // settled account: the rest of the development fixtures are
                        // attributed to this one, so it should not be stuck behind a
                        // password prompt
                        MustChangePassword = false,
                        PasswordSetAt = now.AddDays(-30),
                        PasswordChangedAt = now.AddDays(-30),
                        FullName = "System Administrator",
                        IsActive = true,
                        CreatedAt = now,
                        UpdatedAt = now
                    },
                    new Admin
                    {
                        Username = "nurse1",
                        Role = AdminRoles.Admin,
                        ContactNo = "09170000002",
                        PasswordHash = HashPassword("password123"),
                        // freshly onboarded by the superadmin: still on the default
                        MustChangePassword = true,
                        PasswordSetAt = now,
                        PasswordChangedAt = null,
                        FullName = "Corazon Dimaculangan",
                        IsActive = true,
                        CreatedAt = now,
                        UpdatedAt = now
                    });
                await context.SaveChangesAsync();
            }

            var currentAdmin = await context.Admins.FirstOrDefaultAsync(a => a.Username == "admin");

            // MedicalConditions and the whole Station 2 question bank (categories,
            // questions, options) come from the migration via HasData, so there is
            // nothing to seed for them here.

            // Seed Patients.
            // Patient rows normally only ever arrive by syncing from the external HR
            // API, so every row needs an ExternalEmployeeId. These development
            // fixtures use synthetic EMP-#### ids that no real employee can collide with.
            if (!await context.Patients.AnyAsync())
            {
                context.Patients.AddRange(
                    new Patient
                    {
                        ExternalEmployeeId = "EMP-0001",
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
                        LastSyncedAt = now,
                        CreatedAt = now,
                        UpdatedAt = now
                    },
                    new Patient
                    {
                        ExternalEmployeeId = "EMP-0002",
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
                        LastSyncedAt = now,
                        CreatedAt = now,
                        UpdatedAt = now
                    },
                    new Patient
                    {
                        ExternalEmployeeId = "EMP-0003",
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
                        LastSyncedAt = now,
                        CreatedAt = now,
                        UpdatedAt = now
                    },
                    new Patient
                    {
                        ExternalEmployeeId = "EMP-0004",
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
                        LastSyncedAt = now,
                        CreatedAt = now,
                        UpdatedAt = now
                    },
                    new Patient
                    {
                        ExternalEmployeeId = "EMP-0005",
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
                        LastSyncedAt = now,
                        CreatedAt = now,
                        UpdatedAt = now
                    },
                    new Patient
                    {
                        ExternalEmployeeId = "EMP-0006",
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
                        LastSyncedAt = now,
                        CreatedAt = now,
                        UpdatedAt = now
                    },
                    new Patient
                    {
                        ExternalEmployeeId = "EMP-0007",
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
                        LastSyncedAt = now,
                        CreatedAt = now,
                        UpdatedAt = now
                    },
                    new Patient
                    {
                        ExternalEmployeeId = "EMP-0008",
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
                        LastSyncedAt = now,
                        CreatedAt = now,
                        UpdatedAt = now
                    },
                    new Patient
                    {
                        ExternalEmployeeId = "EMP-0009",
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
                        LastSyncedAt = now,
                        CreatedAt = now,
                        UpdatedAt = now
                    },
                    new Patient
                    {
                        ExternalEmployeeId = "EMP-0010",
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
                        LastSyncedAt = now,
                        CreatedAt = now,
                        UpdatedAt = now
                    },
                    new Patient
                    {
                        ExternalEmployeeId = "EMP-0011",
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
                        LastSyncedAt = now,
                        CreatedAt = now,
                        UpdatedAt = now
                    }
                );
                await context.SaveChangesAsync();
            }

            // Seed Physicians. As with the admins, one doctor is settled and one is
            // still on the password an admin issued at onboarding.
            if (!await context.Physicians.AnyAsync())
            {
                context.Physicians.AddRange(
                    new Physician
                    {
                        Username = "doctor",
                        PasswordHash = HashPassword("password123"),
                        // settled account: the Station 3 fixtures are assigned to this
                        // doctor, so it should not be stuck behind a password prompt
                        MustChangePassword = false,
                        PasswordSetAt = now.AddDays(-30),
                        PasswordChangedAt = now.AddDays(-30),
                        Surname = "House",
                        FirstName = "Gregory",
                        MiddleName = "H.",
                        PRCLicenseNo = "PRC-12345",
                        ContactNo = "09171234567",
                        IsActive = true,
                        CreatedAt = now,
                        UpdatedAt = now
                    },
                    new Physician
                    {
                        Username = "mgrey",
                        PasswordHash = HashPassword("password123"),
                        // freshly onboarded by an admin: still on the default
                        MustChangePassword = true,
                        PasswordSetAt = now,
                        PasswordChangedAt = null,
                        Surname = "Grey",
                        FirstName = "Meredith",
                        MiddleName = "E.",
                        PRCLicenseNo = "PRC-67890",
                        ContactNo = "09176789012",
                        IsActive = true,
                        CreatedAt = now,
                        UpdatedAt = now
                    }
                );
                await context.SaveChangesAsync();
            }

            // Seed wellness forms: one parked at each stage of the workflow, so every
            // station queue has something in it on a fresh development database.
            if (!await context.WellnessForms.AnyAsync())
            {
                var patients = await context.Patients.OrderBy(p => p.PatientID).Take(3).ToListAsync();
                var physician = await context.Physicians.FirstAsync();
                var conditionHypertension = await context.MedicalConditions.FirstAsync(c => c.ConditionName == "Hypertension");
                var conditionDiabetes = await context.MedicalConditions.FirstAsync(c => c.ConditionName == "Diabetes Mellitus");

                // ---- Form A: completed and signed (Station 3 done) ----
                var completed = new WellnessForm
                {
                    PatientID = patients[0].PatientID,
                    PhysicianID = physician.PhysicianID,
                    Status = "Completed",
                    CurrentStation = 3,
                    // a completed form must be signed, so the seed carries a placeholder signature
                    Signature = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                    SignedAt = now,
                    FormDate = now.Date,
                    WeightKg = 75.5m,
                    HeightCm = 175.0m,
                    BMI = 24.65m,
                    IdealBMI = 22.0m,
                    BPSystolic = 120,
                    BPDiastolic = 80,
                    TempCelsius = 36.5m,
                    HeartRate = 72,
                    RespRate = 16,
                    Station1AdminID = currentAdmin?.AdminID,
                    Station1SubmittedAt = now.AddHours(-3),
                    Station2AdminID = currentAdmin?.AdminID,
                    Station2SubmittedAt = now.AddHours(-2),
                    RecommendedDiagnosticTest = "CBC, Urinalysis, FBS",
                    ImpressionClinical = "Generally healthy; pre-diabetic monitoring",
                    ManagementTreatment = "Maintain healthy diet, exercise regularly",
                    Station3SubmittedAt = now,
                    CreatedByAdminID = currentAdmin?.AdminID,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                // ---- Form B: Station 2 done, sitting in the doctor's queue ----
                var pendingConsultation = new WellnessForm
                {
                    PatientID = patients[1].PatientID,
                    Status = "PendingConsultation",
                    CurrentStation = 3,
                    FormDate = now.Date,
                    WeightKg = 58.0m,
                    HeightCm = 162.0m,
                    BMI = 22.10m,
                    IdealBMI = 21.5m,
                    BPSystolic = 118,
                    BPDiastolic = 76,
                    TempCelsius = 36.7m,
                    HeartRate = 68,
                    RespRate = 15,
                    Station1AdminID = currentAdmin?.AdminID,
                    Station1SubmittedAt = now.AddHours(-2),
                    Station2AdminID = currentAdmin?.AdminID,
                    Station2SubmittedAt = now.AddHours(-1),
                    CreatedByAdminID = currentAdmin?.AdminID,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                // ---- Form C: Station 1 done, sitting in the assessment queue ----
                var pendingAssessment = new WellnessForm
                {
                    PatientID = patients[2].PatientID,
                    Status = "PendingAssessment",
                    CurrentStation = 2,
                    FormDate = now.Date,
                    WeightKg = 82.3m,
                    HeightCm = 178.0m,
                    BMI = 25.98m,
                    IdealBMI = 23.0m,
                    BPSystolic = 132,
                    BPDiastolic = 85,
                    TempCelsius = 36.4m,
                    HeartRate = 78,
                    RespRate = 17,
                    Station1AdminID = currentAdmin?.AdminID,
                    Station1SubmittedAt = now.AddMinutes(-20),
                    CreatedByAdminID = currentAdmin?.AdminID,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                context.WellnessForms.AddRange(completed, pendingConsultation, pendingAssessment);
                await context.SaveChangesAsync();

                // ---- Station 2 answers for the two forms that cleared assessment ----
                // Picks a mid-range option for every active question rather than
                // hand-listing 32 answers, so the seed survives question-bank edits.
                var questions = await context.AssessmentQuestions
                    .Where(q => q.IsActive)
                    .OrderBy(q => q.QuestionID)
                    .ToListAsync();
                var optionsByQuestion = await context.AssessmentOptions
                    .OrderBy(o => o.DisplayOrder)
                    .ToListAsync();

                foreach (var form in new[] { completed, pendingConsultation })
                {
                    // alternate between the best and second-best option so the two
                    // seeded forms do not produce identical category scores
                    var pickBest = form.FormID == completed.FormID;
                    foreach (var question in questions)
                    {
                        var choices = optionsByQuestion
                            .Where(o => o.QuestionID == question.QuestionID)
                            .OrderByDescending(o => o.Score)
                            .ToList();
                        var chosen = pickBest ? choices[0] : choices[Math.Min(1, choices.Count - 1)];

                        context.AssessmentAnswers.Add(new AssessmentAnswer
                        {
                            FormID = form.FormID,
                            QuestionID = question.QuestionID,
                            OptionID = chosen.OptionID,
                            CreatedAt = now
                        });
                    }
                }

                // ---- Station 3 clinical history, on the completed form only ----
                context.SocialHistories.Add(new SocialHistory
                {
                    FormID = completed.FormID,
                    SmokingSticksPerDay = 0,
                    AlcoholType = "Beer",
                    DrinkFrequency = "Occasional",
                    DrinksPerSession = "1-2",
                    HasBeenDrunk = false,
                    DrunkFrequency = "Never",
                    ExerciseFrequency = "3x a week",
                    ExerciseType = "Jogging",
                    CreatedAt = now,
                    UpdatedAt = now
                });

                context.FamilyMedicalHistories.Add(new FamilyMedicalHistory
                {
                    FormID = completed.FormID,
                    ConditionID = conditionHypertension.ConditionID,
                    IsNone = false,
                    FamilyMembers = "Father, paternal grandfather",
                    CreatedAt = now,
                    UpdatedAt = now
                });

                context.PastMedicalHistories.Add(new PastMedicalHistory
                {
                    FormID = completed.FormID,
                    ConditionID = conditionDiabetes.ConditionID,
                    YearDiagnosed = 2020,
                    MaintenanceDrugGeneric = "Metformin",
                    Dosage = "500mg",
                    Frequency = "Once a day",
                    CreatedAt = now,
                    UpdatedAt = now
                });

                // ---- Audit trail for the hand-offs the seed data represents ----
                if (currentAdmin is not null)
                {
                    context.WellnessFormAuditLogs.AddRange(
                        new WellnessFormAuditLog
                        {
                            FormID = completed.FormID,
                            ActorType = "Admin",
                            ActorID = currentAdmin.AdminID,
                            Action = "Station1Submitted",
                            OccurredAt = now.AddHours(-3)
                        },
                        new WellnessFormAuditLog
                        {
                            FormID = completed.FormID,
                            ActorType = "Admin",
                            ActorID = currentAdmin.AdminID,
                            Action = "Station2Submitted",
                            OccurredAt = now.AddHours(-2)
                        },
                        new WellnessFormAuditLog
                        {
                            FormID = completed.FormID,
                            ActorType = "Physician",
                            ActorID = physician.PhysicianID,
                            Action = "Station3Signed",
                            OccurredAt = now
                        },
                        new WellnessFormAuditLog
                        {
                            FormID = pendingConsultation.FormID,
                            ActorType = "Admin",
                            ActorID = currentAdmin.AdminID,
                            Action = "Station2Submitted",
                            OccurredAt = now.AddHours(-1)
                        },
                        new WellnessFormAuditLog
                        {
                            FormID = pendingAssessment.FormID,
                            ActorType = "Admin",
                            ActorID = currentAdmin.AdminID,
                            Action = "Station1Submitted",
                            OccurredAt = now.AddMinutes(-20)
                        }
                    );
                }

                await context.SaveChangesAsync();
            }

            // Seed patient portal accounts. Station 1 provisions one of these the
            // first time it registers an employee; all three credential states are
            // represented here so the portal login flow has something to exercise.
            if (!await context.PatientAccounts.AnyAsync())
            {
                var portalPatients = await context.Patients.OrderBy(p => p.PatientID).Take(3).ToListAsync();

                // Usernames are derived from the employee id at provisioning time so
                // Station 1 can hand the patient a predictable handle; the id itself is
                // no longer a login identifier.
                context.PatientAccounts.Add(new PatientAccount
                {
                    PatientID = portalPatients[0].PatientID,
                    Username = UsernameFor(portalPatients[0].ExternalEmployeeId),
                    PasswordHash = HashPassword("patient123"),
                    // settled account: chose their own password after activating
                    MustChangePassword = false,
                    PasswordSetAt = now.AddDays(-1),
                    PasswordChangedAt = now,
                    Status = "Active",
                    ProvisionedAt = now.AddDays(-1),
                    ActivatedAt = now,
                    CreatedAt = now,
                    UpdatedAt = now
                });

                // provisioned but never activated: no password yet, so nothing is owed
                context.PatientAccounts.Add(new PatientAccount
                {
                    PatientID = portalPatients[1].PatientID,
                    Username = UsernameFor(portalPatients[1].ExternalEmployeeId),
                    MustChangePassword = false,
                    Status = "Provisioned",
                    ProvisionedAt = now,
                    CreatedAt = now,
                    UpdatedAt = now
                });

                // onboarded by an admin who handed over a default password: active,
                // but the patient still has to replace it on first login
                context.PatientAccounts.Add(new PatientAccount
                {
                    PatientID = portalPatients[2].PatientID,
                    Username = UsernameFor(portalPatients[2].ExternalEmployeeId),
                    PasswordHash = HashPassword("patient123"),
                    MustChangePassword = true,
                    PasswordSetAt = now,
                    PasswordChangedAt = null,
                    Status = "Active",
                    ProvisionedAt = now,
                    ActivatedAt = now,
                    CreatedAt = now,
                    UpdatedAt = now
                });

                await context.SaveChangesAsync();
            }
        }

        // "EMP-0001" -> "emp0001". Keeps the handle easy to dictate at the counter
        // while staying inside the 30-char unique column.
        private static string UsernameFor(string externalEmployeeId)
        {
            var cleaned = new string(externalEmployeeId
                .Where(char.IsLetterOrDigit)
                .ToArray())
                .ToLowerInvariant();
            return cleaned.Length > 30 ? cleaned[..30] : cleaned;
        }

        // -----------------------------------------------------------------
        // REMOVED: the old HashPassword(string) method that used raw
        // SHA256.Create()/ComputeHash(). It's no longer called anywhere in
        // this file — every PasswordHash assignment now goes through
        // PasswordHasher<T>.HashPassword(...) above, so this method (and
        // the System.Security.Cryptography / System.Text usings it needed)
        // has been deleted rather than left as dead code.
        // -----------------------------------------------------------------
    }
}