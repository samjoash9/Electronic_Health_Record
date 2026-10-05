using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.Patient;
using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services;
using Microsoft.AspNetCore.Authorization;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Microsoft.EntityFrameworkCore.Scaffolding.Metadata;
using System.Globalization;
using System.Linq.Expressions;
using System.Runtime.InteropServices;


namespace Electronic_Health_Record.Server.Controllers.Reference
{
    [ApiController]
    [Route("api/[controller]")]  
    public class PatientsController : ControllerBase
    {
        private readonly ElectronicHealthRecordDbContext _context;
        private readonly ILogger<PatientsController> _logger;

        public PatientsController(
            ElectronicHealthRecordDbContext context,
            ILogger<PatientsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // get all patients
        [Authorize]
        [HttpGet("")]
        public async Task<IActionResult> GetPatients()
        {
            try
            {
                var patients = await _context.Patients.ToListAsync();
                return Ok(new { data = patients });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve patients.");
                return StatusCode(500, "An error occurred while retrieving patients.");
            }
        }

        // get specific patient
        [Authorize]
        // :int so this cannot swallow the literal routes below it -- without the
        // constraint "accounts" matches here too and fails model binding with
        // "The value 'accounts' is not valid."
        [HttpGet("{PatientId:int}")]
        public async Task<IActionResult> GetPatient(int PatientId)
        {
            try
            {
                var patient = await _context.Patients.FindAsync(PatientId);

                if (patient == null)
                    return NotFound($"Patient with ID {PatientId} was not found.");

                return Ok(patient);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve patient {PatientId}.", PatientId);
                return StatusCode(500, "An error occurred while retrieving the patient.");
            }
        }

        // register new patient
        [Authorize]
        [HttpPost("")]
        public async Task<IActionResult> CreatePatient([FromBody] CreatePatientDto dto)
        {
            // check if input is valid
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            
            try
            {
                var patient = new Patient
                {
                    Surname = dto.Surname,
                    FirstName = dto.FirstName,
                    MiddleName = dto.MiddleName,
                    Birthdate = dto.Birthdate,
                    Sex = dto.Sex,
                    CivilStatus = dto.CivilStatus,
                    Address = dto.Address,
                    AgencyOffice = dto.AgencyOffice,
                    Position = dto.Position,
                    ContactNo = dto.ContactNo
                    // for the CreatedAt and UpdatedAt is handled by DB defaults
                };

                _context.Patients.Add(patient);
                await _context.SaveChangesAsync();

                return CreatedAtAction(
                        nameof(GetPatient),
                        new { PatientId = patient.PatientID },
                        patient);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to create patient.");
                return StatusCode(500, "An error occurred while creating the patient.");
            }
        }

        // GET /api/patients/has-account/{externalEmployeeId}
        // Lets Station 1 know, once an employee is picked, whether a
        // PatientAccount already exists for them -- if not, the admin must
        // ask the patient for a desired username before submitting.
        [Authorize]
        [HttpGet("has-account/{externalEmployeeId}")]
        public async Task<IActionResult> HasAccount(string externalEmployeeId)
        {
            try
            {
                var patientID = await _context.Patients
                    .Where(p => p.ExternalEmployeeId == externalEmployeeId)
                    .Select(p => (int?)p.PatientID)
                    .FirstOrDefaultAsync();

                var hasAccount = patientID.HasValue
                    && await _context.PatientAccounts.AnyAsync(a => a.PatientID == patientID.Value);

                return Ok(new { hasAccount });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to check account status for employee {ExternalEmployeeId}.", externalEmployeeId);
                return StatusCode(500, "An error occurred while checking account status.");
            }
        }

        // GET /api/patients/username-available?username=...
        // Lets Station 1 flag a taken username while the admin is still on the
        // field, instead of only at submit. Free means free across every kind
        // of login (see IsUsernameTakenAsync). Staff only: it reveals whether
        // an account exists, which a patient has no reason to probe.
        [Authorize(Roles = $"{AdminRoles.Admin},{AdminRoles.SuperAdmin}")]
        [HttpGet("username-available")]
        public async Task<IActionResult> UsernameAvailable([FromQuery] string? username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return BadRequest(new { message = "Username is required." });

            try
            {
                var available = !await _context.IsUsernameTakenAsync(username);
                return Ok(new { available });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to check username availability.");
                return StatusCode(500, "An error occurred while checking the username.");
            }
        }

        // GET /api/patients/accounts
        // Every patient with the portal account Station 1 provisioned for them,
        // for the admin Patients panel. Staff-only: a patient must never be able
        // to enumerate other patients' login handles.
        //
        // Account is null for a Patient row the HR sync created but that has
        // never been registered at Station 1, so the panel can show those as
        // "not onboarded" rather than hiding them.
        [Authorize(Roles = $"{AdminRoles.Admin},{AdminRoles.SuperAdmin}")]
        [HttpGet("accounts")]
        public async Task<IActionResult> GetPatientAccounts()
        {
            try
            {
                // Left-joined in one query rather than per-patient lookups --
                // PatientAccount is 1:1 with Patient (see the HasOne/WithOne in
                // ElectronicHealthRecordDbContext), so this cannot fan out.
                var rows = await _context.Patients
                    .GroupJoin(
                        _context.PatientAccounts,
                        p => p.PatientID,
                        a => a.PatientID,
                        (p, accounts) => new { Patient = p, Accounts = accounts })
                    .SelectMany(
                        x => x.Accounts.DefaultIfEmpty(),
                        (x, account) => new PatientWithAccountDto
                        {
                            PatientID = x.Patient.PatientID,
                            ExternalEmployeeId = x.Patient.ExternalEmployeeId,
                            Surname = x.Patient.Surname,
                            FirstName = x.Patient.FirstName,
                            MiddleName = x.Patient.MiddleName,
                            Birthdate = x.Patient.Birthdate,
                            Sex = x.Patient.Sex,
                            AgencyOffice = x.Patient.AgencyOffice,
                            Position = x.Patient.Position,
                            ContactNo = x.Patient.ContactNo,
                            CreatedAt = x.Patient.CreatedAt,
                            // never the raw entity here: PatientAccount carries PasswordHash
                            Account = account == null ? null : new PatientAccountDto
                            {
                                PatientAccountID = account.PatientAccountID,
                                PatientID = account.PatientID,
                                Username = account.Username,
                                Status = account.Status,
                                MustChangePassword = account.MustChangePassword,
                                ProvisionedAt = account.ProvisionedAt,
                                ActivatedAt = account.ActivatedAt,
                                LastLoginAt = account.LastLoginAt,
                            },
                        })
                    .OrderBy(p => p.Surname)
                    .ThenBy(p => p.FirstName)
                    .ToListAsync();

                return Ok(rows);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve patient accounts.");
                return StatusCode(500, "An error occurred while retrieving patient accounts.");
            }
        }

        // PUT    /api/patients/:id → full update (edit patient profile)


        // PATCH  /api/patients/:id → partial update

        // PATCH /api/patients/:id/account
        // Suspends or restores the portal login without touching the person or
        // their records. Reversible, and the counterpart to DELETE below: this
        // is what "the patient should not be able to sign in" means.
        [Authorize(Roles = AdminRoles.SuperAdmin)]
        [HttpPatch("{patientId:int}/account")]
        public async Task<IActionResult> SetPatientAccountStatus(
            int patientId,
            [FromBody] SetPatientAccountStatusDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var account = await _context.PatientAccounts
                .FirstOrDefaultAsync(a => a.PatientID == patientId);
            if (account == null)
                return NotFound($"Patient with ID {patientId} has no portal account.");

            // Status is free text in the schema; these are the only two values
            // this endpoint writes, and AuthController treats anything other
            // than an active status as unable to sign in.
            account.Status = dto.IsActive ? "Active" : "Suspended";
            account.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException e)
            {
                _logger.LogError(e, "Failed to update account status for patient {PatientID}", patientId);
                return StatusCode(500, "An error occurred while updating the account.");
            }

            return Ok(new
            {
                account.PatientAccountID,
                account.PatientID,
                account.Username,
                account.Status,
                account.MustChangePassword,
                account.ProvisionedAt,
                account.ActivatedAt,
                account.LastLoginAt,
            });
        }

