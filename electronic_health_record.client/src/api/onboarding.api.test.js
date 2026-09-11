import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './mock/db';
import {
  listPhysicians, createPhysician, updatePhysician, setPhysicianActive,
  resetPhysicianPassword,
  listEmployees, createEmployee, updateEmployee,
} from './onboarding.api';

const newDoctor = {
  surname: 'Reyes', firstName: 'Alma', middleName: 'C',
  prcLicenseNo: 'PRC-55555', contactNo: '09171112222',
  username: 'areyes', password: 'Temp#12345',
};

const newEmployee = {
  externalEmployeeId: 'PHO-7777',
  surname: 'Bautista', firstName: 'Nico', middleName: 'D',
  birthdate: '1990-06-15', sex: 'Male', civilStatus: 'Single',
  address: '5 Mabini Street', agencyOffice: 'Provincial Health Office',
  position: 'Administrative Aide', contactNo: '09173334444',
};

beforeEach(() => {
  localStorage.clear();
  db.reset();
});

describe('physician onboarding', () => {
  it('lists seeded physicians without exposing passwords', async () => {
    const physicians = await listPhysicians();
    expect(physicians.length).toBeGreaterThan(0);
    for (const p of physicians) {
      expect(p).not.toHaveProperty('password');
      expect(p).toHaveProperty('prcLicenseNo');
    }
  });

  it('registers a doctor who must change the issued password', async () => {
    const created = await createPhysician(newDoctor);
    expect(created.physicianID).toBeTruthy();
    expect(created).not.toHaveProperty('password');

    const stored = db.read().physicians.find((p) => p.physicianID === created.physicianID);
    expect(stored.password).toBe('Temp#12345');
    expect(stored.mustChangePassword).toBe(true);
    expect(stored.isActive).toBe(true);
  });

  it('rejects a duplicate username', async () => {
    await createPhysician(newDoctor);
    await expect(createPhysician({ ...newDoctor, prcLicenseNo: 'PRC-66666' }))
      .rejects.toMatchObject({ status: 409 });
  });

  it('rejects a duplicate PRC license number', async () => {
    await createPhysician(newDoctor);
    await expect(createPhysician({ ...newDoctor, username: 'other' }))
      .rejects.toMatchObject({ status: 409 });
  });

  it('edits a doctor without touching their password', async () => {
    const created = await createPhysician(newDoctor);
    const updated = await updatePhysician(created.physicianID, {
      ...newDoctor, contactNo: '09179998888',
    });
    expect(updated.contactNo).toBe('09179998888');
    const stored = db.read().physicians.find((p) => p.physicianID === created.physicianID);
    expect(stored.password).toBe('Temp#12345');
  });

  it('deactivates a doctor instead of deleting the record', async () => {
    const before = db.read().physicians.length;
    const created = await createPhysician(newDoctor);
    const updated = await setPhysicianActive(created.physicianID, false);
    expect(updated.isActive).toBe(false);
    // The row survives: it is referenced by every form this doctor signed.
    expect(db.read().physicians).toHaveLength(before + 1);
  });

  it('reissues a temporary password and forces a change', async () => {
    const created = await createPhysician(newDoctor);
    await resetPhysicianPassword(created.physicianID, 'Fresh#54321');
    const stored = db.read().physicians.find((p) => p.physicianID === created.physicianID);
    expect(stored.password).toBe('Fresh#54321');
    expect(stored.mustChangePassword).toBe(true);
  });

  it('stores the station a doctor is assigned to', async () => {
    const created = await createPhysician({
      surname: 'Cruz', firstName: 'Ana', middleName: 'B',
      prcLicenseNo: '1122334', contactNo: '09170001111',
      username: 'acruz', password: 'password123', station: 5,
    });

    expect(created.station).toBe(5);
    const listed = await listPhysicians();
    expect(listed.find((p) => p.physicianID === created.physicianID).station).toBe(5);
  });

  it('reassigns a doctor to another station', async () => {
    const created = await createPhysician({
      surname: 'Reyes', firstName: 'Ben', middleName: 'C',
      prcLicenseNo: '5566778', contactNo: '09170002222',
      username: 'breyes', password: 'password123', station: 3,
    });

    const updated = await updatePhysician(created.physicianID, {
      surname: 'Reyes', firstName: 'Ben', middleName: 'C',
      prcLicenseNo: '5566778', contactNo: '09170002222', station: 4,
    });

    expect(updated.station).toBe(4);
  });
});

describe('employee onboarding', () => {
  it('lists the seeded HR directory', async () => {
    const employees = await listEmployees();
    expect(employees.length).toBeGreaterThan(0);
  });

  it('adds a local employee record flagged as locally added', async () => {
    const created = await createEmployee(newEmployee);
    expect(created.externalEmployeeId).toBe('PHO-7777');
    expect(created.isLocallyAdded).toBe(true);

    const employees = await listEmployees();
    expect(employees.some((e) => e.externalEmployeeId === 'PHO-7777')).toBe(true);
  });

  it('rejects a duplicate employee id', async () => {
    await createEmployee(newEmployee);
    await expect(createEmployee(newEmployee)).rejects.toMatchObject({ status: 409 });
  });

  it('edits an employee record', async () => {
    await createEmployee(newEmployee);
    const updated = await updateEmployee('PHO-7777', { ...newEmployee, position: 'Nurse II' });
    expect(updated.position).toBe('Nurse II');
  });

  it('makes a new employee findable by the station 1 picker', async () => {
    await createEmployee(newEmployee);
    const { searchEmployees } = await import('./patients.api');
    const results = await searchEmployees('Bautista');
    expect(results.some((e) => e.externalEmployeeId === 'PHO-7777')).toBe(true);
  });
});
