using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.WellnessForm;
using Electronic_Health_Record.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WellnessFormsController : ControllerBase
    {
        private const string StatusDraft = "Draft";
        private const string StatusSubmitted = "Submitted";

        private readonly ElectronicHealthRecordDbContext _context;
        private readonly ILogger<WellnessFormsController> _logger;

        public WellnessFormsController(
            ElectronicHealthRecordDbContext context,
            ILogger<WellnessFormsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // get specific wellness form with its child records
        [Authorize]
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
        [Authorize]
        // create a wellness form
        // handles both footer buttons: "Save as Draft" sends Status="Draft", "Submit" sends Status="Submitted".
        // a draft only needs a PatientID; a submission also needs a PhysicianID.
        [HttpPost("")]
        public async Task<IActionResult> CreateWellnessForm([FromBody] CreateWellnessFormDto dto)
        {
            // check if input is valid
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var isSubmit = dto.Status == StatusSubmitted;

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
                        PhysicianID = dto.PhysicianID,
                        Status = isSubmit ? StatusSubmitted : StatusDraft,
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
                            FamilyMember = item.FamilyMember,
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

        // PUT   /api/wellnessforms/:id → full update (edit a draft, or promote a draft to Submitted)

        // GET   /api/wellnessforms?patientId=:id → list a patient's forms

        // DELETE /api/wellnessforms/:id → discard a draft

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
