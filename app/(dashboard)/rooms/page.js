"use client";

import React, { useState, useEffect } from "react";
import {
  BedDouble,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  User,
  CheckCircle2,
  AlertCircle,
  Building,
  Wrench,
  Check,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { subscribeProperties } from "@/lib/repositories/propertyRepo";
import {
  subscribeRooms,
  subscribeBeds,
  createRoomWithBeds,
  deleteRoomAndBeds,
  updateRoom,
  updateBedStatus,
} from "@/lib/repositories/roomBedRepo";

const ROOM_TYPES = [
  { label: "Single Private Room (1 Bed)", capacity: 1 },
  { label: "2 Sharing / Double (2 Beds)", capacity: 2 },
  { label: "3 Sharing / Triple (3 Beds)", capacity: 3 },
  { label: "4 Sharing / Quad (4 Beds)", capacity: 4 },
];

export default function RoomsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedPropertyId, setSelectedPropertyId] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State (Create)
  const [formData, setFormData] = useState({
    propertyId: "",
    roomNumber: "",
    floor: "1",
    capacity: 2,
    rentAmount: "8000",
    securityDeposit: "10000",
    amenities: "Attached Washroom, Balcony, Wardrobe",
  });

  // Edit Room State (Update)
  const [editingRoom, setEditingRoom] = useState(null);
  const [editFormData, setEditFormData] = useState({
    roomNumber: "",
    floor: "1",
    rentAmount: "8000",
    securityDeposit: "10000",
    amenities: "",
  });

  // Delete State (Delete)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubProps = subscribeProperties(user.uid, (data) => {
      setProperties(data);
      if (data.length > 0 && !formData.propertyId) {
        setFormData((prev) => ({ ...prev, propertyId: data[0].id }));
      }
    });

    const unsubRooms = subscribeRooms(user.uid, (data) => {
      setRooms(data);
      setLoading(false);
    });

    const unsubBeds = subscribeBeds(user.uid, (data) => {
      setBeds(data);
    });

    return () => {
      unsubProps();
      unsubRooms();
      unsubBeds();
    };
  }, [user?.uid]);

  const handleOpenAdd = () => {
    if (properties.length === 0) {
      showToast("Please register a property first before adding rooms.", "error");
      return;
    }
    setFormData({
      propertyId: properties[0]?.id || "",
      roomNumber: "",
      floor: "1",
      capacity: 2,
      rentAmount: "8000",
      securityDeposit: "10000",
      amenities: "Attached Washroom, Balcony, Wardrobe",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setEditFormData({
      roomNumber: room.roomNumber || "",
      floor: String(room.floor || "1"),
      rentAmount: String(room.rentAmount || "8000"),
      securityDeposit: String(room.securityDeposit || "10000"),
      amenities: room.amenities || "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.roomNumber.trim()) {
      showToast("Room number is required", "error");
      return;
    }
    if (!formData.propertyId) {
      showToast("Please select a property", "error");
      return;
    }

    const prop = properties.find((p) => p.id === formData.propertyId);

    try {
      setSubmitting(true);
      await createRoomWithBeds(user.uid, {
        ...formData,
        propertyName: prop?.name || "",
        capacity: Number(formData.capacity),
        rentAmount: Number(formData.rentAmount),
        securityDeposit: Number(formData.securityDeposit),
      });
      showToast(`Room ${formData.roomNumber} with ${formData.capacity} beds created successfully!`);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Create room error:", err);
      showToast("Failed to create room: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingRoom) return;

    try {
      setSubmitting(true);
      await updateRoom(user.uid, editingRoom.id, {
        roomNumber: editFormData.roomNumber.trim(),
        floor: Number(editFormData.floor) || 1,
        rentAmount: Number(editFormData.rentAmount) || 0,
        securityDeposit: Number(editFormData.securityDeposit) || 0,
        amenities: editFormData.amenities,
      });
      showToast(`Room ${editFormData.roomNumber} updated successfully!`);
      setEditingRoom(null);
    } catch (err) {
      console.error("Edit room error:", err);
      showToast("Failed to update room: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteRoomAndBeds(user.uid, deleteTarget.id);
      showToast("Room and associated beds deleted successfully.");
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete room error:", err);
      showToast("Failed to delete room.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleBedStatus = async (bed) => {
    if (bed.status === "Occupied") {
      showToast(`Bed ${bed.bedNumber} is currently occupied by ${bed.currentTenantName}. Please check out the tenant first.`, "info");
      return;
    }
    const newStatus = bed.status === "Available" ? "Maintenance" : "Available";
    try {
      await updateBedStatus(user.uid, bed.id, newStatus);
      showToast(`Bed ${bed.bedNumber} marked as ${newStatus}!`);
    } catch (err) {
      showToast("Failed to update bed status", "error");
    }
  };

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    const matchesProp =
      selectedPropertyId === "All" || r.propertyId === selectedPropertyId;
    const matchesSearch =
      r.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.propertyName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProp && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Rooms & Beds Management
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Configure room capacities, edit accommodations, toggle bed availability, and track occupancy
          </p>
        </div>

        <Button onClick={handleOpenAdd} icon={Plus} size="md">
          Add Room & Beds
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
            placeholder="Search by room number or building..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs sm:text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400 shrink-0" />
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-emerald-600"
          >
            <option value="All">All Properties ({rooms.length} rooms)</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rooms List */}
      {filteredRooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="No rooms created yet"
          description={
            searchQuery || selectedPropertyId !== "All"
              ? "No rooms match your search query or property filter."
              : "Set up your rooms and bed capacities to begin checking in tenants."
          }
          actionLabel="Add Room & Beds"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => {
            // Find beds for this room
            const roomBeds = beds.filter((b) => b.roomId === room.id);
            const occupiedCount = roomBeds.filter((b) => b.status === "Occupied").length;
            const isFull = occupiedCount >= (room.capacity || 1);

            return (
              <div
                key={room.id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs transition-all duration-200 hover:shadow-md"
              >
                {/* Room Header */}
                <div className="border-b border-slate-100 p-4 bg-slate-50/60">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg text-slate-900">
                          Room {room.roomNumber}
                        </span>
                        <Badge
                          variant={isFull ? "danger" : "success"}
                          size="sm"
                        >
                          {isFull ? "Full" : `${room.capacity - occupiedCount} Vacant`}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Building size={12} className="text-slate-400" />
                        {room.propertyName || "Property"} • Floor {room.floor || 1}
                      </p>
                    </div>

                    {/* Edit and Delete Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(room)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-700 transition-colors"
                        title="Edit room"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(room)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete room"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-xs text-slate-600">
                  <span>
                    Rent: <strong className="text-slate-900 font-semibold">₹{Number(room.rentAmount || 0).toLocaleString()}/mo</strong>
                  </span>
                  <span>
                    Deposit: <strong className="text-slate-900 font-semibold">₹{Number(room.securityDeposit || 0).toLocaleString()}</strong>
                  </span>
                </div>

                {/* Individual Beds Grid */}
                <div className="p-4 space-y-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Beds & Tenant Status ({occupiedCount}/{room.capacity || 1} Occupied)
                  </p>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {roomBeds.map((bed) => {
                      const isOccupied = bed.status === "Occupied";
                      const isMaintenance = bed.status === "Maintenance";

                      return (
                        <div
                          key={bed.id}
                          className={`rounded-xl border p-2.5 text-xs transition-colors ${
                            isOccupied
                              ? "border-emerald-200 bg-emerald-50/50 text-emerald-950"
                              : isMaintenance
                              ? "border-amber-200 bg-amber-50/50 text-amber-950"
                              : "border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Bed {bed.bedNumber}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleBedStatus(bed)}
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all ${
                                isOccupied
                                  ? "bg-emerald-100 text-emerald-800 cursor-default"
                                  : isMaintenance
                                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                              title={isOccupied ? "Occupied by active tenant" : "Click to toggle Available / Maintenance"}
                            >
                              {bed.status}
                            </button>
                          </div>

                          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                            <User size={12} className={isOccupied ? "text-emerald-700" : "text-slate-400"} />
                            <span className="truncate">
                              {bed.currentTenantName || (isMaintenance ? "Under Maintenance" : "Vacant")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Room Modal (Create) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Room & Provision Beds"
        subtitle="Specify room number, sharing capacity, floor, and monthly rent"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Select Property <span className="text-red-500">*</span>
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
                  {p.name} ({p.type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Room Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 101, A-202"
                value={formData.roomNumber}
                onChange={(e) =>
                  setFormData({ ...formData, roomNumber: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Floor
              </label>
              <input
                type="number"
                min="0"
                value={formData.floor}
                onChange={(e) =>
                  setFormData({ ...formData, floor: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Room Sharing Capacity
            </label>
            <select
              value={formData.capacity}
              onChange={(e) =>
                setFormData({ ...formData, capacity: Number(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
            >
              {ROOM_TYPES.map((rt) => (
                <option key={rt.capacity} value={rt.capacity}>
                  {rt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              BiD Rent Manager will automatically generate {formData.capacity} tracked bed slots for this room.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Rent / Bed (₹/mo)
              </label>
              <input
                type="number"
                min="0"
                value={formData.rentAmount}
                onChange={(e) =>
                  setFormData({ ...formData, rentAmount: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Security Deposit (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.securityDeposit}
                onChange={(e) =>
                  setFormData({ ...formData, securityDeposit: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Room Amenities
            </label>
            <input
              type="text"
              placeholder="e.g. Attached Washroom, Balcony, Wardrobe"
              value={formData.amenities}
              onChange={(e) =>
                setFormData({ ...formData, amenities: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} size="md">
              Create Room
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Room Modal (Update) */}
      <Modal
        isOpen={!!editingRoom}
        onClose={() => setEditingRoom(null)}
        title="Edit Room Details"
        subtitle={`Updating Room ${editingRoom?.roomNumber}`}
      >
        {editingRoom && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Room Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.roomNumber}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, roomNumber: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Floor
                </label>
                <input
                  type="number"
                  min="0"
                  value={editFormData.floor}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, floor: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Rent / Bed (₹/mo)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editFormData.rentAmount}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, rentAmount: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Security Deposit (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editFormData.securityDeposit}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      securityDeposit: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Room Amenities
              </label>
              <input
                type="text"
                value={editFormData.amenities}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, amenities: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="md"
                onClick={() => setEditingRoom(null)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting} size="md">
                Save Room Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation (Delete) */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete Room ${deleteTarget?.roomNumber}?`}
        message="Deleting this room will also remove all its beds and associated tracking. Proceed?"
        confirmText="Delete Room"
        loading={deleting}
      />
    </div>
  );
}
