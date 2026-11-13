import {
  createOwnerDoc,
  getOwnerDoc,
  deleteOwnerDoc,
  getOwnerCollection,
  subscribeOwnerCollection,
  db
} from "./db";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const COL = "documents";

export const uploadDocumentFile = async (ownerId, file, folder = "documents") => {
  const cleanFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const storagePath = `owners/${ownerId}/${folder}/${cleanFileName}`;
  const storageRef = ref(storage, storagePath);

  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return {
    downloadURL,
    storagePath,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  };
};

export const saveDocumentRecord = async (ownerId, data) => {
  return await createOwnerDoc(ownerId, COL, data);
};

export const getDocuments = async (ownerId) => {
  return await getOwnerCollection(ownerId, COL);
};

export const deleteDocumentRecord = async (ownerId, id, storagePath = null) => {
  if (storagePath) {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn("Storage deletion warning:", err.message);
    }
  }
  return await deleteOwnerDoc(ownerId, COL, id);
};

export const subscribeDocuments = (ownerId, onData, onError) => {
  return subscribeOwnerCollection(ownerId, COL, [], onData, onError);
};

