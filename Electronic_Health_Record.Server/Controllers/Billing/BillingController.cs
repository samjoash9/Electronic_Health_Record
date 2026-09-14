using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.Billing;
using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers.Billing
{
    // Station 6. Every patient carries their own allotment for a visit
    // (decision 1); there is no shared fund. Approve is the only endpoint that
    // changes money state, and it recomputes everything from
    // WellnessFormCharge rather than trusting a client-sent total.
    [ApiController]
    [Route("api/billing")]
    [Authorize]
    public class BillingController : ControllerBase
    {
        private readonly ElectronicHealthRecordDbContext _context;
        private readonly ICurrentUser _currentUser;
        private readonly ILogger<BillingController> _logger;

        public BillingController(
            ElectronicHealthRecordDbContext context,
            ICurrentUser currentUser,
            ILogger<BillingController> logger)
        {
            _context = context;
            _currentUser = currentUser;
            _logger = logger;
        }

        // GET /api/billing/settings
        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await GetOrSeedSettingsAsync();
            return Ok(new BillingSettingsResponseDto
            {
                DefaultAllotment = settings.DefaultAllotment,
                UpdatedAt = settings.UpdatedAt,
            });
        }

        // PUT /api/billing/settings
        // Superadmin only, same reasoning as ChargeItemsController's writes:
        // the budget is a policy decision, not a station-floor one. Changing
        // this never touches a form already approved -- FormBilling snapshots
        // the allotment at approval time (decision 4).
        [Authorize(Roles = AdminRoles.SuperAdmin)]
        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] UpdateBillingSettingsDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var settings = await GetOrSeedSettingsAsync();
                settings.DefaultAllotment = dto.DefaultAllotment;
                settings.UpdatedAt = DateTime.UtcNow;
                settings.UpdatedByAdminID = _currentUser.AdminID;

                await _context.SaveChangesAsync();

                return Ok(new BillingSettingsResponseDto
                {
                    DefaultAllotment = settings.DefaultAllotment,
                    UpdatedAt = settings.UpdatedAt,
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update billing settings.");
                return StatusCode(500, "An error occurred while updating billing settings.");
            }
        }

        // GET /api/billing/forms?status=Pending|Deducted|All&q=&page=&pageSize=
        //
        // A form with no FormBilling row yet is Pending against the current
        // DefaultAllotment: billing state is only created on approval, not the
        // moment a form reaches the queue, so a brand-new form needs no
        // migration step to show up here.
        [HttpGet("forms")]
        public async Task<IActionResult> GetQueue(
            [FromQuery] string? status,
            [FromQuery] string? q,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            try
            {
                var settings = await GetOrSeedSettingsAsync();

                // Only forms that have actually reached billing -- i.e. gone
                // through Station 3, which is where charges are recorded --
                // belong in this queue. PendingAssessment/PendingConsultation
                // forms have no charges yet and would just show as zero-total
                // noise.
                var formsQuery = _context.WellnessForms
                    .Where(f => f.Status != "PendingAssessment" && f.Status != "PendingConsultation"
                             && f.Status != "Cancelled");

                if (!string.IsNullOrWhiteSpace(q))
                {
                    var term = q.Trim();
                    var patientIds = await _context.Patients
                        .Where(p => p.Surname.Contains(term) || p.FirstName.Contains(term)
                                 || (p.AgencyOffice != null && p.AgencyOffice.Contains(term)))
                        .Select(p => p.PatientID)
                        .ToListAsync();

                    formsQuery = formsQuery.Where(f => patientIds.Contains(f.PatientID));
                }

                var forms = await formsQuery
                    .OrderByDescending(f => f.FormDate)
                    .ThenByDescending(f => f.FormID)
                    .ToListAsync();

                var formIds = forms.Select(f => f.FormID).ToList();
                var patientIdsOnPage = forms.Select(f => f.PatientID).Distinct().ToList();

                var patients = await _context.Patients
                    .Where(p => patientIdsOnPage.Contains(p.PatientID))
                    .ToDictionaryAsync(p => p.PatientID);

                var chargeTotals = await _context.WellnessFormCharges
                    .Where(c => formIds.Contains(c.FormID))
                    .GroupBy(c => c.FormID)
                    .Select(g => new
                    {
                        FormID = g.Key,
                        ItemCount = g.Count(),
                        Total = g.Sum(c => (c.UnitPrice ?? 0) * c.Quantity),
                    })
                    .ToDictionaryAsync(g => g.FormID);

                var billingRows = await _context.FormBillings
                    .Where(b => formIds.Contains(b.FormID))
                    .ToDictionaryAsync(b => b.FormID);

                var rows = forms.Select(f =>
                {
                    var patient = patients.GetValueOrDefault(f.PatientID);
                    var chargeInfo = chargeTotals.GetValueOrDefault(f.FormID);
                    var billing = billingRows.GetValueOrDefault(f.FormID);

                    var total = chargeInfo?.Total ?? 0m;
                    var allotment = billing?.AllotmentSnapshot ?? settings.DefaultAllotment;
                    var rowStatus = billing?.Status ?? FormBillingStatus.Pending;
                    // A Deducted row's total is the recomputed figure frozen at
                    // approval; a Pending row's total is live, since charges
                    // may still change before it is approved.
                    var effectiveTotal = billing?.TotalCharged ?? total;

                    return new BillingQueueRowDto
                    {
                        FormID = f.FormID,
                        PatientID = f.PatientID,
                        PatientName = FormatPatientName(patient),
                        AgencyOffice = patient?.AgencyOffice,
                        FormDate = f.FormDate,
                        ItemCount = chargeInfo?.ItemCount ?? 0,
                        TotalCharged = effectiveTotal,
                        Allotment = allotment,
                        Remaining = allotment - effectiveTotal,
                        Status = rowStatus,
                        IsOverBudget = effectiveTotal > allotment,
                    };
                }).ToList();

                if (!string.IsNullOrWhiteSpace(status) && status != "All")
                {
                    if (status != FormBillingStatus.Pending && status != FormBillingStatus.Deducted)
                        return BadRequest(new { message = "status must be Pending, Deducted, or All." });

                    rows = rows.Where(r => r.Status == status).ToList();
                }

                var totalCount = rows.Count;
                var paged = rows.Skip((page - 1) * pageSize).Take(pageSize).ToList();

                return Ok(new
                {
                    data = paged,
                    totalCount,
                    page,
                    pageSize,
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve billing queue.");
                return StatusCode(500, "An error occurred while retrieving the billing queue.");
            }
        }

        // GET /api/billing/forms/{formId}
        [HttpGet("forms/{formId:int}")]
        public async Task<IActionResult> GetInvoice(int formId)
        {
            var form = await _context.WellnessForms.FindAsync(formId);
            if (form == null)
                return NotFound(new { message = $"Wellness form with ID {formId} was not found." });

            try
            {
                var invoice = await BuildInvoiceAsync(form);
                return Ok(invoice);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to build invoice for form {FormID}.", formId);
                return StatusCode(500, "An error occurred while retrieving the invoice.");
            }
        }

        // POST /api/billing/forms/{formId}/approve
        //
        // The five rules that keep this endpoint from ever deducting the wrong
        // amount:
        //   1. TotalCharged is recomputed from WellnessFormCharge, never taken
        //      from the request.
        //   2. DefaultAllotment is read fresh and snapshotted, not carried from
        //      an earlier GET.
        //   3. total > allotment with no OverrideReason -> 409 with the exact
        //      overage, so the client's confirm dialog has a real number.
        //      Equal to the allotment is not an overage.
        //   4. Already Deducted -> 409. A double-click must not deduct twice.
        //   5. A WellnessFormAuditLog row records who approved it, the total,
        //      the allotment, and the override reason if any.
        [Authorize(Roles = AdminRoles.SuperAdmin)]
        [HttpPost("forms/{formId:int}/approve")]
        public async Task<IActionResult> ApproveAndDeduct(int formId, [FromBody] ApproveBillingDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var form = await _context.WellnessForms.FindAsync(formId);
            if (form == null)
                return NotFound(new { message = $"Wellness form with ID {formId} was not found." });

            var billing = await _context.FormBillings.FirstOrDefaultAsync(b => b.FormID == formId);

            if (billing != null && billing.Status == FormBillingStatus.Deducted)
                return Conflict(new { message = "This bill has already been approved and deducted." });

            if (billing != null)
                ApplyRowVersionToken(billing, dto.RowVersion);

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var settings = await GetOrSeedSettingsAsync();

                // Rule 1: recompute, never trust the client.
                var total = await _context.WellnessFormCharges
                    .Where(c => c.FormID == formId)
                    .SumAsync(c => (c.UnitPrice ?? 0) * c.Quantity);

                // Rule 2: fresh snapshot.
                var allotment = settings.DefaultAllotment;
                var overage = total - allotment;

                // Rule 3.
                if (overage > 0 && string.IsNullOrWhiteSpace(dto.OverrideReason))
                {
                    await transaction.RollbackAsync();
                    return Conflict(new BillingOverageDto
                    {
                        TotalCharged = total,
                        Allotment = allotment,
                        Overage = overage,
                    });
                }

                var now = DateTime.UtcNow;

                if (billing == null)
                {
                    billing = new FormBilling
                    {
                        FormID = formId,
                    };
                    _context.FormBillings.Add(billing);
                }

                billing.AllotmentSnapshot = allotment;
                billing.Status = FormBillingStatus.Deducted;
                billing.TotalCharged = total;
                billing.ApprovedByAdminID = _currentUser.AdminID;
                billing.ApprovedAt = now;
                billing.OverrideReason = overage > 0 ? dto.OverrideReason : null;

                _context.WellnessFormAuditLogs.Add(new WellnessFormAuditLog
                {
                    FormID = formId,
                    ActorType = "Admin",
                    ActorID = _currentUser.AdminID,
                    Action = "BillingApproved",
                    Details = overage > 0
                        ? $"Total {total:F2} exceeded allotment {allotment:F2} by {overage:F2}. Override: {dto.OverrideReason}"
                        : $"Total {total:F2} deducted from allotment {allotment:F2}.",
                    OccurredAt = now,
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var invoice = await BuildInvoiceAsync(form);
                return Ok(invoice);
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync();
                return Conflict(new { message = "This bill was changed by someone else. Reload and try again." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to approve billing for form {FormID}.", formId);
                return StatusCode(500, "An error occurred while approving this bill.");
            }
        }

        private async Task<BillingInvoiceDto> BuildInvoiceAsync(WellnessForm form)
        {
            var patient = await _context.Patients.FindAsync(form.PatientID);

            var charges = await _context.WellnessFormCharges
                .Where(c => c.FormID == form.FormID)
                .OrderBy(c => c.ItemType)
                .ThenBy(c => c.ChargeID)
                .ToListAsync();

            // Category lives on ChargeItem, not the charge snapshot (a
            // free-text row has no catalog item to read it from), so it is
            // joined in for display only and never affects the total.
            var chargeItemIds = charges.Where(c => c.ChargeItemID.HasValue)
                .Select(c => c.ChargeItemID!.Value).Distinct().ToList();
            var categories = await _context.ChargeItems
                .Where(c => chargeItemIds.Contains(c.ChargeItemID))
                .ToDictionaryAsync(c => c.ChargeItemID, c => c.Category);

            var lines = charges.Select(c => new ChargeLineDto
            {
                ChargeID = c.ChargeID,
                ItemType = c.ItemType,
                Name = c.Name,
                Category = c.ChargeItemID.HasValue ? categories.GetValueOrDefault(c.ChargeItemID.Value) : null,
                UnitPrice = c.UnitPrice,
                Quantity = c.Quantity,
                Dosage = c.Dosage,
                Frequency = c.Frequency,
                LineTotal = c.UnitPrice.HasValue ? c.UnitPrice.Value * c.Quantity : null,
            }).ToList();

            var total = lines.Where(l => l.LineTotal.HasValue).Sum(l => l.LineTotal!.Value);
            var unpricedCount = lines.Count(l => l.LineTotal is null);

            var billing = await _context.FormBillings.FirstOrDefaultAsync(b => b.FormID == form.FormID);
            var settings = await GetOrSeedSettingsAsync();

            var allotment = billing?.AllotmentSnapshot ?? settings.DefaultAllotment;
            var effectiveTotal = billing?.TotalCharged ?? total;

            string? approverName = null;
            if (billing?.ApprovedByAdminID is { } approverId)
            {
                approverName = await _context.Admins
                    .Where(a => a.AdminID == approverId)
                    .Select(a => a.FullName)
                    .FirstOrDefaultAsync();
            }

            return new BillingInvoiceDto
            {
                FormID = form.FormID,
                PatientID = form.PatientID,
                PatientName = FormatPatientName(patient),
                AgencyOffice = patient?.AgencyOffice,
                FormDate = form.FormDate,
                Charges = lines,
                TotalCharged = effectiveTotal,
                UnpricedCount = unpricedCount,
                Allotment = allotment,
                Remaining = allotment - effectiveTotal,
                IsOverBudget = effectiveTotal > allotment,
                Status = billing?.Status ?? FormBillingStatus.Pending,
                OverrideReason = billing?.OverrideReason,
                ApprovedByAdminName = approverName,
                ApprovedAt = billing?.ApprovedAt,
                RowVersion = Convert.ToBase64String(billing?.RowVersion ?? Array.Empty<byte>()),
            };
        }

        private async Task<BillingSettings> GetOrSeedSettingsAsync()
        {
            var settings = await _context.BillingSettings.FindAsync(1);
            if (settings != null)
                return settings;

            // Belt-and-suspenders: the migration seeds this row, but a fresh
            // database that skipped seeding must never 500 on a plain GET.
            settings = new BillingSettings
            {
                BillingSettingsID = 1,
                DefaultAllotment = 0,
                UpdatedAt = DateTime.UtcNow,
            };
            _context.BillingSettings.Add(settings);
            await _context.SaveChangesAsync();
            return settings;
        }

        private static string FormatPatientName(Patient? patient)
        {
            if (patient == null) return "Unknown Patient";
            var middle = string.IsNullOrWhiteSpace(patient.MiddleName) ? "" : $" {patient.MiddleName}";
            return $"{patient.FirstName}{middle} {patient.Surname}".Trim();
        }

        private void ApplyRowVersionToken(FormBilling billing, string rowVersion)
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

            _context.Entry(billing).Property(b => b.RowVersion).OriginalValue = bytes;
        }
    }
}
