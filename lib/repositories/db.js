import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Returns owner subcollection reference
 */
export const getOwnerColRef = (ownerId, collectionName) => {
  if (!ownerId) throw new Error("ownerId is required");
  return collection(db, "owners", ownerId, collectionName);
};

/**
 * Returns owner subcollection document reference
 */
export const getOwnerDocRef = (ownerId, collectionName, docId) => {
  if (!ownerId) throw new Error("ownerId is required");
  if (!docId) throw new Error("docId is required");
  return doc(db, "owners", ownerId, collectionName, docId);
};

// Generic CRUD operations
export const createOwnerDoc = async (ownerId, collectionName, data) => {
  const colRef = getOwnerColRef(ownerId, collectionName);
  const payload = {
    ...data,
    ownerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(colRef, payload);
  return { id: docRef.id, ...payload };
};

export const setOwnerDoc = async (ownerId, collectionName, docId, data, merge = true) => {
  const docRef = getOwnerDocRef(ownerId, collectionName, docId);
  const payload = {
    ...data,
    ownerId,
    updatedAt: serverTimestamp(),
  };
  await setDoc(docRef, payload, { merge });
  return { id: docId, ...payload };
};

export const updateOwnerDoc = async (ownerId, collectionName, docId, data) => {
  const docRef = getOwnerDocRef(ownerId, collectionName, docId);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(docRef, payload);
  return { id: docId, ...payload };
};

export const deleteOwnerDoc = async (ownerId, collectionName, docId) => {
  const docRef = getOwnerDocRef(ownerId, collectionName, docId);
  await deleteDoc(docRef);
  return { id: docId };
};

export const getOwnerDoc = async (ownerId, collectionName, docId) => {
  const docRef = getOwnerDocRef(ownerId, collectionName, docId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

export const getOwnerCollection = async (ownerId, collectionName, constraints = []) => {
  const colRef = getOwnerColRef(ownerId, collectionName);
  const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};

export const subscribeOwnerCollection = (ownerId, collectionName, constraints = [], onData, onError) => {
  if (!ownerId) return () => {};
  try {
    const colRef = getOwnerColRef(ownerId, collectionName);
    const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (onData) onData(items);
      },
      (err) => {
        console.error(`Error in snapshot listener for ${collectionName}:`, err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.error(`Failed to setup listener for ${collectionName}:`, err);
    return () => {};
  }
};

/**
 * Permanently delete all business data for an owner across all subcollections
 */
export const clearAllOwnerData = async (ownerId) => {
  if (!ownerId) throw new Error("ownerId is required");
  const subcollections = [
    "properties",
    "rooms",
    "beds",
    "tenants",
    "rentInvoices",
    "payments",
    "expenses",
    "maintenance",
    "staff",
    "attendance",
    "salaryRecords",
    "documents",
    "notifications",
  ];

  let totalDeleted = 0;
  for (const sub of subcollections) {
    try {
      const colRef = getOwnerColRef(ownerId, sub);
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        totalDeleted += snap.size;
      }
    } catch (e) {
      console.warn(`Error clearing subcollection ${sub}:`, e);
    }
  }
  return { totalDeleted };
};

export {
  db,
  serverTimestamp,
  runTransaction,
  writeBatch,
  query,
  where,
  orderBy,
  limit
};

