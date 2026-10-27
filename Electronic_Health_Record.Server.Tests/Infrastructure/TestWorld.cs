using System.Net.Http.Headers;
using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Electronic_Health_Record.Server.Tests.Infrastructure;

/// <summary>
/// Seeds the rows a test needs and hands out clients signed in as a given
/// account, with a token from the app's own TokenService -- so a request is
/// authorized exactly as it would be after a real login.
///
/// Test classes share one database per fixture, so everything seeded here is
/// unique per call (usernames, employee ids, licence numbers) and a test only
/// ever asserts on the rows it seeded itself.
/// </summary>
public sealed class TestWorld(EhrApiFactory factory)
{
    public const string Signature = "data:image/png;base64,AAAA";

    /// <summary>The rowVersion token the client would have read with the form.</summary>
    public static string TokenOf(WellnessForm form) => Convert.ToBase64String(form.RowVersion!);

    private static string Unique(string prefix) => $"{prefix}-{Guid.NewGuid():N}"[..20];

    public async Task<T> WithDbAsync<T>(Func<ElectronicHealthRecordDbContext, Task<T>> work)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ElectronicHealthRecordDbContext>();
        return await work(db);
    }

    public Task<Admin> AddAdminAsync(string role = AdminRoles.Admin) => WithDbAsync(async db =>
    {
        var admin = new Admin
        {
            Username = Unique("admin"),
            Role = role,
            FullName = "Test Admin",
            PasswordHash = "unused",
            MustChangePassword = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Admins.Add(admin);
        await db.SaveChangesAsync();
        return admin;
    });

    public Task<Physician> AddPhysicianAsync(int station, bool isActive = true, string surname = "Reyes") => WithDbAsync(async db =>
    {
        var physician = new Physician
        {
            Username = Unique("doc"),
            PasswordHash = "unused",
            MustChangePassword = false,
            Surname = surname,
            FirstName = "Ana",
            PRCLicenseNo = Unique("PRC"),
            Station = station,
            IsActive = isActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Physicians.Add(physician);
        await db.SaveChangesAsync();
        return physician;
    });

    public Task<Patient> AddPatientAsync(DateTime? birthdate = null) => WithDbAsync(async db =>
    {
        var patient = new Patient
        {
            ExternalEmployeeId = Unique("EMP"),
            Surname = "DELA CRUZ",
            FirstName = "JUAN",
            Birthdate = birthdate ?? new DateTime(1979, 2, 8),
            Sex = "Male",
            CivilStatus = "Single",
            LastSyncedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Patients.Add(patient);
        await db.SaveChangesAsync();
        return patient;
    });

    public Task<PatientAccount> AddPatientAccountAsync(int patientID) => WithDbAsync(async db =>
    {
        var account = new PatientAccount
        {
            PatientID = patientID,
            Username = Unique("pt"),
            PasswordHash = "unused",
            Status = "Active",
            ProvisionedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.PatientAccounts.Add(account);
        await db.SaveChangesAsync();
        return account;
    });

    /// <summary>A form parked at the desk its status names, as the previous station left it.</summary>
    public Task<WellnessForm> AddFormAsync(int patientID, string status, byte currentStation) => WithDbAsync(async db =>
    {
        var form = new WellnessForm
        {
            PatientID = patientID,
            Status = status,
            CurrentStation = currentStation,
            FormDate = new DateTime(2026, 10, 8),
            WeightKg = 62, HeightCm = 158, BMI = 24.8m, IdealBMI = 22,
            BPSystolic = 118, BPDiastolic = 76, TempCelsius = 36.6m, HeartRate = 72, RespRate = 16,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.WellnessForms.Add(form);
        await db.SaveChangesAsync();
        return form;
    });

    /// <summary>One question with two options of its own, and a third option belonging elsewhere.</summary>
    public Task<(int QuestionID, int OptionID, int ForeignOptionID)> AddAssessmentQuestionAsync() => WithDbAsync(async db =>
    {
        var category = new AssessmentCategory { Name = Unique("Cat"), DisplayOrder = 1 };
        db.AssessmentCategories.Add(category);
        await db.SaveChangesAsync();

        var question = new AssessmentQuestion { CategoryID = category.CategoryID, QuestionText = "Q", DisplayOrder = 1, CreatedAt = DateTime.UtcNow };
        var other = new AssessmentQuestion { CategoryID = category.CategoryID, QuestionText = "Other Q", DisplayOrder = 2, CreatedAt = DateTime.UtcNow };
        db.AssessmentQuestions.AddRange(question, other);
        await db.SaveChangesAsync();

        var option = new AssessmentOption { QuestionID = question.QuestionID, OptionText = "Never", Score = 4, DisplayOrder = 1 };
        var foreign = new AssessmentOption { QuestionID = other.QuestionID, OptionText = "Always", Score = 1, DisplayOrder = 1 };
        db.AssessmentOptions.AddRange(option, foreign);
        await db.SaveChangesAsync();

        return (question.QuestionID, option.OptionID, foreign.OptionID);
    });

    public Task<WellnessForm?> FindFormAsync(int formID) =>
        WithDbAsync(db => db.WellnessForms.FindAsync(formID).AsTask());

    public HttpClient AnonymousClient() => factory.CreateClient();

    public Task<HttpClient> ClientForAsync(Admin admin) =>
        SignedInClientAsync(tokens => tokens.GenerateTokenAsync(admin));

    public Task<HttpClient> ClientForAsync(Physician physician) =>
        SignedInClientAsync(tokens => tokens.GenerateTokenAsync(physician));

    public async Task<HttpClient> ClientForAsync(PatientAccount account)
    {
        var patient = await WithDbAsync(db => db.Patients.FindAsync(account.PatientID).AsTask());
        return await SignedInClientAsync(tokens => tokens.GenerateTokenAsync(account, patient!));
    }

    private async Task<HttpClient> SignedInClientAsync(Func<TokenService, Task<(string token, DateTime expiresAt)>> mint)
    {
        string token;
        using (var scope = factory.Services.CreateScope())
        {
            var tokens = scope.ServiceProvider.GetRequiredService<TokenService>();
            (token, _) = await mint(tokens);
        }

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}
