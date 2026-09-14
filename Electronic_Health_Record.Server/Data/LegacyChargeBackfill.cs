using System.Text.RegularExpressions;
using Electronic_Health_Record.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Data
{
    /// <summary>
    /// One-time migration of billing data out of the two free-text columns it
    /// used to live in, into real WellnessFormCharge rows.
    ///
    /// This is not a schema migration because the parsing it does -- splitting
    /// a comma-joined lab list, reading a "(500)" quoted amount, and picking
    /// apart the bulleted medication prose buildManagementTreatment() in the
    /// client emits -- is not reasonably expressible in T-SQL. It runs from
    /// DbSeeder.SeedAsync instead, which already has a real DbContext and the
    /// same "check before touching" idempotency pattern used elsewhere in that
    /// file (see SeedBootstrapAdminAsync).
    ///
    /// Idempotent by construction: it only ever looks at forms with zero
    /// WellnessFormCharge rows. Every form Station 3 submits after this ships
    /// gets real charge rows directly (see WellnessFormsController.SubmitStation3),
    /// so once a form has been touched by either path it is never looked at
    /// again here.
    /// </summary>
    public static class LegacyChargeBackfill
    {
        // "CBC, ECG (500)" -> the parenthesised amount, when present.
        // Mirrors src/lib/diagnosticTests.js's ENTRY regex exactly: only a bare
        // number in trailing parens counts as a price, so a test name that
        // happens to end in "(blood)" is left alone.
        private static readonly Regex LabEntryPattern =
            new(@"^(?<name>.*?)\s*\((?<price>\d[\d,]*(?:\.\d+)?)\)$", RegexOptions.Compiled);

        // "• Losartan — 50 mg — Once daily — ₱250.00" -> drug / dosage /
        // frequency / price, each optional past "drug". Mirrors the shape
        // buildManagementTreatment() in Station3ConsultationPage.jsx emits:
        // parts joined with " — ", price as the last part when present and
        // formatted as currency.
        private static readonly Regex MedicationBulletPattern =
            new(@"^[•\-*]\s*(?<rest>.+)$", RegexOptions.Compiled);

        private static readonly string[] AliasedLabNames =
        {
            // ChargeItem seeds the retired spellings themselves (IsActive =
            // false) under their own row so this lookup is just "find any
            // active-or-not ChargeItem by exact name" -- no separate alias
            // table needed.
        };

        public static async Task RunAsync(ElectronicHealthRecordDbContext context, DateTime now)
        {
            // Only forms that have been through Station 3 or later can carry
            // legacy billing text; earlier statuses never had the fields set.
            var candidates = await context.WellnessForms
                .Where(f => f.Status != "PendingAssessment" && f.Status != "PendingConsultation")
                .Where(f => (f.RecommendedDiagnosticTest != null && f.RecommendedDiagnosticTest != "")
                         || (f.ManagementTreatment != null && f.ManagementTreatment != ""))
                .ToListAsync();

            if (candidates.Count == 0)
                return;

            var alreadyCharged = await context.WellnessFormCharges
                .Select(c => c.FormID)
                .Distinct()
                .ToListAsync();
            var alreadyChargedSet = alreadyCharged.ToHashSet();

            var pending = candidates.Where(f => !alreadyChargedSet.Contains(f.FormID)).ToList();
            if (pending.Count == 0)
                return;

            var catalog = await context.ChargeItems.ToListAsync();
            // Exact-name lookup only (case-sensitive on purpose): the catalog's
            // retired rows already carry the old spellings ("Liquid Profile",
            // "HVC") as their own entries, so a fuzzy match is not needed and
            // would risk mis-resolving a physician's genuinely custom entry.
            var byName = catalog
                .GroupBy(c => c.Name)
                .ToDictionary(g => g.Key, g => g.First());

            var unparsedMedicationForms = new List<int>();

            foreach (var form in pending)
            {
                var charges = new List<WellnessFormCharge>();

                if (!string.IsNullOrWhiteSpace(form.RecommendedDiagnosticTest))
                    charges.AddRange(ParseLabs(form.FormID, form.RecommendedDiagnosticTest, byName, now));

                if (!string.IsNullOrWhiteSpace(form.ManagementTreatment))
                {
                    var (medCharges, parsedCleanly) = ParseMedications(form.FormID, form.ManagementTreatment, now);
                    charges.AddRange(medCharges);
                    if (!parsedCleanly)
                        unparsedMedicationForms.Add(form.FormID);
                }

                if (charges.Count > 0)
                    context.WellnessFormCharges.AddRange(charges);
            }

            await context.SaveChangesAsync();

            if (unparsedMedicationForms.Count > 0)
            {
                // Left unbilled rather than guessed: a form that shows zero
                // medication charges is visibly incomplete and correctable by
                // hand; a wrong guess would look like a correct bill.
                Console.WriteLine(
                    $"[LegacyChargeBackfill] {unparsedMedicationForms.Count} form(s) had " +
                    $"ManagementTreatment text that did not match the expected medication " +
                    $"bullet format and were left with no medication charges: " +
                    $"{string.Join(", ", unparsedMedicationForms)}");
            }
        }

        private static List<WellnessFormCharge> ParseLabs(
            int formId,
            string value,
            Dictionary<string, ChargeItem> byName,
            DateTime now)
        {
            var result = new List<WellnessFormCharge>();

            foreach (var rawPart in value.Split(','))
            {
                var part = rawPart.Trim();
                if (part.Length == 0) continue;

                string name = part;
                decimal? quotedPrice = null;

                var match = LabEntryPattern.Match(part);
                if (match.Success)
                {
                    name = match.Groups["name"].Value.Trim();
                    if (decimal.TryParse(match.Groups["price"].Value.Replace(",", ""), out var parsed))
                        quotedPrice = parsed;
                }

                var catalogItem = byName.GetValueOrDefault(name);

                result.Add(new WellnessFormCharge
                {
                    FormID = formId,
                    ChargeItemID = catalogItem?.ChargeItemID,
                    ItemType = ChargeItemType.Lab,
                    // The catalog's current name if this resolved to a retired
                    // alias (e.g. "HVC" -> the row named "HVC" itself, since
                    // aliases are seeded as their own inactive entries) --
                    // otherwise the text exactly as written.
                    Name = catalogItem?.Name ?? name,
                    // A quoted amount wins over the catalog's own price (same
                    // rule as catalogPrice() client-side): it is what was
                    // actually charged for this specific patient.
                    UnitPrice = quotedPrice ?? catalogItem?.UnitPrice,
                    Quantity = 1,
                    CreatedAt = now,
                });
            }

            return result;
        }

        /// <summary>
        /// Returns the parsed medication charges and whether every bullet line
        /// in the medication block matched the expected shape. A partial match
        /// (some lines parsed, one did not) still returns false: a backfill
        /// that silently drops one drug from a multi-drug list is exactly the
        /// "quietly wrong money" failure this backfill exists to avoid.
        /// </summary>
        private static (List<WellnessFormCharge> Charges, bool ParsedCleanly) ParseMedications(
            int formId,
            string managementTreatment,
            DateTime now)
        {
            var result = new List<WellnessFormCharge>();

            // buildManagementTreatment() emits "Medications:\n<bullets>" as one
            // block, then a blank line, then "Lifestyle advice...". Only the
            // bulleted lines between those two markers are medications.
            var lines = managementTreatment.Split('\n');
            var inMedicationBlock = false;
            var sawAnyBullet = false;
            var allBulletsParsed = true;

            foreach (var rawLine in lines)
            {
                var line = rawLine.TrimEnd();

                if (line.StartsWith("Medications:"))
                {
                    inMedicationBlock = true;
                    continue;
                }

                if (!inMedicationBlock) continue;

                if (line.Length == 0 || line.StartsWith("Lifestyle advice") || line.StartsWith("Medication total:"))
                {
                    inMedicationBlock = line.StartsWith("Medication total:"); // total line is still "in block" but not a bullet
                    if (line.Length == 0 || line.StartsWith("Lifestyle advice")) break;
                    continue;
                }

                var bulletMatch = MedicationBulletPattern.Match(line.Trim());
                if (!bulletMatch.Success)
                {
                    allBulletsParsed = false;
                    continue;
                }

                sawAnyBullet = true;
                var parts = bulletMatch.Groups["rest"].Value.Split(" — ", StringSplitOptions.TrimEntries);

                string? drug = parts.Length > 0 ? parts[0] : null;
                string? dosage = parts.Length > 1 ? parts[1] : null;
                string? frequency = parts.Length > 2 ? parts[2] : null;
                decimal? price = null;

                // The price segment, when present, is the last part and is
                // formatted as currency ("₱250.00"); dosage/frequency never
                // are, so a currency-shaped last part is unambiguous.
                if (parts.Length > 3)
                {
                    var priceText = parts[^1].Replace("₱", "").Replace(",", "").Trim();
                    if (decimal.TryParse(priceText, out var parsedPrice))
                        price = parsedPrice;
                    else
                        allBulletsParsed = false;
                }

                if (string.IsNullOrWhiteSpace(drug))
                {
                    allBulletsParsed = false;
                    continue;
                }

                result.Add(new WellnessFormCharge
                {
                    FormID = formId,
                    ChargeItemID = null, // medications had no catalog before this backfill
                    ItemType = ChargeItemType.Medication,
                    Name = drug!.Trim(),
                    UnitPrice = price,
                    Quantity = 1,
                    Dosage = dosage?.Trim(),
                    Frequency = frequency?.Trim(),
                    CreatedAt = now,
                });
            }

            // No medication block at all (only lifestyle advice was recorded)
            // is a clean, correct zero-medication result, not a parse failure.
            var parsedCleanly = !sawAnyBullet || allBulletsParsed;
            return (result, parsedCleanly);
        }
    }
}
