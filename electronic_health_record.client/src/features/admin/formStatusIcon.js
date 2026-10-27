import { CircleX, Clock, Eye, Smile, SquareCheck, Users } from 'lucide-react';
import { FORM_STATUS } from '../../lib/constants';

// Dental and vision reuse their sidebar icons, so a status reads as the desk
// the form is waiting at.
export const STATUS_ICON = {
  [FORM_STATUS.PENDING_ASSESSMENT]: Clock,
  [FORM_STATUS.PENDING_CONSULTATION]: Users,
  [FORM_STATUS.PENDING_DENTAL]: Smile,
  [FORM_STATUS.PENDING_VISION]: Eye,
  [FORM_STATUS.COMPLETED]: SquareCheck,
  [FORM_STATUS.CANCELLED]: CircleX,
};
