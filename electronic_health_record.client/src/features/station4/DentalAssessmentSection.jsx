import { Smile } from 'lucide-react';
import Textarea from '../../components/ui/Textarea';
import SectionCard, { SubPanel } from '../station3/SectionCard';
import { DENTAL_INDICATORS } from '../../lib/constants';
import ChoiceField from './ChoiceField';

export default function DentalAssessmentSection({ control, register }) {
  return (
    <SectionCard
      step={1}
      title="Dental Assessment"
      subtitle="Record each indicator and any remarks the doctor should see."
      icon={Smile}
    >
      <div className="flex flex-col gap-4">
        {DENTAL_INDICATORS.map(({ name, label, options, remarksPlaceholder }, index) => (
          // SubPanel renders its icon unconditionally (no fallback for a
          // missing one), and DENTAL_INDICATORS carries no per-item icon --
          // unlike SocialHistorySection's habit-specific icons, all ten
          // dental indicators are the same kind of thing, so one shared glyph
          // (matching the section header) is enough to identify the group.
          <SubPanel key={name} icon={Smile} title={`${index + 1}. ${label}`}>
            <div className="flex flex-col gap-3">
              <ChoiceField
                control={control}
                name={`dentalAssessment.${name}`}
                label={label}
                options={options}
              />
              {/* The panel heading already names the indicator, so the remarks
                  box disambiguates itself by appending the label rather than
                  rendering ten identical "Remarks for the doctor" labels. */}
              <Textarea
                id={`${name}Remarks`}
                rows={2}
                aria-label={`Remarks for the doctor — ${label}`}
                placeholder={remarksPlaceholder}
                className="w-full"
                {...register(`dentalAssessment.${name}Remarks`)}
              />
            </div>
          </SubPanel>
        ))}
      </div>
    </SectionCard>
  );
}
