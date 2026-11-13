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
import { doc, addDoc } from "firebase/firestore";

const COL = "maintenance";

export const createMaintenanceRequest = async (ownerId, data) => {
  const ticketNumber = data.ticketNumber || `TKT-${Date.now().toString().slice(-6)}`;

  const result = await createOwnerDoc(ownerId, COL, {
    ...data,
    ticketNumber,
    status: data.status || "Open",
    priority: data.priority || "Medium",
    estimatedCost: Number(data.estimatedCost) || 0,
    actualCost: Number(data.actualCost) || 0,
    createdAt: new Date().toISOString(),
  });

  // Also create a notification
  try {
    await addDoc(getOwnerColRef(ownerId, "notifications"), {
      title: `Maintenance Request #${ticketNumber}`,
      message: `${ticketNumber}: ${data.title} (${data.propertyName || 'Property'}) - Priority: ${data.priority || 'Medium'}`,
      type: "maintenance",
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to create notification:", e);
  }

  return result;
};

export const getMaintenanceRequests = async (ownerId) => {
  return await getOwnerCollection(ownerId, COL);
};

export const updateMaintenanceRequest = async (ownerId, id, data) => {
  const updateData = {
    ...data,
    estimatedCost: Number(data.estimatedCost) || 0,
    actualCost: Number(data.actualCost) || 0,
  };
  if (data.status === "Resolved" && !data.resolvedAt) {
    updateData.resolvedAt = new Date().toISOString();
  }
  return await updateOwnerDoc(ownerId, COL, id, updateData);
};

export const deleteMaintenanceRequest = async (ownerId, id) => {
  return await deleteOwnerDoc(ownerId, COL, id);
};

export const subscribeMaintenance = (ownerId, onData, onError) => {
  return subscribeOwnerCollection(ownerId, COL, [], onData, onError);
};

