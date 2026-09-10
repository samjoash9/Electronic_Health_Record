import { Eye } from 'lucide-react';
import Field from '../../components/ui/Field';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import SectionCard, { SubPanel } from '../station3/SectionCard';
import { VISION_INDICATORS } from '../../lib/constants';
import ChoiceField from '../station4/ChoiceField';
import ChoiceWithOtherField from './ChoiceWithOtherField';

export default function VisionAssessmentSection({ control, register }) {
  return (
    <SectionCard
      step={1}
      title="Vision Assessment"
      subtitle="Record each indicator and any remarks the examiner should see."
      icon={Eye}
    >
      <div className="flex flex-col gap-4">
        {VISION_INDICATORS.map((indicator, index) => {
          const { name, label, type, remarksPlaceholder } = indicator;
          return (
            // SubPanel renders its icon unconditionally (no fallback for a
            // missing one), and VISION_INDICATORS carries no per-item icon --
            // same reasoning as DentalAssessmentSection: all thirteen vision
            // indicators are the same kind of thing, so one shared glyph
            // (matching the section header) is enough to identify the group.
            <SubPanel key={name} icon={Eye} title={`${index + 1}. ${label}`}>
              <div className="flex flex-col gap-3">
                {type === 'text' ? (
                  <Field label={label}>
                    <Input
                      aria-label={label}
                      placeholder={indicator.placeholder}
                      className="w-full"
                      {...register(`visionAssessment.${name}`)}
                    />
                  </Field>
                ) : indicator.hasOther ? (
                  <ChoiceWithOtherField
                    control={control}
                    register={register}
                    name={`visionAssessment.${name}`}
                    otherName={`visionAssessment.${indicator.otherFieldName}`}
                    label={label}
                    options={indicator.options}
                    otherPlaceholder={indicator.otherPlaceholder}
                  />
                ) : (
                  <ChoiceField
                    control={control}
                    name={`visionAssessment.${name}`}
                    label={label}
                    options={indicator.options}
                  />
                )}
                {/* The panel heading already names the indicator, so the remarks
                    box disambiguates itself by appending the label rather than
                    rendering thirteen identical "Remarks for the examiner" labels. */}
                <Textarea
                  id={`${name}Remarks`}
                  rows={2}
                  aria-label={`Remarks for the examiner — ${label}`}
                  placeholder={remarksPlaceholder}
                  className="w-full"
                  {...register(`visionAssessment.${name}Remarks`)}
                />
              </div>
            </SubPanel>
          );
        })}
      </div>
    </SectionCard>
  );
}
