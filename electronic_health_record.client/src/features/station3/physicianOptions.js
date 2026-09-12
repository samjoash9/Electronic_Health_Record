/**
 * The signer list for a station, built from the registered doctors the
 * Onboarding page maintains.
 *
 * Deactivated accounts are left out: a doctor who can no longer sign in must
 * not be offered as the signer of a new consultation. Forms they already signed
 * still resolve, because deactivation keeps the record.
 *
 * `station` scopes the list to the desk a doctor was assigned at onboarding
 * (3 Consultation, 4 Dental, 5 Vision), so the dental picker cannot offer an
 * optometrist. It is optional only so a caller wanting every doctor -- the
 * Onboarding page itself -- can still omit it.
 */
export function activePhysicianOptions(physicians, station) {
  return (physicians ?? [])
    .filter((p) => p.isActive)
    .filter((p) => station === undefined || p.station === station)
    .map((p) => ({
      value: p.physicianID,
      label: `Dr. ${p.firstName}${p.middleName ? ` ${p.middleName}` : ''} ${p.surname}`,
      hint: `PRC ${p.prcLicenseNo}`,
    }));
}

/** The option currently selected, for reading a name and licence back out. */
export function findPhysician(physicians, physicianID) {
  return (physicians ?? []).find((p) => p.physicianID === physicianID) ?? null;
}
