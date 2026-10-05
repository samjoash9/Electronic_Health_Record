using System.Globalization;
using System.Linq.Expressions;
using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services;
using Electronic_Health_Record.Server.Services.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers.Reports
{
    /// <summary>
    /// The dashboard's per-station report cards. Every action takes the same
    /// filter: from and to are inclusive yyyy-MM-dd bounds on FormDate (a
    /// Manila calendar date), office matches Patient.AgencyOffice and is
    /// omitted for every office. Cancelled visits are left out everywhere.
    ///
    /// Health breakdowns count each patient once, from their latest visit in
    /// the range that has that station's data -- the rule the older dashboard
    /// charts used. Throughput ("completed") counts forms.
    ///
    /// Admin roles only: plain [Authorize] would let a patient or physician
    /// session read clinic-wide aggregates.
    /// </summary>
    [ApiController]
    [Route("api/reports")]
    [Authorize(Roles = $"{AdminRoles.Admin},{AdminRoles.SuperAdmin}")]
    public class StationReportsController : ControllerBase
    {
        // Forms that never reached Station 3 carry no charges, and a cancelled
        // visit consumes nothing -- the same exclusions as BillingController.
        private static readonly string[] UnbilledStatuses =
            ["PendingAssessment", "PendingConsultation", "Cancelled"];

        private readonly ElectronicHealthRecordDbContext _context;

        public StationReportsController(ElectronicHealthRecordDbContext context)
        {
            _context = context;
        }

        // GET /api/reports/station1?from=&to=&office=
        // Every form is created at Station 1, so every visit in range counts.
        [HttpGet("station1")]
        public async Task<IActionResult> GetStation1(
            [FromQuery] string? from, [FromQuery] string? to, [FromQuery] string? office)
        {
            if (!TryParseRange(from, to, office, out var range, out var error))
                return BadRequest(new { message = error });

            var visits = await FormsInRange(range)
                .Select(f => new
                {
                    f.FormID, f.PatientID, f.FormDate,
                    f.BMI, f.BPSystolic, f.BPDiastolic, f.TempCelsius, f.HeartRate, f.RespRate,
                })
                .ToListAsync();

            var latest = LatestPerPatient(visits, v => v.PatientID, v => v.FormDate, v => v.FormID);

            return Ok(new
            {
                completed = visits.Count,
                patients = latest.Count,
                bmi = ReportClassifiers.Tally(
                    latest.Select(v => ReportClassifiers.BmiClass(v.BMI)),
                    "underweight", "normal", "overweight", "obese"),
                bp = ReportClassifiers.Tally(
                    latest.Select(v => ReportClassifiers.BpClass(v.BPSystolic, v.BPDiastolic)),
                    "normal", "elevated", "stage1", "stage2", "crisis"),
                flags = new
                {
                    fever = latest.Count(v => ReportClassifiers.IsFever(v.TempCelsius)),
                    tachycardia = latest.Count(v => ReportClassifiers.IsTachycardia(v.HeartRate)),
                    bradycardia = latest.Count(v => ReportClassifiers.IsBradycardia(v.HeartRate)),
                    tachypnea = latest.Count(v => ReportClassifiers.IsTachypnea(v.RespRate)),
                },
            });
        }

        // GET /api/reports/station2?from=&to=&office=
        // Scores pool the same way as AssessmentController.GetWellnessScores:
        // points over points possible, across the questions actually answered.
        [HttpGet("station2")]
        public async Task<IActionResult> GetStation2(
            [FromQuery] string? from, [FromQuery] string? to, [FromQuery] string? office)
        {
            if (!TryParseRange(from, to, office, out var range, out var error))
                return BadRequest(new { message = error });

            var (completed, medianMinutes) = await ThroughputAsync(range,
                f => new StationSpan { Start = f.Station2StartedAt, End = f.Station2SubmittedAt });

            var assessed = await FormsInRange(range)
                .Where(f => _context.AssessmentAnswers.Any(a => a.FormID == f.FormID))
                .Select(f => new { f.FormID, f.PatientID, f.FormDate })
                .ToListAsync();
            var latestIds = LatestPerPatient(assessed, v => v.PatientID, v => v.FormDate, v => v.FormID)
                .Select(v => v.FormID)
                .ToList();

            var answers = await (
                from a in _context.AssessmentAnswers
                join o in _context.AssessmentOptions on a.OptionID equals o.OptionID
                join q in _context.AssessmentQuestions on a.QuestionID equals q.QuestionID
                where latestIds.Contains(a.FormID)
                select new { a.FormID, a.QuestionID, q.CategoryID, Score = (int)o.Score }
            ).ToListAsync();

            // A question's best option is what an answer to it could have scored.
            var bestByQuestion = await _context.AssessmentOptions
                .GroupBy(o => o.QuestionID)
                .Select(g => new { QuestionID = g.Key, Best = g.Max(o => (int)o.Score) })
                .ToDictionaryAsync(q => q.QuestionID, q => q.Best);

            var bands = answers
                .GroupBy(a => a.FormID)
                .Select(g => ReportClassifiers.WellnessBand(ScorePercent(
                    g.Sum(a => a.Score),
                    g.Sum(a => bestByQuestion.GetValueOrDefault(a.QuestionID)))));

            var categoryNames = await _context.AssessmentCategories
                .ToDictionaryAsync(c => c.CategoryID, c => c.Name);

            var focus = answers
                .GroupBy(a => a.CategoryID)
                .Select(g => new
                {
                    CategoryID = g.Key,
                    Percent = ScorePercent(
                        g.Sum(a => a.Score),
                        g.Sum(a => bestByQuestion.GetValueOrDefault(a.QuestionID))),
                })
                .Where(c => c.Percent != null)
                .OrderBy(c => c.Percent)
                .FirstOrDefault();

            return Ok(new
            {
                completed,
                medianMinutes,
                patients = latestIds.Count,
                bands = ReportClassifiers.Tally(bands, "excellent", "good", "fair", "attention", "support"),
                focusArea = focus == null ? null : new
                {
                    category = categoryNames.GetValueOrDefault(focus.CategoryID, "Unknown"),
                    percent = Math.Round(focus.Percent!.Value, 1),
                },
            });
        }

        // GET /api/reports/station3?from=&to=&office=
        [HttpGet("station3")]
        public async Task<IActionResult> GetStation3(
            [FromQuery] string? from, [FromQuery] string? to, [FromQuery] string? office)
        {
            if (!TryParseRange(from, to, office, out var range, out var error))
                return BadRequest(new { message = error });

            var consults = await FormsInRange(range)
                .Where(f => f.Station3SubmittedAt != null)
                .Select(f => new
                {
                    f.FormID, f.PatientID, f.FormDate, f.SignedByName,
                    f.Station3StartedAt, f.Station3SubmittedAt,
                })
                .ToListAsync();

            var latestIds = LatestPerPatient(consults, v => v.PatientID, v => v.FormDate, v => v.FormID)
                .Select(v => v.FormID)
                .ToList();

            var charges = await (
                from c in _context.WellnessFormCharges
                join f in FormsInRange(range) on c.FormID equals f.FormID
                select new { c.ItemType, c.Name }
            ).ToListAsync();

            // A blank PMH row (no catalog condition, no free text) is not a condition.
            var withCondition = await _context.PastMedicalHistories
                .Where(h => latestIds.Contains(h.FormID)
                         && (h.ConditionID != null || (h.ConditionOther != null && h.ConditionOther != "")))
                .Select(h => h.FormID)
                .Distinct()
                .CountAsync();

            var social = await _context.SocialHistories
                .Where(s => latestIds.Contains(s.FormID))
                .Select(s => new { s.FormID, s.Smokes, s.AlcoholType })
                .ToListAsync();

            return Ok(new
            {
                completed = consults.Count,
                medianMinutes = ReportClassifiers.MedianMinutes(
                    consults.Select(c => (c.Station3StartedAt, c.Station3SubmittedAt))),
                patients = latestIds.Count,
                topLabs = TopByCount(charges.Where(c => c.ItemType == ChargeItemType.Lab).Select(c => c.Name)),
                topMeds = TopByCount(charges.Where(c => c.ItemType == ChargeItemType.Medication).Select(c => c.Name)),
                // SignedByName, not PhysicianID: it survives deletion of the account.
                byPhysician = consults
                    .GroupBy(c => string.IsNullOrWhiteSpace(c.SignedByName) ? "Unknown" : c.SignedByName.Trim())
                    .Select(g => new NameCount(g.Key, g.Count()))
                    .OrderByDescending(p => p.Count)
                    .ThenBy(p => p.Name)
                    .ToList(),
                riskFactors = new
                {
                    chronicCondition = withCondition,
                    smokers = social.Where(s => s.Smokes == true).Select(s => s.FormID).Distinct().Count(),
                    drinkers = social.Where(s => !string.IsNullOrWhiteSpace(s.AlcoholType))
                        .Select(s => s.FormID).Distinct().Count(),
                },
            });
        }

        // GET /api/reports/station4?from=&to=&office=
        // Values compared below must match DENTAL_INDICATORS in
        // src/lib/constants.js and the CK_DentalAssessment_* constraints.
        [HttpGet("station4")]
        public async Task<IActionResult> GetStation4(
            [FromQuery] string? from, [FromQuery] string? to, [FromQuery] string? office)
        {
            if (!TryParseRange(from, to, office, out var range, out var error))
                return BadRequest(new { message = error });

            var (completed, medianMinutes) = await ThroughputAsync(range,
                f => new StationSpan { Start = f.Station4StartedAt, End = f.Station4SubmittedAt });

            var exams = await (
                from f in FormsInRange(range)
                join d in _context.DentalAssessments on f.FormID equals d.FormID
                select new
                {
                    f.FormID, f.PatientID, f.FormDate,
                    d.OralHygieneStatus, d.DentalCaries, d.GumCondition,
                    d.ToothStatus, d.OralLesions, d.DentalReferral,
                }
            ).ToListAsync();

            var latest = LatestPerPatient(exams, v => v.PatientID, v => v.FormDate, v => v.FormID);

            return Ok(new
            {
                completed,
                medianMinutes,
                patients = latest.Count,
                hygiene = new
                {
                    good = latest.Count(e => e.OralHygieneStatus == "Good"),
                    fair = latest.Count(e => e.OralHygieneStatus == "Fair"),
                    poor = latest.Count(e => e.OralHygieneStatus == "Poor"),
                },
                findings = new
                {
                    caries = latest.Count(e => e.DentalCaries == "Present"),
                    gumProblem = latest.Count(e => e.GumCondition is "Gingivitis" or "Suspected Periodontal Problem"),
                    toothProblem = latest.Count(e => e.ToothStatus is "Missing Teeth" or "Needs Dental Treatment"),
                    // Stored as "Present – refer for evaluation" (en dash); matched
                    // on the prefix so the dash's encoding cannot desync it.
                    oralLesions = latest.Count(e => e.OralLesions != null && e.OralLesions.StartsWith("Present")),
                },
                referrals = new
                {
                    routine = latest.Count(e => e.DentalReferral == "Routine referral"),
                    urgent = latest.Count(e => e.DentalReferral == "Urgent referral"),
                },
            });
        }

        // GET /api/reports/station5?from=&to=&office=
        // Values compared below must match VISION_INDICATORS in
        // src/lib/constants.js and the CK_VisionAssessment_* constraints.
        [HttpGet("station5")]
        public async Task<IActionResult> GetStation5(
            [FromQuery] string? from, [FromQuery] string? to, [FromQuery] string? office)
        {
            if (!TryParseRange(from, to, office, out var range, out var error))
                return BadRequest(new { message = error });

            var (completed, medianMinutes) = await ThroughputAsync(range,
                f => new StationSpan { Start = f.Station5StartedAt, End = f.Station5SubmittedAt });

            var exams = await (
                from f in FormsInRange(range)
                join v in _context.VisionAssessments on f.FormID equals v.FormID
                select new
                {
                    f.FormID, f.PatientID, f.FormDate,
                    v.BlurredVision, v.DifficultySeeingNear, v.DifficultySeeingDistant,
                    v.HeadacheEyeStrain, v.EyePainDiscomfort, v.EyeConditionIdentified,
                    v.UsesEyeglassesContactLenses, v.CorrectiveLensesRecommended,
                    v.ReferralToEyeSpecialist, v.FollowUpConsultationAdvised,
                }
            ).ToListAsync();

            var latest = LatestPerPatient(exams, v => v.PatientID, v => v.FormDate, v => v.FormID);

            return Ok(new
            {
                completed,
                medianMinutes,
                patients = latest.Count,
                symptoms = new
                {
                    blurred = latest.Count(e => e.BlurredVision == "Yes"),
                    near = latest.Count(e => e.DifficultySeeingNear == "Yes"),
                    distant = latest.Count(e => e.DifficultySeeingDistant == "Yes"),
                    eyeStrain = latest.Count(e => e.HeadacheEyeStrain == "Yes"),
                    eyePain = latest.Count(e => e.EyePainDiscomfort == "Yes"),
                },
                conditions = new
                {
                    none = latest.Count(e => e.EyeConditionIdentified == "None"),
                    refractiveError = latest.Count(e => e.EyeConditionIdentified == "Refractive error"),
                    other = latest.Count(e => e.EyeConditionIdentified == "Other"),
                },
                usesCorrection = latest.Count(e => e.UsesEyeglassesContactLenses == "Yes"),
                outcomes = new
                {
                    lensesRecommended = latest.Count(e => e.CorrectiveLensesRecommended == "Yes"),
                    specialistReferral = latest.Count(e => e.ReferralToEyeSpecialist == "Yes"),
                    followUp = latest.Count(e => e.FollowUpConsultationAdvised == "Yes"),
                },
            });
        }

        // GET /api/reports/station6?from=&to=
        // Capital is pooled across offices, so office is accepted but ignored.
        // The period shown is the billing form covering the end of the range,
        // or today when the range runs into the future. Consumed is summed
        // exactly as BillingController.SummarisePeriodAsync does.
        [HttpGet("station6")]
        public async Task<IActionResult> GetStation6(
            [FromQuery] string? from, [FromQuery] string? to, [FromQuery] string? office)
        {
            if (!TryParseRange(from, to, office, out var range, out var error))
                return BadRequest(new { message = error });

            var today = PhilippineTime.Today;
            var asOf = range.To < today ? range.To : today;

            var period = await _context.BillingForms
                .Where(b => b.StartDate.Date <= asOf && b.EndDate.Date >= asOf)
                .OrderByDescending(b => b.StartDate)
                .FirstOrDefaultAsync();

            if (period == null)
            {
                return Ok(new
                {
                    asOf = asOf.ToString("yyyy-MM-dd"),
                    period = (object?)null,
                    byType = new { lab = 0m, medication = 0m },
                    topItems = Array.Empty<object>(),
                    unpricedCount = 0,
                });
            }

            var lowerBound = period.StartDate.Date;
            var upperBound = period.EndDate.Date.AddDays(1);

            var charges = await (
                from c in _context.WellnessFormCharges
                join f in _context.WellnessForms on c.FormID equals f.FormID
                where f.FormDate >= lowerBound
                   && f.FormDate < upperBound
                   && !UnbilledStatuses.Contains(f.Status)
                select new { c.ItemType, c.Name, c.UnitPrice, c.Quantity }
            ).ToListAsync();

            // A null price is a quote still owed, not zero: it adds nothing to
            // the money and is counted in unpricedCount instead.
            static decimal Amount(decimal? unitPrice, int quantity) => (unitPrice ?? 0) * quantity;

            var consumed = charges.Sum(c => Amount(c.UnitPrice, c.Quantity));

            return Ok(new
            {
                asOf = asOf.ToString("yyyy-MM-dd"),
                period = new
                {
                    billingFormID = period.BillingFormID,
                    title = period.Title,
                    startDate = period.StartDate.ToString("yyyy-MM-dd"),
                    endDate = period.EndDate.ToString("yyyy-MM-dd"),
                    capital = period.Capital,
                    consumed,
                    remaining = period.Capital - consumed,
                    percentUsed = period.Capital > 0 ? Math.Round(consumed / period.Capital * 100, 1) : 0m,
                },
                byType = new
                {
                    lab = charges.Where(c => c.ItemType == ChargeItemType.Lab)
                        .Sum(c => Amount(c.UnitPrice, c.Quantity)),
                    medication = charges.Where(c => c.ItemType == ChargeItemType.Medication)
                        .Sum(c => Amount(c.UnitPrice, c.Quantity)),
                },
                topItems = charges
                    .Where(c => c.UnitPrice != null)
                    .GroupBy(c => c.Name.Trim(), StringComparer.OrdinalIgnoreCase)
                    .Select(g => new { name = g.First().Name.Trim(), amount = g.Sum(c => Amount(c.UnitPrice, c.Quantity)) })
                    .OrderByDescending(i => i.amount)
                    .ThenBy(i => i.name)
                    .Take(5)
                    .ToList(),
                unpricedCount = charges.Count(c => c.UnitPrice == null),
            });
        }

        // ---- shared helpers ------------------------------------------------

        private sealed record ReportRange(DateTime From, DateTime To, string? Office);

        // Set from a projection so EF can translate it; see ThroughputAsync.
        private sealed class StationSpan
        {
            public DateTime? Start { get; init; }
            public DateTime? End { get; init; }
        }

        private static bool TryParseRange(
            string? from, string? to, string? office, out ReportRange range, out string error)
        {
            range = null!;
            if (!TryParseDate(from, out var fromDate) || !TryParseDate(to, out var toDate))
            {
                error = "from and to are required as yyyy-MM-dd.";
                return false;
            }
            if (fromDate > toDate)
            {
                error = "from must not be after to.";
                return false;
            }

            error = string.Empty;
            range = new ReportRange(fromDate, toDate, string.IsNullOrWhiteSpace(office) ? null : office.Trim());
            return true;
        }

        private static bool TryParseDate(string? value, out DateTime date) =>
            DateTime.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date);

        // Non-cancelled visits dated inside the range, limited to the office when one is given.
        private IQueryable<WellnessForm> FormsInRange(ReportRange range) =>
            from f in _context.WellnessForms
            join p in _context.Patients on f.PatientID equals p.PatientID
            where f.Status != "Cancelled"
               && f.FormDate >= range.From
               && f.FormDate <= range.To
               && (range.Office == null || p.AgencyOffice == range.Office)
            select f;

        // One row per patient: their latest visit, FormID breaking same-day ties.
        private static List<T> LatestPerPatient<T>(
            IEnumerable<T> rows, Func<T, int> patientId, Func<T, DateTime> formDate, Func<T, int> formId) =>
            rows.GroupBy(patientId)
                .Select(g => g.OrderByDescending(formDate).ThenByDescending(formId).First())
                .ToList();

        // Forms in range that finished the station, and the median minutes spent at it.
        // The finished filter runs in memory: two columns per visit is cheap,
        // and EF cannot filter on a member of an object it just constructed.
        private async Task<(int Completed, double? MedianMinutes)> ThroughputAsync(
            ReportRange range, Expression<Func<WellnessForm, StationSpan>> span)
        {
            var spans = await FormsInRange(range).Select(span).ToListAsync();
            var finished = spans.Where(s => s.End != null).ToList();
            return (finished.Count, ReportClassifiers.MedianMinutes(finished.Select(s => (s.Start, s.End))));
        }

        private sealed record NameCount(string Name, int Count);

        private static double? ScorePercent(int points, int possible) =>
            possible == 0 ? null : 100.0 * points / possible;

        // The five names seen most often, case-insensitively, ties alphabetical.
        private static List<NameCount> TopByCount(IEnumerable<string> names) =>
            names.GroupBy(n => n.Trim(), StringComparer.OrdinalIgnoreCase)
                 .Select(g => new NameCount(g.First().Trim(), g.Count()))
                 .OrderByDescending(n => n.Count)
                 .ThenBy(n => n.Name)
                 .Take(5)
                 .ToList();
    }
}
