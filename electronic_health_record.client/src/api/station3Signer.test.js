import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './mock/db';
import { listPhysicians, createPhysician, setPhysicianActive } from './onboarding.api';
import { activePhysicianOptions } from '../features/station3/physicianOptions';

// The signer list only. Submitting against the picked doctor is pinned in
// forms.api.test.js (the request) and on the server (the stored signer).

beforeEach(() => {
  localStorage.clear();
  db.reset();
});

describe('station 3 physician selection', () => {
  it('offers every active doctor, labelled with their licence', async () => {
    const options = activePhysicianOptions(await listPhysicians());
    expect(options.length).toBeGreaterThan(1);
    expect(options[0]).toMatchObject({
      value: expect.any(Number),
      label: expect.stringContaining('Dr.'),
      hint: expect.stringContaining('PRC'),
    });
  });

  it('offers only the doctors assigned to the requested station', async () => {
    const physicians = await listPhysicians();
    for (const station of [3, 4, 5]) {
      const options = activePhysicianOptions(physicians, station);
      expect(options.length).toBeGreaterThan(0);
      for (const option of options) {
        const doctor = physicians.find((p) => p.physicianID === option.value);
        expect(doctor.station).toBe(station);
      }
    }
  });

  it('leaves a deactivated doctor out of the list', async () => {
    const created = await createPhysician({
      surname: 'Lim', firstName: 'Paolo', middleName: '',
      prcLicenseNo: 'PRC-31415', contactNo: '',
      username: 'plim', password: 'Temp#12345',
    });
    await setPhysicianActive(created.physicianID, false);

    const options = activePhysicianOptions(await listPhysicians());
    expect(options.some((o) => o.value === created.physicianID)).toBe(false);
  });
});
