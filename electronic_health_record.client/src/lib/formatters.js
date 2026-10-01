export function fullName(person) {
  if (!person) return '';
  const middle = person.middleName ? ` ${person.middleName}.` : '';
  const given = `${person.firstName ?? ''}${middle}`.trim();
  const surname = person.surname ?? '';
  if (!given) return surname;
  if (!surname) return given;
  return `${surname}, ${given}`;
}

// The clinic reads every date in Philippine time, so the timezone is pinned
// rather than left to the viewer's machine -- 'en-PH' only sets the wording and
// ordering of the output, never the offset it is rendered at.
const PH_TIME_ZONE = 'Asia/Manila';

// Timestamps arrive as UTC instants ("...Z"), but date-only columns arrive as a
// bare 'YYYY-MM-DD'. new Date() reads that as UTC midnight, which is the
// *previous* day once converted to Manila, so a plain date is formatted from its
// own parts instead of being run through a timezone at all.
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function formatDate(iso) {
  if (!iso) return '—';

  const dateOnly = typeof iso === 'string' && DATE_ONLY.test(iso);
  const date = dateOnly ? new Date(`${iso}T00:00:00`) : new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    ...(dateOnly ? {} : { timeZone: PH_TIME_ZONE }),
  });
}

export function formatDateTime(iso) {
  if (!iso) return '—';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: PH_TIME_ZONE,
  });
}

/** Peso amount with thousands separators and a fixed two decimals. */
export function peso(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;
}

export function ageFrom(birthdate) {
  if (!birthdate) return null;
  const dob = new Date(birthdate);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}
