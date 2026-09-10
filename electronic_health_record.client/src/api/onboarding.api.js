import { USE_MOCK, client, toApiError } from './client';
import { db } from './mock/db';
import { delay } from './mock/delay';

/**
 * Admin onboarding: doctor accounts (real logins) and HR directory records
 * (Station 1's employee picker, no login of their own).
 *
 * A physician row carries a password, so nothing here ever returns the stored
 * record as-is -- every response goes through toPhysician(), mirroring the
 * server's PhysicianResponseDto projection.
 */

function conflict(message) {
  return Object.assign(new Error(message), { status: 409 });
}

function notFound(message) {
  return Object.assign(new Error(message), { status: 404 });
}

/**
 * The physician fields a client may read. An explicit pick rather than an omit,
 * so a credential field added to the row later cannot leak by default.
 */
function toPhysician(row) {
  return {
    physicianID: row.physicianID,
    username: row.username,
    surname: row.surname,
    firstName: row.firstName,
    middleName: row.middleName ?? null,
    prcLicenseNo: row.prcLicenseNo,
    contactNo: row.contactNo ?? null,
    mustChangePassword: Boolean(row.mustChangePassword),
    isActive: row.isActive,
    createdAt: row.createdAt ?? null,
    updatedAt: row.updatedAt ?? null,
  };
}

function nowIso() {
  return new Date().toISOString();
}

// ---------------------------------------------------------------- physicians

