import { USE_MOCK, client, toApiError } from './client';
import { db } from './mock/db';
import { delay } from './mock/delay';

/**
 * Superadmin-only staff account management. An admin row carries a password
 * hash, so nothing here returns the stored record as-is -- every response goes
 * through toAdmin(), mirroring the server's projection in AdminController.
 *
 * Creation lives on /users/admin rather than /Admin: the server splits reading
 * the roster (AdminController) from provisioning accounts
 * (UserManagementController), and only the latter hashes a password.
 */

function conflict(message) {
  return Object.assign(new Error(message), { status: 409 });
}

function notFound(message) {
  return Object.assign(new Error(message), { status: 404 });
}

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 });
}

/**
 * True when this is the only superadmin still able to sign in. Both writes below
 * refuse in that case, mirroring the server -- removing the last way in is not
 * recoverable from inside the app.
 */
function isLastActiveSuperAdmin(state, adminID) {
  const target = state.admins?.find((a) => a.adminID === adminID);
  if (target?.role !== 'superadmin') return false;
  return !state.admins.some(
    (a) => a.adminID !== adminID && a.role === 'superadmin' && a.isActive,
  );
}

/**
 * The admin fields a client may read. An explicit pick rather than an omit, so
 * a credential field added to the row later cannot leak by default.
 */
function toAdmin(row) {
  return {
    adminID: row.adminID,
    username: row.username,
    role: row.role,
    fullName: row.fullName,
    contactNo: row.contactNo ?? null,
    isActive: row.isActive,
    mustChangePassword: Boolean(row.mustChangePassword),
    lastLoginAt: row.lastLoginAt ?? null,
    createdAt: row.createdAt ?? null,
    updatedAt: row.updatedAt ?? null,
  };
}

function nowIso() {
  return new Date().toISOString();
}

export async function listAdmins() {
  if (USE_MOCK) {
    await delay(150);
    return (db.read().admins ?? [])
      .map(toAdmin)
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }
  try {
    const { data } = await client.get('/Admin');
    return (data.data ?? data).map(toAdmin);
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Creates a station admin. The server assigns the role (always `admin`, never
 * another superadmin) and returns the one-time temporary password the new
 * account must replace at first login -- it is never retrievable afterwards,
 * so the caller has to surface it immediately.
 */
export async function createAdmin({ username, fullName, contactNo }) {
  if (USE_MOCK) {
    await delay(300);
    return db.write((state) => {
      state.admins ??= [];
      const taken = state.admins.some(
        (a) => a.username.toLowerCase() === username.trim().toLowerCase(),
      );
      if (taken) throw conflict(`The username "${username}" is already taken.`);

      const admin = {
        adminID: db.nextId('adminID'),
        username: username.trim(),
        fullName: fullName.trim(),
        contactNo: contactNo?.trim() || null,
        role: 'admin',
        // Still on the password the superadmin hands over, so the first login
        // has to replace it.
        mustChangePassword: true,
        passwordSetAt: nowIso(),
        passwordChangedAt: null,
        isActive: true,
        lastLoginAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      state.admins.push(admin);
      return { ...toAdmin(admin), temporaryPassword: 'password123' };
    });
  }
  try {
    const { data } = await client.post('/users/admin', {
      username, fullName, contactNo,
    });
    return {
      ...toAdmin({
        adminID: data.adminID,
        username: data.username,
        role: data.role,
        fullName: data.fullName,
        contactNo: data.contactNo,
        isActive: true,
        mustChangePassword: true,
      }),
      temporaryPassword: data.temporaryPassword,
    };
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Deactivates or restores a staff login. The reversible option, and the one to
 * reach for first: the account and every id it holds on existing records stay
 * put, only sign-in stops.
 */
export async function setAdminActive(adminID, isActive) {
  if (USE_MOCK) {
    await delay(250);
    return db.write((state) => {
      const admin = state.admins?.find((a) => a.adminID === adminID);
      if (!admin) throw notFound(`Admin with ID ${adminID} was not found.`);
      if (!isActive && isLastActiveSuperAdmin(state, adminID)) {
        throw badRequest('This is the last active superadmin. Promote another account first.');
      }
      admin.isActive = isActive;
      admin.updatedAt = nowIso();
      return toAdmin(admin);
    });
  }
  try {
    const { data } = await client.patch(`/Admin/${adminID}`, { isActive });
    return toAdmin(data);
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Permanently removes a staff account. Superadmin only, enforced server-side.
 *
 * Work the account did is kept: the server copies the admin's name onto every
 * wellness form they staffed before detaching the account, so a record still
 * says who took the vitals and ran the assessment. Deactivation is the
 * reversible option -- this one is not.
 */
export async function deleteAdmin(adminID) {
  if (USE_MOCK) {
    await delay(250);
    return db.write((state) => {
      const index = state.admins?.findIndex((a) => a.adminID === adminID) ?? -1;
      if (index === -1) throw notFound(`Admin with ID ${adminID} was not found.`);
      if (isLastActiveSuperAdmin(state, adminID)) {
        throw badRequest('This is the last active superadmin. Promote another account first.');
      }
      const [removed] = state.admins.splice(index, 1);
      // Mirrors DeleteAdmin on the server: preserve the attribution, drop the id.
      state.forms?.forEach((form) => {
        if (form.station1AdminID === adminID) {
          form.station1AdminName ??= removed.fullName;
          form.station1AdminID = null;
        }
        if (form.station2AdminID === adminID) {
          form.station2AdminName ??= removed.fullName;
          form.station2AdminID = null;
        }
        if (form.createdByAdminID === adminID) form.createdByAdminID = null;
        if (form.updatedByAdminID === adminID) form.updatedByAdminID = null;
      });
      return toAdmin(removed);
    });
  }
  try {
    await client.delete(`/Admin/${adminID}`);
    return { adminID };
  } catch (error) {
    throw toApiError(error);
  }
}
