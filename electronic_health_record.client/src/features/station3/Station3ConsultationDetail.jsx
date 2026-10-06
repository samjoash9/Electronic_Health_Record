import { useId } from 'react';
import { visitYear } from '../../lib/consultationRecord';
import { FamilyHistoryList, PastHistoryList } from './ConsultationHistories';
import SocialHistoryTable from './SocialHistoryTable';
import PhysicianAssessmentDetail from './PhysicianAssessmentDetail';

/**
 * Station 3 as the form record shows it once opened: family and past history
 * side by side, social history as one table, then the physician's assessment
 * and sign-off. The parts are ruled off edge to edge rather than boxed, so
 * the station card is the only box around them -- give it `flush`.
 */
export default function Station3ConsultationDetail({ form }) {
  const uid = useId();
  const asOf = visitYear(form);
  const pastHistory = form.pastMedicalHistory ?? [];

  return (
    <div className="divide-y divide-line">
      <div className="grid @3xl:grid-cols-2">
        <FamilyHistoryList
          id={`${uid}-family`}
          rows={form.familyMedicalHistory ?? []}
          pastHistory={pastHistory}
          className="border-b border-line @3xl:border-r @3xl:border-b-0"
        />
        <PastHistoryList id={`${uid}-past`} rows={pastHistory} asOf={asOf} />
      </div>

      <SocialHistoryTable id={`${uid}-social`} social={form.socialHistory} exercise={form.exercise} asOf={asOf} />

      <PhysicianAssessmentDetail id={`${uid}-assessment`} form={form} />
    </div>
  );
}
