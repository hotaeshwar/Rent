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
import { query, where, addDoc } from "firebase/firestore";

const STAFF_COL = "staff";
const ATTENDANCE_COL = "attendance";
const SALARY_COL = "salaryRecords";

export const createStaff = async (ownerId, data) => {
  return await createOwnerDoc(ownerId, STAFF_COL, {
    ...data,
    salary: Number(data.salary) || 0,
    status: data.status || "Active",
  });
};

export const getStaffMembers = async (ownerId) => {
  return await getOwnerCollection(ownerId, STAFF_COL);
};

export const updateStaff = async (ownerId, id, data) => {
  return await updateOwnerDoc(ownerId, STAFF_COL, id, {
    ...data,
    salary: Number(data.salary) || 0,
  });
};

export const deleteStaff = async (ownerId, id) => {
  return await deleteOwnerDoc(ownerId, STAFF_COL, id);
};

export const subscribeStaff = (ownerId, onData, onError) => {
  return subscribeOwnerCollection(ownerId, STAFF_COL, [], onData, onError);
};

// Attendance
export const markAttendance = async (ownerId, data) => {
  return await createOwnerDoc(ownerId, ATTENDANCE_COL, {
    ...data,
    date: data.date || new Date().toISOString().split("T")[0],
    status: data.status || "Present", // Present, Absent, Half-day, Leave
  });
};

export const getAttendance = async (ownerId, date = null) => {
  const constraints = date ? [where("date", "==", date)] : [];
  return await getOwnerCollection(ownerId, ATTENDANCE_COL, constraints);
};

export const subscribeAttendance = (ownerId, onData, onError) => {
  return subscribeOwnerCollection(ownerId, ATTENDANCE_COL, [], onData, onError);
};

// Salary Records
export const recordSalaryPayment = async (ownerId, data) => {
  const salaryAmount = Number(data.salaryAmount) || 0;
  const bonus = Number(data.bonus) || 0;
  const deduction = Number(data.deduction) || 0;
  const netPaid = salaryAmount + bonus - deduction;

  return await createOwnerDoc(ownerId, SALARY_COL, {
    ...data,
    salaryAmount,
    bonus,
    deduction,
    netPaid,
    paymentDate: data.paymentDate || new Date().toISOString().split("T")[0],
    status: "Paid",
  });
};

export const getSalaryRecords = async (ownerId) => {
  return await getOwnerCollection(ownerId, SALARY_COL);
};

export const subscribeSalaryRecords = (ownerId, onData, onError) => {
  return subscribeOwnerCollection(ownerId, SALARY_COL, [], onData, onError);
};

