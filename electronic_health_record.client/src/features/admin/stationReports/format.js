/** Share of total as a whole percent, or an em dash when there is nothing to divide. */
export function pct(count, total) {
  if (!total) return '—';
  return `${Math.round((count / total) * 100)}%`;
}

/** "12 min", or an em dash when no visit at the station was timed. */
export function minutes(value) {
  return value == null ? '—' : `${Math.round(value)} min`;
}

/** A report's counts keyed by class, in a theme's class order, for SegmentBar. */
export function toSegments(classes, counts) {
  return classes.map(({ key, label, color }) => ({ key, label, color, value: counts?.[key] ?? 0 }));
}

/** Server { name, <field> } rows as RankedList's { name, value } items. */
export const toRanked = (rows, field) => rows.map((row) => ({ name: row.name, value: row[field] }));
