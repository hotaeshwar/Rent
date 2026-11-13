import {
  createOwnerDoc,
  getOwnerDoc,
  updateOwnerDoc,
  deleteOwnerDoc,
  getOwnerCollection,
  subscribeOwnerCollection,
  getOwnerColRef,
  getOwnerDocRef,
  db
} from "./db";
import { runTransaction, doc, writeBatch } from "firebase/firestore";

const COL = "properties";

export const createProperty = async (ownerId, data) => {
  return await createOwnerDoc(ownerId, COL, {
    ...data,
    totalRooms: Number(data.totalRooms) || 0,
    totalFloors: Number(data.totalFloors) || 1,
    status: data.status || "active",
  });
};

export const getProperties = async (ownerId) => {
  return await getOwnerCollection(ownerId, COL);
};

export const getPropertyById = async (ownerId, propertyId) => {
  return await getOwnerDoc(ownerId, COL, propertyId);
};

export const updateProperty = async (ownerId, propertyId, data) => {
  return await updateOwnerDoc(ownerId, COL, propertyId, data);
};

export const deleteProperty = async (ownerId, propertyId) => {
  return await deleteOwnerDoc(ownerId, COL, propertyId);
};

export const subscribeProperties = (ownerId, onData, onError) => {
  return subscribeOwnerCollection(ownerId, COL, [], onData, onError);
};

