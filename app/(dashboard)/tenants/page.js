"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  LogOut,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Building,
  BedDouble,
  ShieldCheck,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { subscribeProperties } from "@/lib/repositories/propertyRepo";
import { subscribeRooms, subscribeBeds } from "@/lib/repositories/roomBedRepo";
import {
  subscribeTenants,
  addTenant,
  updateTenant,
  checkoutTenant,
  deleteTenant,
} from "@/lib/repositories/tenantRepo";

export default function TenantsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active"); // All, Active, Checked Out
  const [propertyFilter, setPropertyFilter] = useState("All");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [viewingTenant, setViewingTenant] = useState(null);
  const [checkoutTarget, setCheckoutTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    idProofType: "Aadhaar",
    idProofNumber: "",
    rentAmount: "0",
    securityDeposit: "0",
    agreementEndDate: "",
    notes: "",
  });

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    idProofType: "Aadhaar",
    idProofNumber: "",
    propertyId: "",
    roomId: "",
    bedId: "",
    rentAmount: "8000",
    securityDeposit: "10000",
    checkInDate: new Date().toISOString().split("T")[0],
    agreementStartDate: new Date().toISOString().split("T")[0],
    agreementEndDate: "",
    notes: "",
  });

  useEffect(() => {
    if (!user?.uid) return;

    const unsubProps = subscribeProperties(user.uid, (data) => setProperties(data));
    const unsubRooms = subscribeRooms(user.uid, (data) => setRooms(data));
    const unsubBeds = subscribeBeds(user.uid, (data) => setBeds(data));
    const unsubTenants = subscribeTenants(user.uid, (data) => {
      setTenants(data);
      setLoading(false);
    });

    return () => {
      unsubProps();
      unsubRooms();
      unsubBeds();
      unsubTenants();
    };
  }, [user?.uid]);

  const handleOpenAdd = () => {
    if (properties.length === 0) {
      showToast("Please register a property first.", "error");
      return;
    }
    const firstProp = properties[0];
    const availableRooms = rooms.filter((r) => r.propertyId === firstProp.id);
    const firstRoom = availableRooms[0];
    const availableBeds = beds.filter(
      (b) => b.roomId === firstRoom?.id && b.status === "Available"
    );

    setFormData({
      fullName: "",
      email: "",
      phone: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      idProofType: "Aadhaar",
      idProofNumber: "",
      propertyId: firstProp.id,
      roomId: firstRoom?.id || "",
      bedId: availableBeds[0]?.id || "",
      rentAmount: firstRoom?.rentAmount || "8000",
      securityDeposit: firstRoom?.securityDeposit || "10000",
      checkInDate: new Date().toISOString().split("T")[0],
      agreementStartDate: new Date().toISOString().split("T")[0],
      agreementEndDate: "",
      notes: "",
    });
    setIsAddModalOpen(true);
  };

  // Property changed in form
  const handlePropertyChange = (propertyId) => {
    const propRooms = rooms.filter((r) => r.propertyId === propertyId);
    const firstRoom = propRooms[0];
    const availableBeds = beds.filter(
      (b) => b.roomId === firstRoom?.id && b.status === "Available"
    );

    setFormData((prev) => ({
      ...prev,
      propertyId,
      roomId: firstRoom?.id || "",
      bedId: availableBeds[0]?.id || "",
      rentAmount: firstRoom?.rentAmount || prev.rentAmount,
      securityDeposit: firstRoom?.securityDeposit || prev.securityDeposit,
    }));
  };

  // Room changed in form
  const handleRoomChange = (roomId) => {
    const room = rooms.find((r) => r.id === roomId);
    const availableBeds = beds.filter(
      (b) => b.roomId === roomId && b.status === "Available"
    );

    setFormData((prev) => ({
      ...prev,
      roomId,
      bedId: availableBeds[0]?.id || "",
      rentAmount: room?.rentAmount || prev.rentAmount,
      securityDeposit: room?.securityDeposit || prev.securityDeposit,
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      showToast("Tenant full name is required", "error");
      return;
    }
    if (!formData.phone.trim()) {
      showToast("Phone number is required", "error");
      return;
    }
    if (!formData.bedId) {
      showToast("Please select an available bed", "error");
      return;
    }

    const prop = properties.find((p) => p.id === formData.propertyId);
    const room = rooms.find((r) => r.id === formData.roomId);
    const bed = beds.find((b) => b.id === formData.bedId);

    try {
      setSubmitting(true);
      await addTenant(user.uid, {
        ...formData,
        propertyName: prop?.name || "",
        roomNumber: room?.roomNumber || "",
        bedNumber: bed?.bedNumber || "",
      });
      showToast(`${formData.fullName} checked in successfully!`);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Add tenant error:", err);
      showToast(err.message || "Failed to add tenant", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (tenant) => {
    setEditingTenant(tenant);
    setEditFormData({
      fullName: tenant.fullName || "",
      email: tenant.email || "",
      phone: tenant.phone || "",
      emergencyContactName: tenant.emergencyContactName || "",
      emergencyContactPhone: tenant.emergencyContactPhone || "",
      idProofType: tenant.idProofType || "Aadhaar",
      idProofNumber: tenant.idProofNumber || "",
      rentAmount: String(tenant.rentAmount || 0),
      securityDeposit: String(tenant.securityDeposit || 0),
      agreementEndDate: tenant.agreementEndDate || "",
      notes: tenant.notes || "",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTenant) return;

    if (!editFormData.fullName.trim()) {
      showToast("Tenant full name is required", "error");
      return;
    }
    if (!editFormData.phone.trim()) {
      showToast("Phone number is required", "error");
      return;
    }

    try {
      setSubmitting(true);
      await updateTenant(user.uid, editingTenant.id, {
        fullName: editFormData.fullName.trim(),
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim(),
        emergencyContactName: editFormData.emergencyContactName.trim(),
        emergencyContactPhone: editFormData.emergencyContactPhone.trim(),
        idProofType: editFormData.idProofType,
        idProofNumber: editFormData.idProofNumber.trim(),
        rentAmount: Number(editFormData.rentAmount) || 0,
        securityDeposit: Number(editFormData.securityDeposit) || 0,
        agreementEndDate: editFormData.agreementEndDate,
        notes: editFormData.notes.trim(),
      });
      showToast("Tenant details updated successfully!");
      setEditingTenant(null);
    } catch (err) {
      console.error("Edit tenant error:", err);
      showToast("Failed to update tenant: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckoutConfirm = async () => {
    if (!checkoutTarget) return;
    try {
      setSubmitting(true);
      await checkoutTenant(user.uid, checkoutTarget.id, "Regular checkout");
      showToast(`${checkoutTarget.fullName} checked out. Bed is now available.`);
      setCheckoutTarget(null);
    } catch (err) {
      console.error("Checkout error:", err);
      showToast("Failed to process checkout: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      await deleteTenant(user.uid, deleteTarget.id);
      showToast("Tenant record removed.");
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete tenant: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered tenants
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone?.includes(searchQuery) ||
      t.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    const matchesProp =
      propertyFilter === "All" || t.propertyId === propertyFilter;
    return matchesSearch && matchesStatus && matchesProp;
  });

  // Current available rooms and beds for the selected property in modal
  const formAvailableRooms = rooms.filter(
    (r) => r.propertyId === formData.propertyId
  );
  const formAvailableBeds = beds.filter(
    (b) => b.roomId === formData.roomId && b.status === "Available"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Tenants Directory
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Check-in guests, assign beds, manage agreements, and handle check-outs
          </p>
        </div>

        <Button onClick={handleOpenAdd} icon={Plus} size="md">
          Check-in New Tenant
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by name, phone, room number, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs sm:text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-emerald-600"
          >
            <option value="All">All Statuses ({tenants.length})</option>
            <option value="Active">Active Only</option>
            <option value="Checked Out">Checked Out</option>
          </select>

          {/* Property Filter */}
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-emerald-600"
          >
            <option value="All">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tenants Table */}
      {filteredTenants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tenants found"
          description={
            searchQuery || statusFilter !== "All"
              ? "No tenant matches your current filter or search criteria."
              : "Check-in your first tenant and link them to an available room and bed."
          }
          actionLabel="Check-in Tenant"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 sm:pl-6">Tenant Name</th>
                  <th className="px-3 py-3.5">Room & Bed</th>
                  <th className="px-3 py-3.5">Contact Details</th>
                  <th className="px-3 py-3.5">Check-in Date</th>
                  <th className="px-3 py-3.5">Monthly Rent</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="py-3.5 pl-3 pr-4 text-right sm:pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTenants.map((t) => {
                  const isActive = t.status === "Active";
                  return (
                    <tr
                      key={t.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      {/* Name */}
                      <td className="py-3.5 pl-4 pr-3 sm:pl-6 font-medium text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                            {t.fullName?.[0]?.toUpperCase() || "T"}
                          </div>
                          <div>
                            <span className="font-semibold block">{t.fullName}</span>
                            <span className="text-[11px] text-slate-400">
                              {t.idProofType}: {t.idProofNumber || "Verified"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Room & Bed */}
                      <td className="px-3 py-3.5">
                        <span className="font-semibold text-slate-800 block">
                          Room {t.roomNumber || "N/A"} • Bed {t.bedNumber || ""}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {t.propertyName || "Property"}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone size={12} className="text-slate-400" />
                          <span>{t.phone}</span>
                        </div>
                        {t.email && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <Mail size={12} />
                            <span className="truncate max-w-[140px]">{t.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Check-in Date */}
                      <td className="px-3 py-3.5 text-xs text-slate-600">
                        {t.checkInDate || "N/A"}
                      </td>

                      {/* Rent */}
                      <td className="px-3 py-3.5 font-semibold text-slate-900">
                        ₹{Number(t.rentAmount || 0).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5">
                        <Badge
                          variant={isActive ? "success" : "default"}
                          size="sm"
                        >
                          {t.status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-4 text-right sm:pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingTenant(t)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-700"
                            title="View Profile"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(t)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-700"
                            title="Edit Tenant"
                          >
                            <Edit size={15} />
                          </button>

                          {isActive && (
                            <button
                              type="button"
                              onClick={() => setCheckoutTarget(t)}
                              className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-100 transition-colors"
                              title="Check-out Tenant"
                            >
                              <LogOut size={12} />
                              <span>Check-out</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(t)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Delete"
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

      {/* Add / Check-in Tenant Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Check-in New Tenant"
        subtitle="Record tenant details and allocate an available bed slot"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                placeholder="rahul@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  ID Proof
                </label>
                <select
                  value={formData.idProofType}
                  onChange={(e) =>
                    setFormData({ ...formData, idProofType: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs outline-none focus:border-emerald-600"
                >
                  <option value="Aadhaar">Aadhaar</option>
                  <option value="PAN">PAN</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">License</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  ID Number
                </label>
                <input
                  type="text"
                  placeholder="ID Number"
                  value={formData.idProofNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, idProofNumber: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Allocation */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Room & Bed Allocation
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  Property
                </label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => handlePropertyChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  Room
                </label>
                <select
                  value={formData.roomId}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
                >
                  {formAvailableRooms.length === 0 ? (
                    <option value="">No rooms available</option>
                  ) : (
                    formAvailableRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.roomNumber} ({r.capacity} Sharing)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  Available Bed <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.bedId}
                  onChange={(e) =>
                    setFormData({ ...formData, bedId: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-800 outline-none focus:border-emerald-600"
                >
                  {formAvailableBeds.length === 0 ? (
                    <option value="">No vacant beds in this room</option>
                  ) : (
                    formAvailableBeds.map((b) => (
                      <option key={b.id} value={b.id}>
                        Bed {b.bedNumber} (Vacant)
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Financials & Dates */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                Monthly Rent (₹)
              </label>
              <input
                type="number"
                value={formData.rentAmount}
                onChange={(e) =>
                  setFormData({ ...formData, rentAmount: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                Security Deposit (₹)
              </label>
              <input
                type="number"
                value={formData.securityDeposit}
                onChange={(e) =>
                  setFormData({ ...formData, securityDeposit: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                Check-in Date
              </label>
              <input
                type="date"
                value={formData.checkInDate}
                onChange={(e) =>
                  setFormData({ ...formData, checkInDate: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                Agreement End
              </label>
              <input
                type="date"
                value={formData.agreementEndDate}
                onChange={(e) =>
                  setFormData({ ...formData, agreementEndDate: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Emergency Contact Name
              </label>
              <input
                type="text"
                placeholder="Parent / Guardian Name"
                value={formData.emergencyContactName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContactName: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                placeholder="+91 9988776655"
                value={formData.emergencyContactPhone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContactPhone: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={formAvailableBeds.length === 0}
              size="md"
            >
              Check-in Tenant
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Tenant Modal */}
      <Modal
        isOpen={!!editingTenant}
        onClose={() => setEditingTenant(null)}
        title="Edit Tenant Details"
        subtitle={editingTenant?.fullName ? `Updating details for ${editingTenant.fullName}` : "Edit profile"}
        maxWidth="max-w-2xl"
      >
        {editingTenant && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.fullName}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, fullName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={editFormData.phone}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, phone: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  ID Proof Type
                </label>
                <select
                  value={editFormData.idProofType}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, idProofType: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
                >
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Student / Employee ID">Student / Work ID</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  ID Document Number
                </label>
                <input
                  type="text"
                  value={editFormData.idProofNumber}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      idProofNumber: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                  Monthly Rent (₹)
                </label>
                <input
                  type="number"
                  value={editFormData.rentAmount}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      rentAmount: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                  Security Deposit (₹)
                </label>
                <input
                  type="number"
                  value={editFormData.securityDeposit}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      securityDeposit: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                  Agreement End Date
                </label>
                <input
                  type="date"
                  value={editFormData.agreementEndDate}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      agreementEndDate: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={editFormData.emergencyContactName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      emergencyContactName: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  value={editFormData.emergencyContactPhone}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      emergencyContactPhone: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Notes / Agreement Remarks
              </label>
              <textarea
                rows={2}
                value={editFormData.notes}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, notes: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-emerald-600"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="md"
                onClick={() => setEditingTenant(null)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting} size="md">
                Save Tenant Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Tenant Profile View Modal */}
      <Modal
        isOpen={!!viewingTenant}
        onClose={() => setViewingTenant(null)}
        title="Tenant Information"
        subtitle={viewingTenant?.fullName}
      >
        {viewingTenant && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 border border-slate-200/70">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase">
                  Property & Room
                </span>
                <span className="font-semibold text-slate-800">
                  {viewingTenant.propertyName} (Room {viewingTenant.roomNumber} - Bed {viewingTenant.bedNumber})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase">
                  Status
                </span>
                <Badge
                  variant={viewingTenant.status === "Active" ? "success" : "default"}
                  size="sm"
                >
                  {viewingTenant.status}
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase">
                  Phone
                </span>
                <span className="font-medium text-slate-800">
                  {viewingTenant.phone}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase">
                  Email
                </span>
                <span className="font-medium text-slate-800">
                  {viewingTenant.email || "Not provided"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase">
                  ID Proof
                </span>
                <span className="font-medium text-slate-800">
                  {viewingTenant.idProofType}: {viewingTenant.idProofNumber || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase">
                  Monthly Rent
                </span>
                <span className="font-bold text-emerald-700">
                  ₹{Number(viewingTenant.rentAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-3 border border-slate-100 rounded-xl space-y-1 text-xs">
              <p>
                <strong>Check-in Date:</strong> {viewingTenant.checkInDate || "N/A"}
              </p>
              {viewingTenant.checkOutDate && (
                <p>
                  <strong>Check-out Date:</strong> {viewingTenant.checkOutDate}
                </p>
              )}
              <p>
                <strong>Security Deposit:</strong> ₹{Number(viewingTenant.securityDeposit || 0).toLocaleString()}
              </p>
              <p>
                <strong>Emergency Contact:</strong> {viewingTenant.emergencyContactName || "N/A"} ({viewingTenant.emergencyContactPhone || "N/A"})
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingTenant(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Check-out Confirmation */}
      <ConfirmDialog
        isOpen={!!checkoutTarget}
        onClose={() => setCheckoutTarget(null)}
        onConfirm={handleCheckoutConfirm}
        title={`Check-out "${checkoutTarget?.fullName}"?`}
        message="This will mark the tenant as Checked Out and immediately free their bed for future bookings."
        confirmText="Confirm Check-out"
        confirmVariant="danger"
        loading={submitting}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete tenant record?`}
        message="Are you sure you want to permanently delete this tenant from the system?"
        confirmText="Delete Tenant"
        loading={submitting}
      />
    </div>
  );
}

