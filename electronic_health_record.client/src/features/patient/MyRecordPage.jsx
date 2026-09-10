import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText } from 'lucide-react';
import { getPatientForms } from '../../api/forms.api';
import { useAuth } from '../../auth/useAuth';
import { FORM_STATUS, STATUS_LABEL, STATUS_TONE } from '../../lib/constants';
import { formatDate } from '../../lib/formatters';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import StatusTimeline from './StatusTimeline';
import { STEPS, currentStepIndex } from './visitSteps';

function Page({ children }) {
  return <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-8">{children}</div>;
}

/**
 * The band answers the only question the patient came here with — is it ready,
 * and if not, what is it waiting on — so the answer is the headline rather
 * than a status code they'd have to translate.
 */
function StatusBand({ form }) {
  const visit = `Wellness examination on ${formatDate(form.formDate)}`;

  if (form.status === FORM_STATUS.CANCELLED) {
    return (
      <div className="rounded-2xl border border-line bg-surface px-6 py-7 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">This visit was cancelled</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          {visit}. Ask the health office if you think this is a mistake.
        </p>
      </div>
    );
  }

  if (form.status === FORM_STATUS.COMPLETED) {
    return (
      <div className="rounded-2xl bg-linear-to-br from-[#14a690] to-[#0e7d6b] px-6 py-7 text-white shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Your record is ready</h1>
        <p className="mt-1.5 text-sm text-white/75">{visit}</p>
        <Link
          to={`/my-record/${form.formID}`}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-[#0e7d6b] shadow-sm transition hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          View my record
        </Link>
      </div>
    );
  }

  const waiting = STEPS[currentStepIndex(form)]?.waiting;
  return (
    <div className="rounded-2xl bg-linear-to-br from-[#14a690] to-[#0e7d6b] px-6 py-7 text-white shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight">Your record is being prepared</h1>
      {waiting && <p className="mt-1.5 text-sm text-white/85">{waiting}.</p>}
      <p className="mt-3 text-sm text-white/65">{visit}</p>
    </div>
  );
}

function EarlierVisit({ form }) {
  const viewable = form.status === FORM_STATUS.COMPLETED;
  const body = (
    <>
      <span className="text-sm font-medium text-ink-900">{formatDate(form.formDate)}</span>
      <span className="flex items-center gap-2">
        <Badge tone={STATUS_TONE[form.status]} dot>{STATUS_LABEL[form.status]}</Badge>
        {viewable && <ChevronRight size={16} className="text-ink-400" />}
      </span>
    </>
  );

  return (
    <li className="border-t border-line first:border-t-0">
      {viewable ? (
        <Link
          to={`/my-record/${form.formID}`}
          className="-mx-2 flex items-center justify-between rounded-lg px-2 py-3 transition hover:bg-[#f3fdfb]"
        >
          {body}
        </Link>
      ) : (
        <div className="flex items-center justify-between py-3">{body}</div>
      )}
    </li>
  );
}

export default function MyRecordPage() {
  const { user } = useAuth();
  const { data: forms, isLoading, error, refetch } = useQuery({
    queryKey: ['my-forms', user.patientID],
    queryFn: () => getPatientForms(user.patientID),
  });

  if (isLoading) return <Page><Skeleton /></Page>;
  if (error) return <Page><ErrorState error={error} onRetry={refetch} /></Page>;

  if (!forms?.length) {
    return (
      <Page>
        <div className="flex flex-col items-center rounded-2xl border border-line bg-surface px-6 py-14 text-center shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9fbf6] text-[#0e7d6b]">
            <FileText size={22} strokeWidth={2} />
          </span>
          <p className="mt-4 text-base font-semibold text-ink-900">No record yet</p>
          <p className="mt-1 max-w-sm text-sm text-ink-500">
            Your record appears here after your first wellness examination at the health office.
          </p>
        </div>
      </Page>
    );
  }

  const [latest, ...older] = forms;

  return (
    <Page>
      <StatusBand form={latest} />

      <Card title="Your visit, step by step" flush>
        <StatusTimeline form={latest} />
      </Card>

      {older.length > 0 && (
        <Card title="Earlier visits" flush>
          <ul className="-mt-1 flex flex-col">
            {older.map((f) => <EarlierVisit key={f.formID} form={f} />)}
          </ul>
        </Card>
      )}
    </Page>
  );
}
