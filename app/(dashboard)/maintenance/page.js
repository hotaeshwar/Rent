"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Building,
  Trash2,
  Edit,
  DollarSign,
  Share2,
  Phone,
  MessageSquare,
  Copy,
  Send,
  Eye,
  Check,
  LayoutGrid,
  List,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { subscribeProperties } from "@/lib/repositories/propertyRepo";
import { subscribeStaff } from "@/lib/repositories/staffRepo";
import {
  subscribeMaintenance,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
} from "@/lib/repositories/maintenanceRepo";

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const STATUSES = ["Open", "In Progress", "Resolved", "Cancelled"];
const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Appliance / AC",
  "Cleaning / Pest Control",
  "Masonry / Painting",
  "WiFi / Network",
  "Other",
];

export default function MaintenancePage() {
  const { user, userProfile } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [properties, setProperties] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Mode: grid or table
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [viewingTicket, setViewingTicket] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // WhatsApp Share Modal
  const [whatsappTicket, setWhatsappTicket] = useState(null);
  const [whatsappPhone, setWhatsappPhone] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Plumbing",
    propertyId: "",
    roomNumber: "",
    priority: "Medium",
    status: "Open",
    assignedStaffId: "",
    estimatedCost: "0",
    actualCost: "0",
  });

  useEffect(() => {
    if (!user?.uid) return;

    const unsubProps = subscribeProperties(user.uid, (data) => setProperties(data));
    const unsubStaff = subscribeStaff(user.uid, (data) => setStaffMembers(data));
    const unsubMaint = subscribeMaintenance(user.uid, (data) => {
      setRequests(data);
      setLoading(false);
    });

    return () => {
      unsubProps();
      unsubStaff();
      unsubMaint();
    };
  }, [user?.uid]);

  const handleOpenAdd = () => {
    setEditingRequest(null);
    setFormData({
      title: "",
      description: "",
      category: "Plumbing",
      propertyId: properties[0]?.id || "",
      roomNumber: "",
      priority: "Medium",
      status: "Open",
      assignedStaffId: "",
      estimatedCost: "0",
      actualCost: "0",
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (req) => {
    const ticketNumber = req.ticketNumber || `TKT-${(req.id || '').slice(-6).toUpperCase()}`;
    setEditingRequest(req);
    setFormData({
      ticketNumber,
      title: req.title || "",
      description: req.description || "",
      category: req.category || "Plumbing",
      propertyId: req.propertyId || "",
      roomNumber: req.roomNumber || "",
      priority: req.priority || "Medium",
      status: req.status || "Open",
      assignedStaffId: req.assignedStaffId || "",
      estimatedCost: String(req.estimatedCost || "0"),
      actualCost: String(req.actualCost || "0"),
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("Issue title is required", "error");
      return;
    }

    const prop = properties.find((p) => p.id === formData.propertyId);
    const assignedStaff = staffMembers.find((s) => s.id === formData.assignedStaffId);
    const ticketNumber = formData.ticketNumber || editingRequest?.ticketNumber || `TKT-${Date.now().toString().slice(-6)}`;

    const payload = {
      ...formData,
      ticketNumber,
      propertyName: prop?.name || "",
      assignedStaffName: assignedStaff?.fullName || "Unassigned",
      assignedStaffPhone: assignedStaff?.phone || "",
      estimatedCost: Number(formData.estimatedCost) || 0,
      actualCost: Number(formData.actualCost) || 0,
    };

    try {
      setSubmitting(true);
      if (editingRequest) {
        await updateMaintenanceRequest(user.uid, editingRequest.id, payload);
        showToast(`Maintenance ticket #${ticketNumber} updated!`);
      } else {
        await createMaintenanceRequest(user.uid, payload);
        showToast(`New maintenance ticket #${ticketNumber} created!`);
      }
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Save maintenance error:", err);
      showToast("Failed to save request: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      await deleteMaintenanceRequest(user.uid, deleteTarget.id);
      showToast("Maintenance ticket deleted.");
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete request error:", err);
      showToast("Failed to delete request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (req, newStatus) => {
    try {
      await updateMaintenanceRequest(user.uid, req.id, {
        status: newStatus,
        resolvedAt: newStatus === "Resolved" ? new Date().toISOString() : null,
      });
      showToast(`Ticket status updated to ${newStatus}`);
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  // Open WhatsApp Share Dialog (ensuring all ticket properties are fully populated)
  const handleOpenWhatsApp = (req) => {
    const ticketNo = req.ticketNumber || `TKT-${(req.id || "").slice(-6).toUpperCase()}`;
    const staff = staffMembers.find((s) => s.id === req.assignedStaffId);
    const prop = properties.find((p) => p.id === req.propertyId);
    setWhatsappTicket({
      ...req,
      ticketNumber: ticketNo,
      propertyName: req.propertyName || prop?.name || userProfile?.businessName || "BiD PG",
      assignedStaffName: req.assignedStaffName || staff?.fullName || "Unassigned",
    });
    setWhatsappPhone(staff?.phone || req.assignedStaffPhone || "");
  };

  // Build Formatted WhatsApp Message (Emoji-free, professional text work order)
  const getWhatsAppMessageText = () => {
    if (!whatsappTicket) return "";
    const ticketNo = whatsappTicket.ticketNumber || `TKT-${(whatsappTicket.id || "").slice(-6).toUpperCase()}`;
    const pgName = whatsappTicket.propertyName || userProfile?.businessName || "BiD PG & Rental Hostel";
    const loc = whatsappTicket.roomNumber ? `Room ${whatsappTicket.roomNumber}` : "Common Area / General";
    const staffName = whatsappTicket.assignedStaffName || "Unassigned";
    const estCost = Number(whatsappTicket.estimatedCost || 0).toLocaleString();
    const actCost = Number(whatsappTicket.actualCost || 0).toLocaleString();

    return `*MAINTENANCE WORK ORDER - ${pgName.toUpperCase()}*
Ticket ID: #${ticketNo}
Issue Name: ${whatsappTicket.title}

*Details:*
- Property: ${pgName}
- Location: ${loc}
- Category: ${whatsappTicket.category || "General"}
- Priority: ${whatsappTicket.priority?.toUpperCase() || "MEDIUM"}
- Current Status: ${whatsappTicket.status?.toUpperCase() || "OPEN"}
- Assigned Technician: ${staffName}
- Estimated Cost: Rs. ${estCost}
${Number(whatsappTicket.actualCost || 0) > 0 ? `- Actual Incurred Cost: Rs. ${actCost}\n` : ""}
*Problem Description:*
${whatsappTicket.description ? whatsappTicket.description : "No additional description provided."}

Please inspect and resolve this maintenance issue.

View Work Order Card:
https://Rent.buildingindiadigital.com

Issued by: ${pgName}
BiD Rent Manager`;
  };

  const handleNativeShareCard = async () => {
    if (!whatsappTicket) return;
    const ticketNo = whatsappTicket.ticketNumber || `TKT-${(whatsappTicket.id || "").slice(-6).toUpperCase()}`;
    const pgName = whatsappTicket.propertyName || userProfile?.businessName || "BiD Rent Manager";
    const shareData = {
      title: `${pgName} - Maintenance #${ticketNo}`,
      text: `Maintenance Ticket #${ticketNo}: ${whatsappTicket.title}. View online:`,
      url: "https://Rent.buildingindiadigital.com",
    };

    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast("Maintenance ticket card shared successfully!");
      } catch (err) {
        if (err.name !== "AbortError") {
          handleShareWhatsApp();
        }
      }
    } else {
      handleShareWhatsApp();
    }
  };

  const handleShareWhatsApp = () => {
    if (!whatsappTicket) return;

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
    showToast("Opening WhatsApp with maintenance work order!");
  };

  const handleCopyWhatsAppMessage = () => {
    const message = getWhatsAppMessageText();
    navigator.clipboard.writeText(message);
    showToast("Maintenance ticket message copied to clipboard!");
  };

  // Filtered requests
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.propertyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.assignedStaffName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || r.status === statusFilter;
    const matchesPriority =
      priorityFilter === "All" || r.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Maintenance & Repairs
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Track reported issues with ticket numbers, assign technicians, share via WhatsApp, and monitor costs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="hidden sm:inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "grid" ? "bg-slate-100 text-emerald-800" : "text-slate-400 hover:text-slate-700"
              }`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "table" ? "bg-slate-100 text-emerald-800" : "text-slate-400 hover:text-slate-700"
              }`}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>

          <Button onClick={handleOpenAdd} icon={Plus} size="md">
            Log New Ticket
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search tickets by #TKT number, issue name, property, room, or staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs sm:text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-emerald-600"
          >
            <option value="All">All Statuses ({requests.length})</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-emerald-600"
          >
            <option value="All">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tickets List */}
      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No maintenance tickets found"
          description="Log plumbing, electrical, or appliance issues to assign technicians and track resolution."
          actionLabel="Log Maintenance Ticket"
          onAction={handleOpenAdd}
        />
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((req) => {
            const ticketNo = req.ticketNumber || `TKT-${(req.id || "").slice(-6).toUpperCase()}`;
            const isResolved = req.status === "Resolved";

            return (
              <div
                key={req.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:shadow-md hover:border-slate-300"
              >
                <div>
                  {/* Top Badge Bar: Ticket Number & Priority */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      #{ticketNo}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={
                          req.priority === "Urgent"
                            ? "danger"
                            : req.priority === "High"
                            ? "warning"
                            : "default"
                        }
                        size="sm"
                      >
                        {req.priority}
                      </Badge>
                      <Badge
                        variant={
                          req.status === "Resolved"
                            ? "success"
                            : req.status === "In Progress"
                            ? "info"
                            : req.status === "Cancelled"
                            ? "default"
                            : "warning"
                        }
                        size="sm"
                      >
                        {req.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Issue Name with prominent title */}
                  <h3 className="font-bold text-slate-900 text-base line-clamp-1 hover:text-emerald-800 transition-colors cursor-pointer" onClick={() => setViewingTicket(req)}>
                    {req.title}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                    {req.description || "No detailed description provided."}
                  </p>

                  {/* Metadata Grid */}
                  <div className="mt-3.5 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Location:</span>
                      <span className="font-medium text-slate-800">
                        {req.propertyName || "Property"} {req.roomNumber ? `• Room ${req.roomNumber}` : ""}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Category:</span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        {req.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Assigned To:</span>
                      <span className="font-medium text-slate-800">
                        {req.assignedStaffName || "Unassigned"}
                      </span>
                    </div>

                    {Number(req.actualCost || 0) > 0 ? (
                      <div className="flex items-center justify-between font-semibold text-rose-700">
                        <span>Actual Cost:</span>
                        <span>₹{Number(req.actualCost).toLocaleString()}</span>
                      </div>
                    ) : Number(req.estimatedCost || 0) > 0 ? (
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Est. Cost:</span>
                        <span>₹{Number(req.estimatedCost).toLocaleString()}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Card Bottom Actions: Status Select, WhatsApp, Edit, Delete */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5">
                    {/* Quick Status Dropdown */}
                    <select
                      value={req.status}
                      onChange={(e) => handleQuickStatusChange(req, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer shadow-2xs"
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* View Details */}
                    <button
                      type="button"
                      onClick={() => setViewingTicket(req)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                      title="View Details"
                    >
                      <Eye size={15} />
                    </button>

                    {/* WhatsApp Share Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(req)}
                      className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      title="Share via WhatsApp"
                    >
                      <Share2 size={15} />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(req)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-700 transition-colors"
                      title="Edit Ticket"
                    >
                      <Edit size={15} />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(req)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete Ticket"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 sm:pl-6">Ticket # & Issue</th>
                  <th className="px-3 py-3.5">Category</th>
                  <th className="px-3 py-3.5">Location</th>
                  <th className="px-3 py-3.5">Assigned To</th>
                  <th className="px-3 py-3.5">Priority</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="py-3.5 pl-3 pr-4 text-right sm:pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRequests.map((req) => {
                  const ticketNo = req.ticketNumber || `TKT-${(req.id || "").slice(-6).toUpperCase()}`;
                  return (
                    <tr key={req.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="py-3.5 pl-4 pr-3 sm:pl-6">
                        <span className="font-mono text-xs font-bold text-emerald-800 block">
                          #{ticketNo}
                        </span>
                        <span className="font-semibold text-slate-900 block mt-0.5">
                          {req.title}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                          {req.category}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-slate-700 font-medium">
                        {req.propertyName || "Property"} {req.roomNumber ? `• Room ${req.roomNumber}` : ""}
                      </td>
                      <td className="px-3 py-3.5 font-medium text-slate-800">
                        {req.assignedStaffName || "Unassigned"}
                      </td>
                      <td className="px-3 py-3.5">
                        <Badge
                          variant={
                            req.priority === "Urgent"
                              ? "danger"
                              : req.priority === "High"
                              ? "warning"
                              : "default"
                          }
                          size="sm"
                        >
                          {req.priority}
                        </Badge>
                      </td>
                      <td className="px-3 py-3.5">
                        <select
                          value={req.status}
                          onChange={(e) => handleQuickStatusChange(req, e.target.value)}
                          className="rounded-full px-2.5 py-0.5 text-xs font-semibold border cursor-pointer outline-none bg-slate-50 text-slate-700 border-slate-200"
                        >
                          {STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 pl-3 pr-4 text-right sm:pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingTicket(req)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                            title="View"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsApp(req)}
                            className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            title="Share via WhatsApp"
                          >
                            <Share2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(req)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-700"
                            title="Edit"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(req)}
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

      {/* Add / Edit Request Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingRequest ? "Update Maintenance Ticket" : "Log Maintenance Request"}
        subtitle="Specify issue details, priority, and assign maintenance personnel"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {editingRequest && (
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Ticket Number</span>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  #{formData.ticketNumber || `TKT-${(editingRequest.id || '').slice(-6).toUpperCase()}`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Status</span>
                <span className="font-semibold text-slate-800">{formData.status}</span>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Issue Title / Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bathroom Geyser not heating, AC water leakage"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Description / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Provide exact problem details..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Property
              </label>
              <select
                value={formData.propertyId}
                onChange={(e) =>
                  setFormData({ ...formData, propertyId: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Room Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 102"
                value={formData.roomNumber}
                onChange={(e) =>
                  setFormData({ ...formData, roomNumber: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Assign Staff Member
              </label>
              <select
                value={formData.assignedStaffId}
                onChange={(e) =>
                  setFormData({ ...formData, assignedStaffId: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
              >
                <option value="">Unassigned</option>
                {staffMembers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 font-semibold"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Estimated Cost (₹)
              </label>
              <input
                type="number"
                value={formData.estimatedCost}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedCost: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Actual Cost Incurred (₹)
              </label>
              <input
                type="number"
                value={formData.actualCost}
                onChange={(e) =>
                  setFormData({ ...formData, actualCost: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
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
            <Button type="submit" loading={submitting} size="md">
              {editingRequest ? "Save Ticket Changes" : "Create Ticket"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Ticket Details View Modal */}
      <Modal
        isOpen={!!viewingTicket}
        onClose={() => setViewingTicket(null)}
        title="Maintenance Ticket Details"
        subtitle={`#${viewingTicket?.ticketNumber || 'TKT-000000'} • ${viewingTicket?.title}`}
        maxWidth="max-w-lg"
      >
        {viewingTicket && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                  #{viewingTicket.ticketNumber || "TKT-000000"}
                </span>
                <div className="flex gap-1.5">
                  <Badge variant={viewingTicket.priority === "Urgent" ? "danger" : "default"} size="sm">
                    {viewingTicket.priority} Priority
                  </Badge>
                  <Badge variant={viewingTicket.status === "Resolved" ? "success" : "warning"} size="sm">
                    {viewingTicket.status}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Issue Title
                </span>
                <p className="font-bold text-slate-900 text-base">{viewingTicket.title}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Description
                </span>
                <p className="text-slate-600">{viewingTicket.description || "No further details provided."}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Location:</span>
                  <span className="font-medium text-slate-800">{viewingTicket.propertyName} (Room {viewingTicket.roomNumber || "Common"})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Category:</span>
                  <span className="font-medium text-slate-800">{viewingTicket.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Assigned To:</span>
                  <span className="font-medium text-slate-800">{viewingTicket.assignedStaffName || "Unassigned"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Estimated Cost:</span>
                  <span className="font-bold text-slate-900">₹{Number(viewingTicket.estimatedCost || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                icon={Share2}
                onClick={() => {
                  const t = viewingTicket;
                  setViewingTicket(null);
                  handleOpenWhatsApp(t);
                }}
              >
                Share via WhatsApp
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const t = viewingTicket;
                    setViewingTicket(null);
                    handleOpenEdit(t);
                  }}
                  icon={Edit}
                >
                  Edit
                </Button>
                <Button size="sm" onClick={() => setViewingTicket(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* WhatsApp Share Modal */}
      <Modal
        isOpen={!!whatsappTicket}
        onClose={() => setWhatsappTicket(null)}
        title="Share Maintenance Ticket via WhatsApp"
        subtitle={`#${whatsappTicket?.ticketNumber || 'TKT'} • ${whatsappTicket?.title}`}
        maxWidth="max-w-md"
      >
        {whatsappTicket && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-950 font-bold">
                <MessageSquare size={16} className="text-emerald-700" />
                <span>Dispatch Ticket to Technician or Staff</span>
              </div>
              <p className="text-[11px] text-emerald-900/80">
                Enter or verify the recipient&apos;s WhatsApp number (e.g. plumber, electrician, warden, or tenant):
              </p>

              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  placeholder="Recipient mobile number (e.g. 9876543210)"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs sm:text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
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
                    {whatsappTicket.propertyName || "BiD Rent Manager"}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                    #{whatsappTicket.ticketNumber || "TKT"}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-800 truncate mt-0.5">
                  Maintenance • {whatsappTicket.title}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  Category: {whatsappTicket.category || "General"} • Status: {whatsappTicket.status || "Open"}
                </p>
              </div>
            </div>

            {/* Message Preview Box */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] text-slate-700 space-y-1 max-h-48 overflow-y-auto whitespace-pre-wrap">
              {getWhatsAppMessageText()}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                icon={Copy}
                onClick={handleCopyWhatsAppMessage}
              >
                Copy Text
              </Button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleNativeShareCard}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
                  title="Share Card via device share sheet"
                >
                  <Share2 size={13} />
                  <span>Share Card</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors"
                >
                  <Send size={13} />
                  <span>Send on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete maintenance ticket?`}
        message={`Are you sure you want to permanently delete ticket #${deleteTarget?.ticketNumber || ''} (${deleteTarget?.title})?`}
        confirmText="Delete Ticket"
        loading={submitting}
      />
    </div>
  );
}