        // DELETE /api/patients/:id → delete/deactivate patient
        //
        // Superadmin only, and genuinely destructive: it removes the person AND
        // their entire medical history -- every wellness form, the assessments
        // and charges hanging off those forms, the audit trail, the portal
        // login and its sessions.
        //
        // The alternative considered was detaching the forms (nulling
        // PatientID). That was rejected: a wellness form's PatientID is the
        // *subject* of the record, not an attribution, so an orphaned form is
        // vitals and diagnoses belonging to nobody -- unlinkable and clinically
        // meaningless. Deleting the history outright at least leaves nothing
        // misleading behind.
        //
        // Every FK below is Restrict except WellnessFormCharge, so the rows are
        // removed explicitly, children before parents, inside one transaction.
        [Authorize(Roles = AdminRoles.SuperAdmin)]
        [HttpDelete("{patientId:int}")]
        public async Task<IActionResult> DeletePatient(int patientId)
        {
            var patient = await _context.Patients.FindAsync(patientId);
            if (patient == null)
                return NotFound($"Patient with ID {patientId} was not found.");

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var formIds = await _context.WellnessForms
                    .Where(f => f.PatientID == patientId)
                    .Select(f => f.FormID)
                    .ToListAsync();

                if (formIds.Count > 0)
                {
                    // Per-form children first. WellnessFormCharge cascades from
                    // WellnessForm, but is removed here too so the delete does
                    // not depend on which FKs happen to cascade.
                    _context.WellnessFormCharges.RemoveRange(
                        await _context.WellnessFormCharges.Where(c => formIds.Contains(c.FormID)).ToListAsync());
                    _context.AssessmentAnswers.RemoveRange(
                        await _context.AssessmentAnswers.Where(a => formIds.Contains(a.FormID)).ToListAsync());
                    _context.SocialHistories.RemoveRange(
                        await _context.SocialHistories.Where(x => formIds.Contains(x.FormID)).ToListAsync());
                    _context.Exercises.RemoveRange(
                        await _context.Exercises.Where(x => formIds.Contains(x.FormID)).ToListAsync());
                    _context.DentalAssessments.RemoveRange(
                        await _context.DentalAssessments.Where(x => formIds.Contains(x.FormID)).ToListAsync());
                    _context.VisionAssessments.RemoveRange(
                        await _context.VisionAssessments.Where(x => formIds.Contains(x.FormID)).ToListAsync());
                    _context.FamilyMedicalHistories.RemoveRange(
                        await _context.FamilyMedicalHistories.Where(x => formIds.Contains(x.FormID)).ToListAsync());
                    _context.PastMedicalHistories.RemoveRange(
                        await _context.PastMedicalHistories.Where(x => formIds.Contains(x.FormID)).ToListAsync());
                    _context.WellnessFormAuditLogs.RemoveRange(
                        await _context.WellnessFormAuditLogs.Where(l => formIds.Contains(l.FormID)).ToListAsync());

                    await _context.SaveChangesAsync();

                    _context.WellnessForms.RemoveRange(
                        await _context.WellnessForms.Where(f => f.PatientID == patientId).ToListAsync());
                    await _context.SaveChangesAsync();
                }

                // Login and its sessions.
                var account = await _context.PatientAccounts
                    .FirstOrDefaultAsync(a => a.PatientID == patientId);
                if (account != null)
                {
                    _context.PatientSessions.RemoveRange(
                        await _context.PatientSessions
                            .Where(s => s.PatientAccountID == account.PatientAccountID)
                            .ToListAsync());
                    await _context.SaveChangesAsync();

                    _context.PatientAccounts.Remove(account);
                    await _context.SaveChangesAsync();
                }

                _context.Patients.Remove(patient);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                _logger.LogWarning(
                    "Deleted patient {PatientID} ({Surname}, {FirstName}) and {FormCount} wellness form(s) with all dependent records",
                    patientId, patient.Surname, patient.FirstName, formIds.Count);
            }
            catch (DbUpdateException e)
            {
                await transaction.RollbackAsync();
                _logger.LogError(e, "Failed to delete patient {PatientID}", patientId);
                return Conflict("Unable to delete this patient. Something still references their records; suspend the account instead.");
            }

