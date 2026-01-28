// Compatibility layer for legacy imports
// Many files import from "../firebase/config" expecting { auth, db, storage }.
// This module re-exports the admin instances from the central admin firebase setup.

import { adminAuth, adminDB, adminStorage } from "../firebase.admin";

export const auth = adminAuth;
export const db = adminDB;
export const storage = adminStorage;

export default {
  auth,
  db,
  storage,
};
