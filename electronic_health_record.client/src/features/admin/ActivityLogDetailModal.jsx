import { useNavigate } from 'react-router-dom';
import { User, Activity, UserRound, Clock, Hash, FileText } from 'lucide-react';
import { fullName, formatDateTime } from '../../lib/formatters';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const ACTOR_TONE = {
  Admin: 'info',
  Physician: 'success',
  Patient: 'default',
};

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-line bg-canvas p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#e9fbf6] text-[#0e7d6b]">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium wrap-break-word text-ink-900">{children}</dd>
      </div>
    </div>
  );
}

/**
 * Read-only detail for one audit entry. An audit log is a record of what
 * happened, so nothing here is editable — the only action offered is opening
 * the form the entry refers to.
 */
export default function ActivityLogDetailModal({ log, actionLabel, onClose }) {
  const navigate = useNavigate();

  return (
    <Modal
      open={Boolean(log)}
      title="Activity Details"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" size="lg" className="mr-auto" onClick={onClose}>
            Close
          </Button>
          {log?.formID && (
            <Button
              type="button"
              variant="teal"
              size="lg"
              onClick={() => navigate(`/forms/${log.formID}`)}
            >
              <FileText size={16} strokeWidth={2.25} />
              View Form
            </Button>
          )}
        </>
      }
    >
      {log && (
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Row icon={Activity} label="Action">
            {actionLabel?.[log.action] ?? log.action}
          </Row>
          <Row icon={Clock} label="Date / Time">
            {formatDateTime(log.occurredAt)}
          </Row>
          <Row icon={User} label="Actor">
            <span className="inline-flex flex-wrap items-center gap-2">
              {log.actorName}
              <Badge tone={ACTOR_TONE[log.actorType] ?? 'default'}>{log.actorType}</Badge>
            </span>
          </Row>
          <Row icon={Hash} label="Log Reference">
            #{log.logID} · Form #{log.formID}
          </Row>
          <Row icon={UserRound} label="Patient">
            {log.patient ? (
              <>
                {fullName(log.patient)}
                <span className="mt-0.5 block text-xs font-normal text-ink-500">
                  {log.patient.externalEmployeeId}
                  {log.patient.position ? ` · ${log.patient.position}` : ''}
                </span>
              </>
            ) : (
              <span className="font-normal text-ink-500">No patient linked to this entry</span>
            )}
          </Row>
          <Row icon={FileText} label="Agency / Office">
            {log.patient?.agencyOffice || <span className="font-normal text-ink-500">—</span>}
          </Row>

          {/* `details` is reserved for extra context on an action and is unset
              for the station submissions, so the row only appears when filled. */}
          {log.details && (
            <div className="sm:col-span-2">
              <Row icon={Activity} label="Details">
                {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
              </Row>
            </div>
          )}
        </dl>
      )}
    </Modal>
  );
}
