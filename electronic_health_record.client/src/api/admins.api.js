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
