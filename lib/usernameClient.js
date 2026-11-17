import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Checks if a username is registered in Firebase Firestore or backend.
 * Works seamlessly on both local server and static hosting (GitHub Pages).
 */
export async function isUsernameRegistered(username) {
  if (!username || typeof username !== "string") {
    return { registered: false, email: null };
  }

  const clean = username.trim().toLowerCase();

  // 1. Primary Check: Direct Firestore 'usernames' collection
  try {
    const snap = await getDoc(doc(db, "usernames", clean));
    if (snap.exists()) {
      const data = snap.data();
      return {
        registered: true,
        email: data?.email || null,
        uid: data?.uid || null,
      };
    }
  } catch (err) {
    console.warn("Firestore username lookup note:", err.message);
  }

  // 2. Secondary Check: API Route (active on Node.js server runtime)
  try {
    const res = await fetch("/api/auth/resolve-username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: clean }),
    });
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (data?.email) {
        return {
          registered: true,
          email: data.email,
          uid: data.uid || null,
        };
      }
    }
  } catch (err) {
    // Expected on static hosting where API routes are not active
  }

  return { registered: false, email: null };
}

