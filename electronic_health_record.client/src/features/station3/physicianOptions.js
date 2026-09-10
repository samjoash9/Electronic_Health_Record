/**
 * The attending-physician list for Station 3, built from the registered doctors
 * the Onboarding page maintains.
 *
 * Deactivated accounts are left out: a doctor who can no longer sign in must
 * not be offered as the signer of a new consultation. Forms they already signed
 * still resolve, because deactivation keeps the record.
 */
export function activePhysicianOptions(physicians) {
  return (physicians ?? [])
    .filter((p) => p.isActive)
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
