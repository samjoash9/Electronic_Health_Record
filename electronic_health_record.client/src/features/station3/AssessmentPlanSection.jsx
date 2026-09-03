import Card from '../../components/ui/Card';
import Field from '../../components/ui/Field';
import Textarea from '../../components/ui/Textarea';

export default function AssessmentPlanSection({ register }) {
  return (
    <Card title="4. Assessment and Plan">
      <div className="flex flex-col gap-3">
        <Field label="Recommended Diagnostic Test" htmlFor="recommendedDiagnosticTest">
          <Textarea id="recommendedDiagnosticTest" rows={4} {...register('recommendedDiagnosticTest')} />
        </Field>
        <Field label="Impression / Clinical" htmlFor="impressionClinical">
          <Textarea id="impressionClinical" rows={4} {...register('impressionClinical')} />
        </Field>
        <Field label="Management / Treatment" htmlFor="managementTreatment">
          <Textarea id="managementTreatment" rows={4} {...register('managementTreatment')} />
        </Field>
      </div>
    </Card>
  );
}