            return NoContent();
        }

        // GET /api/patients/{id}/forms
        // A patient's full visit history, newest first: one row per
        // WellnessForm, since a patient can now go through the station
        // workflow repeatedly (monthly, six-monthly -- the cadence is an
        // operational decision this endpoint does not encode). Used by
        // Station 1 (is this a returning patient?), Station 3
        // (PriorStationsPanel's "Previous visits"), and Station 6 (has this
        // patient been billed before?).
        [Authorize]
        [HttpGet("{patientId:int}/forms")]
        public async Task<IActionResult> GetPatientForms(int patientId)
        {
            var patientExists = await _context.Patients.AnyAsync(p => p.PatientID == patientId);
            if (!patientExists)
                return NotFound(new { message = $"Patient with ID {patientId} was not found." });

            try
            {
                var forms = await _context.WellnessForms
                    .Where(f => f.PatientID == patientId)
                    .OrderByDescending(f => f.FormDate)
                    .ThenByDescending(f => f.FormID)
                    .ToListAsync();

                var formIds = forms.Select(f => f.FormID).ToList();

                var chargeTotals = await _context.WellnessFormCharges
                    .Where(c => formIds.Contains(c.FormID))
                    .GroupBy(c => c.FormID)
                    .Select(g => new { FormID = g.Key, Total = g.Sum(c => (c.UnitPrice ?? 0) * c.Quantity) })
                    .ToDictionaryAsync(g => g.FormID, g => g.Total);

                // No per-visit billing status: budget is scoped to a period
                // (BillingForm), not to a form, so a visit is not individually
                // approved or deducted. Its charges count toward whichever
                // period covers its FormDate.
                var rows = forms.Select(f => new
                {
                    f.FormID,
                    f.Status,
                    f.CurrentStation,
                    f.FormDate,
                    f.ImpressionClinical,
                    f.RecommendedDiagnosticTest,
                    f.ManagementTreatment,
                    TotalCharged = chargeTotals.GetValueOrDefault(f.FormID, 0m),
                }).ToList();

                return Ok(new { data = rows });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve visit history for patient {PatientID}.", patientId);
                return StatusCode(500, "An error occurred while retrieving this patient's visit history.");
            }
        }

