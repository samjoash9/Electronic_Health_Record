import { useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { ClipboardList, FlaskConical, Stethoscope, Pill, Check, Plus, Trash2 } from 'lucide-react';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import { peso } from '../../lib/formatters';
import SectionCard, { SubPanel } from './SectionCard';
import { DIAGNOSTIC_TESTS, DIAGNOSTIC_TEST_CATALOG, THYROID_PANEL } from '../../lib/constants';
import { parseEntry, catalogPrice } from '../../lib/diagnosticTests';

// Same tile pattern as Family Medical History: a hidden native checkbox under
// a styled tile, so the whole tile is the hit target and focus styling comes
// from the peer relationship instead of manual state.
const HIDDEN_CHECKBOX =
  'peer absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0';
const TILE_ON = 'border-[#0e7d6b]/40 bg-[#f3fdfb]';
const TILE_OFF = 'border-line bg-canvas hover:border-[#0e7d6b]/30 hover:bg-[#f9fefd]';

function CheckMark({ checked }) {
  return (
    <span
      aria-hidden
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#0e7d6b]/40 peer-focus-visible:ring-offset-1 ${
        checked ? 'border-[#0e7d6b] bg-[#0e7d6b] text-white' : 'border-gray-300 bg-white'
      }`}
    >
      {checked && <Check size={11} strokeWidth={3.5} />}
    </span>
  );
}

const BY_NAME = new Map(DIAGNOSTIC_TEST_CATALOG.map((t) => [t.name, t]));

// The thyroid panel is pulled out of the main grid and rendered as its own
// 3-column row, so TT3/TT4/TSH never wrap apart at any breakpoint. The tests
// on either side of it keep their original list positions.
const PANEL_START = DIAGNOSTIC_TESTS.indexOf(THYROID_PANEL[0]);
const TESTS_BEFORE_PANEL = DIAGNOSTIC_TESTS.slice(0, PANEL_START);
const TESTS_AFTER_PANEL = DIAGNOSTIC_TESTS.slice(PANEL_START + THYROID_PANEL.length);

function splitValue(value) {
  const parts = value.split(',').map((t) => t.trim()).filter(Boolean);
  const catalog = new Map();
  const custom = [];

  for (const part of parts) {
    const entry = parseEntry(part);
    if (BY_NAME.has(entry.name)) catalog.set(entry.name, entry.price);
    // Anything not in the catalog was typed by a physician, so a reloaded
    // draft recovers its custom rows from the stored string itself rather
    // than needing a second field on the form.
    else custom.push({ name: entry.name, price: entry.price });
  }
  return { catalog, custom };
}

// The field is stored as one comma-joined string ("CBC, FBS"), matching how
// it's already persisted server-side, so no DTO/model shape change is needed
// for what is otherwise a fixed multi-select.
function DiagnosticTestGrid({ watch, setValue }) {
  const value = watch('recommendedDiagnosticTest') || '';
  const { catalog: selected, custom } = splitValue(value);

  const BLANK_ROW = { name: '', price: '' };

  // Rows are held here rather than in the joined field so a half-typed or
  // blank row can exist on screen without landing in the stored string.
  const [otherRows, setOtherRows] = useState(() =>
    custom.length
      ? custom.map((c) => ({ name: c.name, price: c.price == null ? '' : String(c.price) }))
      : [{ ...BLANK_ROW }],
  );
  const [otherChecked, setOtherChecked] = useState(custom.length > 0);

  // Quoted amounts for the tests with no fixed rate, keyed by test name. Held
  // as typed text so a half-entered number doesn't round-trip through Number().
  const [quotes, setQuotes] = useState(() => {
    const initial = {};
    for (const [name, price] of selected) {
      if (catalogPrice(name) == null && price != null) initial[name] = String(price);
    }
    return initial;
  });

  const priceOf = (name) => {
    const listed = catalogPrice(name);
    if (listed != null) return listed;
    const quoted = Number(quotes[name]);
    return Number.isFinite(quoted) && quotes[name] !== '' ? quoted : null;
  };

  // List order for the catalog, then the typed entries, so the stored string
  // is deterministic regardless of click or typing order. A price is written
  // only when it isn't already the catalog's, keeping bare names bare.
  const commit = (nextCatalog, nextRows, nextQuotes = quotes) => {
    const format = (name, price) => (price == null || price === '' ? name : `${name} (${price})`);

    const joined = [
      ...DIAGNOSTIC_TESTS.filter((t) => nextCatalog.has(t)).map((name) =>
        catalogPrice(name) != null ? name : format(name, nextQuotes[name]),
      ),
      ...nextRows
        .filter((row) => row.name.trim())
        .map((row) => format(row.name.trim(), row.price.trim())),
    ].join(', ');
    setValue('recommendedDiagnosticTest', joined, { shouldDirty: true });
  };

  const toggle = (test) => {
    const next = new Map(selected);
    if (next.has(test)) next.delete(test);
    else next.set(test, catalogPrice(test));
    commit(next, otherRows);
  };

  const editQuote = (test, text) => {
    const next = { ...quotes, [test]: text };
    setQuotes(next);
    commit(selected, otherRows, next);
  };

  const toggleOther = () => {
    const next = !otherChecked;
    setOtherChecked(next);
    // Unchecking drops the typed rows from the stored value and resets the
    // inputs, same as Family Medical History's Others tile.
    if (!next) {
      setOtherRows([{ ...BLANK_ROW }]);
      commit(selected, []);
    }
  };

  const editRow = (index, field, text) => {
    const next = otherRows.map((row, i) => (i === index ? { ...row, [field]: text } : row));
    setOtherRows(next);
    commit(selected, next);
  };

  const addRow = () => setOtherRows((rows) => [...rows, { ...BLANK_ROW }]);

  // Keep at least one row on screen: removing the last one resets it instead
  // of leaving nothing to type into.
  const removeRow = (index) => {
    const next = otherRows.length === 1
      ? [{ ...BLANK_ROW }]
      : otherRows.filter((_, i) => i !== index);
    setOtherRows(next);
    commit(selected, next);
  };

  const total = [...selected.keys()].reduce((sum, name) => sum + (priceOf(name) ?? 0), 0)
    + otherRows.reduce((sum, row) => {
      if (!row.name.trim()) return sum;
      const price = Number(row.price);
      return sum + (Number.isFinite(price) ? price : 0);
    }, 0);

  const tile = (test) => {
    const checked = selected.has(test);
    const listed = catalogPrice(test);
    return (
      <div
        key={test}
        className={`relative flex flex-col overflow-hidden rounded-lg border transition-colors ${
          checked ? TILE_ON : TILE_OFF
        }`}
      >
        <label className="relative flex cursor-pointer items-center gap-2 p-2.5">
          <input
            type="checkbox"
            className={HIDDEN_CHECKBOX}
            checked={checked}
            onChange={() => toggle(test)}
            aria-label={test}
          />
          <CheckMark checked={checked} />
          <span className={`flex-1 text-sm leading-snug ${checked ? 'font-semibold text-ink-900' : 'text-ink-700'}`}>
            {test}
          </span>
          <span className={`shrink-0 text-xs tabular-nums ${checked ? 'font-semibold text-ink-900' : 'text-ink-500'}`}>
            {listed == null ? '—' : peso(listed)}
          </span>
        </label>
        {/* Only the tests with no fixed rate take an amount, and only once
            ticked -- an empty box on every tile would read as a required field. */}
        {checked && listed == null && (
          <div className="border-t border-[#0e7d6b]/15 px-2.5 pt-2 pb-2.5">
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              aria-label={`Price for ${test}`}
              placeholder="Price (optional)"
              className="w-full"
              value={quotes[test] ?? ''}
              onChange={(e) => editQuote(test, e.target.value)}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {/* One grid for every test, so all tiles share the same column widths.
          The thyroid panel sits inside it as a single spanning cell that
          subdivides into its own 3 columns -- keeping TT3/TT4/TSH on one row
          at every breakpoint without making them wider than the tiles above.
          It starts a fresh row (col-start-1) so the group is never split by
          whatever the preceding tests leave over. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {TESTS_BEFORE_PANEL.map(tile)}

        <div className="col-span-2 col-start-1 grid grid-cols-3 gap-2 sm:col-span-3 lg:col-span-3">
          {THYROID_PANEL.map(tile)}
        </div>

        {TESTS_AFTER_PANEL.map(tile)}
      </div>

      {/* Others spans the full width: its rows need more room than a tile. */}
      <div
        className={`group relative flex flex-col overflow-hidden rounded-lg border transition-colors ${
          otherChecked ? TILE_ON : TILE_OFF
        }`}
      >
        <label className="relative flex flex-1 cursor-pointer items-center gap-2 p-2.5">
          <input
            type="checkbox"
            className={HIDDEN_CHECKBOX}
            checked={otherChecked}
            onChange={toggleOther}
            aria-label="Others (Please Specify)"
          />
          <CheckMark checked={otherChecked} />
          <span className={`text-sm leading-snug ${otherChecked ? 'font-semibold text-ink-900' : 'text-ink-700'}`}>
            Others (Please Specify)
          </span>
        </label>

        {otherChecked && (
          <div className="border-t border-[#0e7d6b]/15 px-3 pt-3 pb-3">
            <div className="mb-1.5 hidden grid-cols-[1fr_10rem_auto] gap-2 md:grid">
              <span className="text-xs font-medium tracking-wide text-ink-600">Please specify</span>
              <span className="text-xs font-medium tracking-wide text-ink-600">Price</span>
              <span className="w-9" aria-hidden />
            </div>
            <div className="space-y-2">
              {otherRows.map((row, index) => (
                // Index keys are safe here: rows are a plain ordered list with
                // no state of their own beyond the input values.
                <div key={index} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_10rem_auto]">
                  <Input
                    aria-label={`Other diagnostic test, row ${index + 1}`}
                    placeholder="e.g. 2D Echo, Bone density scan"
                    className="w-full"
                    value={row.name}
                    onChange={(e) => editRow(index, 'name', e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    aria-label={`Price, row ${index + 1}`}
                    placeholder="Price"
                    className="w-full"
                    value={row.price}
                    onChange={(e) => editRow(index, 'price', e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={`Remove row ${index + 1}`}
                    onClick={() => removeRow(index)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center justify-self-end rounded-lg text-ink-300 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addRow}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-xs font-medium text-ink-500 transition-colors hover:border-[#0e7d6b]/40 hover:bg-[#f9fefd] hover:text-[#0e7d6b]"
            >
              <Plus size={14} />
              Add another test
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-[#0e7d6b]/30 bg-[#f3fdfb] px-3 py-2.5">
        <span className="text-sm font-semibold text-ink-900">Total</span>
        <span className="text-base font-extrabold tabular-nums text-[#0e7d6b]">{peso(total)}</span>
      </div>
    </div>
  );
}

const BLANK_MEDICATION_ROW = { drug: '', dosage: '', frequency: '', price: '' };

const MEDICATION_COLUMNS = [
  { name: 'drug', label: 'Medication (Generic)', placeholder: 'e.g. Losartan', width: 'w-[32%]' },
  { name: 'dosage', label: 'Dosage', placeholder: 'e.g. 50 mg', width: 'w-[22%]' },
  { name: 'frequency', label: 'Frequency', placeholder: 'e.g. Once daily', width: 'w-[26%]' },
  { name: 'price', label: 'Price', placeholder: 'e.g. 250', width: 'w-[20%]', type: 'number' },
];

// Same table shape as Past Medical History, so prescribing reads the way
// recording an existing maintenance drug already does.
function MedicationTable({ control, register, watch }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'medications' });

  // Watched rather than read off `fields`, whose values are only the defaults
  // captured when the array was built, so the total tracks what is typed.
  const rows = watch('medications') ?? [];
  const total = rows.reduce((sum, row) => {
    if (!row?.drug?.trim()) return sum;
    const price = Number(row.price);
    return sum + (Number.isFinite(price) ? price : 0);
  }, 0);

  // Keep at least one row on screen: emptying the last row resets it instead
  // of leaving the section with nothing to type into.
  const handleRemove = (index) => {
    if (fields.length === 1) {
      remove(0);
      append({ ...BLANK_MEDICATION_ROW });
      return;
    }
    remove(index);
  };

  return (
    <>
      {/* One input per field only: rendering a second mobile copy would register
          two DOM nodes against the same react-hook-form path and desync them. */}
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-150 table-fixed text-sm">
          <thead className="bg-gray-50/80">
            <tr className="border-b border-line text-left">
              <th className="w-10 px-3 py-2.5 text-[11px] font-semibold tracking-wide text-ink-500 uppercase">
                #
              </th>
              {MEDICATION_COLUMNS.map((column) => (
                <th
                  key={column.name}
                  className={`${column.width} px-2 py-2.5 text-[11px] font-semibold tracking-wide text-ink-500 uppercase`}
                >
                  {column.label}
                </th>
              ))}
              <th className="w-12 px-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr
                key={field.id}
                className="group border-b border-line last:border-b-0 transition-colors hover:bg-[#f9fefd]"
              >
                <td className="px-3 py-2 align-middle text-xs font-medium tabular-nums text-ink-400">
                  {index + 1}
                </td>
                {MEDICATION_COLUMNS.map((column) => (
                  <td key={column.name} className="px-2 py-2 align-middle">
                    <label className="sr-only" htmlFor={`med-${index}-${column.name}`}>
                      {`${column.label}, row ${index + 1}`}
                    </label>
                    <Input
                      id={`med-${index}-${column.name}`}
                      placeholder={column.placeholder}
                      className="w-full"
                      {...(column.type === 'number'
                        ? { type: 'number', min: '0', step: '0.01', inputMode: 'decimal' }
                        : {})}
                      {...register(`medications.${index}.${column.name}`)}
                    />
                  </td>
                ))}
                <td className="px-2 py-2 align-middle">
                  <button
                    type="button"
                    aria-label={`Remove row ${index + 1}`}
                    onClick={() => handleRemove(index)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-300 transition group-hover:text-ink-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() => append({ ...BLANK_MEDICATION_ROW })}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2.5 text-xs font-medium text-ink-500 transition-colors hover:border-[#0e7d6b]/40 hover:bg-[#f9fefd] hover:text-[#0e7d6b]"
      >
        <Plus size={14} />
        Add another medication
      </button>

      <div className="mt-2 flex items-center justify-between rounded-lg border border-[#0e7d6b]/30 bg-[#f3fdfb] px-3 py-2.5">
        <span className="text-sm font-semibold text-ink-900">Medication Total</span>
        <span className="text-base font-extrabold tabular-nums text-[#0e7d6b]">{peso(total)}</span>
      </div>
    </>
  );
}

export default function AssessmentPlanSection({ register, watch, setValue, control }) {
  return (
    <SectionCard
      step={4}
      title="Assessment and Plan"
      subtitle="Record the impression and the plan of care for this consultation."
      icon={ClipboardList}
    >
      <div className="flex flex-col gap-4">
        <SubPanel icon={FlaskConical} title="Recommended Diagnostic Test" subtitle="Labs, imaging, or referrals to order.">
          <DiagnosticTestGrid watch={watch} setValue={setValue} />
        </SubPanel>

        <SubPanel
          icon={Stethoscope}
          title="Impression / Clinical"
          subtitle="Working diagnosis based on the findings above."
        >
          {/* The rail heading already names this field visually, so the
              textarea takes its accessible name from aria-label instead of
              repeating the heading as a second visible label. */}
          <Textarea
            id="impressionClinical"
            rows={4}
            aria-label="Impression / Clinical"
            placeholder="e.g. Stage 1 hypertension, overweight"
            className="w-full"
            {...register('impressionClinical')}
          />
        </SubPanel>

        {/* Management / Treatment is one panel holding two parts: what to
            prescribe (a row per drug) and everything else the physician wants
            to say in prose. They are composed into the single stored
            ManagementTreatment text on submit. */}
        <SubPanel
          icon={Pill}
          title="Management / Treatment"
          subtitle="Medication, lifestyle advice, and follow-up."
        >
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-[11px] font-semibold tracking-wide text-ink-500 uppercase">
                Medication
              </p>
              <MedicationTable control={control} register={register} watch={watch} />
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold tracking-wide text-ink-500 uppercase">
                Lifestyle advice and follow-up
              </p>
              <Textarea
                id="lifestyleFollowUp"
                rows={4}
                aria-label="Lifestyle advice and follow-up"
                placeholder="e.g. Start lifestyle modification, recheck BP in 4 weeks"
                className="w-full"
                {...register('lifestyleFollowUp')}
              />
            </div>
          </div>
        </SubPanel>
      </div>
    </SectionCard>
  );
}
