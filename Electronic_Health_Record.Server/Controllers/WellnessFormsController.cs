using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.WellnessForm;
using Electronic_Health_Record.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.SqlServer.Server;

namespace Electronic_Health_Record.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WellnessFormsController : ControllerBase
    {
        // the lifecycle values now live in Models/FormStatus.cs so the future sign endpoint and
        // these CRUD endpoints share one source
        private const string StatusDraft = FormStatus.Draft;
        private const string StatusSubmitted = FormStatus.PendingSignature;

        private readonly ElectronicHealthRecordDbContext _context;
        private readonly ILogger<WellnessFormsController> _logger;

        public WellnessFormsController(
            ElectronicHealthRecordDbContext context,
            ILogger<WellnessFormsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // get all wellness forms, with every field the UI form displays: patient info,
        // vitals, physician cert, plus each form's Past/Family Medical History and Social History
        [HttpGet("")]
        public async Task<IActionResult> GetwellnessForms()
        {
            try
            {
                var forms = await (
                    from f in _context.WellnessForms
                    join p in _context.Patients on f.PatientID equals p.PatientID
                    join ph in _context.Physicians on f.AssignedPhysicianID equals ph.PhysicianID into physicianJoin
                    from ph in physicianJoin.DefaultIfEmpty()
                    orderby f.FormDate descending
                    select new
                    {
                        f.FormID,
                        f.PatientID,
                        f.Status,
                        f.FormDate,

                        // Patient Information
                        p.Surname,
                        p.FirstName,
                        p.MiddleName,
                        p.Birthdate,
                        p.Sex,
                        p.CivilStatus,
                        p.Address,
                        p.ContactNo,

                        // Vital Signs
                        f.WeightKg,
                        f.HeightCm,
                        f.BMI,
                        f.IdealBMI,
                        f.BPSystolic,
                        f.BPDiastolic,
                        f.TempCelsius,
                        f.HeartRate,
                        f.RespRate,

                        // Recommended Diagnostic Test
                        f.RecommendedDiagnosticTest,
                        f.ImpressionClinical,
                        f.ManagementTreatment,

                        // Physician Certification.
                        // aliased back to PhysicianID so the response shape the client already
                        // consumes is unchanged by the column rename
                        PhysicianID = f.AssignedPhysicianID,
                        PhysicianName = ph == null ? null : (ph.FirstName + " " + ph.Surname),
                        PhysicianPRCLicenseNo = ph == null ? null : ph.PRCLicenseNo,
                        f.SignedAt
                    })
                    .ToListAsync();

                var formIds = forms.Select(f => f.FormID).ToList();

                var pastHistoryByForm = (await _context.PastMedicalHistories
                        .Where(p => formIds.Contains(p.FormID))
                        .ToListAsync())
                    .ToLookup(p => p.FormID);

                var familyHistoryByForm = (await _context.FamilyMedicalHistories
                        .Where(fh => formIds.Contains(fh.FormID))
                        .ToListAsync())
                    .ToLookup(fh => fh.FormID);

                var socialHistoryByForm = (await _context.SocialHistories
                        .Where(s => formIds.Contains(s.FormID))
                        .ToListAsync())
                    .ToDictionary(s => s.FormID);

                var response = forms.Select(f => new
                {
                    f.FormID,
                    f.PatientID,
                    f.Status,
                    f.FormDate,
                    f.Surname,
                    f.FirstName,
                    f.MiddleName,
                    f.Birthdate,
                    f.Sex,
                    f.CivilStatus,
                    f.Address,
                    f.ContactNo,
                    f.WeightKg,
                    f.HeightCm,
                    f.BMI,
                    f.IdealBMI,
                    f.BPSystolic,
                    f.BPDiastolic,
                    f.TempCelsius,
                    f.HeartRate,
                    f.RespRate,
                    f.RecommendedDiagnosticTest,
                    f.ImpressionClinical,
                    f.ManagementTreatment,
                    f.PhysicianID,
                    f.PhysicianName,
                    f.PhysicianPRCLicenseNo,
                    f.SignedAt,
                    PastMedicalHistory = pastHistoryByForm[f.FormID].ToList(),
                    FamilyMedicalHistory = familyHistoryByForm[f.FormID].ToList(),
                    SocialHistory = socialHistoryByForm.TryGetValue(f.FormID, out var sh) ? sh : null
                });

                return Ok(response);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to retrieve wellness forms.");
                return StatusCode(500, "An error occurred while retrieving the wellness forms.");
            }
        }

        // get specific wellness form with its child records
        [HttpGet("{FormId}")]
        public async Task<IActionResult> GetWellnessForm(int FormId)
        {
            try
            {
                var form = await _context.WellnessForms.FindAsync(FormId);

                if (form == null)
                    return NotFound($"Wellness form with ID {FormId} was not found.");

                return Ok(await BuildFormResponseAsync(form));
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to retrieve wellness form {FormId}.", FormId);
                return StatusCode(500, "An error occurred while retrieving the wellness form.");
            }
        }

        // GET count of health records
        [HttpGet("count")]
        public async Task<IActionResult> GetHealthRecordCount()
        {
            try
            {
                var count = await _context.WellnessForms.CountAsync();
                return Ok(count);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to retrieve health record count.");
                return StatusCode(500, "An error occurred while retrieving the wellness form count.");
            }
        }

        // create a wellness form
        // handles both footer buttons: "Save as Draft" sends Status="Draft", "Submit" sends Status="Submitted".
        // a draft only needs a PatientID; a submission also needs a PhysicianID.
        [HttpPost("")]
        public async Task<IActionResult> CreateWellnessForm([FromBody] CreateWellnessFormDto dto)
        {
            // check if input is valid
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Normalize maps the old "Submitted" wire value onto "PendingSignature"
            var isSubmit = FormStatus.Normalize(dto.Status) == StatusSubmitted;

            try
            {
                if (!await _context.Patients.AnyAsync(p => p.PatientID == dto.PatientID))
                    return BadRequest($"Patient with ID {dto.PatientID} was not found.");

                // physician is required on submit, optional on draft
                if (dto.PhysicianID.HasValue)
                {
                    if (!await _context.Physicians.AnyAsync(p => p.PhysicianID == dto.PhysicianID.Value))
                        return BadRequest($"Physician with ID {dto.PhysicianID.Value} was not found.");
                }
                else if (isSubmit)
                {
                    return BadRequest("PhysicianID is required when submitting a wellness form.");
                }

                // a submitted form is a finalized clinical record, so it must carry the physician's signature
                if (isSubmit && string.IsNullOrWhiteSpace(dto.Signature))
                    return BadRequest("Signature is required when submitting a wellness form.");

                if (dto.CreatedByAdminID.HasValue &&
                    !await _context.Admins.AnyAsync(a => a.AdminID == dto.CreatedByAdminID.Value))
                {
                    return BadRequest($"Admin with ID {dto.CreatedByAdminID.Value} was not found.");
                }

                // the UI always renders one blank Past Medical History row, so drop rows the user never filled in
                var pastHistory = dto.PastMedicalHistory
                    .Where(p => p.ConditionID.HasValue
                             || !string.IsNullOrWhiteSpace(p.ConditionOther)
                             || p.YearDiagnosed.HasValue
                             || !string.IsNullOrWhiteSpace(p.MaintenanceDrugGeneric))
                    .ToList();

                // likewise for the family history checkbox grid: keep checked conditions and the "None" row only
                var familyHistory = dto.FamilyMedicalHistory
                    .Where(f => f.ConditionID.HasValue
                             || !string.IsNullOrWhiteSpace(f.ConditionOther)
                             || f.IsNone == true)
                    .ToList();

                // fail fast on unknown conditions instead of letting the FK blow up mid-transaction
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
                        return BadRequest($"Unknown medical condition ID(s): {string.Join(", ", unknownIds)}.");
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    var form = new WellnessForm
                    {
                        PatientID = dto.PatientID,
                        AssignedPhysicianID = dto.PhysicianID,
                        Status = isSubmit ? StatusSubmitted : StatusDraft,
                        Signature = dto.Signature,
                        SignedAt = string.IsNullOrWhiteSpace(dto.Signature) ? null : DateTime.UtcNow,
                        WeightKg = dto.WeightKg,
                        HeightCm = dto.HeightCm,
                        BMI = dto.BMI,
                        IdealBMI = dto.IdealBMI,
                        BPSystolic = dto.BPSystolic,
                        BPDiastolic = dto.BPDiastolic,
                        TempCelsius = dto.TempCelsius,
                        HeartRate = dto.HeartRate,
                        RespRate = dto.RespRate,
                        RecommendedDiagnosticTest = dto.RecommendedDiagnosticTest,
                        ImpressionClinical = dto.ImpressionClinical,
                        ManagementTreatment = dto.ManagementTreatment,
                        CreatedByAdminID = dto.CreatedByAdminID
                        // for the CreatedAt and UpdatedAt is handled by DB defaults
                    };

                    // left unset so the DB default (today's date) applies
                    if (dto.FormDate.HasValue)
                        form.FormDate = dto.FormDate.Value;

                    _context.WellnessForms.Add(form);
                    await _context.SaveChangesAsync(); // assigns FormID for the child rows below

                    foreach (var item in pastHistory)
                    {
                        _context.PastMedicalHistories.Add(new PastMedicalHistory
                        {
                            FormID = form.FormID,
                            ConditionID = item.ConditionID,
                            ConditionOther = item.ConditionOther,
                            YearDiagnosed = item.YearDiagnosed,
                            MaintenanceDrugGeneric = item.MaintenanceDrugGeneric,
                            Dosage = item.Dosage,
                            Frequency = item.Frequency
                        });
                    }

                    foreach (var item in familyHistory)
                    {
                        _context.FamilyMedicalHistories.Add(new FamilyMedicalHistory
                        {
                            FormID = form.FormID,
                            ConditionID = item.ConditionID,
                            ConditionOther = item.ConditionOther,
                            IsNone = item.IsNone ?? false
                        });
                    }

                    if (dto.SocialHistory != null)
                    {
                        _context.SocialHistories.Add(new SocialHistory
                        {
                            FormID = form.FormID,
                            SmokingSticksPerDay = dto.SocialHistory.SmokingSticksPerDay,
                            AlcoholType = dto.SocialHistory.AlcoholType,
                            DrinkFrequency = dto.SocialHistory.DrinkFrequency,
                            DrinksPerSession = dto.SocialHistory.DrinksPerSession,
                            HasBeenDrunk = dto.SocialHistory.HasBeenDrunk,
                            DrunkFrequency = dto.SocialHistory.DrunkFrequency,
                            ExerciseFrequency = dto.SocialHistory.ExerciseFrequency,
                            ExerciseType = dto.SocialHistory.ExerciseType
                        });
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return CreatedAtAction(
                            nameof(GetWellnessForm),
                            new { FormId = form.FormID },
                            await BuildFormResponseAsync(form));
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to create wellness form for patient {PatientID}.", dto.PatientID);
                return StatusCode(500, "An error occurred while creating the wellness form.");
            }
        }

        // full update of a wellness form (edit a draft, or promote a draft to Submitted).
        // checkbox-style child rows (Past/Family Medical History) are sent as the complete
        // current set, so the existing rows are replaced wholesale rather than merged —
        // an unchecked condition (e.g. Stroke, Diabetes Mellitus) must disappear, not linger.
        [HttpPut("{FormId}")]
        public async Task<IActionResult> UpdateWellnessForm(int FormId, [FromBody] UpdateWellnessFormDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Normalize maps the old "Submitted" wire value onto "PendingSignature"
            var isSubmit = FormStatus.Normalize(dto.Status) == StatusSubmitted;

            try
            {
                var form = await _context.WellnessForms.FindAsync(FormId);
                if (form == null)
                    return NotFound($"Wellness form with ID {FormId} was not found.");

                if (!await _context.Patients.AnyAsync(p => p.PatientID == dto.PatientID))
                    return BadRequest($"Patient with ID {dto.PatientID} was not found.");

                // physician is required on submit, optional on draft
                if (dto.PhysicianID.HasValue)
                {
                    if (!await _context.Physicians.AnyAsync(p => p.PhysicianID == dto.PhysicianID.Value))
                        return BadRequest($"Physician with ID {dto.PhysicianID.Value} was not found.");
                }
                else if (isSubmit)
                {
                    return BadRequest("PhysicianID is required when submitting a wellness form.");
                }

                // a submitted form is a finalized clinical record, so it must carry the physician's signature
                if (isSubmit && string.IsNullOrWhiteSpace(dto.Signature))
                    return BadRequest("Signature is required when submitting a wellness form.");

                if (dto.UpdatedByAdminID.HasValue &&
                    !await _context.Admins.AnyAsync(a => a.AdminID == dto.UpdatedByAdminID.Value))
                {
                    return BadRequest($"Admin with ID {dto.UpdatedByAdminID.Value} was not found.");
                }

                // the UI always renders one blank Past Medical History row, so drop rows the user never filled in
                var pastHistory = dto.PastMedicalHistory
                    .Where(p => p.ConditionID.HasValue
                             || !string.IsNullOrWhiteSpace(p.ConditionOther)
                             || p.YearDiagnosed.HasValue
                             || !string.IsNullOrWhiteSpace(p.MaintenanceDrugGeneric))
                    .ToList();

                // likewise for the family history checkbox grid: keep checked conditions and the "None" row only
                var familyHistory = dto.FamilyMedicalHistory
                    .Where(f => f.ConditionID.HasValue
                             || !string.IsNullOrWhiteSpace(f.ConditionOther)
                             || f.IsNone == true)
                    .ToList();

                // fail fast on unknown conditions instead of letting the FK blow up mid-transaction
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
                        return BadRequest($"Unknown medical condition ID(s): {string.Join(", ", unknownIds)}.");
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    form.PatientID = dto.PatientID;
                    form.AssignedPhysicianID = dto.PhysicianID;
                    form.Status = isSubmit ? StatusSubmitted : StatusDraft;

                    // only re-stamp SignedAt when the signature actually changes, so re-saving an
                    // already-signed form keeps the original signing time
                    if (form.Signature != dto.Signature)
                        form.SignedAt = string.IsNullOrWhiteSpace(dto.Signature) ? null : DateTime.UtcNow;
                    form.Signature = dto.Signature;

                    form.WeightKg = dto.WeightKg;
                    form.HeightCm = dto.HeightCm;
                    form.BMI = dto.BMI;
                    form.IdealBMI = dto.IdealBMI;
                    form.BPSystolic = dto.BPSystolic;
                    form.BPDiastolic = dto.BPDiastolic;
                    form.TempCelsius = dto.TempCelsius;
                    form.HeartRate = dto.HeartRate;
                    form.RespRate = dto.RespRate;
                    form.RecommendedDiagnosticTest = dto.RecommendedDiagnosticTest;
                    form.ImpressionClinical = dto.ImpressionClinical;
                    form.ManagementTreatment = dto.ManagementTreatment;
                    form.UpdatedByAdminID = dto.UpdatedByAdminID;
                    form.UpdatedAt = DateTime.UtcNow;

                    if (dto.FormDate.HasValue)
                        form.FormDate = dto.FormDate.Value;

                    // replace child rows wholesale: delete the existing set, then insert the current one
                    var oldPastHistory = _context.PastMedicalHistories.Where(p => p.FormID == FormId);
                    var oldFamilyHistory = _context.FamilyMedicalHistories.Where(f => f.FormID == FormId);
                    var oldSocialHistory = _context.SocialHistories.Where(s => s.FormID == FormId);

                    _context.PastMedicalHistories.RemoveRange(oldPastHistory);
                    _context.FamilyMedicalHistories.RemoveRange(oldFamilyHistory);
                    _context.SocialHistories.RemoveRange(oldSocialHistory);

                    foreach (var item in pastHistory)
                    {
                        _context.PastMedicalHistories.Add(new PastMedicalHistory
                        {
                            FormID = FormId,
                            ConditionID = item.ConditionID,
                            ConditionOther = item.ConditionOther,
                            YearDiagnosed = item.YearDiagnosed,
                            MaintenanceDrugGeneric = item.MaintenanceDrugGeneric,
                            Dosage = item.Dosage,
                            Frequency = item.Frequency
                        });
                    }

                    foreach (var item in familyHistory)
                    {
                        _context.FamilyMedicalHistories.Add(new FamilyMedicalHistory
                        {
                            FormID = FormId,
                            ConditionID = item.ConditionID,
                            ConditionOther = item.ConditionOther,
                            IsNone = item.IsNone ?? false
                        });
                    }

                    if (dto.SocialHistory != null)
                    {
                        _context.SocialHistories.Add(new SocialHistory
                        {
                            FormID = FormId,
                            SmokingSticksPerDay = dto.SocialHistory.SmokingSticksPerDay,
                            AlcoholType = dto.SocialHistory.AlcoholType,
                            DrinkFrequency = dto.SocialHistory.DrinkFrequency,
                            DrinksPerSession = dto.SocialHistory.DrinksPerSession,
                            HasBeenDrunk = dto.SocialHistory.HasBeenDrunk,
                            DrunkFrequency = dto.SocialHistory.DrunkFrequency,
                            ExerciseFrequency = dto.SocialHistory.ExerciseFrequency,
                            ExerciseType = dto.SocialHistory.ExerciseType
                        });
                    }

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
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to update wellness form {FormId}.", FormId);
                return StatusCode(500, "An error occurred while updating the wellness form.");
            }
        }

        // DELETE /api/wellnessforms/:id → discard a draft
        // DELETE /api/wellnessforms/:id → discard a draft.
        // only drafts can be deleted; a submitted form is a finalized clinical record.
        [HttpDelete("{FormId}")]
        public async Task<IActionResult> DeleteWellnessForm(int FormId)
        {
            try
            {
                var form = await _context.WellnessForms.FindAsync(FormId);
                if (form == null)
                    return NotFound($"Wellness form with ID {FormId} was not found.");

                if (form.Status != StatusDraft)
                    return BadRequest("Only draft wellness forms can be deleted.");

                await using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    var pastHistory = _context.PastMedicalHistories.Where(p => p.FormID == FormId);
                    var familyHistory = _context.FamilyMedicalHistories.Where(f => f.FormID == FormId);
                    var socialHistory = _context.SocialHistories.Where(s => s.FormID == FormId);

                    _context.PastMedicalHistories.RemoveRange(pastHistory);
                    _context.FamilyMedicalHistories.RemoveRange(familyHistory);
                    _context.SocialHistories.RemoveRange(socialHistory);

                    _context.WellnessForms.Remove(form);

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return NoContent();
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to delete wellness form {FormId}.", FormId);
                return StatusCode(500, "An error occurred while deleting the wellness form.");
            }
        }

        private async Task<object> BuildFormResponseAsync(WellnessForm form)
        {
            return new
            {
                form,
                pastMedicalHistory = await _context.PastMedicalHistories
                    .Where(p => p.FormID == form.FormID)
                    .ToListAsync(),
                familyMedicalHistory = await _context.FamilyMedicalHistories
                    .Where(f => f.FormID == form.FormID)
                    .ToListAsync(),
                socialHistory = await _context.SocialHistories
                    .FirstOrDefaultAsync(s => s.FormID == form.FormID)
            };
        }
    }
}