        // Manila has had no DST since 1978 (see PhilippineTime), so a fixed
        // offset is exact -- and, unlike TimeZoneInfo, it translates to SQL.
        private const int ManilaUtcOffsetHours = 8;

        // GET /api/patients/onboarded?granularity=day&year=2026&month=10
        // GET /api/patients/onboarded?granularity=month&year=2026
        // GET /api/patients/onboarded?granularity=year
        // The dashboard's "Total Patients Onboarded" chart. A patient is
        // onboarded when Station 1 first registers them (Patient.CreatedAt,
        // stored UTC). Buckets are Manila calendar days/months/years, so a
        // 7 AM PHT registration -- still the previous day in UTC -- lands on
        // the day the clinic actually saw it. Every bucket in the range comes
        // back, zero-filled, so the client can plot the series as-is.
        //   day   -> each day of the month; previous = same day of the month before
        //   month -> each month of the year; previous = same month of the year before
        //   year  -> each year since the first registration; no previous
        [Authorize]
        [HttpGet("onboarded")]
        public async Task<IActionResult> GetOnboardedStats(
            [FromQuery] string? granularity,
            [FromQuery] int? year,
            [FromQuery] int? month)
        {
            var mode = granularity?.Trim().ToLowerInvariant();
            if (mode is not ("day" or "month" or "year"))
                return BadRequest(new { message = "granularity must be day, month, or year." });

            if (mode is "day" or "month" && year is not (>= 1900 and <= 2100))
                return BadRequest(new { message = "A year between 1900 and 2100 is required." });

            if (mode == "day" && month is not (>= 1 and <= 12))
                return BadRequest(new { message = "A month between 1 and 12 is required." });

            try
            {
                var thisYear = PhilippineTime.Today.Year;
                var firstCreatedAt = await _context.Patients.MinAsync(p => (DateTime?)p.CreatedAt);
                var firstYear = firstCreatedAt is { } first
                    ? Math.Min(first.AddHours(ManilaUtcOffsetHours).Year, thisYear)
                    : thisYear;

                List<OnboardedPoint> points;

                if (mode == "day")
                {
                    var start = new DateTime(year!.Value, month!.Value, 1);
                    var previousStart = start.AddMonths(-1);
                    var current = await CountOnboardedAsync(start, start.AddMonths(1), p => p.CreatedAt.AddHours(ManilaUtcOffsetHours).Day);
                    var previous = await CountOnboardedAsync(previousStart, start, p => p.CreatedAt.AddHours(ManilaUtcOffsetHours).Day);
                    var daysInPrevious = DateTime.DaysInMonth(previousStart.Year, previousStart.Month);

                    // Previous is null past the end of a shorter month (Mar 31
                    // has no Feb 31), so the dashed line stops instead of
                    // dropping to a zero that never happened.
                    points = Enumerable.Range(1, DateTime.DaysInMonth(start.Year, start.Month))
                        .Select(d => new OnboardedPoint(
                            d.ToString(CultureInfo.InvariantCulture),
                            current.GetValueOrDefault(d),
                            d <= daysInPrevious ? previous.GetValueOrDefault(d) : null))
                        .ToList();
                }
                else if (mode == "month")
                {
                    var start = new DateTime(year!.Value, 1, 1);
                    var current = await CountOnboardedAsync(start, start.AddYears(1), p => p.CreatedAt.AddHours(ManilaUtcOffsetHours).Month);
                    var previous = await CountOnboardedAsync(start.AddYears(-1), start, p => p.CreatedAt.AddHours(ManilaUtcOffsetHours).Month);

                    points = Enumerable.Range(1, 12)
                        .Select(m => new OnboardedPoint(
                            CultureInfo.InvariantCulture.DateTimeFormat.GetAbbreviatedMonthName(m),
                            current.GetValueOrDefault(m),
                            previous.GetValueOrDefault(m)))
                        .ToList();
                }
                else
                {
                    var counts = await CountOnboardedAsync(
                        new DateTime(firstYear, 1, 1),
                        new DateTime(thisYear + 1, 1, 1),
                        p => p.CreatedAt.AddHours(ManilaUtcOffsetHours).Year);

                    points = Enumerable.Range(firstYear, thisYear - firstYear + 1)
                        .Select(y => new OnboardedPoint(
                            y.ToString(CultureInfo.InvariantCulture),
                            counts.GetValueOrDefault(y),
                            null))
                        .ToList();
                }

                return Ok(new
                {
                    data = new
                    {
                        Total = points.Sum(p => p.Current),
                        Points = points,
                        // What the Year dropdown offers: every year that can
                        // have data, newest last.
                        Years = Enumerable.Range(firstYear, thisYear - firstYear + 1).ToList(),
                    },
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve onboarded patient stats.");
                return StatusCode(500, "An error occurred while retrieving onboarded patient stats.");
            }
        }

        private sealed record OnboardedPoint(string Label, int Current, int? Previous);

        // GET /api/patients/smoking-status
        // GET /api/patients/smoking-status?office=PROVINCIAL HEALTH OFFICE
        // The dashboard's Smoker Status card. Each patient counts once, by
        // the Social History of their latest visit that answered "Smokes?" --
        // someone who quit since an earlier visit is a non-smoker now.
        // Cancelled forms and unanswered rows are skipped. Station 3 lets a
        // smoker tick cigarette and e-cigarette both, so smokers split four
        // ways (cigarette only, e-cigarette only, both, neither ticked) and
        // the split adds up to the number of smokers.
        // office is compared with Patient.AgencyOffice (the client offers the
        // offices in agencyPositions.json); the column's default collation
        // makes that case-insensitive. Omit it for every office.
        [Authorize]
        [HttpGet("smoking-status")]
        public async Task<IActionResult> GetSmokingStatus([FromQuery] string? office)
        {
            var officeFilter = string.IsNullOrWhiteSpace(office) ? null : office.Trim();

            try
            {
                var answered =
                    from s in _context.SocialHistories
                    join f in _context.WellnessForms on s.FormID equals f.FormID
                    join p in _context.Patients on f.PatientID equals p.PatientID
                    where s.Smokes != null
                       && f.Status != "Cancelled"
                       && (officeFilter == null || p.AgencyOffice == officeFilter)
                    select new
                    {
                        f.PatientID,
                        f.FormDate,
                        f.FormID,
                        s.SocialHistoryID,
                        s.Smokes,
                        s.SmokesCigarette,
                        s.SmokesEcig,
                    };

                // A patient's latest answered visit is the one no other answered
                // visit of theirs comes after. FormID breaks same-day ties (as
                // in WellnessFormsController.GetMine), and SocialHistoryID a
                // stray second row on one form, so nobody is counted twice.
                var latest = answered.Where(a => !answered.Any(b =>
                    b.PatientID == a.PatientID
                    && (b.FormDate > a.FormDate
                        || (b.FormDate == a.FormDate && b.FormID > a.FormID)
                        || (b.FormID == a.FormID && b.SocialHistoryID > a.SocialHistoryID))));

                // One constant group, so at most one row: taken in memory
                // rather than with FirstOrDefaultAsync, which makes EF log an
                // "unordered First" warning on every dashboard load.
                var counts = (await latest
                    .GroupBy(_ => 1)
                    .Select(g => new
                    {
                        Total = g.Count(),
                        NonSmokers = g.Count(x => x.Smokes == false),
                        Traditional = g.Count(x => x.Smokes == true && x.SmokesCigarette && !x.SmokesEcig),
                        ECigarette = g.Count(x => x.Smokes == true && !x.SmokesCigarette && x.SmokesEcig),
                        Both = g.Count(x => x.Smokes == true && x.SmokesCigarette && x.SmokesEcig),
                        Unspecified = g.Count(x => x.Smokes == true && !x.SmokesCigarette && !x.SmokesEcig),
                    })
                    .ToListAsync())
                    .SingleOrDefault();

                return Ok(new
                {
                    data = new
                    {
                        Total = counts?.Total ?? 0,
                        NonSmokers = counts?.NonSmokers ?? 0,
                        Smokers = new
                        {
                            Traditional = counts?.Traditional ?? 0,
                            ECigarette = counts?.ECigarette ?? 0,
                            Both = counts?.Both ?? 0,
                            Unspecified = counts?.Unspecified ?? 0,
                        },
                    },
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve smoking status for office {Office}.", officeFilter ?? "(all)");
                return StatusCode(500, "An error occurred while retrieving smoking status.");
            }
        }

        // Registrations in [fromLocal, toLocal) Manila time, counted per
        // bucket. The range is converted to UTC and filtered on the raw
        // column so SQL can use it as-is; only the grouping key shifts.
        private async Task<Dictionary<int, int>> CountOnboardedAsync(
            DateTime fromLocal,
            DateTime toLocal,
            Expression<Func<Patient, int>> bucket)
        {
            var fromUtc = fromLocal.AddHours(-ManilaUtcOffsetHours);
            var toUtc = toLocal.AddHours(-ManilaUtcOffsetHours);

            return await _context.Patients
                .Where(p => p.CreatedAt >= fromUtc && p.CreatedAt < toUtc)
                .GroupBy(bucket)
                .Select(g => new { g.Key, Count = g.Count() })
                .ToDictionaryAsync(g => g.Key, g => g.Count);
        }
    }
}
