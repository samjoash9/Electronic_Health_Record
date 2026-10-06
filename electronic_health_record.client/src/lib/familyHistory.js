import { FAMILY_CONDITIONS } from './constants';

const CONDITION_NAME = new Map(FAMILY_CONDITIONS.map((c) => [c.conditionID, c.name]));

/**
 * One family-history row as the record views read it: the condition, then the
 * type the physician specified.
 *
 * A checked condition is stored as its conditionID alone -- the form's read
 * returns the bare FamilyMedicalHistory rows, with no name joined on -- so the
 * name comes from FAMILY_CONDITIONS, the same catalog Station 3 ticked it
 * from. Only an "Others" row carries its own name, in conditionOther. An id
 * the catalog no longer lists still shows as its number rather than vanishing.
 */
export function familyHistoryLabel(row) {
  if (row.isNone) return 'None reported';

  const name = row.conditionOther ?? CONDITION_NAME.get(row.conditionID) ?? `Condition #${row.conditionID}`;
  return row.conditionType ? `${name} — ${row.conditionType}` : name;
}

/**
 * Just the condition's name, for a view that shows the type separately: an
 * "Others" row's own text as typed, else the catalog name in sentence case
 * ("DIABETES MELLITUS" → "Diabetes mellitus").
 */
export function conditionName(row) {
  if (row.conditionOther) return row.conditionOther;
  const name = CONDITION_NAME.get(row.conditionID);
  return name ? name.charAt(0) + name.slice(1).toLowerCase() : `Condition #${row.conditionID}`;
}
