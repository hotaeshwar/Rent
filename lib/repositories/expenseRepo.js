import {
  createOwnerDoc,
  getOwnerDoc,
  updateOwnerDoc,
  deleteOwnerDoc,
  getOwnerCollection,
  subscribeOwnerCollection
} from "./db";

const COL = "expenses";

export const createExpense = async (ownerId, data) => {
  return await createOwnerDoc(ownerId, COL, {
    ...data,
    amount: Number(data.amount) || 0,
    date: data.date || new Date().toISOString().split("T")[0],
  });
};

export const getExpenses = async (ownerId) => {
  return await getOwnerCollection(ownerId, COL);
};

export const updateExpense = async (ownerId, expenseId, data) => {
  return await updateOwnerDoc(ownerId, COL, expenseId, {
    ...data,
    amount: Number(data.amount) || 0,
  });
};

export const deleteExpense = async (ownerId, expenseId) => {
  return await deleteOwnerDoc(ownerId, COL, expenseId);
};

export const subscribeExpenses = (ownerId, onData, onError) => {
  return subscribeOwnerCollection(ownerId, COL, [], onData, onError);
};

