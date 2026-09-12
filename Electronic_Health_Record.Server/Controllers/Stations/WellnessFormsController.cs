using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.WellnessForm;
using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
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
        private readonly PasswordHasher<PatientAccount> _patientPasswordHasher = new();

        // Every patient account provisioned at Station 1 starts on this
        // password; the patient is forced to replace it on first login
        // (MustChangePassword below). Same default Admin/Physician get from
        // UserManagementController.DefaultPassword.
        private const string DefaultPatientPassword = "password123";

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
                    station4 = forms.Count(f => f.CurrentStation == 4),
                    station5 = forms.Count(f => f.CurrentStation == 5),
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
                    // First registration: the admin must have asked the patient what
                    // username they want. No auto-derived fallback -- Username on the
                    // DTO is required exactly in this branch.
                    if (string.IsNullOrWhiteSpace(dto.Patient.Username))
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new { message = "Username is required when registering a new patient account." });
                    }

                    var usernameTaken = await _context.PatientAccounts
                        .AnyAsync(a => a.Username == dto.Patient.Username);
                    if (usernameTaken)
                    {
                        await transaction.RollbackAsync();
                        return Conflict(new { message = "That username is already taken." });
                    }

                    var account = new PatientAccount
                    {
                        PatientID = patient.PatientID,
                        Username = dto.Patient.Username,
                        Status = "Active",
                        MustChangePassword = true,
                        PasswordSetAt = now,
                        ProvisionedAt = now,
                        ActivatedAt = now,
                        CreatedAt = now,
                        UpdatedAt = now,
                    };
                    account.PasswordHash = _patientPasswordHasher.HashPassword(account, DefaultPatientPassword);
                    _context.PatientAccounts.Add(account);
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

            // The signer is a submitted field now, so it is validated here: an
            // arbitrary id, or a retired account, must not end up on a record.
            if (dto.PhysicianID is not { } physicianID)
                return BadRequest(new { message = "An attending physician is required before submitting." });

            var signerIsActive = await _context.Physicians
                .AnyAsync(p => p.PhysicianID == physicianID && p.IsActive);
            if (!signerIsActive)
            {
                return UnprocessableEntity(new
                {
                    message = "That physician is no longer registered as active."
                });
            }

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

            // the UI always renders one blank Exercise row and drops rows
            // never filled in; mirror that here rather than trusting the client
            var exercise = dto.Exercise
                .Where(e => !string.IsNullOrWhiteSpace(e.ExerciseType))
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
                _context.Exercises.RemoveRange(
                    _context.Exercises.Where(e => e.FormID == formID));

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
                        ConditionType = item.ConditionType,
                        CreatedAt = now,
                        UpdatedAt = now,
                    });
                }

                if (dto.SocialHistory != null)
                {
                    _context.SocialHistories.Add(new SocialHistory
                    {
                        FormID = formID,
                        Smokes = dto.SocialHistory.Smokes,
                        SmokesCigarette = dto.SocialHistory.SmokesCigarette,
                        CigaretteSticksPerDay = dto.SocialHistory.CigaretteSticksPerDay,
                        CigaretteFrequency = dto.SocialHistory.CigaretteFrequency,
                        CigaretteYearStarted = dto.SocialHistory.CigaretteYearStarted,
                        CigarettePuffsPerDay = dto.SocialHistory.CigarettePuffsPerDay,
                        SmokesEcig = dto.SocialHistory.SmokesEcig,
                        EcigPodsPerMonth = dto.SocialHistory.EcigPodsPerMonth,
                        EcigFrequency = dto.SocialHistory.EcigFrequency,
                        EcigYearStarted = dto.SocialHistory.EcigYearStarted,
                        EcigPuffsPerDay = dto.SocialHistory.EcigPuffsPerDay,
                        AlcoholType = dto.SocialHistory.AlcoholType,
                        DrinkFrequency = dto.SocialHistory.DrinkFrequency,
                        DrinksPerSession = dto.SocialHistory.DrinksPerSession,
                        CreatedAt = now,
                        UpdatedAt = now,
                    });
                }

                foreach (var item in exercise)
                {
                    _context.Exercises.Add(new Exercise
                    {
                        FormID = formID,
                        ExerciseType = item.ExerciseType,
                        ExerciseFrequency = item.ExerciseFrequency,
                        ExerciseYearStarted = item.ExerciseYearStarted,
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
                // Station 4 (Dental) owns the transition to Completed now; this
                // hands the form to the dental queue still carrying the
                // physician's signature.
                form.Status = "PendingDental";
                form.CurrentStation = 4;
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

        // POST /api/wellnessforms/{formID}/station4
        // Body: { dentistID, dentalAssessment: {...}, dentalSignature, rowVersion }
        // (see submitStation4 in src/api/forms.api.js). Replaces the dental row
        // wholesale, same reasoning as Station 2's answers -- a resubmit must not
        // accumulate duplicates. Hands off to Station 5, which now completes the form.
        [HttpPost("{formID}/station4")]
        public async Task<IActionResult> SubmitStation4(int formID, [FromBody] Station4SubmitDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // The dentist is a submitted field, so it is validated here: an
            // arbitrary id, or a retired account, must not end up on a record.
            if (dto.DentistID is not { } dentistID)
                return BadRequest(new { message = "An examining dentist is required before submitting." });

            var dentistIsActive = await _context.Physicians
                .AnyAsync(p => p.PhysicianID == dentistID && p.IsActive);
            if (!dentistIsActive)
            {
                return UnprocessableEntity(new
                {
                    message = "That dentist is no longer registered as active."
                });
            }

            var form = await _context.WellnessForms.FindAsync(formID);
            if (form == null)
                return NotFound(new { message = $"Wellness form with ID {formID} was not found." });

            ApplyRowVersionToken(form, dto.RowVersion);

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var now = DateTime.UtcNow;

                _context.DentalAssessments.RemoveRange(
                    _context.DentalAssessments.Where(d => d.FormID == formID));

                if (dto.DentalAssessment is { } dental)
                {
                    _context.DentalAssessments.Add(new DentalAssessment
                    {
                        FormID = formID,
                        OralHygieneStatus = dental.OralHygieneStatus,
                        OralHygieneStatusRemarks = dental.OralHygieneStatusRemarks,
                        DentalCaries = dental.DentalCaries,
                        DentalCariesRemarks = dental.DentalCariesRemarks,
                        GumCondition = dental.GumCondition,
                        GumConditionRemarks = dental.GumConditionRemarks,
                        ToothStatus = dental.ToothStatus,
                        ToothStatusRemarks = dental.ToothStatusRemarks,
                        ToothachePain = dental.ToothachePain,
                        ToothachePainRemarks = dental.ToothachePainRemarks,
                        OralLesions = dental.OralLesions,
                        OralLesionsRemarks = dental.OralLesionsRemarks,
                        DentureUse = dental.DentureUse,
                        DentureUseRemarks = dental.DentureUseRemarks,
                        DentalTreatmentNeed = dental.DentalTreatmentNeed,
                        DentalTreatmentNeedRemarks = dental.DentalTreatmentNeedRemarks,
                        LastDentalVisit = dental.LastDentalVisit,
                        LastDentalVisitRemarks = dental.LastDentalVisitRemarks,
                        DentalReferral = dental.DentalReferral,
                        DentalReferralRemarks = dental.DentalReferralRemarks,
                        CreatedAt = now,
                        UpdatedAt = now,
                    });
                }

                form.DentistID = dentistID;
                form.DentalSignature = dto.DentalSignature;
                form.DentalSignedAt = now;
                // Station 5 (Vision) owns the transition to Completed now; this
                // hands the form to the vision queue still carrying the
                // dentist's signature.
                form.Status = "PendingVision";
                form.CurrentStation = 5;
                form.Station4SubmittedAt = now;
                form.UpdatedByAdminID = null;
                form.UpdatedAt = now;

                _context.WellnessFormAuditLogs.Add(new WellnessFormAuditLog
                {
                    FormID = formID,
                    ActorType = "Physician",
                    ActorID = dentistID,
                    Action = "Station4Submitted",
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

        // POST /api/wellnessforms/{formID}/station5
        // Body: { optometristID, visionAssessment: {...}, visionSignature, rowVersion }
        // (see submitStation5 in src/api/forms.api.js). Replaces the vision row
        // wholesale, same reasoning as Station 4's dental row -- a resubmit must
        // not accumulate duplicates. This is the station that completes the form.
        [HttpPost("{formID}/station5")]
        public async Task<IActionResult> SubmitStation5(int formID, [FromBody] Station5SubmitDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // The optometrist is a submitted field, so it is validated here: an
            // arbitrary id, or a retired account, must not end up on a record.
            if (dto.OptometristID is not { } optometristID)
                return BadRequest(new { message = "An examining optometrist is required before submitting." });

            var optometristIsActive = await _context.Physicians
                .AnyAsync(p => p.PhysicianID == optometristID && p.IsActive);
            if (!optometristIsActive)
            {
                return UnprocessableEntity(new
                {
                    message = "That optometrist is no longer registered as active."
                });
            }

            var form = await _context.WellnessForms.FindAsync(formID);
            if (form == null)
                return NotFound(new { message = $"Wellness form with ID {formID} was not found." });

            ApplyRowVersionToken(form, dto.RowVersion);

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var now = DateTime.UtcNow;

                _context.VisionAssessments.RemoveRange(
                    _context.VisionAssessments.Where(v => v.FormID == formID));

                if (dto.VisionAssessment is { } vision)
                {
                    _context.VisionAssessments.Add(new VisionAssessment
                    {
                        FormID = formID,
                        HistoryOfEyeProblems = vision.HistoryOfEyeProblems,
                        HistoryOfEyeProblemsRemarks = vision.HistoryOfEyeProblemsRemarks,
                        EyePainDiscomfort = vision.EyePainDiscomfort,
                        EyePainDiscomfortRemarks = vision.EyePainDiscomfortRemarks,
                        BlurredVision = vision.BlurredVision,
                        BlurredVisionRemarks = vision.BlurredVisionRemarks,
                        DifficultySeeingNear = vision.DifficultySeeingNear,
                        DifficultySeeingNearRemarks = vision.DifficultySeeingNearRemarks,
                        DifficultySeeingDistant = vision.DifficultySeeingDistant,
                        DifficultySeeingDistantRemarks = vision.DifficultySeeingDistantRemarks,
                        HeadacheEyeStrain = vision.HeadacheEyeStrain,
                        HeadacheEyeStrainRemarks = vision.HeadacheEyeStrainRemarks,
                        UsesEyeglassesContactLenses = vision.UsesEyeglassesContactLenses,
                        UsesEyeglassesContactLensesRemarks = vision.UsesEyeglassesContactLensesRemarks,
                        VisualAcuityRightEye = vision.VisualAcuityRightEye,
                        VisualAcuityRightEyeRemarks = vision.VisualAcuityRightEyeRemarks,
                        VisualAcuityLeftEye = vision.VisualAcuityLeftEye,
                        VisualAcuityLeftEyeRemarks = vision.VisualAcuityLeftEyeRemarks,
                        EyeConditionIdentified = vision.EyeConditionIdentified,
                        EyeConditionOther = vision.EyeConditionOther,
                        EyeConditionIdentifiedRemarks = vision.EyeConditionIdentifiedRemarks,
                        CorrectiveLensesRecommended = vision.CorrectiveLensesRecommended,
                        CorrectiveLensesRecommendedRemarks = vision.CorrectiveLensesRecommendedRemarks,
                        ReferralToEyeSpecialist = vision.ReferralToEyeSpecialist,
                        ReferralToEyeSpecialistRemarks = vision.ReferralToEyeSpecialistRemarks,
                        FollowUpConsultationAdvised = vision.FollowUpConsultationAdvised,
                        FollowUpConsultationAdvisedRemarks = vision.FollowUpConsultationAdvisedRemarks,
                        CreatedAt = now,
                        UpdatedAt = now,
                    });
                }

                form.OptometristID = optometristID;
                form.VisionSignature = dto.VisionSignature;
                form.VisionSignedAt = now;
                form.Status = "Completed";
                form.Station5SubmittedAt = now;
                form.UpdatedByAdminID = null;
                form.UpdatedAt = now;

                _context.WellnessFormAuditLogs.Add(new WellnessFormAuditLog
                {
                    FormID = formID,
                    ActorType = "Physician",
                    ActorID = optometristID,
                    Action = "Station5Submitted",
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

        // DELETE /api/wellnessforms/{formID}
        // Body: { reason, rowVersion }. Hard delete: unlike Cancel above, this
        // removes the form row and everything that points at it -- assessment
        // answers, station 1/4/5 detail rows, and the form's own audit log --
        // permanently. Superadmin only, same actor check as Cancel (no auth
        // scheme yet, so this can't be an [Authorize(Roles = ...)] attribute).
        [HttpDelete("{formID}")]
        public async Task<IActionResult> DeleteForm(int formID, [FromBody] DeleteFormDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (_currentUser.AdminID is not { } adminID)
                return Unauthorized(new { message = "No admin identity on this request." });

            var actor = await _context.Admins.FindAsync(adminID);
            if (actor == null || actor.Role != AdminRoles.SuperAdmin)
                return Forbid();

            var form = await _context.WellnessForms.FindAsync(formID);
            if (form == null)
                return NotFound(new { message = $"Wellness form with ID {formID} was not found." });

            ApplyRowVersionToken(form, dto.RowVersion);

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.AssessmentAnswers.RemoveRange(
                    _context.AssessmentAnswers.Where(a => a.FormID == formID));
                _context.FamilyMedicalHistories.RemoveRange(
                    _context.FamilyMedicalHistories.Where(f => f.FormID == formID));
                _context.PastMedicalHistories.RemoveRange(
                    _context.PastMedicalHistories.Where(p => p.FormID == formID));
                _context.Exercises.RemoveRange(
                    _context.Exercises.Where(e => e.FormID == formID));
                _context.SocialHistories.RemoveRange(
                    _context.SocialHistories.Where(s => s.FormID == formID));
                _context.DentalAssessments.RemoveRange(
                    _context.DentalAssessments.Where(d => d.FormID == formID));
                _context.VisionAssessments.RemoveRange(
                    _context.VisionAssessments.Where(v => v.FormID == formID));
                _context.WellnessFormAuditLogs.RemoveRange(
                    _context.WellnessFormAuditLogs.Where(l => l.FormID == formID));

                await _context.SaveChangesAsync();

                _context.WellnessForms.Remove(form);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                _logger.LogWarning(
                    "Wellness form {FormID} hard-deleted by admin {AdminID}. Reason: {Reason}",
                    formID, adminID, dto.Reason);

                return NoContent();
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

            // Station 4's examining dentist -- a Physician row, tracked apart from
            // PhysicianID (see DentistID on WellnessForm).
            var dentist = form.DentistID.HasValue
                ? await _context.Physicians
                    .Where(p => p.PhysicianID == form.DentistID.Value)
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

            // Station 5's examining optometrist -- a Physician row, tracked apart
            // from PhysicianID/DentistID (see OptometristID on WellnessForm).
            var optometrist = form.OptometristID.HasValue
                ? await _context.Physicians
                    .Where(p => p.PhysicianID == form.OptometristID.Value)
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
                form.DentistID,
                form.DentalSignature,
                form.DentalSignedAt,
                form.Station4SubmittedAt,
                form.OptometristID,
                form.VisionSignature,
                form.VisionSignedAt,
                form.Station5SubmittedAt,
                form.CreatedAt,
                form.UpdatedAt,
                Patient = patient,
                Physician = physician,
                Dentist = dentist,
                Optometrist = optometrist,
                FamilyMedicalHistory = await _context.FamilyMedicalHistories
                    .Where(f => f.FormID == form.FormID).ToListAsync(),
                PastMedicalHistory = await _context.PastMedicalHistories
                    .Where(p => p.FormID == form.FormID).ToListAsync(),
                SocialHistory = await _context.SocialHistories
                    .FirstOrDefaultAsync(s => s.FormID == form.FormID),
                Exercise = await _context.Exercises
                    .Where(e => e.FormID == form.FormID).ToListAsync(),
                DentalAssessment = await _context.DentalAssessments
                    .FirstOrDefaultAsync(d => d.FormID == form.FormID),
                VisionAssessment = await _context.VisionAssessments
                    .FirstOrDefaultAsync(v => v.FormID == form.FormID),
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
    }
}
