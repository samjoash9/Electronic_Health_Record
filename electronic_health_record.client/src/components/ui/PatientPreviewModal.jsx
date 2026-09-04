import { IdCard, Briefcase, Building2, Cake, VenusAndMars, HeartHandshake, MapPin, Phone } from 'lucide-react';
import { fullName, formatDate } from '../../lib/formatters';
import Modal from './Modal';
import Button from './Button';

const PREVIEW_FIELDS = [
  { key: 'externalEmployeeId', label: 'Employee ID', icon: IdCard },
  { key: 'position', label: 'Position', icon: Briefcase },
  { key: 'agencyOffice', label: 'Agency/Office', icon: Building2 },
  { key: 'birthdate', label: 'Birthdate', icon: Cake, render: (p) => formatDate(p.birthdate) },
  { key: 'sex', label: 'Sex', icon: VenusAndMars },
  { key: 'civilStatus', label: 'Civil Status', icon: HeartHandshake },
  { key: 'address', label: 'Address', icon: MapPin },
  { key: 'contactNo', label: 'Contact No.', icon: Phone },
];

export default function PatientPreviewModal({ patient, onClose, onConfirm, confirmLabel = 'Select Employee' }) {
  return (
    <Modal
      open={Boolean(patient)}
      title="Employee Preview"
      size="xl"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" size="lg" onClick={onClose}>
            Back
          </Button>
          <Button type="button" variant="teal" size="lg" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {patient && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4 rounded-xl bg-linear-to-r from-[#e9fbf6] to-[#f3fdfb] p-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#14a690] to-[#0e7d6b] text-xl font-bold text-white shadow-sm ring-4 ring-white">
              {fullName(patient).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-ink-900">{fullName(patient)}</p>
              <p className="text-sm text-ink-500">{patient.position} • {patient.agencyOffice}</p>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PREVIEW_FIELDS.map(({ key, label, icon: Icon, render }) => (
              <div key={key} className="flex items-start gap-3 rounded-lg border border-line bg-surface p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#e9fbf6] text-[#0e7d6b]">
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
                  <dd className={`mt-0.5 text-sm font-medium text-ink-900 ${key === 'address' ? 'wrap-break-word' : 'truncate'}`}>
                    {render ? render(patient) : patient[key] || '—'}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      )}
    </Modal>
  );
}
