import { useEffect } from 'react';
import { Check, Ban, Users } from 'lucide-react';
import { FAMILY_CONDITIONS } from '../../lib/constants';
import Input from '../../components/ui/Input';
import Field from '../../components/ui/Field';
import SectionCard from './SectionCard';

const TILE_BASE =
  'group relative flex flex-col overflow-hidden rounded-lg border transition-colors';
// Padding lives on the <label> so the whole tile surface is a hit target.
const TILE_LABEL = 'relative flex flex-1 cursor-pointer items-start gap-2.5 p-3';
// Sized to its label instead of Tailwind's sr-only: a 1px box with a negative
// margin makes the browser's focus-scroll jump the whole shell, which left a
// blank gap below the form when checking a box revealed another field.
const HIDDEN_CHECKBOX =
  'peer absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 disabled:cursor-default';
const TILE_ON = 'border-[#0e7d6b]/40 bg-[#f3fdfb]';
const TILE_OFF = 'border-line bg-canvas hover:border-[#0e7d6b]/30 hover:bg-[#f9fefd]';

/** Square teal checkbox that stays in sync with the native input it wraps. */
function CheckMark({ checked }) {
  return (
    <span
      aria-hidden
      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#0e7d6b]/40 peer-focus-visible:ring-offset-1 ${
        checked ? 'border-[#0e7d6b] bg-[#0e7d6b] text-white' : 'border-gray-300 bg-white'
      }`}
    >
      {checked && <Check size={11} strokeWidth={3.5} />}
    </span>
  );
}

export default function FamilyHistorySection({ register, watch, setValue }) {
  const none = watch('familyHistory.none');

  // "None" is exclusive: selecting it clears every other selection.
  useEffect(() => {
    if (!none) return;
    for (const condition of FAMILY_CONDITIONS) {
      if (condition.exclusive || condition.isOther) continue;
      setValue(`familyHistory.conditions.${condition.conditionID}.checked`, false);
      setValue(`familyHistory.conditions.${condition.conditionID}.familyMembers`, '');
    }
    setValue('familyHistory.other.checked', false);
    setValue('familyHistory.other.conditionOther', '');
    setValue('familyHistory.other.familyMembers', '');
  }, [none, setValue]);

  const noneOption = FAMILY_CONDITIONS.find((c) => c.exclusive);
  const otherOption = FAMILY_CONDITIONS.find((c) => c.isOther);
  const conditions = FAMILY_CONDITIONS.filter((c) => !c.exclusive && !c.isOther);
  const otherChecked = watch('familyHistory.other.checked');

  return (
    <SectionCard
      step={1}
      title="Family Medical History"
      subtitle="Check if applicable and identify the family members affected."
      icon={Users}
    >
      {/* Exclusive option gets its own row so it reads as a shortcut, not a condition. */}
      <label
        className={`relative flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
          none ? TILE_ON : TILE_OFF
        }`}
      >
        {/* The helper text below is decorative, so the checkbox names itself
            explicitly rather than absorbing that sentence into its label. */}
        <input
          type="checkbox"
          className={HIDDEN_CHECKBOX}
          aria-label={noneOption.name}
          {...register('familyHistory.none')}
        />
        <CheckMark checked={none} />
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#e9fbf6] text-[#0e7d6b]"
        >
          <Ban size={14} />
        </span>
        <span className="min-w-0" aria-hidden>
          <span className="block text-sm font-semibold text-ink-900">{noneOption.name}</span>
          <span className="block text-[11px] text-ink-500">
            No known family history — clears all conditions below.
          </span>
        </span>
      </label>

      <div
        className={`mt-4 transition-opacity ${none ? 'pointer-events-none opacity-45' : ''}`}
        aria-disabled={none || undefined}
      >
        <p className="mb-2 text-[11px] font-semibold tracking-wide text-ink-500 uppercase">
          Known conditions
        </p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {conditions.map((condition) => {
            const key = `familyHistory.conditions.${condition.conditionID}`;
            const checked = watch(`${key}.checked`);
            const inputId = `fmh-${condition.conditionID}`;
            return (
              <div
                key={condition.conditionID}
                className={`${TILE_BASE} ${checked ? TILE_ON : TILE_OFF}`}
              >
                <label className={TILE_LABEL}>
                  <input
                    type="checkbox"
                    className={HIDDEN_CHECKBOX}
                    disabled={none}
                    {...register(`${key}.checked`)}
                  />
                  <CheckMark checked={checked} />
                  <span
                    className={`text-sm leading-snug ${checked ? 'font-semibold text-ink-900' : 'text-ink-700'}`}
                  >
                    {condition.name}
                  </span>
                </label>
                {checked && !none && (
                  <div className="border-t border-[#0e7d6b]/15 px-3 pt-3 pb-3">
                    <Field label="Family members affected" htmlFor={inputId}>
                      <Input
                        id={inputId}
                        placeholder="e.g. Mother, Grandfather"
                        {...register(`${key}.familyMembers`)}
                      />
                    </Field>
                  </div>
                )}
              </div>
            );
          })}

          {/* "Others" needs two inputs, so it spans the grid instead of squeezing them. */}
          <div
            className={`${TILE_BASE} sm:col-span-2 xl:col-span-3 ${otherChecked ? TILE_ON : TILE_OFF}`}
          >
            <label className={TILE_LABEL}>
              <input
                type="checkbox"
                className={HIDDEN_CHECKBOX}
                disabled={none}
                {...register('familyHistory.other.checked')}
              />
              <CheckMark checked={otherChecked} />
              <span
                className={`text-sm leading-snug ${otherChecked ? 'font-semibold text-ink-900' : 'text-ink-700'}`}
              >
                {otherOption.name}
              </span>
            </label>
            {otherChecked && !none && (
              <div className="grid grid-cols-1 gap-3 border-t border-[#0e7d6b]/15 px-3 pt-3 pb-3 md:grid-cols-2">
                <Field label="Condition" htmlFor="other-condition">
                  <Input
                    id="other-condition"
                    placeholder="Specify the condition"
                    {...register('familyHistory.other.conditionOther')}
                  />
                </Field>
                <Field label="Family members affected" htmlFor="other-members">
                  <Input
                    id="other-members"
                    placeholder="e.g. Mother, Grandfather"
                    {...register('familyHistory.other.familyMembers')}
                  />
                </Field>
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
