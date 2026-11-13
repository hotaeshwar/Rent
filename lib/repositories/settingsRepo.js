import {
  getOwnerDoc,
  setOwnerDoc,
  updateOwnerDoc
} from "./db";

const COL = "settings";
const GENERAL_SETTINGS_DOC = "general";

export const getOwnerSettings = async (ownerId) => {
  const settings = await getOwnerDoc(ownerId, COL, GENERAL_SETTINGS_DOC);
  if (!settings) {
    // Return standard defaults
    return {
      businessName: "BiD Rent Manager PG",
      ownerName: "",
      phone: "",
      email: "",
      address: "",
      currency: "₹",
      rentDueDay: "5",
      gracePeriodDays: "3",
      emailNotifications: true,
      rentReminders: true,
      maintenanceAlerts: true,
    };
  }
  return settings;
};

export const saveOwnerSettings = async (ownerId, data) => {
  return await setOwnerDoc(ownerId, COL, GENERAL_SETTINGS_DOC, data, true);
};

