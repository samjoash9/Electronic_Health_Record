import { ClipboardList, FlaskConical, Stethoscope, Pill } from 'lucide-react';
import Textarea from '../../components/ui/Textarea';
import SectionCard, { SubPanel } from './SectionCard';

// An icon rail per entry matches the Social History panels, so the physician's
// three free-text answers read as distinct steps rather than one wall of boxes.
const ENTRIES = [
  {
    name: 'recommendedDiagnosticTest',
    label: 'Recommended Diagnostic Test',
    hint: 'Labs, imaging, or referrals to order.',
    icon: FlaskConical,
    placeholder: 'e.g. Fasting blood sugar, lipid profile, chest X-ray',
  },
  {
    name: 'impressionClinical',
    label: 'Impression / Clinical',
    hint: 'Working diagnosis based on the findings above.',
    icon: Stethoscope,
    placeholder: 'e.g. Stage 1 hypertension, overweight',
  },
  {
    name: 'managementTreatment',
    label: 'Management / Treatment',
    hint: 'Medication, lifestyle advice, and follow-up.',
    icon: Pill,
    placeholder: 'e.g. Start lifestyle modification, recheck BP in 4 weeks',
  },
];

export default function AssessmentPlanSection({ register }) {
  return (
    <SectionCard
      step={4}
      title="Assessment and Plan"
      subtitle="Record the impression and the plan of care for this consultation."
      icon={ClipboardList}
    >
      <div className="flex flex-col gap-4">
        {ENTRIES.map(({ name, label, hint, icon, placeholder }) => (
          <SubPanel key={name} icon={icon} title={label} subtitle={hint}>
            {/* The rail heading already names this field visually, so the
                textarea takes its accessible name from aria-label instead of
                repeating the heading as a second visible label. */}
            <Textarea
              id={name}
              rows={4}
              aria-label={label}
              placeholder={placeholder}
              className="w-full"
              {...register(name)}
            />
          </SubPanel>
        ))}
      </div>
    </SectionCard>
  );
}
