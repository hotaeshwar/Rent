import {
  createOwnerDoc,
  getOwnerDoc,
  updateOwnerDoc,
  deleteOwnerDoc,
  getOwnerCollection,
  subscribeOwnerCollection,
  getOwnerColRef,
  db
} from "./db";
import { writeBatch, getDocs } from "firebase/firestore";

const COL = "notifications";

export const getNotifications = async (ownerId) => {
  return await getOwnerCollection(ownerId, COL);
};

export const markNotificationRead = async (ownerId, id) => {
  return await updateOwnerDoc(ownerId, COL, id, { read: true });
};

export const markAllNotificationsRead = async (ownerId) => {
  const colRef = getOwnerColRef(ownerId, COL);
  const snap = await getDocs(colRef);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    if (!d.data().read) {
      batch.update(d.ref, { read: true });
    }
  });
  await batch.commit();
};

export const deleteNotification = async (ownerId, id) => {
  return await deleteOwnerDoc(ownerId, COL, id);
};

export const subscribeNotifications = (ownerId, onData, onError) => {
  return subscribeOwnerCollection(ownerId, COL, [], onData, onError);
};

