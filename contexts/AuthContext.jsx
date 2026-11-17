"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useRouter } from "next/navigation";

const AuthContext = createContext({
  user: null,
  userProfile: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  confirmReset: async () => {},
  changePassword: async () => {},
  updateUserProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setUserProfile(snap.data());
          } else {
            // Basic profile if doc not found
            setUserProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              fullName: firebaseUser.displayName || "Property Owner",
              username: firebaseUser.email.split("@")[0],
            });
          }
        } catch (err) {
          console.error("Error loading user profile:", err);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Username or email login
  const login = async (identifier, password) => {
    let email = identifier.trim();

    // If identifier doesn't contain '@', resolve username
    if (!identifier.includes("@")) {
      const normalized = identifier.trim().toLowerCase();
      let resolvedEmail = null;

      // 1. Direct Firestore check (works on static hosting like GitHub Pages)
      try {
        const usernameDoc = await getDoc(doc(db, "usernames", normalized));
        if (usernameDoc.exists() && usernameDoc.data()?.email) {
          resolvedEmail = usernameDoc.data().email;
        }
      } catch (fsErr) {
        console.warn("Direct Firestore username lookup note:", fsErr);
      }

      // 2. Fallback to API route if running in a Node.js server environment
      if (!resolvedEmail) {
        try {
          const res = await fetch("/api/auth/resolve-username", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: normalized }),
          });
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const data = await res.json();
            if (res.ok && data?.email) {
              resolvedEmail = data.email;
            }
          }
        } catch (apiErr) {
          console.warn("API username lookup note:", apiErr);
        }
      }

      if (!resolvedEmail) {
        throw new Error("Invalid username or password");
      }
      email = resolvedEmail;
    }

    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  // Register with username and email
  const register = async ({ fullName, username, email, password }) => {
    const normalizedUsername = username.trim().toLowerCase();

    // 1. Check username availability in Firestore directly (works on GitHub Pages)
    try {
      const existingUserSnap = await getDoc(doc(db, "usernames", normalizedUsername));
      if (existingUserSnap.exists()) {
        throw new Error("This username is already taken. Please choose another username.");
      }
    } catch (checkErr) {
      if (checkErr.message?.includes("already taken")) {
        throw checkErr;
      }
      console.warn("Firestore username pre-check note:", checkErr);
    }

    // Optional API check if running in server runtime
    try {
      const checkRes = await fetch("/api/auth/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalizedUsername }),
      });
      const ct = checkRes.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const checkData = await checkRes.json();
        if (checkRes.ok && checkData.available === false) {
          throw new Error(checkData.error || "This username is already taken");
        }
      }
    } catch (apiCheckErr) {
      if (apiCheckErr.message?.includes("already taken")) {
        throw apiCheckErr;
      }
      // Non-blocking on static hosting
    }

    // 2. Create in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const firebaseUser = userCredential.user;

    // 3. Update display name
    await updateProfile(firebaseUser, { displayName: fullName.trim() });

    // 4. Register username in backend if available (safely without crashing on static HTML 404)
    try {
      await fetch("/api/auth/register-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: email.trim(),
          username: normalizedUsername,
          fullName: fullName.trim(),
        }),
      });
    } catch (apiRegErr) {
      // Expected on static hosting where API routes are not active
    }

    // 5. Also write to user's profile document directly from client
    const userRef = doc(db, "users", firebaseUser.uid);
    const profile = {
      uid: firebaseUser.uid,
      fullName: fullName.trim(),
      username: normalizedUsername,
      email: email.trim(),
      role: "owner",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      await setDoc(userRef, profile, { merge: true });
      // 6. Also register username index in Firestore for client-side lookups
      await setDoc(
        doc(db, "usernames", normalizedUsername),
        {
          uid: firebaseUser.uid,
          email: email.trim(),
          username: normalizedUsername,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((e) => console.warn("Firestore username index note:", e.message));

      setUserProfile(profile);
    } catch (fsErr) {
      console.warn("Firestore profile save warning:", fsErr);
      if (fsErr.code === "permission-denied" || fsErr.message?.includes("insufficient permissions")) {
        throw new Error(
          "Cloud Firestore rules are blocking access. Please deploy or paste your project's firestore.rules in Firebase Console > Firestore Database > Rules."
        );
      }
      throw fsErr;
    }

    return firebaseUser;
  };

  // Official Firebase Password Reset
  const resetPassword = async (email) => {
    return await sendPasswordResetEmail(auth, email.trim());
  };

  const confirmReset = async (oobCode, newPassword) => {
    return await confirmPasswordReset(auth, oobCode, newPassword);
  };

  const changePassword = async (newPassword) => {
    if (!auth.currentUser) throw new Error("No authenticated user");
    return await updatePassword(auth.currentUser, newPassword);
  };

  // Update user profile in Firestore and Context state
  const updateUserProfile = async (updates) => {
    if (!auth.currentUser) throw new Error("No authenticated user");
    const uid = auth.currentUser.uid;
    const userRef = doc(db, "users", uid);
    
    // Save to Firestore
    await setDoc(userRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });

    // Update Firebase Auth display name if fullName provided
    if (updates.fullName) {
      try {
        await updateProfile(auth.currentUser, { displayName: updates.fullName.trim() });
      } catch (pErr) {
        console.warn("Update displayName warning:", pErr);
      }
    }

    // Update local state immediately
    setUserProfile((prev) => ({
      ...(prev || {}),
      ...updates,
      uid,
      email: auth.currentUser.email,
    }));

    return true;
  };

  // Complete logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      router.replace("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        login,
        register,
        logout,
        resetPassword,
        confirmReset,
        changePassword,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

