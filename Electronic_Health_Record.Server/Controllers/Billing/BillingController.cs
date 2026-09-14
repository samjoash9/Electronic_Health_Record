using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.Billing;
using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers.Billing
{
    /// <summary>
    /// Station 6. A billing form is a budget period: one capital allocation
    /// covering every visit dated inside it. Consumption is always summed from
    /// WellnessFormCharge on read, never stored, so a charge Station 3 records
    /// after the period was created is counted with no approval step.
    ///
    /// Periods may not overlap. That rule is enforced here rather than by a
    /// check constraint, which cannot see other rows, and it is what makes the
    /// billing form covering a given visit unambiguous.
    /// </summary>
    [ApiController]
    [Route("api/billing")]
    [Authorize]
    public class BillingController : ControllerBase
    {
        private readonly ElectronicHealthRecordDbContext _context;
        private readonly ICurrentUser _currentUser;
        private readonly ILogger<BillingController> _logger;

        // Forms that never reached Station 3 have no charges, and a cancelled
        // visit must not consume budget.
        private static readonly string[] ExcludedFormStatuses =
            ["PendingAssessment", "PendingConsultation", "Cancelled"];

        public BillingController(
            ElectronicHealthRecordDbContext context,
            ICurrentUser currentUser,
            ILogger<BillingController> logger)
        {
            _context = context;
            _currentUser = currentUser;
            _logger = logger;
        }

        // GET /api/billing/forms?q=
        [HttpGet("forms")]
        public async Task<IActionResult> GetBillingForms([FromQuery] string? q)
        {
            try
            {
                var query = _context.BillingForms.AsQueryable();

                if (!string.IsNullOrWhiteSpace(q))
                {
                    var term = q.Trim();
                    query = query.Where(b => b.Title.Contains(term));
                }

                var forms = await query
                    .OrderByDescending(b => b.StartDate)
                    .ThenByDescending(b => b.BillingFormID)
                    .ToListAsync();

                var rows = new List<BillingFormRowDto>(forms.Count);
                foreach (var form in forms)
                {
                    var usage = await SummarisePeriodAsync(form.StartDate, form.EndDate);

                    rows.Add(new BillingFormRowDto
                    {
                        BillingFormID = form.BillingFormID,
                        Title = form.Title,
                        StartDate = form.StartDate,
                        EndDate = form.EndDate,
                        Capital = form.Capital,
                        Consumed = usage.Consumed,
                        Remaining = form.Capital - usage.Consumed,
                        EmployeeCount = usage.EmployeeCount,
                        FormCount = usage.FormCount,
                        UnpricedCount = usage.UnpricedCount,
                        IsOverBudget = usage.Consumed > form.Capital,
                        CreatedAt = form.CreatedAt,
                        RowVersion = EncodeRowVersion(form.RowVersion),
                    });
                }

                return Ok(new { data = rows, totalCount = rows.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve billing forms.");
                return StatusCode(500, "An error occurred while retrieving billing forms.");
            }
        }

        // GET /api/billing/forms/{id}
        [HttpGet("forms/{id:int}")]
        public async Task<IActionResult> GetBillingForm(int id)
        {
            var form = await _context.BillingForms.FindAsync(id);
            if (form == null)
                return NotFound(new { message = $"Billing form with ID {id} was not found." });

            try
            {
                return Ok(await BuildDetailAsync(form));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to build billing form detail for {BillingFormID}.", id);
                return StatusCode(500, "An error occurred while retrieving this billing form.");
            }
        }

        // POST /api/billing/forms
        //
        // Open to both admin roles: allocating a period's budget is billing
        // floor work here, not a superadmin-only policy change -- unlike the
        // charge catalog's prices, which stay superadmin-gated.
        [Authorize(Roles = $"{AdminRoles.Admin},{AdminRoles.SuperAdmin}")]
        [HttpPost("forms")]
        public async Task<IActionResult> CreateBillingForm([FromBody] CreateBillingFormDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var start = dto.StartDate.Date;
            var end = dto.EndDate.Date;

            if (end < start)
                return BadRequest(new { message = "End date must be on or after the start date." });

            var conflict = await FindOverlapAsync(start, end, excludeId: null);
            if (conflict != null)
                return Conflict(BuildOverlapDto(conflict));

            try
            {
                var form = new BillingForm
                {
                    Title = dto.Title.Trim(),
                    StartDate = start,
                    EndDate = end,
                    Capital = dto.Capital,
                    CreatedByAdminID = _currentUser.AdminID,
                    CreatedAt = DateTime.UtcNow,
                };

                _context.BillingForms.Add(form);
                await _context.SaveChangesAsync();

                return CreatedAtAction(
                    nameof(GetBillingForm),
                    new { id = form.BillingFormID },
                    await BuildDetailAsync(form));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create billing form.");
                return StatusCode(500, "An error occurred while creating this billing form.");
            }
        }

        // PUT /api/billing/forms/{id}
        //
        // Editing the range moves which visits the period covers, and editing
        // Capital re-prices it. Both are intentional: consumption is derived,
        // so there is no snapshot to invalidate.
        [Authorize(Roles = $"{AdminRoles.Admin},{AdminRoles.SuperAdmin}")]
        [HttpPut("forms/{id:int}")]
        public async Task<IActionResult> UpdateBillingForm(int id, [FromBody] UpdateBillingFormDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var form = await _context.BillingForms.FindAsync(id);
            if (form == null)
                return NotFound(new { message = $"Billing form with ID {id} was not found." });

            var start = dto.StartDate.Date;
            var end = dto.EndDate.Date;

            if (end < start)
                return BadRequest(new { message = "End date must be on or after the start date." });

            var conflict = await FindOverlapAsync(start, end, excludeId: id);
            if (conflict != null)
                return Conflict(BuildOverlapDto(conflict));

            try
            {
                ApplyRowVersionToken(form, dto.RowVersion);

                form.Title = dto.Title.Trim();
                form.StartDate = start;
                form.EndDate = end;
                form.Capital = dto.Capital;

                await _context.SaveChangesAsync();

                return Ok(await BuildDetailAsync(form));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict(new { message = "This billing form was changed by someone else. Reload and try again." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update billing form {BillingFormID}.", id);
                return StatusCode(500, "An error occurred while updating this billing form.");
            }
        }

        // DELETE /api/billing/forms/{id}
        //
        // Safe by construction: a period owns no charge rows, so removing it
        // only discards the budget envelope. The visits and their charges are
        // untouched and fall under whatever period covers them next.
        [Authorize(Roles = $"{AdminRoles.Admin},{AdminRoles.SuperAdmin}")]
        [HttpDelete("forms/{id:int}")]
        public async Task<IActionResult> DeleteBillingForm(int id)
        {
            var form = await _context.BillingForms.FindAsync(id);
            if (form == null)
                return NotFound(new { message = $"Billing form with ID {id} was not found." });

            try
            {
                _context.BillingForms.Remove(form);
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete billing form {BillingFormID}.", id);
                return StatusCode(500, "An error occurred while deleting this billing form.");
            }
        }

        private record PeriodUsage(decimal Consumed, int EmployeeCount, int FormCount, int UnpricedCount);

        /// <summary>
        /// Totals every charge on a billable visit dated within the period.
        /// EndDate is inclusive, so the upper bound compares against the start
        /// of the following day -- a FormDate carrying a time component would
        /// otherwise fall outside its own period.
        /// </summary>
        private async Task<PeriodUsage> SummarisePeriodAsync(DateTime start, DateTime end)
        {
            var lowerBound = start.Date;
            var upperBound = end.Date.AddDays(1);

            var charges = await (
                from charge in _context.WellnessFormCharges
                join wellnessForm in _context.WellnessForms
                    on charge.FormID equals wellnessForm.FormID
                where wellnessForm.FormDate >= lowerBound
                   && wellnessForm.FormDate < upperBound
                   && !ExcludedFormStatuses.Contains(wellnessForm.Status)
                select new
                {
                    charge.UnitPrice,
                    charge.Quantity,
                    charge.FormID,
                    wellnessForm.PatientID,
                }).ToListAsync();

            return new PeriodUsage(
                Consumed: charges.Sum(c => (c.UnitPrice ?? 0) * c.Quantity),
                EmployeeCount: charges.Select(c => c.PatientID).Distinct().Count(),
                FormCount: charges.Select(c => c.FormID).Distinct().Count(),
                UnpricedCount: charges.Count(c => c.UnitPrice == null));
        }

        private async Task<BillingFormDetailDto> BuildDetailAsync(BillingForm form)
        {
            var lowerBound = form.StartDate.Date;
            var upperBound = form.EndDate.Date.AddDays(1);

            var visits = await _context.WellnessForms
                .Where(f => f.FormDate >= lowerBound
                         && f.FormDate < upperBound
                         && !ExcludedFormStatuses.Contains(f.Status))
                .Select(f => new { f.FormID, f.PatientID, f.FormDate })
                .ToListAsync();

            var formIds = visits.Select(v => v.FormID).ToList();

            var charges = await _context.WellnessFormCharges
                .Where(c => formIds.Contains(c.FormID))
                .OrderBy(c => c.ItemType)
                .ThenBy(c => c.ChargeID)
                .ToListAsync();

            // Category lives on ChargeItem, not on the charge snapshot (a
            // free-text row has no catalog item to read it from), so it is
            // joined in for display only and never affects a total.
            var chargeItemIds = charges
                .Where(c => c.ChargeItemID.HasValue)
                .Select(c => c.ChargeItemID!.Value)
                .Distinct()
                .ToList();

            var categories = await _context.ChargeItems
                .Where(c => chargeItemIds.Contains(c.ChargeItemID))
                .ToDictionaryAsync(c => c.ChargeItemID, c => c.Category);

            var patientIds = visits.Select(v => v.PatientID).Distinct().ToList();
            var patients = await _context.Patients
                .Where(p => patientIds.Contains(p.PatientID))
                .ToDictionaryAsync(p => p.PatientID);

            var chargesByForm = charges
                .GroupBy(c => c.FormID)
                .ToDictionary(g => g.Key, g => g.ToList());

            var patientRows = new List<BillingFormPatientDto>();

            foreach (var group in visits.GroupBy(v => v.PatientID))
            {
                var visitRows = new List<BillingFormVisitDto>();

                foreach (var visit in group.OrderByDescending(v => v.FormDate))
                {
                    if (!chargesByForm.TryGetValue(visit.FormID, out var visitCharges))
                        continue;

                    var lines = visitCharges.Select(c => new ChargeLineDto
                    {
                        ChargeID = c.ChargeID,
                        ItemType = c.ItemType,
                        Name = c.Name,
                        Category = c.ChargeItemID.HasValue
                            ? categories.GetValueOrDefault(c.ChargeItemID.Value)
                            : null,
                        UnitPrice = c.UnitPrice,
                        Quantity = c.Quantity,
                        Dosage = c.Dosage,
                        Frequency = c.Frequency,
                        LineTotal = c.UnitPrice.HasValue ? c.UnitPrice.Value * c.Quantity : null,
                    }).ToList();

                    visitRows.Add(new BillingFormVisitDto
                    {
                        FormID = visit.FormID,
                        FormDate = visit.FormDate,
                        Subtotal = lines.Where(l => l.LineTotal.HasValue).Sum(l => l.LineTotal!.Value),
                        Charges = lines,
                    });
                }

                // A visit in the window that recorded no labs or medications
                // consumes nothing, so it is not an employee this budget covers.
                if (visitRows.Count == 0)
                    continue;

                var patient = patients.GetValueOrDefault(group.Key);
                var allLines = visitRows.SelectMany(v => v.Charges).ToList();

                patientRows.Add(new BillingFormPatientDto
                {
                    PatientID = group.Key,
                    PatientName = FormatPatientName(patient),
                    AgencyOffice = patient?.AgencyOffice,
                    FormCount = visitRows.Count,
                    ItemCount = allLines.Count,
                    Subtotal = visitRows.Sum(v => v.Subtotal),
                    UnpricedCount = allLines.Count(l => l.LineTotal is null),
                    Visits = visitRows,
                });
            }

            patientRows = patientRows.OrderByDescending(p => p.Subtotal).ToList();

            var consumed = patientRows.Sum(p => p.Subtotal);

            string? creatorName = null;
            if (form.CreatedByAdminID is { } creatorId)
            {
                creatorName = await _context.Admins
                    .Where(a => a.AdminID == creatorId)
                    .Select(a => a.FullName)
                    .FirstOrDefaultAsync();
            }

            return new BillingFormDetailDto
            {
                BillingFormID = form.BillingFormID,
                Title = form.Title,
                StartDate = form.StartDate,
                EndDate = form.EndDate,
                Capital = form.Capital,
                Consumed = consumed,
                Remaining = form.Capital - consumed,
                IsOverBudget = consumed > form.Capital,
                UnpricedCount = patientRows.Sum(p => p.UnpricedCount),
                CreatedByAdminName = creatorName,
                CreatedAt = form.CreatedAt,
                RowVersion = EncodeRowVersion(form.RowVersion),
                Patients = patientRows,
            };
        }

        /// <summary>
        /// Two inclusive ranges overlap when each starts on or before the
        /// other ends. Returns the first period already covering any part of
        /// [start, end], or null when the range is free.
        /// </summary>
        private async Task<BillingForm?> FindOverlapAsync(DateTime start, DateTime end, int? excludeId)
        {
            var query = _context.BillingForms.AsQueryable();

            if (excludeId is { } id)
                query = query.Where(b => b.BillingFormID != id);

            return await query
                .Where(b => b.StartDate <= end && start <= b.EndDate)
                .OrderBy(b => b.StartDate)
                .FirstOrDefaultAsync();
        }

        private static BillingPeriodOverlapDto BuildOverlapDto(BillingForm conflict) => new()
        {
            Message = $"This period overlaps \"{conflict.Title}\" "
                    + $"({conflict.StartDate:MMM d, yyyy} – {conflict.EndDate:MMM d, yyyy}). "
                    + "Billing periods cannot cover the same dates.",
            ConflictingBillingFormID = conflict.BillingFormID,
            ConflictingTitle = conflict.Title,
            ConflictingStartDate = conflict.StartDate,
            ConflictingEndDate = conflict.EndDate,
        };

        private static string EncodeRowVersion(byte[]? rowVersion) =>
            Convert.ToBase64String(rowVersion ?? Array.Empty<byte>());

        private static string FormatPatientName(Patient? patient)
        {
            if (patient == null) return "Unknown Patient";
            var middle = string.IsNullOrWhiteSpace(patient.MiddleName) ? "" : $" {patient.MiddleName}";
            return $"{patient.FirstName}{middle} {patient.Surname}".Trim();
        }

        private void ApplyRowVersionToken(BillingForm form, string rowVersion)
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

            _context.Entry(form).Property(b => b.RowVersion).OriginalValue = bytes;
        }
    }
}