export async function listPhysicians() {
  if (USE_MOCK) {
    await delay(150);
    return db.read().physicians
      .map(toPhysician)
      .sort((a, b) => a.surname.localeCompare(b.surname)
        || a.firstName.localeCompare(b.firstName));
  }
  try {
    const { data } = await client.get('/physicians');
    return data.data ?? data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function createPhysician({
  surname, firstName, middleName, prcLicenseNo, contactNo, username, password,
}) {
  if (USE_MOCK) {
    await delay(300);
    return db.write((state) => {
      const takenUsername = state.physicians.some(
        (p) => p.username.toLowerCase() === username.trim().toLowerCase(),
      );
      if (takenUsername) throw conflict(`The username "${username}" is already taken.`);

      const takenLicense = state.physicians.some((p) => p.prcLicenseNo === prcLicenseNo.trim());
      if (takenLicense) {
        throw conflict(`PRC License No. ${prcLicenseNo} is already registered to another physician.`);
      }

      const physician = {
        physicianID: db.nextId('physicianID'),
        username: username.trim(),
        password,
        // The doctor is still on the password the admin handed over, so the
        // first login has to replace it.
        mustChangePassword: true,
        passwordSetAt: nowIso(),
        passwordChangedAt: null,
        surname: surname.trim(),
        firstName: firstName.trim(),
        middleName: middleName?.trim() || null,
        prcLicenseNo: prcLicenseNo.trim(),
        contactNo: contactNo?.trim() || null,
        isActive: true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      state.physicians.push(physician);
      return toPhysician(physician);
    });
  }
  try {
    const { data } = await client.post('/physicians', {
      surname, firstName, middleName, prcLicenseNo, contactNo, username, password,
    });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

/** Profile fields only. Credentials move through resetPhysicianPassword. */
export async function updatePhysician(physicianID, {
  surname, firstName, middleName, prcLicenseNo, contactNo,
}) {
  if (USE_MOCK) {
    await delay(300);
    return db.write((state) => {
      const physician = state.physicians.find((p) => p.physicianID === physicianID);
      if (!physician) throw notFound(`Physician with ID ${physicianID} was not found.`);

      const takenLicense = state.physicians.some(
        (p) => p.prcLicenseNo === prcLicenseNo.trim() && p.physicianID !== physicianID,
      );
      if (takenLicense) {
        throw conflict(`PRC License No. ${prcLicenseNo} is already registered to another physician.`);
      }

      physician.surname = surname.trim();
      physician.firstName = firstName.trim();
      physician.middleName = middleName?.trim() || null;
      physician.prcLicenseNo = prcLicenseNo.trim();
      physician.contactNo = contactNo?.trim() || null;
      physician.updatedAt = nowIso();
      return toPhysician(physician);
    });
  }
  try {
    const { data } = await client.put(`/physicians/${physicianID}`, {
      surname, firstName, middleName, prcLicenseNo, contactNo,
    });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Deactivate rather than delete: a physician is referenced by every form they
 * signed, and those forms are medical records.
 */
export async function setPhysicianActive(physicianID, isActive) {
  if (USE_MOCK) {
    await delay(250);
    return db.write((state) => {
      const physician = state.physicians.find((p) => p.physicianID === physicianID);
      if (!physician) throw notFound(`Physician with ID ${physicianID} was not found.`);
      physician.isActive = isActive;
      physician.updatedAt = nowIso();
      return toPhysician(physician);
    });
  }
  try {
    const { data } = await client.patch(`/physicians/${physicianID}`, { isActive });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

/** Issues a new temporary password the doctor must replace at next login. */
export async function resetPhysicianPassword(physicianID, password) {
  if (USE_MOCK) {
    await delay(250);
    return db.write((state) => {
      const physician = state.physicians.find((p) => p.physicianID === physicianID);
      if (!physician) throw notFound(`Physician with ID ${physicianID} was not found.`);
      physician.password = password;
      physician.mustChangePassword = true;
      physician.passwordSetAt = nowIso();
      physician.updatedAt = nowIso();
      return toPhysician(physician);
    });
  }
  try {
    const { data } = await client.post(`/physicians/${physicianID}/password`, { password });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

// ----------------------------------------------------------------- employees

export async function listEmployees() {
  if (USE_MOCK) {
    await delay(150);
    return db.read().employees
      .slice()
      .sort((a, b) => a.surname.localeCompare(b.surname)
        || a.firstName.localeCompare(b.firstName));
  }
  try {
    const { data } = await client.get('/employees');
    return data.data ?? data;
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Adds someone the HR feed has not synced yet. Flagged isLocallyAdded so a
 * future real HR integration can tell these rows from mirrored ones instead of
 * overwriting them blind.
 */
export async function createEmployee(employee) {
  if (USE_MOCK) {
    await delay(300);
    return db.write((state) => {
      const id = employee.externalEmployeeId.trim();
      if (state.employees.some((e) => e.externalEmployeeId === id)) {
        throw conflict(`Employee ID ${id} already exists in the directory.`);
      }
      const row = { ...normalizeEmployee(employee), isLocallyAdded: true };
      state.employees.push(row);
      return { ...row };
    });
  }
  try {
    const { data } = await client.post('/employees', employee);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function updateEmployee(externalEmployeeId, employee) {
  if (USE_MOCK) {
    await delay(300);
    return db.write((state) => {
      const index = state.employees.findIndex(
        (e) => e.externalEmployeeId === externalEmployeeId,
      );
      if (index === -1) throw notFound(`Employee ${externalEmployeeId} was not found.`);

      const nextId = employee.externalEmployeeId.trim();
      if (nextId !== externalEmployeeId
        && state.employees.some((e) => e.externalEmployeeId === nextId)) {
        throw conflict(`Employee ID ${nextId} already exists in the directory.`);
      }

      const row = {
        ...state.employees[index],
        ...normalizeEmployee(employee),
      };
      state.employees[index] = row;
      return { ...row };
    });
  }
  try {
    const { data } = await client.put(`/employees/${externalEmployeeId}`, employee);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

function normalizeEmployee(employee) {
  return {
    externalEmployeeId: employee.externalEmployeeId.trim(),
    surname: employee.surname.trim(),
    firstName: employee.firstName.trim(),
    middleName: employee.middleName?.trim() || null,
    birthdate: employee.birthdate,
    sex: employee.sex,
    civilStatus: employee.civilStatus,
    address: employee.address?.trim() || null,
    agencyOffice: employee.agencyOffice?.trim() || null,
    position: employee.position?.trim() || null,
    contactNo: employee.contactNo?.trim() || null,
  };
}
