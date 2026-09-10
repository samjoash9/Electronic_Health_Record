import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './mock/db';
import { submitStation1, submitStation2, submitStation3, getForm } from './forms.api';
import { listPhysicians, createPhysician, setPhysicianActive } from './onboarding.api';
import { activePhysicianOptions } from '../features/station3/physicianOptions';

const employee = {
  externalEmployeeId: 'PHO-9100',
  surname: 'Cruz', firstName: 'Elena', middleName: 'R',
  birthdate: '1980-03-02', sex: 'Female', civilStatus: 'Married',
  address: '9 Rizal Street', agencyOffice: 'Provincial Health Office',
  position: 'Nurse II', contactNo: '09171234567',
};

const vitals = {
  weightKg: 60, heightCm: 160, bmi: 23.4, idealBMI: 22,
  bpSystolic: 118, bpDiastolic: 78, tempCelsius: 36.5,
  heartRate: 70, respRate: 16,
};

async function formAwaitingConsultation() {
  const created = await submitStation1({ patient: employee, vitals, adminID: 1 });
  return submitStation2({
    formID: created.formID, answers: [], adminID: 2, rowVersion: created.rowVersion,
  });
}

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

  it('signs the consultation against the selected doctor, not the caller', async () => {
    const assessed = await formAwaitingConsultation();
    const signed = await submitStation3({
      formID: assessed.formID,
      // Doctor 2 is the one picked in the dropdown; doctor 1 is signed in.
      physicianID: 2,
      rowVersion: assessed.rowVersion,
      consultation: { socialHistory: { smokes: false }, signature: 'data:image/png;base64,AAA' },
    });
    expect(signed.physicianID).toBe(2);

    const full = await getForm(assessed.formID);
    expect(full.physician.physicianID).toBe(2);
  });

  it('refuses to submit without a physician', async () => {
    const assessed = await formAwaitingConsultation();
    await expect(submitStation3({
      formID: assessed.formID,
      physicianID: null,
      rowVersion: assessed.rowVersion,
      consultation: { signature: 'data:image/png;base64,AAA' },
    })).rejects.toThrow(/physician/i);
  });
});
