import {
  Calendar, CircleX, Clock, Eye, MapPin, Smile, SquareCheck, Users,
} from 'lucide-react';
import { FORM_STATUS, STATUS_LABEL, STATUS_TONE } from '../../lib/constants';
import { fullName, formatDate } from '../../lib/formatters';
import Badge from '../../components/ui/Badge';
import RecordCardList from '../../components/ui/RecordCardList';

// Dental and vision reuse their sidebar icons, so a status reads as the desk
// the form is waiting at.
const STATUS_ICON = {
  [FORM_STATUS.PENDING_ASSESSMENT]: Clock,
  [FORM_STATUS.PENDING_CONSULTATION]: Users,
  [FORM_STATUS.PENDING_DENTAL]: Smile,
  [FORM_STATUS.PENDING_VISION]: Eye,
  [FORM_STATUS.COMPLETED]: SquareCheck,
  [FORM_STATUS.CANCELLED]: CircleX,
};

/**
 * The Forms list as record cards, for widths the table's columns cannot fit
 * (phones, tablets beside the sidebar). `actionsFor(form)` returns the same
 * action list the desktop table renders as buttons; omit it to show none.
 */
export default function FormCardList({ forms, onOpen, actionsFor, empty }) {
  return (
    <RecordCardList
      rows={forms}
      rowKey={(form) => form.formID}
      onOpen={onOpen}
      empty={empty}
      card={(form) => {
        const name = fullName(form.patient);
        return {
          avatarName: name,
          title: name,
          subtitle: form.patientAccount?.username ?? '—',
          badges: (
            <Badge tone={STATUS_TONE[form.status]} icon={STATUS_ICON[form.status]}>
              {STATUS_LABEL[form.status] ?? form.status}
            </Badge>
          ),
          meta: [
            { icon: MapPin, label: `Station ${form.currentStation}` },
            { icon: Calendar, label: formatDate(form.formDate) },
          ],
          actions: actionsFor?.(form) ?? [],
          actionsLabel: `Actions for ${name}`,
        };
      }}
    />
  );
}
