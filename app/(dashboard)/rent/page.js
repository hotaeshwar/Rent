"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  Clock,
  Printer,
  IndianRupee,
  FileText,
  Share2,
  Edit,
  Trash2,
  Phone,
  MessageSquare,
  Check,
  Send,
  Building,
  User,
  Copy,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { subscribeProperties } from "@/lib/repositories/propertyRepo";
import { subscribeTenants } from "@/lib/repositories/tenantRepo";
import {
  subscribeInvoices,
  subscribePayments,
  createRentInvoice,
  updateInvoice,
  deleteInvoice,
  recordPayment,
  deletePayment,
} from "@/lib/repositories/rentRepo";

export default function RentPage() {
  const { user, userProfile } = useAuth();
  const { showToast } = useToast();

  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState("invoices"); // invoices, payments
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Invoice Detailed View & WhatsApp Sharing Modal
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Edit Invoice Modal
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editForm, setEditForm] = useState({
    month: "",
    dueDate: "",
    rentAmount: "0",
    electricityCharges: "0",
    maintenanceCharges: "0",
    extraCharges: "0",
    status: "Unpaid",
    paidAmount: "0",
  });

  // Delete Invoice Confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Delete Payment Confirmation
  const [deletePaymentTarget, setDeletePaymentTarget] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Form states for creating invoice
  const currentMonthYear = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  const [invoiceForm, setInvoiceForm] = useState({
    tenantId: "",
    month: currentMonthYear,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    rentAmount: "8000",
    maintenanceCharges: "0",
    electricityCharges: "0",
    extraCharges: "0",
    status: "Unpaid",
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "UPI",
    referenceNumber: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    if (!user?.uid) return;

    const unsubProps = subscribeProperties(user.uid, (data) => setProperties(data));
    const unsubTenants = subscribeTenants(user.uid, (data) => setTenants(data));
    const unsubInvoices = subscribeInvoices(user.uid, (data) => {
      setInvoices(data);
      setLoading(false);
    });
    const unsubPayments = subscribePayments(user.uid, (data) => setPayments(data));

    return () => {
      unsubProps();
      unsubTenants();
      unsubInvoices();
      unsubPayments();
    };
  }, [user?.uid]);

  // Keep viewingInvoice in sync with real-time updates
  useEffect(() => {
    if (viewingInvoice) {
      const updated = invoices.find((i) => i.id === viewingInvoice.id);
      if (updated) {
        setViewingInvoice(updated);
      }
    }
  }, [invoices]);

  // Handle open Create Invoice modal
  const handleOpenCreateInvoice = () => {
    const activeTenants = tenants.filter((t) => t.status === "Active");
    if (activeTenants.length === 0) {
      showToast("No active tenants found. Check in tenants first.", "error");
      return;
    }
    const firstTenant = activeTenants[0];
    setInvoiceForm({
      tenantId: firstTenant.id,
      month: currentMonthYear,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      rentAmount: String(firstTenant.rentAmount || "8000"),
      maintenanceCharges: "0",
      electricityCharges: "0",
      extraCharges: "0",
      status: "Unpaid",
    });
    setIsInvoiceModalOpen(true);
  };

  const handleTenantSelectInInvoice = (tenantId) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    setInvoiceForm((prev) => ({
      ...prev,
      tenantId,
      rentAmount: String(tenant?.rentAmount || prev.rentAmount),
    }));
  };

  const handleCreateInvoiceSubmit = async (e) => {
    e.preventDefault();
    const tenant = tenants.find((t) => t.id === invoiceForm.tenantId);
    if (!tenant) {
      showToast("Please select a tenant", "error");
      return;
    }

    try {
      setSubmitting(true);
      const rentAmount = Number(invoiceForm.rentAmount) || 0;
      const maintenance = Number(invoiceForm.maintenanceCharges) || 0;
      const electricity = Number(invoiceForm.electricityCharges) || 0;
      const extra = Number(invoiceForm.extraCharges) || 0;
      const totalAmount = rentAmount + maintenance + electricity + extra;

      let paidAmount = 0;
      let pendingAmount = totalAmount;

      if (invoiceForm.status === "Paid") {
        paidAmount = totalAmount;
        pendingAmount = 0;
      } else if (invoiceForm.status === "Partial") {
        paidAmount = Math.round(totalAmount / 2);
        pendingAmount = totalAmount - paidAmount;
      }

      await createRentInvoice(user.uid, {
        ...invoiceForm,
        tenantName: tenant.fullName,
        propertyId: tenant.propertyId,
        propertyName: tenant.propertyName || "BiD PG",
        roomId: tenant.roomId,
        roomNumber: tenant.roomNumber,
        bedId: tenant.bedId,
        bedNumber: tenant.bedNumber,
        rentAmount,
        maintenanceCharges: maintenance,
        electricityCharges: electricity,
        extraCharges: extra,
        totalAmount,
        paidAmount,
        pendingAmount,
        status: invoiceForm.status || "Unpaid",
      });
      showToast(`Rent invoice created for ${tenant.fullName}!`);
      setIsInvoiceModalOpen(false);
    } catch (err) {
      console.error("Create invoice error:", err);
      showToast("Failed to create invoice: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Status Update (Direct dropdown selection in the row or modal)
  const handleStatusChange = async (invoice, newStatus) => {
    try {
      setUpdatingStatus(true);
      const total = Number(invoice.totalAmount) || 0;
      let newPaid = Number(invoice.paidAmount) || 0;
      let newPending = Number(invoice.pendingAmount) || 0;

      if (newStatus === "Paid") {
        newPaid = total;
        newPending = 0;
      } else if (newStatus === "Unpaid") {
        newPaid = 0;
        newPending = total;
      } else if (newStatus === "Partial") {
        if (newPaid === 0 || newPaid >= total) {
          newPaid = Math.round(total / 2);
          newPending = total - newPaid;
        }
      }

      await updateInvoice(user.uid, invoice.id, {
        status: newStatus,
        paidAmount: newPaid,
        pendingAmount: newPending,
      });

      showToast(`Status updated to "${newStatus}"!`);
    } catch (err) {
      console.error("Status update error:", err);
      showToast("Failed to update status in Firebase: " + err.message, "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Open Edit Invoice Modal
  const handleOpenEdit = (inv) => {
    setEditingInvoice(inv);
    setEditForm({
      month: inv.month || "",
      dueDate: inv.dueDate || "",
      rentAmount: String(inv.rentAmount || 0),
      electricityCharges: String(inv.electricityCharges || 0),
      maintenanceCharges: String(inv.maintenanceCharges || 0),
      extraCharges: String(inv.extraCharges || 0),
      status: inv.status || "Unpaid",
      paidAmount: String(inv.paidAmount || 0),
    });
  };

  // Submit Edit Invoice
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingInvoice) return;

    try {
      setSubmitting(true);
      const rentAmount = Number(editForm.rentAmount) || 0;
      const electricity = Number(editForm.electricityCharges) || 0;
      const maintenance = Number(editForm.maintenanceCharges) || 0;
      const extra = Number(editForm.extraCharges) || 0;
      const totalAmount = rentAmount + electricity + maintenance + extra;

      let paidAmount = Number(editForm.paidAmount) || 0;
      let pendingAmount = Math.max(0, totalAmount - paidAmount);

      let status = editForm.status;
      if (status === "Paid") {
        paidAmount = totalAmount;
        pendingAmount = 0;
      } else if (status === "Unpaid") {
        paidAmount = 0;
        pendingAmount = totalAmount;
      }

      await updateInvoice(user.uid, editingInvoice.id, {
        month: editForm.month,
        dueDate: editForm.dueDate,
        rentAmount,
        electricityCharges: electricity,
        maintenanceCharges: maintenance,
        extraCharges: extra,
        totalAmount,
        paidAmount,
        pendingAmount,
        status,
      });

      showToast("Invoice updated successfully!");
      setEditingInvoice(null);
    } catch (err) {
      console.error("Edit invoice error:", err);
      showToast("Failed to update invoice: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Invoice
  const handleDeleteInvoice = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteInvoice(user.uid, deleteTarget.id);
      showToast("Invoice deleted successfully.");
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete invoice error:", err);
      showToast("Failed to delete invoice: " + err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  // Delete Payment Transaction
  const handleDeletePayment = async () => {
    if (!deletePaymentTarget) return;
    try {
      setDeletingPayment(true);
      await deletePayment(user.uid, deletePaymentTarget.id);
      showToast("Payment record deleted and invoice balance restored.");
      setDeletePaymentTarget(null);
    } catch (err) {
      console.error("Delete payment error:", err);
      showToast("Failed to delete payment: " + err.message, "error");
    } finally {
      setDeletingPayment(false);
    }
  };

  // Open Invoice Preview & WhatsApp Share Modal
  const handleOpenViewInvoice = (inv) => {
    setViewingInvoice(inv);
    const tenant = tenants.find((t) => t.id === inv.tenantId);
    setWhatsappPhone(tenant?.phone || "");
  };

  // Build Formatted WhatsApp Message (Clean, professional, emoji-free)
  const getWhatsAppMessageText = () => {
    if (!viewingInvoice) return "";
    const pgName = viewingInvoice.propertyName || userProfile?.businessName || "BiD PG & Rental Hostel";
    const tenantName = viewingInvoice.tenantName || "Tenant";
    const total = Number(viewingInvoice.totalAmount || 0).toLocaleString();
    const paid = Number(viewingInvoice.paidAmount || 0).toLocaleString();
    const pending = Number(viewingInvoice.pendingAmount || 0).toLocaleString();
    const invNumber = `INV-${(viewingInvoice.id || "").slice(-6).toUpperCase()}`;

    return `*RENT INVOICE - ${pgName.toUpperCase()}*
Bill Reference: #${invNumber}

Hello ${tenantName},
Here are your monthly rent invoice details for ${viewingInvoice.month}:

- Property: ${pgName}
- Room: ${viewingInvoice.roomNumber || "N/A"}${viewingInvoice.bedNumber ? ` (Bed ${viewingInvoice.bedNumber})` : ""}
- Payment Due Date: ${viewingInvoice.dueDate || "N/A"}
------------------------------------
- Total Billed: Rs. ${total}
- Amount Paid: Rs. ${paid}
- Balance Due: Rs. ${pending}
- Payment Status: ${viewingInvoice.status?.toUpperCase() || "UNPAID"}
------------------------------------

Please clear any balance dues on or before the due date.

View Digital Invoice Card:
https://Rent.buildingindiadigital.com

Thank you,
${pgName}
BiD Rent Manager`;
  };

  // Native Share Card Handler (Opens device share sheet with rich card)
  const handleNativeShareCard = async () => {
    if (!viewingInvoice) return;
    const invNumber = `INV-${(viewingInvoice.id || "").slice(-6).toUpperCase()}`;
    const pgName = viewingInvoice.propertyName || userProfile?.businessName || "BiD Rent Manager";
    const total = Number(viewingInvoice.totalAmount || 0).toLocaleString();
    const shareData = {
      title: `${pgName} - Rent Invoice #${invNumber}`,
      text: `Rent invoice for ${viewingInvoice.tenantName} (${viewingInvoice.month}) - Total: Rs. ${total}. View online:`,
      url: "https://Rent.buildingindiadigital.com",
    };

    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast("Shared invoice card successfully!");
      } catch (err) {
        if (err.name !== "AbortError") {
          handleShareWhatsApp();
        }
      }
    } else {
      handleShareWhatsApp();
    }
  };

  // WhatsApp Share Handler
  const handleShareWhatsApp = () => {
    if (!viewingInvoice) return;

    let cleanPhone = whatsappPhone.replace(/\D/g, "");
    if (!cleanPhone) {
      showToast("Please enter a valid WhatsApp phone number", "error");
      return;
    }

    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const message = getWhatsAppMessageText();
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    showToast("Opening WhatsApp with pre-filled invoice message!");
  };

  const handleCopyWhatsAppMessage = () => {
    const message = getWhatsAppMessageText();
    navigator.clipboard.writeText(message);
    showToast("Invoice message copied to clipboard!");
  };

  // Handle open Payment modal
  const handleOpenRecordPayment = (invoice = null) => {
    const targetInvoice = invoice || invoices.find((i) => i.status !== "Paid");
    if (!targetInvoice) {
      showToast("No pending invoices available to pay.", "info");
      return;
    }
    setSelectedInvoiceForPay(targetInvoice);
    setPaymentForm({
      amount: String(targetInvoice.pendingAmount || targetInvoice.totalAmount),
      paymentMethod: "UPI",
      referenceNumber: `UPI-${Date.now().toString().slice(-6)}`,
      paymentDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setIsPaymentModalOpen(true);
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceForPay) return;

    const amount = Number(paymentForm.amount);
    if (amount <= 0) {
      showToast("Payment amount must be greater than zero", "error");
      return;
    }

    try {
      setSubmitting(true);
      const res = await recordPayment(user.uid, {
        invoiceId: selectedInvoiceForPay.id,
        amount,
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber,
        paymentDate: paymentForm.paymentDate,
        notes: paymentForm.notes,
      });
      showToast(`Payment of ₹${amount.toLocaleString()} recorded successfully!`);
      setIsPaymentModalOpen(false);
      setViewingReceipt(res);
    } catch (err) {
      console.error("Record payment error:", err);
      showToast("Payment record failed: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // KPIs
  const totalInvoiced = invoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const totalCollected = invoices.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
  const totalPending = invoices.reduce((s, i) => s + (Number(i.pendingAmount) || 0), 0);

  // Filtered invoices
  const filteredInvoices = invoices.filter((i) => {
    const matchesSearch =
      i.tenantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.propertyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" ||
      i.status === statusFilter ||
      (statusFilter === "Unpaid" && (i.status === "Unpaid" || i.status === "Pending"));
    return matchesSearch && matchesStatus;
  });

  const filteredPayments = payments.filter((p) => {
    return (
      p.tenantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.paymentMethod?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Print-specific style for ultra-clean A4 printout */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-rent-invoice,
          #printable-rent-invoice * {
            visibility: visible !important;
          }
          #printable-rent-invoice {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            z-index: 99999 !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Rent Collection & Invoices
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Generate monthly rent bills, update statuses (Paid, Unpaid, Partial), share via WhatsApp, and manage records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleOpenRecordPayment()}
            variant="outline"
            icon={CreditCard}
            size="md"
          >
            Record Payment
          </Button>
          <Button onClick={handleOpenCreateInvoice} icon={Plus} size="md">
            Generate Invoice
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Billed Rent
          </span>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            ₹{totalInvoiced.toLocaleString()}
          </p>
          <span className="text-xs text-slate-500">{invoices.length} Invoices issued</span>
        </div>

        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
            Total Collected
          </span>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            ₹{totalCollected.toLocaleString()}
          </p>
          <span className="text-xs text-emerald-800">{payments.length} Payments cleared</span>
        </div>

        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
            Outstanding Pending
          </span>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            ₹{totalPending.toLocaleString()}
          </p>
          <span className="text-xs text-amber-800">Awaiting collection</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "invoices"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Rent Invoices ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "payments"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Payment Transactions ({payments.length})
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder={
              activeTab === "invoices"
                ? "Search invoices by tenant, room, building..."
                : "Search payments by tenant, receipt number, method..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs sm:text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {activeTab === "invoices" && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-emerald-600"
          >
            <option value="All">All Invoices</option>
            <option value="Paid">Paid Only</option>
            <option value="Unpaid">Unpaid Only</option>
            <option value="Partial">Partial Only</option>
          </select>
        )}
      </div>

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <>
          {filteredInvoices.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No rent invoices found"
              description="Generate your first monthly invoice to begin tracking tenant rent."
              actionLabel="Generate Invoice"
              onAction={handleOpenCreateInvoice}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 sm:pl-6">Tenant & Room</th>
                      <th className="px-3 py-3.5">Billing Month</th>
                      <th className="px-3 py-3.5">Due Date</th>
                      <th className="px-3 py-3.5">Total Billed</th>
                      <th className="px-3 py-3.5">Paid</th>
                      <th className="px-3 py-3.5">Pending</th>
                      <th className="px-3 py-3.5">Status</th>
                      <th className="py-3.5 pl-3 pr-4 text-right sm:pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredInvoices.map((inv) => {
                      const isPaid = inv.status === "Paid";
                      const isPartial = inv.status === "Partial";
                      const isUnpaid = inv.status === "Unpaid" || inv.status === "Pending";

                      return (
                        <tr
                          key={inv.id}
                          className="transition-colors hover:bg-slate-50/70"
                        >
                          <td className="py-3.5 pl-4 pr-3 sm:pl-6">
                            <span className="font-semibold text-slate-900 block">
                              {inv.tenantName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Room {inv.roomNumber || "N/A"}{inv.bedNumber ? ` • Bed ${inv.bedNumber}` : ""} • {inv.propertyName || "Property"}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 font-medium text-slate-800">
                            {inv.month}
                          </td>
                          <td className="px-3 py-3.5 text-xs text-slate-600">
                            {inv.dueDate}
                          </td>
                          <td className="px-3 py-3.5 font-bold text-slate-900">
                            ₹{Number(inv.totalAmount || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-3.5 font-semibold text-emerald-700">
                            ₹{Number(inv.paidAmount || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-3.5 font-semibold text-amber-700">
                            ₹{Number(inv.pendingAmount || 0).toLocaleString()}
                          </td>

                          {/* Interactive Status Selector (Paid, Unpaid, Partial) saving to Firebase */}
                          <td className="px-3 py-3.5">
                            <select
                              value={isUnpaid ? "Unpaid" : inv.status}
                              onChange={(e) => handleStatusChange(inv, e.target.value)}
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold border cursor-pointer outline-none transition-all duration-150 ${
                                isPaid
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                  : isPartial
                                  ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                                  : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
                              }`}
                              title="Click to change status (saves directly to Firebase)"
                            >
                              <option value="Paid">Paid</option>
                              <option value="Unpaid">Unpaid</option>
                              <option value="Partial">Partial</option>
                            </select>
                          </td>

                          {/* Full CRUD & Share Actions */}
                          <td className="py-3.5 pl-3 pr-4 text-right sm:pr-6">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* WhatsApp Share & View Modal */}
                              <button
                                type="button"
                                onClick={() => handleOpenViewInvoice(inv)}
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                                title="View & Share Invoice via WhatsApp"
                              >
                                <Share2 size={13} />
                                <span>Share</span>
                              </button>

                              {/* Record Pay Button (if pending) */}
                              {!isPaid && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRecordPayment(inv)}
                                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors shadow-2xs"
                                  title="Record Payment"
                                >
                                  <CreditCard size={13} />
                                  <span>Pay</span>
                                </button>
                              )}

                              {/* Edit Invoice Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(inv)}
                                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-700 transition-colors"
                                title="Edit Invoice Details"
                              >
                                <Edit size={15} />
                              </button>

                              {/* Delete Invoice Button */}
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(inv)}
                                className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Delete Invoice"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <>
          {filteredPayments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payment transactions yet"
              description="When you record rent payments, digital receipts will appear here."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 sm:pl-6">Receipt #</th>
                      <th className="px-3 py-3.5">Tenant Name</th>
                      <th className="px-3 py-3.5">Amount Paid</th>
                      <th className="px-3 py-3.5">Payment Date</th>
                      <th className="px-3 py-3.5">Method</th>
                      <th className="px-3 py-3.5">Reference ID</th>
                      <th className="py-3.5 pl-3 pr-4 text-right sm:pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredPayments.map((p) => (
                      <tr
                        key={p.id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="py-3.5 pl-4 pr-3 sm:pl-6 font-mono font-semibold text-emerald-800 text-xs">
                          {p.receiptNumber}
                        </td>
                        <td className="px-3 py-3.5 font-medium text-slate-900">
                          {p.tenantName}
                        </td>
                        <td className="px-3 py-3.5 font-bold text-emerald-700">
                          ₹{Number(p.amount).toLocaleString()}
                        </td>
                        <td className="px-3 py-3.5 text-xs text-slate-600">
                          {p.paymentDate}
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {p.paymentMethod || "Cash"}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 font-mono text-xs text-slate-500">
                          {p.referenceNumber || "—"}
                        </td>
                        <td className="py-3.5 pl-3 pr-4 text-right sm:pr-6">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingReceipt(p)}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors shadow-2xs"
                              title="View Payment Receipt"
                            >
                              <FileText size={13} />
                              <span>Receipt</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletePaymentTarget(p)}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Delete Payment Transaction"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Generate Invoice Modal (Create) */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Generate Monthly Rent Invoice"
        subtitle="Create a rent bill with optional maintenance, electricity charges, and initial status"
      >
        <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Select Tenant <span className="text-red-500">*</span>
            </label>
            <select
              value={invoiceForm.tenantId}
              onChange={(e) => handleTenantSelectInInvoice(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
            >
              {tenants
                .filter((t) => t.status === "Active")
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} — Room {t.roomNumber} ({t.propertyName})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Billing Month
              </label>
              <input
                type="text"
                value={invoiceForm.month}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, month: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Payment Due Date
              </label>
              <input
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                Base Rent (₹)
              </label>
              <input
                type="number"
                value={invoiceForm.rentAmount}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, rentAmount: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                Electricity (₹)
              </label>
              <input
                type="number"
                value={invoiceForm.electricityCharges}
                onChange={(e) =>
                  setInvoiceForm({
                    ...invoiceForm,
                    electricityCharges: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                Maintenance (₹)
              </label>
              <input
                type="number"
                value={invoiceForm.maintenanceCharges}
                onChange={(e) =>
                  setInvoiceForm({
                    ...invoiceForm,
                    maintenanceCharges: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                Other Fees (₹)
              </label>
              <input
                type="number"
                value={invoiceForm.extraCharges}
                onChange={(e) =>
                  setInvoiceForm({
                    ...invoiceForm,
                    extraCharges: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Initial Invoice Status
            </label>
            <select
              value={invoiceForm.status}
              onChange={(e) =>
                setInvoiceForm({ ...invoiceForm, status: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 font-semibold"
            >
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
            </select>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Total Invoice Amount:</span>
            <span className="text-base font-bold text-emerald-800">
              ₹
              {(
                Number(invoiceForm.rentAmount || 0) +
                Number(invoiceForm.electricityCharges || 0) +
                Number(invoiceForm.maintenanceCharges || 0) +
                Number(invoiceForm.extraCharges || 0)
              ).toLocaleString()}
            </span>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsInvoiceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} size="md">
              Create Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Invoice Modal (Update) */}
      <Modal
        isOpen={!!editingInvoice}
        onClose={() => setEditingInvoice(null)}
        title="Edit Rent Invoice"
        subtitle={`Updating invoice for ${editingInvoice?.tenantName}`}
      >
        {editingInvoice && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Billing Month
                </label>
                <input
                  type="text"
                  required
                  value={editForm.month}
                  onChange={(e) =>
                    setEditForm({ ...editForm, month: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  value={editForm.dueDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, dueDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                  Rent (₹)
                </label>
                <input
                  type="number"
                  value={editForm.rentAmount}
                  onChange={(e) =>
                    setEditForm({ ...editForm, rentAmount: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                  Electricity (₹)
                </label>
                <input
                  type="number"
                  value={editForm.electricityCharges}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      electricityCharges: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                  Maintenance (₹)
                </label>
                <input
                  type="number"
                  value={editForm.maintenanceCharges}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      maintenanceCharges: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                  Extra (₹)
                </label>
                <input
                  type="number"
                  value={editForm.extraCharges}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      extraCharges: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Payment Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 font-semibold"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partial">Partial</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Paid Amount (₹)
                </label>
                <input
                  type="number"
                  value={editForm.paidAmount}
                  onChange={(e) =>
                    setEditForm({ ...editForm, paidAmount: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="md"
                onClick={() => setEditingInvoice(null)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting} size="md">
                Save Invoice Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Invoice Confirmation Modal (Delete) */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteInvoice}
        title={`Delete Rent Invoice?`}
        message={`Are you sure you want to delete the invoice for ${deleteTarget?.tenantName} (${deleteTarget?.month})? This action cannot be undone.`}
        confirmText="Delete Invoice"
        loading={deleting}
      />

      {/* Delete Payment Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deletePaymentTarget}
        onClose={() => setDeletePaymentTarget(null)}
        onConfirm={handleDeletePayment}
        title={`Delete Payment Transaction?`}
        message={`Are you sure you want to delete receipt ${deletePaymentTarget?.receiptNumber} of ₹${Number(deletePaymentTarget?.amount || 0).toLocaleString()}? This will restore the pending amount on the invoice.`}
        confirmText="Delete Transaction"
        loading={deletingPayment}
      />

      {/* VIEW INVOICE MODAL — PROPER CORPORATE INVOICE STYLE DESIGN */}
      <Modal
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        title="Official Rent Invoice"
        subtitle={viewingInvoice?.propertyName || "Property Invoice"}
        maxWidth="max-w-2xl"
      >
        {viewingInvoice && (
          <div className="space-y-5">
            {/* Quick Status Bar with immediate Firebase synchronization */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Update Status:</span>
                <div className="inline-flex rounded-lg bg-white p-1 border border-slate-200 shadow-2xs gap-1">
                  {["Unpaid", "Partial", "Paid"].map((st) => {
                    const isCurrent =
                      (st === "Unpaid" && (viewingInvoice.status === "Unpaid" || viewingInvoice.status === "Pending")) ||
                      viewingInvoice.status === st;

                    return (
                      <button
                        key={st}
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleStatusChange(viewingInvoice, st)}
                        className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                          isCurrent
                            ? st === "Paid"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : st === "Partial"
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-rose-600 text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                Saves directly to Firebase
              </div>
            </div>

            {/* FORMAL PRINTABLE TAX INVOICE / RENT RECEIPT CONTAINER */}
            <div
              id="printable-rent-invoice"
              className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6 text-slate-800"
            >
              {/* Header: PG Name, Document Type, and Logo + BiD Rent Manager below */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b-2 border-slate-800 pb-5">
                <div>
                  <span className="inline-block rounded bg-emerald-100 text-emerald-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Tax Invoice / Rent Receipt
                  </span>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900">
                    {viewingInvoice.propertyName || "BiD PG & Rental Hostel"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    {userProfile?.businessAddress || "Premium Student & Executive Accommodation Services"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Hostel Contact: <span className="font-medium text-slate-700">{userProfile?.phone || "Support Desk"}</span>
                  </p>
                </div>

                {/* Brand Logo & BiD Rent Manager below */}
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0 text-center min-w-[120px]">
                  <Image
                    src="/images/bid-logo.png"
                    alt="BiD Rent Manager"
                    width={44}
                    height={44}
                    className="h-11 w-11 object-contain"
                  />
                  <span className="mt-1 font-bold tracking-tight text-[11px] text-emerald-950">
                    BiD Rent Manager
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400">
                    Verified Software
                  </span>
                </div>
              </div>

              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Invoice No.
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    #INV-{(viewingInvoice.id || "").slice(-6).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Billing Period
                  </span>
                  <span className="font-semibold text-slate-900">
                    {viewingInvoice.month}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Payment Due Date
                  </span>
                  <span className="font-medium text-slate-800">
                    {viewingInvoice.dueDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Payment Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      viewingInvoice.status === "Paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : viewingInvoice.status === "Partial"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {viewingInvoice.status === "Paid" && <Check size={12} />}
                    {viewingInvoice.status?.toUpperCase() || "UNPAID"}
                  </span>
                </div>
              </div>

              {/* Billed To and Issuer Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl border border-slate-200/80 p-3.5 space-y-1 bg-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Billed To (Tenant)
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    {viewingInvoice.tenantName}
                  </p>
                  <p className="text-slate-600">
                    Room: <span className="font-semibold text-slate-900">{viewingInvoice.roomNumber || "N/A"}</span>
                    {viewingInvoice.bedNumber && (
                      <span> • Bed: <span className="font-semibold text-slate-900">{viewingInvoice.bedNumber}</span></span>
                    )}
                  </p>
                  <p className="text-slate-600">
                    Property: <span className="font-medium text-slate-800">{viewingInvoice.propertyName}</span>
                  </p>
                  {whatsappPhone && (
                    <p className="text-slate-600">
                      Mobile: <span className="font-mono text-slate-800">{whatsappPhone}</span>
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200/80 p-3.5 space-y-1 bg-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Issued By (Owner / PG Management)
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    {viewingInvoice.propertyName || "Hostel Management"}
                  </p>
                  <p className="text-slate-600">
                    Authorized Manager: <span className="font-medium text-slate-800">{userProfile?.fullName || "Property Administrator"}</span>
                  </p>
                  <p className="text-slate-600">
                    System: <span className="font-medium text-emerald-800">BiD Rent Manager Cloud</span>
                  </p>
                  <p className="text-slate-600">
                    Email: <span className="font-medium text-slate-700">{user?.email || "records@bidrent.com"}</span>
                  </p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 pl-3 pr-2 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Description / Components</th>
                      <th className="py-2.5 px-3">Period</th>
                      <th className="py-2.5 pl-3 pr-4 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-3 pl-3 pr-2 text-center text-slate-400 font-mono">01</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-900 block">Monthly Accommodation Room Rent</span>
                        <span className="text-[11px] text-slate-400">Regular lodging and room usage charge</span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{viewingInvoice.month}</td>
                      <td className="py-3 pl-3 pr-4 text-right font-semibold text-slate-900">
                        ₹{Number(viewingInvoice.rentAmount || 0).toLocaleString()}
                      </td>
                    </tr>

                    {Number(viewingInvoice.electricityCharges || 0) > 0 && (
                      <tr>
                        <td className="py-3 pl-3 pr-2 text-center text-slate-400 font-mono">02</td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-900 block">Electricity / Power Consumption</span>
                          <span className="text-[11px] text-slate-400">Sub-metered / shared electricity units</span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{viewingInvoice.month}</td>
                        <td className="py-3 pl-3 pr-4 text-right font-semibold text-slate-900">
                          ₹{Number(viewingInvoice.electricityCharges).toLocaleString()}
                        </td>
                      </tr>
                    )}

                    {Number(viewingInvoice.maintenanceCharges || 0) > 0 && (
                      <tr>
                        <td className="py-3 pl-3 pr-2 text-center text-slate-400 font-mono">03</td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-900 block">Hostel Maintenance & Housekeeping</span>
                          <span className="text-[11px] text-slate-400">Cleaning, security, and facility upkeep</span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{viewingInvoice.month}</td>
                        <td className="py-3 pl-3 pr-4 text-right font-semibold text-slate-900">
                          ₹{Number(viewingInvoice.maintenanceCharges).toLocaleString()}
                        </td>
                      </tr>
                    )}

                    {Number(viewingInvoice.extraCharges || 0) > 0 && (
                      <tr>
                        <td className="py-3 pl-3 pr-2 text-center text-slate-400 font-mono">04</td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-900 block">Additional Amenities / Service Fees</span>
                          <span className="text-[11px] text-slate-400">Wi-Fi, laundry, or other miscellaneous charges</span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{viewingInvoice.month}</td>
                        <td className="py-3 pl-3 pr-4 text-right font-semibold text-slate-900">
                          ₹{Number(viewingInvoice.extraCharges).toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals & Breakdown */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="text-xs text-slate-500 max-w-xs space-y-1">
                  <span className="font-bold text-slate-700 block uppercase text-[10px] tracking-wider">
                    Terms & Notes:
                  </span>
                  <p>1. Rent must be paid on or before the due date.</p>
                  <p>2. GST on residential accommodation is exempt under notification rules.</p>
                  <p>3. This invoice is digitally generated via BiD Rent Manager.</p>
                </div>

                <div className="w-full sm:w-72 rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{Number(viewingInvoice.totalAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (0% - Exempt):</span>
                    <span>₹0</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
                    <span>Total Invoiced:</span>
                    <span>₹{Number(viewingInvoice.totalAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-emerald-700">
                    <span>Total Paid:</span>
                    <span>₹{Number(viewingInvoice.paidAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-amber-700 pt-1 border-t border-slate-200">
                    <span>Balance Pending:</span>
                    <span className="text-base font-extrabold">
                      ₹{Number(viewingInvoice.pendingAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              <div className="flex justify-between items-end pt-4 border-t border-slate-100 text-xs text-slate-400">
                <div>
                  <span className="font-mono text-[10px]">Generated: {new Date().toLocaleDateString()}</span>
                </div>
                <div className="text-right">
                  <div className="h-8 border-b border-slate-300 w-40 mb-1"></div>
                  <span className="font-semibold text-slate-700 block">
                    Authorized Signatory
                  </span>
                  <span className="text-[10px] text-slate-500">
                    For {viewingInvoice.propertyName || "BiD PG"}
                  </span>
                </div>
              </div>
            </div>

            {/* WHATSAPP SHARING SECTION */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs sm:text-sm">
                  <MessageSquare size={16} className="text-emerald-700 shrink-0" />
                  <span>Share Invoice Directly via WhatsApp</span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Link Preview Card
                </span>
              </div>

              {/* Visual Card that will appear when shared */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center p-1">
                  <Image
                    src="/images/bid-logo.png"
                    alt="BiD Rent Manager"
                    width={40}
                    height={40}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-emerald-950 truncate">
                      {viewingInvoice.propertyName || "BiD Rent Manager"}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                      INV-{(viewingInvoice.id || "").slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-800 truncate mt-0.5">
                    Rent Invoice • {viewingInvoice.tenantName} ({viewingInvoice.month})
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    Billed: ₹{Number(viewingInvoice.totalAmount || 0).toLocaleString()} • Balance Due: ₹{Number(viewingInvoice.pendingAmount || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-emerald-900/80 leading-normal">
                Enter the tenant&apos;s WhatsApp mobile number below. When sent or shared, WhatsApp displays this rich card preview with your PG branding.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="Tenant WhatsApp number (e.g. 9876543210)"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs sm:text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyWhatsAppMessage}
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 text-xs font-semibold shadow-2xs transition-all duration-150"
                    title="Copy formatted text"
                  >
                    <Copy size={13} />
                    <span>Copy</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNativeShareCard}
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 px-3 py-2 text-xs font-semibold shadow-2xs transition-all duration-150"
                    title="Share Card via device share sheet"
                  >
                    <Share2 size={13} />
                    <span>Share Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-white px-3.5 py-2 text-xs sm:text-sm font-semibold shadow-sm transition-all duration-150 active:scale-95"
                  >
                    <Send size={14} />
                    <span>Send on WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                icon={Printer}
                onClick={() => window.print()}
              >
                Print / Save PDF
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const inv = viewingInvoice;
                    setViewingInvoice(null);
                    handleOpenEdit(inv);
                  }}
                  icon={Edit}
                >
                  Edit Invoice
                </Button>
                <Button
                  size="sm"
                  onClick={() => setViewingInvoice(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Rent Payment"
        subtitle={
          selectedInvoiceForPay
            ? `Paying for ${selectedInvoiceForPay.tenantName} (${selectedInvoiceForPay.month})`
            : "Record verified payment"
        }
      >
        <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
          {selectedInvoiceForPay && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs flex justify-between">
              <div>
                <span className="text-slate-500 block">Total Due:</span>
                <span className="font-bold text-slate-800">
                  ₹{Number(selectedInvoiceForPay.totalAmount).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Already Paid:</span>
                <span className="font-bold text-emerald-700">
                  ₹{Number(selectedInvoiceForPay.paidAmount || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Balance:</span>
                <span className="font-bold text-amber-700">
                  ₹{Number(selectedInvoiceForPay.pendingAmount).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Payment Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              value={paymentForm.amount}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, amount: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-emerald-800 outline-none focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Payment Method
              </label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    paymentMethod: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Cash">Cash in Hand</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    paymentDate: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Transaction / Reference Number
            </label>
            <input
              type="text"
              placeholder="UPI Ref ID, Cheque No, or Cash Receipt Note"
              value={paymentForm.referenceNumber}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  referenceNumber: e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} size="md">
              Confirm & Issue Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Printable Rent Receipt Modal */}
      <Modal
        isOpen={!!viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        title="Official Rent Receipt"
        subtitle={viewingReceipt?.receiptNumber}
        maxWidth="max-w-lg"
      >
        {viewingReceipt && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div
              id="printable-receipt"
              className="rounded-2xl border border-slate-200 p-6 bg-white shadow-2xs space-y-4"
            >
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <h4 className="font-bold text-base text-emerald-950">
                    {viewingReceipt.propertyName || "BiD Rent Estate"}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Official Payment Voucher
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <Image
                    src="/images/bid-logo.png"
                    alt="BiD Rent Manager"
                    width={36}
                    height={36}
                    className="h-8 w-8 object-contain"
                  />
                  <span className="text-[10px] font-semibold text-emerald-950">
                    BiD Rent Manager
                  </span>
                </div>
              </div>

              <div className="space-y-2 py-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Received From:</span>
                  <span className="font-semibold text-slate-900">
                    {viewingReceipt.tenantName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt Number:</span>
                  <span className="font-mono text-emerald-800 font-semibold">
                    {viewingReceipt.receiptNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Date:</span>
                  <span className="font-medium text-slate-800">
                    {viewingReceipt.paymentDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-medium text-slate-800">
                    {viewingReceipt.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reference ID:</span>
                  <span className="font-mono text-slate-800">
                    {viewingReceipt.referenceNumber || "N/A"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50/80 p-4 border border-emerald-200 flex items-center justify-between">
                <span className="font-bold text-emerald-950">Amount Paid:</span>
                <span className="text-xl font-extrabold text-emerald-700">
                  ₹{Number(viewingReceipt.amount).toLocaleString()}
                </span>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-2">
                This is a digitally generated payment confirmation issued via BiD Rent Manager.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                icon={Printer}
                onClick={() => window.print()}
              >
                Print Receipt
              </Button>
              <Button
                size="sm"
                onClick={() => setViewingReceipt(null)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
