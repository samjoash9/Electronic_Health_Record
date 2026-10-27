import { Calendar, MapPin } from 'lucide-react';
import { STATUS_LABEL, STATUS_TONE } from '../../lib/constants';
import { fullName, formatDate } from '../../lib/formatters';
import Badge from '../../components/ui/Badge';
import RecordCardList from '../../components/ui/RecordCardList';
import { STATUS_ICON } from './formStatusIcon';

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
