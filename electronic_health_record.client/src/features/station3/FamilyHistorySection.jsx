import { useEffect } from 'react';
import { FAMILY_CONDITIONS } from '../../lib/constants';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Field from '../../components/ui/Field';

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

  return (
    <Card title="1. Family Medical History">
      <p className="mb-3 text-xs text-ink-500">
        Check if applicable and identify the family members affected.
      </p>
      <div className="flex flex-col gap-3">
        {FAMILY_CONDITIONS.map((condition) => {
          if (condition.exclusive) {
            return (
              <label key="none" className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('familyHistory.none')} />
                <span className="font-medium">{condition.name}</span>
              </label>
            );
          }

          if (condition.isOther) {
            const checked = watch('familyHistory.other.checked');
            return (
              <div key="other" className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    disabled={none}
                    {...register('familyHistory.other.checked')}
                  />
                  <span>{condition.name}</span>
                </label>
                {checked && !none && (
                  <div className="ml-6 grid grid-cols-1 gap-2 md:grid-cols-2">
                    <Field label="Please specify" htmlFor="other-condition">
                      <Input
                        id="other-condition"
                        {...register('familyHistory.other.conditionOther')}
                      />
                    </Field>
                    <Field label="Family members with this condition" htmlFor="other-members">
                      <Input
                        id="other-members"
                        {...register('familyHistory.other.familyMembers')}
                      />
                    </Field>
                  </div>
                )}
              </div>
            );
          }

          const key = `familyHistory.conditions.${condition.conditionID}`;
          const checked = watch(`${key}.checked`);
          const inputId = `fmh-${condition.conditionID}`;
          return (
            <div key={condition.conditionID} className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" disabled={none} {...register(`${key}.checked`)} />
                <span>{condition.name}</span>
              </label>
              {checked && !none && (
                <div className="ml-6">
                  <Field
                    label={`Family members with ${condition.name}`}
                    htmlFor={inputId}
                  >
                    <Input id={inputId} {...register(`${key}.familyMembers`)} />
                  </Field>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
