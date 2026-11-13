import { adminDb } from "./firebase-admin.js";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".system_data");
const USERNAMES_FILE = path.join(DATA_DIR, "usernames.json");

function getLocalMap() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(USERNAMES_FILE)) {
      const content = fs.readFileSync(USERNAMES_FILE, "utf8");
      return JSON.parse(content || "{}");
    }
  } catch (e) {
    console.warn("Local username cache read note:", e.message);
  }
  return {};
}

function saveLocalMap(map) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERNAMES_FILE, JSON.stringify(map, null, 2), "utf8");
  } catch (e) {
    console.warn("Local username cache write note:", e.message);
  }
}

export async function checkUsernameAvailable(username) {
  const clean = username.trim().toLowerCase();
  const regex = /^[a-zA-Z0-9_]{4,20}$/;
  if (!regex.test(clean)) {
    return {
      available: false,
      error: "Username must be 4–20 characters and contain only letters, numbers, and underscores",
    };
  }

  // 1. Try Firebase Admin if credentials configured
  if (adminDb) {
    try {
      const snap = await adminDb.collection("usernames").doc(clean).get();
      if (snap.exists) {
        return { available: false, error: "This username is already taken" };
      }
      return { available: true };
    } catch (e) {
      console.warn("AdminDb lookup note:", e.message);
    }
  }

  // 2. Check local server cache
  const localMap = getLocalMap();
  if (localMap[clean]) {
    return { available: false, error: "This username is already taken" };
  }

  return { available: true };
}

export async function registerUsernameMapping(cleanUsername, email, uid, fullName = "") {
  const clean = cleanUsername.trim().toLowerCase();
  const record = {
    username: clean,
    email: email.trim().toLowerCase(),
    uid,
    fullName,
    createdAt: new Date().toISOString(),
  };

  // 1. Save to Firebase Admin if available
  if (adminDb) {
    try {
      await adminDb.collection("usernames").doc(clean).set(record);
      await adminDb.collection("users").doc(uid).set({
        uid,
        username: clean,
        email: email.trim().toLowerCase(),
        fullName,
        role: "owner",
        createdAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.warn("AdminDb write note:", e.message);
    }
  }

  // 2. Always persist to local cache for instant lookup
  const localMap = getLocalMap();
  localMap[clean] = record;
  saveLocalMap(localMap);

  return record;
}

export async function resolveUsernameToEmail(username) {
  const clean = username.trim().toLowerCase();

  // 1. Try Firebase Admin if available
  if (adminDb) {
    try {
      const snap = await adminDb.collection("usernames").doc(clean).get();
      if (snap.exists) {
        return snap.data().email;
      }
    } catch (e) {
      console.warn("AdminDb resolve note:", e.message);
    }
  }

  // 2. Try local cache
  const localMap = getLocalMap();
  if (localMap[clean] && localMap[clean].email) {
    return localMap[clean].email;
  }

  return null;
}
