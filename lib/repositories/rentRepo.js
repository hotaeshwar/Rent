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
import { runTransaction, doc, query, where, getDocs, orderBy } from "firebase/firestore";

const INVOICE_COL = "rentInvoices";
const PAYMENT_COL = "payments";

// Generate monthly invoice
export const createRentInvoice = async (ownerId, data) => {
  const rentAmount = Number(data.rentAmount) || 0;
  const maintenanceCharges = Number(data.maintenanceCharges) || 0;
  const electricityCharges = Number(data.electricityCharges) || 0;
  const extraCharges = Number(data.extraCharges) || 0;
  const totalAmount = rentAmount + maintenanceCharges + electricityCharges + extraCharges;

  return await createOwnerDoc(ownerId, INVOICE_COL, {
    ...data,
    rentAmount,
    maintenanceCharges,
    electricityCharges,
    extraCharges,
    totalAmount,
    paidAmount: 0,
    pendingAmount: totalAmount,
    status: "Pending", // Pending, Partial, Paid, Overdue
  });
};

// Record payment with transaction to atomically update invoice
export const recordPayment = async (ownerId, paymentData) => {
  return await runTransaction(db, async (transaction) => {
    const invoiceRef = getOwnerDocRef(ownerId, INVOICE_COL, paymentData.invoiceId);
    const invoiceDoc = await transaction.get(invoiceRef);

    if (!invoiceDoc.exists()) {
      throw new Error("Invoice not found");
    }

    const invoice = invoiceDoc.data();
    const paymentAmount = Number(paymentData.amount) || 0;

    if (paymentAmount <= 0) {
      throw new Error("Payment amount must be greater than zero");
    }

    const newPaidAmount = (Number(invoice.paidAmount) || 0) + paymentAmount;
    const newPendingAmount = Math.max(0, (Number(invoice.totalAmount) || 0) - newPaidAmount);

    let newStatus = "Partial";
    if (newPendingAmount <= 0) {
      newStatus = "Paid";
    } else if (newPaidAmount === 0) {
      newStatus = "Pending";
    }

    // 1. Create payment record
    const paymentCol = getOwnerColRef(ownerId, PAYMENT_COL);
    const paymentRef = doc(paymentCol);
    const receiptNumber = `REC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const paymentPayload = {
      ...paymentData,
      amount: paymentAmount,
      invoiceId: paymentData.invoiceId,
      tenantId: invoice.tenantId,
      tenantName: invoice.tenantName,
      propertyId: invoice.propertyId,
      propertyName: invoice.propertyName || "",
      receiptNumber,
      ownerId,
      paymentDate: paymentData.paymentDate || new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    };

    transaction.set(paymentRef, paymentPayload);

    // 2. Update invoice
    transaction.update(invoiceRef, {
      paidAmount: newPaidAmount,
      pendingAmount: newPendingAmount,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    // 3. Notification
    const notifRef = doc(getOwnerColRef(ownerId, "notifications"));
    transaction.set(notifRef, {
      title: "Payment Received",
      message: `Received ₹${paymentAmount.toLocaleString()} from ${invoice.tenantName} (${paymentData.paymentMethod || 'Cash'})`,
      type: "payment",
      read: false,
      createdAt: new Date().toISOString(),
    });

    return { id: paymentRef.id, ...paymentPayload };
  });
};

export const getInvoices = async (ownerId) => {
  return await getOwnerCollection(ownerId, INVOICE_COL);
};

export const getPayments = async (ownerId, invoiceId = null) => {
  const constraints = invoiceId ? [where("invoiceId", "==", invoiceId)] : [];
  return await getOwnerCollection(ownerId, PAYMENT_COL, constraints);
};

export const subscribeInvoices = (ownerId, onData, onError) => {
  return subscribeOwnerCollection(ownerId, INVOICE_COL, [], onData, onError);
};

export const subscribePayments = (ownerId, onData, onError) => {
  return subscribeOwnerCollection(ownerId, PAYMENT_COL, [], onData, onError);
};

export const updateInvoice = async (ownerId, invoiceId, data) => {
  return await updateOwnerDoc(ownerId, INVOICE_COL, invoiceId, data);
};

export const deleteInvoice = async (ownerId, invoiceId) => {
  return await deleteOwnerDoc(ownerId, INVOICE_COL, invoiceId);
};

// Delete payment transaction and adjust invoice balances
export const deletePayment = async (ownerId, paymentId) => {
  return await runTransaction(db, async (transaction) => {
    const paymentRef = getOwnerDocRef(ownerId, PAYMENT_COL, paymentId);
    const paymentDoc = await transaction.get(paymentRef);
    if (!paymentDoc.exists()) {
      throw new Error("Payment record not found");
    }

    const payment = paymentDoc.data();
    let invoiceRef = null;
    let invoiceDoc = null;

    if (payment.invoiceId) {
      invoiceRef = getOwnerDocRef(ownerId, INVOICE_COL, payment.invoiceId);
      invoiceDoc = await transaction.get(invoiceRef);
    }

    // Adjust invoice if exists
    if (invoiceRef && invoiceDoc && invoiceDoc.exists()) {
      const invoice = invoiceDoc.data();
      const removedAmount = Number(payment.amount) || 0;
      const newPaidAmount = Math.max(0, (Number(invoice.paidAmount) || 0) - removedAmount);
      const newPendingAmount = Math.max(0, (Number(invoice.totalAmount) || 0) - newPaidAmount);

      let newStatus = "Partial";
      if (newPaidAmount === 0) {
        newStatus = "Unpaid";
      } else if (newPendingAmount === 0) {
        newStatus = "Paid";
      }

      transaction.update(invoiceRef, {
        paidAmount: newPaidAmount,
        pendingAmount: newPendingAmount,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    }

    // Delete payment doc
    transaction.delete(paymentRef);

    return { success: true };
  });
};

