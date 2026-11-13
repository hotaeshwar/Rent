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
import { runTransaction, doc, serverTimestamp } from "firebase/firestore";

const COL = "tenants";

// Add Tenant and occupy bed via transaction (ALL READS BEFORE ALL WRITES)
export const addTenant = async (ownerId, tenantData) => {
  return await runTransaction(db, async (transaction) => {
    // --- 1. READ PHASE ---
    let bedRef = null;
    let bedDoc = null;
    if (tenantData.bedId) {
      bedRef = getOwnerDocRef(ownerId, "beds", tenantData.bedId);
      bedDoc = await transaction.get(bedRef);
    }

    let roomRef = null;
    let roomDoc = null;
    if (tenantData.roomId) {
      roomRef = getOwnerDocRef(ownerId, "rooms", tenantData.roomId);
      roomDoc = await transaction.get(roomRef);
    }

    // --- 2. VALIDATION & PREPARATION PHASE ---
    if (bedDoc) {
      if (!bedDoc.exists()) {
        throw new Error("Selected bed not found");
      }
      const bedInfo = bedDoc.data();
      if (bedInfo.status === "Occupied") {
        throw new Error(
          `Bed ${bedInfo.bedNumber} is already occupied by ${bedInfo.currentTenantName || 'another tenant'}`
        );
      }
    }

    let currentRoomOcc = 0;
    let newRoomStatus = "Available";
    if (roomDoc && roomDoc.exists()) {
      const roomInfo = roomDoc.data();
      currentRoomOcc = (roomInfo.occupiedCount || 0) + 1;
      newRoomStatus = currentRoomOcc >= (roomInfo.capacity || 1) ? "Full" : "Available";
    }

    // New tenant ref
    const tenantCol = getOwnerColRef(ownerId, COL);
    const tenantRef = doc(tenantCol);
    const tenantPayload = {
      ...tenantData,
      status: "Active",
      rentAmount: Number(tenantData.rentAmount) || 0,
      securityDeposit: Number(tenantData.securityDeposit) || 0,
      ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // --- 3. WRITE PHASE (ALL WRITES AFTER ALL READS) ---
    // A. Create tenant doc
    transaction.set(tenantRef, tenantPayload);

    // B. Update Bed
    if (bedRef && bedDoc && bedDoc.exists()) {
      transaction.update(bedRef, {
        status: "Occupied",
        currentTenantId: tenantRef.id,
        currentTenantName: tenantData.fullName,
        updatedAt: new Date().toISOString(),
      });
    }

    // C. Update Room
    if (roomRef && roomDoc && roomDoc.exists()) {
      transaction.update(roomRef, {
        occupiedCount: currentRoomOcc,
        status: newRoomStatus,
        updatedAt: new Date().toISOString(),
      });
    }

    // D. Create notification
    const notifRef = doc(getOwnerColRef(ownerId, "notifications"));
    transaction.set(notifRef, {
      title: "New Tenant Checked In",
      message: `${tenantData.fullName} checked into Room ${tenantData.roomNumber || ''} (${tenantData.propertyName || ''})`,
      type: "check_in",
      read: false,
      createdAt: new Date().toISOString(),
    });

    return { id: tenantRef.id, ...tenantPayload };
  });
};

export const getTenants = async (ownerId) => {
  return await getOwnerCollection(ownerId, COL);
};

export const getTenantById = async (ownerId, tenantId) => {
  return await getOwnerDoc(ownerId, COL, tenantId);
};

export const updateTenant = async (ownerId, tenantId, data) => {
  return await updateOwnerDoc(ownerId, COL, tenantId, data);
};

// Check out tenant and free bed & room (ALL READS BEFORE ALL WRITES)
export const checkoutTenant = async (ownerId, tenantId, checkoutNotes = "") => {
  return await runTransaction(db, async (transaction) => {
    // --- 1. READ PHASE ---
    const tenantRef = getOwnerDocRef(ownerId, COL, tenantId);
    const tenantDoc = await transaction.get(tenantRef);
    if (!tenantDoc.exists()) {
      throw new Error("Tenant record not found");
    }
    const tenant = tenantDoc.data();

    let bedRef = null;
    let bedDoc = null;
    if (tenant.bedId) {
      bedRef = getOwnerDocRef(ownerId, "beds", tenant.bedId);
      bedDoc = await transaction.get(bedRef);
    }

    let roomRef = null;
    let roomDoc = null;
    if (tenant.roomId) {
      roomRef = getOwnerDocRef(ownerId, "rooms", tenant.roomId);
      roomDoc = await transaction.get(roomRef);
    }

    // --- 2. PREPARATION PHASE ---
    let newRoomOcc = 0;
    if (roomDoc && roomDoc.exists()) {
      const roomInfo = roomDoc.data();
      newRoomOcc = Math.max(0, (roomInfo.occupiedCount || 1) - 1);
    }

    const updateData = {
      status: "Checked Out",
      checkOutDate: new Date().toISOString().split("T")[0],
      checkoutNotes,
      updatedAt: new Date().toISOString(),
    };

    // --- 3. WRITE PHASE (ALL WRITES AFTER ALL READS) ---
    // A. Update tenant record
    transaction.update(tenantRef, updateData);

    // B. Free the bed
    if (bedRef && bedDoc && bedDoc.exists()) {
      transaction.update(bedRef, {
        status: "Available",
        currentTenantId: null,
        currentTenantName: null,
        updatedAt: new Date().toISOString(),
      });
    }

    // C. Decrement room occupied count
    if (roomRef && roomDoc && roomDoc.exists()) {
      transaction.update(roomRef, {
        occupiedCount: newRoomOcc,
        status: "Available",
        updatedAt: new Date().toISOString(),
      });
    }

    // D. Create notification
    const notifRef = doc(getOwnerColRef(ownerId, "notifications"));
    transaction.set(notifRef, {
      title: "Tenant Checked Out",
      message: `${tenant.fullName} has checked out from Room ${tenant.roomNumber || ''}`,
      type: "check_out",
      read: false,
      createdAt: new Date().toISOString(),
    });

    return { id: tenantId, ...tenant, ...updateData };
  });
};

export const deleteTenant = async (ownerId, tenantId) => {
  // If active, check out first
  const tenant = await getTenantById(ownerId, tenantId);
  if (tenant && tenant.status === "Active") {
    await checkoutTenant(ownerId, tenantId, "Removed by owner");
  }
  return await deleteOwnerDoc(ownerId, COL, tenantId);
};

export const subscribeTenants = (ownerId, onData, onError) => {
  return subscribeOwnerCollection(ownerId, COL, [], onData, onError);
};
