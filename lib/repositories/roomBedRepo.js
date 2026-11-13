import {
  createOwnerDoc,
  getOwnerDoc,
  updateOwnerDoc,
  deleteOwnerDoc,
  getOwnerCollection,
  subscribeOwnerCollection,
  getOwnerDocRef,
  getOwnerColRef,
  db
} from "./db";
import { runTransaction, doc, writeBatch, query, where, getDocs } from "firebase/firestore";

const ROOMS_COL = "rooms";
const BEDS_COL = "beds";

// Create a room and automatically generate its beds within a batch
export const createRoomWithBeds = async (ownerId, roomData) => {
  const batch = writeBatch(db);

  // New room ref
  const roomsCol = getOwnerColRef(ownerId, ROOMS_COL);
  const roomDocRef = doc(roomsCol);

  const capacity = Number(roomData.capacity) || 1;
  const rentPerBed = Number(roomData.rentAmount) || 0;

  const roomPayload = {
    ...roomData,
    capacity,
    occupiedCount: 0,
    rentAmount: rentPerBed,
    securityDeposit: Number(roomData.securityDeposit) || 0,
    status: "Available",
    ownerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  batch.set(roomDocRef, roomPayload);

  // Generate beds
  const bedsCol = getOwnerColRef(ownerId, BEDS_COL);
  const createdBedIds = [];

  for (let i = 1; i <= capacity; i++) {
    const bedDocRef = doc(bedsCol);
    createdBedIds.push(bedDocRef.id);
    const bedPayload = {
      bedNumber: `B${i}`,
      roomId: roomDocRef.id,
      roomNumber: roomData.roomNumber,
      propertyId: roomData.propertyId,
      propertyName: roomData.propertyName || "",
      rentAmount: rentPerBed,
      status: "Available", // Available, Occupied, Maintenance
      currentTenantId: null,
      currentTenantName: null,
      ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    batch.set(bedDocRef, bedPayload);
  }

  await batch.commit();
  return { id: roomDocRef.id, ...roomPayload, bedIds: createdBedIds };
};

export const getRooms = async (ownerId, propertyId = null) => {
  const constraints = propertyId ? [where("propertyId", "==", propertyId)] : [];
  return await getOwnerCollection(ownerId, ROOMS_COL, constraints);
};

export const getBeds = async (ownerId, roomId = null, propertyId = null) => {
  const constraints = [];
  if (propertyId) constraints.push(where("propertyId", "==", propertyId));
  if (roomId) constraints.push(where("roomId", "==", roomId));
  return await getOwnerCollection(ownerId, BEDS_COL, constraints);
};

export const subscribeRooms = (ownerId, onData, onError) => {
  return subscribeOwnerCollection(ownerId, ROOMS_COL, [], onData, onError);
};

export const subscribeBeds = (ownerId, onData, onError) => {
  return subscribeOwnerCollection(ownerId, BEDS_COL, [], onData, onError);
};

export const updateRoom = async (ownerId, roomId, data) => {
  return await updateOwnerDoc(ownerId, ROOMS_COL, roomId, data);
};

export const deleteRoomAndBeds = async (ownerId, roomId) => {
  // Delete all beds belonging to this room first
  const bedsSnap = await getDocs(
    query(getOwnerColRef(ownerId, BEDS_COL), where("roomId", "==", roomId))
  );
  const batch = writeBatch(db);
  bedsSnap.docs.forEach((d) => {
    batch.delete(d.ref);
  });
  // Delete the room doc
  batch.delete(getOwnerDocRef(ownerId, ROOMS_COL, roomId));
  await batch.commit();
  return { id: roomId };
};

export const updateBedStatus = async (ownerId, bedId, status, tenantId = null, tenantName = null) => {
  return await updateOwnerDoc(ownerId, BEDS_COL, bedId, {
    status,
    currentTenantId: tenantId,
    currentTenantName: tenantName,
  });
};

