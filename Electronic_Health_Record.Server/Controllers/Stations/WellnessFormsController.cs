using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.WellnessForm;
using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers.Stations
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WellnessFormsController : ControllerBase
    {
        private readonly ElectronicHealthRecordDbContext _context;
        private readonly ICurrentUser _currentUser;
        private readonly ILogger<WellnessFormsController> _logger;

        public WellnessFormsController(
            ElectronicHealthRecordDbContext context,
            ICurrentUser currentUser,
            ILogger<WellnessFormsController> logger)
        {
            _context = context;
            _currentUser = currentUser;
            _logger = logger;
        }

        // GET /api/wellnessforms
        // GET /api/wellnessforms?status=PendingAssessment,PendingConsultation
        // Every station queue and the admin forms list both hit this route; a
        // status filter reads as a queue (oldest first, so the longest-waiting
        // patient is handled next), the unfiltered list reads as a history feed
        // (newest first).
        [HttpGet("")]
        public async Task<IActionResult> GetForms([FromQuery] string? status)
        {
            var query = _context.WellnessForms.AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                var wanted = status.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                query = query.Where(f => wanted.Contains(f.Status));
                query = query.OrderBy(f => f.FormDate);
            }
            else
            {
                query = query.OrderByDescending(f => f.FormDate);
            }

            var forms = await query.ToListAsync();
            var patientsById = await PatientsByIdAsync(forms.Select(f => f.PatientID));

            return Ok(forms.Select(f => WithPatient(f, patientsById)));
        }

        // GET /api/wellnessforms/stats
        // Dashboard aggregates, computed here instead of client-side over the full
        // list — see DashboardPage.jsx, which the client-side version this
        // replaces read from getAllForms().
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var forms = await _context.WellnessForms
                .Select(f => new { f.Status, f.CurrentStation, f.PatientID, f.FormDate })
                .ToListAsync();

            var today = DateTime.Now.Date;

            var stats = new
            {
                total = forms.Count,
                byStatus = new
                {
                    pendingAssessment = forms.Count(f => f.Status == "PendingAssessment"),
                    pendingConsultation = forms.Count(f => f.Status == "PendingConsultation"),
                    completed = forms.Count(f => f.Status == "Completed"),
                    cancelled = forms.Count(f => f.Status == "Cancelled"),
                },
                byStation = new
                {
                    station1 = forms.Count(f => f.CurrentStation == 1),
                    station2 = forms.Count(f => f.CurrentStation == 2),
                    station3 = forms.Count(f => f.CurrentStation == 3),
                },
                totalPatients = forms.Select(f => f.PatientID).Distinct().Count(),
                submittedToday = forms.Count(f => f.FormDate.Date == today),
            };

            return Ok(stats);
        }

        // GET /api/wellnessforms/mine
        // Scoped to the calling patient's own account — the patientID argument the
        // mock's getPatientForms() takes is deliberately not a route/query param
        // here, so a patient can never pass someone else's id.
        [HttpGet("mine")]
        public async Task<IActionResult> GetMine()
        {
            if (_currentUser.PatientID is not { } patientID)
                return Unauthorized("No patient identity on this request.");

            var forms = await _context.WellnessForms
                .Where(f => f.PatientID == patientID)
                .OrderByDescending(f => f.FormDate)
                .ToListAsync();

            var patientsById = await PatientsByIdAsync(forms.Select(f => f.PatientID));

            return Ok(forms.Select(f => WithPatient(f, patientsById)));
        }

        // GET /api/wellnessforms/{formID}
        [HttpGet("{formID}")]
        public async Task<IActionResult> GetForm(int formID)
        {
            var form = await _context.WellnessForms.FindAsync(formID);
            if (form == null)
                return NotFound(new { message = $"Wellness form with ID {formID} was not found." });

            // A patient may only open their own record. Everyone else (admin,
            // physician, or the pre-auth stub) can read any form -- role scoping
            // for admin/physician arrives with real auth.
            if (_currentUser.PatientID is { } callerPatientID && form.PatientID != callerPatientID)
                return NotFound(new { message = $"Wellness form with ID {formID} was not found." });

            return Ok(await BuildFormResponseAsync(form));
        }

        // POST /api/wellnessforms/station1
        // Body: { patient, vitals }. Finds-or-creates the Patient by
        // ExternalEmployeeId, provisions a PatientAccount on first registration,
        // and opens a new form already parked in the Station 2 queue.
        [HttpPost("station1")]
        public async Task<IActionResult> SubmitStation1([FromBody] Station1SubmitDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (_currentUser.AdminID is not { } adminID)
                return Unauthorized(new { message = "No admin identity on this request." });

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var now = DateTime.UtcNow;
                var patient = await _context.Patients
                    .FirstOrDefaultAsync(p => p.ExternalEmployeeId == dto.Patient.ExternalEmployeeId);

                if (patient == null)
                {
                    patient = new Patient { ExternalEmployeeId = dto.Patient.ExternalEmployeeId, CreatedAt = now };
                    _context.Patients.Add(patient);
                }

                patient.Surname = dto.Patient.Surname;
                patient.FirstName = dto.Patient.FirstName;
                patient.MiddleName = dto.Patient.MiddleName;
                patient.Birthdate = dto.Patient.Birthdate;
                patient.Sex = dto.Patient.Sex;
                patient.CivilStatus = dto.Patient.CivilStatus;
                patient.Address = dto.Patient.Address;
                patient.AgencyOffice = dto.Patient.AgencyOffice;
                patient.Position = dto.Patient.Position;
                patient.ContactNo = dto.Patient.ContactNo;
                patient.LastSyncedAt = now;
                patient.UpdatedAt = now;

                await _context.SaveChangesAsync(); // assigns PatientID for a new patient

                var hasAccount = await _context.PatientAccounts.AnyAsync(a => a.PatientID == patient.PatientID);
                if (!hasAccount)
                {
                    _context.PatientAccounts.Add(new PatientAccount
                    {
                        PatientID = patient.PatientID,
                        Username = UsernameFor(patient.ExternalEmployeeId),
                        Status = "Provisioned",
                        ProvisionedAt = now,
                        CreatedAt = now,
                        UpdatedAt = now,
                    });
                }

                var form = new WellnessForm
                {
                    PatientID = patient.PatientID,
                    Status = "PendingAssessment",
                    CurrentStation = 2,
                    FormDate = now.Date,
                    WeightKg = dto.Vitals.WeightKg,
                    HeightCm = dto.Vitals.HeightCm,
                    BMI = dto.Vitals.BMI,
                    IdealBMI = dto.Vitals.IdealBMI,
                    BPSystolic = dto.Vitals.BPSystolic,
                    BPDiastolic = dto.Vitals.BPDiastolic,
                    TempCelsius = dto.Vitals.TempCelsius,
                    HeartRate = dto.Vitals.HeartRate,
                    RespRate = dto.Vitals.RespRate,
                    Station1AdminID = adminID,
                    Station1SubmittedAt = now,
                    CreatedByAdminID = adminID,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                _context.WellnessForms.Add(form);
                await _context.SaveChangesAsync(); // assigns FormID for the audit row

                _context.WellnessFormAuditLogs.Add(new WellnessFormAuditLog
                {
                    FormID = form.FormID,
                    ActorType = "Admin",
                    ActorID = adminID,
                    Action = "Station1Submitted",
                    OccurredAt = now,
                });
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
                return Ok(await BuildFormResponseAsync(form));
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // POST /api/wellnessforms/{formID}/station2
        // Body: { answers: [{questionID, optionID}], rowVersion }. Replaces the
        // form's answer set wholesale so a resubmit cannot accumulate duplicates,
        // then hands the form to the Station 3 queue.
        [HttpPost("{formID}/station2")]
        public async Task<IActionResult> SubmitStation2(int formID, [FromBody] Station2SubmitDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (_currentUser.AdminID is not { } adminID)
                return Unauthorized(new { message = "No admin identity on this request." });

            var form = await _context.WellnessForms.FindAsync(formID);
            if (form == null)
                return NotFound(new { message = $"Wellness form with ID {formID} was not found." });

            ApplyRowVersionToken(form, dto.RowVersion);

            var optionIds = dto.Answers.Select(a => a.OptionID).ToList();

            // an answer's OptionID must actually belong to its QuestionID -- the FK
            // alone only proves the option exists somewhere, see the note on
            // AssessmentAnswer in ElectronicHealthRecordDbContext
            var validPairs = await _context.AssessmentOptions
                .Where(o => optionIds.Contains(o.OptionID))
                .Select(o => new { o.OptionID, o.QuestionID })
                .ToListAsync();

            foreach (var answer in dto.Answers)
            {
                var match = validPairs.FirstOrDefault(o => o.OptionID == answer.OptionID);
                if (match == null || match.QuestionID != answer.QuestionID)
                {
                    return BadRequest(new
                    {
                        message = $"Option {answer.OptionID} does not belong to question {answer.QuestionID}.",
                    });
                }
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var now = DateTime.UtcNow;

                _context.AssessmentAnswers.RemoveRange(
                    _context.AssessmentAnswers.Where(a => a.FormID == formID));

                foreach (var answer in dto.Answers)
                {
                    _context.AssessmentAnswers.Add(new AssessmentAnswer
                    {
                        FormID = formID,
                        QuestionID = answer.QuestionID,
                        OptionID = answer.OptionID,
                        CreatedAt = now,
                    });
                }

                form.Status = "PendingConsultation";
                form.CurrentStation = 3;
                form.Station2AdminID = adminID;
                form.Station2SubmittedAt = now;
                form.UpdatedByAdminID = adminID;
                form.UpdatedAt = now;

                _context.WellnessFormAuditLogs.Add(new WellnessFormAuditLog
                {
                    FormID = formID,
                    ActorType = "Admin",
                    ActorID = adminID,
                    Action = "Station2Submitted",
                    OccurredAt = now,
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(await BuildFormResponseAsync(form));
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync();
                return Conflict(new { message = "This record was changed at another station." });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // POST /api/wellnessforms/{formID}/station3
        // Body: consultation fields spread flat + rowVersion (see submitStation3
        // in src/api/forms.api.js -- the payload is not nested under a
        // "consultation" key). Replaces Family/Past Medical History and Social
        // History wholesale, same reasoning as Station 2's answers.
        [HttpPost("{formID}/station3")]
        public async Task<IActionResult> SubmitStation3(int formID, [FromBody] Station3SubmitDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (_currentUser.PhysicianID is not { } physicianID)
                return Unauthorized(new { message = "No physician identity on this request." });

            var form = await _context.WellnessForms.FindAsync(formID);
            if (form == null)
                return NotFound(new { message = $"Wellness form with ID {formID} was not found." });

            ApplyRowVersionToken(form, dto.RowVersion);

            // the UI always renders one blank Past Medical History row and drops
            // rows never filled in; mirror that here rather than trusting the client
            var pastHistory = dto.PastMedicalHistory
                .Where(p => p.ConditionID.HasValue
                         || !string.IsNullOrWhiteSpace(p.ConditionOther)
                         || p.YearDiagnosed.HasValue
                         || !string.IsNullOrWhiteSpace(p.MaintenanceDrugGeneric))
                .ToList();

            var familyHistory = dto.FamilyMedicalHistory
                .Where(f => f.ConditionID.HasValue
                         || !string.IsNullOrWhiteSpace(f.ConditionOther)
                         || f.IsNone == true)
                .ToList();

            var conditionIds = pastHistory.Where(p => p.ConditionID.HasValue).Select(p => p.ConditionID!.Value)
                .Concat(familyHistory.Where(f => f.ConditionID.HasValue).Select(f => f.ConditionID!.Value))
                .Distinct()
                .ToList();

            if (conditionIds.Count > 0)
            {
                var knownIds = await _context.MedicalConditions
                    .Where(c => conditionIds.Contains(c.ConditionID))
                    .Select(c => c.ConditionID)
                    .ToListAsync();

                var unknownIds = conditionIds.Except(knownIds).ToList();
                if (unknownIds.Count > 0)
                {
                    return BadRequest(new
                    {
                        message = $"Unknown medical condition ID(s): {string.Join(", ", unknownIds)}.",
                    });
                }
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var now = DateTime.UtcNow;

                _context.PastMedicalHistories.RemoveRange(
                    _context.PastMedicalHistories.Where(p => p.FormID == formID));
                _context.FamilyMedicalHistories.RemoveRange(
                    _context.FamilyMedicalHistories.Where(f => f.FormID == formID));
                _context.SocialHistories.RemoveRange(
                    _context.SocialHistories.Where(s => s.FormID == formID));

                foreach (var item in pastHistory)
                {
                    _context.PastMedicalHistories.Add(new PastMedicalHistory
                    {
                        FormID = formID,
                        ConditionID = item.ConditionID,
                        ConditionOther = item.ConditionOther,
                        YearDiagnosed = item.YearDiagnosed,
                        MaintenanceDrugGeneric = item.MaintenanceDrugGeneric,
                        Dosage = item.Dosage,
                        Frequency = item.Frequency,
                        CreatedAt = now,
                        UpdatedAt = now,
                    });
                }

                foreach (var item in familyHistory)
                {
                    _context.FamilyMedicalHistories.Add(new FamilyMedicalHistory
                    {
                        FormID = formID,
                        ConditionID = item.ConditionID,
                        ConditionOther = item.ConditionOther,
                        IsNone = item.IsNone ?? false,
                        CreatedAt = now,
                        UpdatedAt = now,
                    });
                }

                if (dto.SocialHistory != null)
                {
                    _context.SocialHistories.Add(new SocialHistory
                    {
                        FormID = formID,
                        SmokingSticksPerDay = dto.SocialHistory.SmokingSticksPerDay,
                        AlcoholType = dto.SocialHistory.AlcoholType,
                        DrinkFrequency = dto.SocialHistory.DrinkFrequency,
                        DrinksPerSession = dto.SocialHistory.DrinksPerSession,
                        HasBeenDrunk = dto.SocialHistory.HasBeenDrunk,
                        DrunkFrequency = dto.SocialHistory.DrunkFrequency,
                        ExerciseFrequency = dto.SocialHistory.ExerciseFrequency,
                        ExerciseType = dto.SocialHistory.ExerciseType,
                        CreatedAt = now,
                        UpdatedAt = now,
                    });
                }

                form.PhysicianID = physicianID;
                form.RecommendedDiagnosticTest = dto.RecommendedDiagnosticTest;
                form.ImpressionClinical = dto.ImpressionClinical;
                form.ManagementTreatment = dto.ManagementTreatment;
                form.Signature = dto.Signature;
                form.SignedAt = now;
                form.Status = "Completed";
                form.Station3SubmittedAt = now;
                form.UpdatedByAdminID = null;
                form.UpdatedAt = now;

                _context.WellnessFormAuditLogs.Add(new WellnessFormAuditLog
                {
                    FormID = formID,
                    ActorType = "Physician",
                    ActorID = physicianID,
                    Action = "Station3Submitted",
                    OccurredAt = now,
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(await BuildFormResponseAsync(form));
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync();
                return Conflict(new { message = "This record was changed at another station." });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // POST /api/wellnessforms/{formID}/cancel
        // Body: { reason, rowVersion }. Soft delete: the row stays, its Status
        // moves to "Cancelled" and it drops out of every station queue (all of
        // which filter by status). Deliberately not [HttpDelete] -- a wellness
        // form is a medical record and is never removed, and keeping the row is
        // what lets the audit log still resolve the form it points at.
        [HttpPost("{formID}/cancel")]
        public async Task<IActionResult> CancelForm(int formID, [FromBody] CancelFormDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (_currentUser.AdminID is not { } adminID)
                return Unauthorized(new { message = "No admin identity on this request." });

            // Checked here rather than with [Authorize(Roles = ...)] because the
            // app has no authentication scheme yet and ICurrentUser is a stub, so
            // there is no principal for the framework to read a role from. Swap
            // this block for the attribute once real auth lands.
            var actor = await _context.Admins.FindAsync(adminID);
            if (actor == null || actor.Role != AdminRoles.SuperAdmin)
                return Forbid();

            var form = await _context.WellnessForms.FindAsync(formID);
            if (form == null)
                return NotFound(new { message = $"Wellness form with ID {formID} was not found." });

            if (form.Status == "Cancelled")
                return Conflict(new { message = "This form is already cancelled." });

            ApplyRowVersionToken(form, dto.RowVersion);

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var now = DateTime.UtcNow;
                var previousStatus = form.Status;

                form.Status = "Cancelled";
                form.UpdatedByAdminID = adminID;
                form.UpdatedAt = now;

                _context.WellnessFormAuditLogs.Add(new WellnessFormAuditLog
                {
                    FormID = formID,
                    ActorType = "Admin",
                    ActorID = adminID,
                    Action = "FormCancelled",
                    Details = $"Cancelled from {previousStatus} (Station {form.CurrentStation}). Reason: {dto.Reason}",
                    OccurredAt = now,
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(await BuildFormResponseAsync(form));
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync();
                return Conflict(new { message = "This record was changed at another station." });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // Sets EF's row-version original-value token from the client's opaque
        // base64 string, so SaveChangesAsync throws DbUpdateConcurrencyException
        // if another station has since updated the row in the meantime. The
        // client always sends one (Station2SubmitDto/Station3SubmitDto both
        // require it) -- unlike the client's own assertFresh, which silently
        // skips the check when undefined.
        private void ApplyRowVersionToken(WellnessForm form, string rowVersion)
        {
            byte[] bytes;
            try
            {
                bytes = Convert.FromBase64String(rowVersion);
            }
            catch (FormatException)
            {
                throw new ArgumentException("rowVersion must be base64-encoded.", nameof(rowVersion));
            }

            _context.Entry(form).Property(f => f.RowVersion).OriginalValue = bytes;
        }

        private async Task<object> BuildFormResponseAsync(WellnessForm form)
        {
            var patient = await _context.Patients.FindAsync(form.PatientID);

            // never the raw entity here: Physician carries PasswordHash
            var physician = form.PhysicianID.HasValue
                ? await _context.Physicians
                    .Where(p => p.PhysicianID == form.PhysicianID.Value)
                    .Select(p => new DTOs.Physician.PhysicianResponseDto
                    {
                        PhysicianID = p.PhysicianID,
                        Surname = p.Surname,
                        FirstName = p.FirstName,
                        MiddleName = p.MiddleName,
                        PRCLicenseNo = p.PRCLicenseNo,
                        ContactNo = p.ContactNo,
                        CreatedAt = p.CreatedAt,
                        UpdatedAt = p.UpdatedAt,
                    })
                    .FirstOrDefaultAsync()
                : null;

            return new
            {
                form.FormID,
                form.PatientID,
                form.PhysicianID,
                form.Status,
                form.CurrentStation,
                RowVersion = Convert.ToBase64String(form.RowVersion ?? Array.Empty<byte>()),
                form.Signature,
                form.SignedAt,
                form.FormDate,
                form.WeightKg,
                form.HeightCm,
                form.BMI,
                form.IdealBMI,
                form.BPSystolic,
                form.BPDiastolic,
                form.TempCelsius,
                form.HeartRate,
                form.RespRate,
                form.Station1AdminID,
                form.Station1SubmittedAt,
                form.Station2AdminID,
                form.Station2SubmittedAt,
                form.RecommendedDiagnosticTest,
                form.ImpressionClinical,
                form.ManagementTreatment,
                form.Station3SubmittedAt,
                form.CreatedAt,
                form.UpdatedAt,
                Patient = patient,
                Physician = physician,
                FamilyMedicalHistory = await _context.FamilyMedicalHistories
                    .Where(f => f.FormID == form.FormID).ToListAsync(),
                PastMedicalHistory = await _context.PastMedicalHistories
                    .Where(p => p.FormID == form.FormID).ToListAsync(),
                SocialHistory = await _context.SocialHistories
                    .FirstOrDefaultAsync(s => s.FormID == form.FormID),
                AssessmentAnswers = await _context.AssessmentAnswers
                    .Where(a => a.FormID == form.FormID).ToListAsync(),
            };
        }

        private object WithPatient(WellnessForm form, Dictionary<int, Patient> patientsById)
        {
            patientsById.TryGetValue(form.PatientID, out var patient);

            return new
            {
                form.FormID,
                form.PatientID,
                form.PhysicianID,
                form.Status,
                form.CurrentStation,
                RowVersion = Convert.ToBase64String(form.RowVersion ?? Array.Empty<byte>()),
                form.Signature,
                form.SignedAt,
                form.FormDate,
                form.WeightKg,
                form.HeightCm,
                form.BMI,
                form.IdealBMI,
                form.BPSystolic,
                form.BPDiastolic,
                form.TempCelsius,
                form.HeartRate,
                form.RespRate,
                form.Station1AdminID,
                form.Station1SubmittedAt,
                form.Station2AdminID,
                form.Station2SubmittedAt,
                form.RecommendedDiagnosticTest,
                form.ImpressionClinical,
                form.ManagementTreatment,
                form.Station3SubmittedAt,
                form.CreatedAt,
                form.UpdatedAt,
                Patient = patient,
            };
        }

        private async Task<Dictionary<int, Patient>> PatientsByIdAsync(IEnumerable<int> patientIds)
        {
            var ids = patientIds.Distinct().ToList();
            return await _context.Patients
                .Where(p => ids.Contains(p.PatientID))
                .ToDictionaryAsync(p => p.PatientID);
        }

        private static string UsernameFor(string externalEmployeeId)
        {
            var cleaned = new string(externalEmployeeId.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
            return cleaned.Length > 30 ? cleaned[..30] : cleaned;
        }
    }
}
