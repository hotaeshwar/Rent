"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Layers,
  BedDouble,
  CheckCircle,
  MoreVertical,
  Edit,
  Trash2,
  Filter,
  ExternalLink,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import {
  subscribeProperties,
  createProperty,
  updateProperty,
  deleteProperty,
} from "@/lib/repositories/propertyRepo";

const PROPERTY_TYPES = [
  "PG",
  "Hostel",
  "Apartment",
  "Independent House",
  "Rental Room",
  "Co-living Space",
];

const AVAILABLE_AMENITIES = [
  "High-Speed Wi-Fi",
  "Air Conditioning",
  "Mess / Daily Food",
  "Washing Machine / Laundry",
  "Power Backup / Inverter",
  "RO Drinking Water",
  "CCTV Surveillance",
  "Parking Space",
  "Water Geyser",
  "Daily Housekeeping",
  "Refrigerator",
  "Elevator / Lift",
];

export default function PropertiesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    type: "PG",
    address: "",
    city: "",
    state: "",
    pincode: "",
    totalFloors: "2",
    totalRooms: "10",
    totalBeds: "20",
    description: "",
    status: "Active",
    amenities: ["High-Speed Wi-Fi", "RO Drinking Water", "Daily Housekeeping"],
  });

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeProperties(user.uid, (data) => {
      setProperties(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user?.uid]);

  const handleOpenAdd = () => {
    setEditingProperty(null);
    setFormData({
      name: "",
      type: "PG",
      address: "",
      city: "",
      state: "",
      pincode: "",
      totalFloors: "2",
      totalRooms: "10",
      totalBeds: "20",
      description: "",
      status: "Active",
      amenities: ["High-Speed Wi-Fi", "RO Drinking Water", "Daily Housekeeping"],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name || "",
      type: property.type || "PG",
      address: property.address || "",
      city: property.city || "",
      state: property.state || "",
      pincode: property.pincode || "",
      totalFloors: property.totalFloors || "1",
      totalRooms: property.totalRooms || "0",
      totalBeds: property.totalBeds || "0",
      description: property.description || "",
      status: property.status || "Active",
      amenities: property.amenities || [],
    });
    setIsModalOpen(true);
  };

  const toggleAmenity = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Property name is required", "error");
      return;
    }

    try {
      setSubmitting(true);
      if (editingProperty) {
        await updateProperty(user.uid, editingProperty.id, formData);
        showToast("Property updated successfully!");
      } else {
        await createProperty(user.uid, formData);
        showToast("New property registered successfully!");
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Save property error:", err);
      showToast("Failed to save property. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteProperty(user.uid, deleteTarget.id);
      showToast("Property deleted successfully.");
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete property error:", err);
      showToast("Failed to delete property.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "All" || p.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            My Properties & Hostels
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Manage your buildings, PG locations, and rental estates
          </p>
        </div>

        <Button onClick={handleOpenAdd} icon={Plus} size="md">
          Add Property
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
            placeholder="Search properties by name, city, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs sm:text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400 shrink-0" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-emerald-600"
          >
            <option value="All">All Property Types</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Properties Cards Grid */}
      {filteredProperties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties found"
          description={
            searchQuery || filterType !== "All"
              ? "No property matches your current filter criteria."
              : "Get started by registering your first PG, hostel, or rental building."
          }
          actionLabel="Add New Property"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((prop) => (
            <div
              key={prop.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs transition-all duration-200 hover:shadow-md hover:border-slate-300"
            >
              {/* Card Header with Category and Status */}
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="emerald" size="sm">
                        {prop.type || "PG"}
                      </Badge>
                      <Badge
                        variant={prop.status === "Active" ? "success" : "default"}
                        size="sm"
                      >
                        {prop.status || "Active"}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                      {prop.name}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(prop)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-700 transition-colors"
                      title="Edit property"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(prop)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete property"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-1 text-xs text-slate-500 line-clamp-1">
                  <MapPin size={13} className="shrink-0 text-slate-400" />
                  <span>
                    {prop.address
                      ? `${prop.address}, ${prop.city || ""}`
                      : prop.city || "Address not specified"}
                  </span>
                </div>
              </div>

              {/* Stats & Details */}
              <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50 py-3 text-center">
                <div>
                  <span className="block text-[10px] font-semibold uppercase text-slate-400">
                    Floors
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {prop.totalFloors || 1}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold uppercase text-slate-400">
                    Rooms
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {prop.totalRooms || 0}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold uppercase text-slate-400">
                    Capacity
                  </span>
                  <span className="text-sm font-bold text-emerald-700">
                    {prop.totalBeds || 0} Beds
                  </span>
                </div>
              </div>

              {/* Amenities Preview */}
              <div className="p-4 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Amenities
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(prop.amenities || []).slice(0, 4).map((amenity, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                    >
                      {amenity}
                    </span>
                  ))}
                  {(prop.amenities || []).length > 4 && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      +{(prop.amenities || []).length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Property Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProperty ? "Edit Property Details" : "Register New Property"}
        subtitle="Provide property location, structure, and guest amenities"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Property / PG Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Green Meadows Luxury PG"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Property Category
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Street Address
            </label>
            <input
              type="text"
              placeholder="e.g. 104, 5th Cross, Koramangala"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                City
              </label>
              <input
                type="text"
                placeholder="Bengaluru"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                State
              </label>
              <input
                type="text"
                placeholder="Karnataka"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Pincode
              </label>
              <input
                type="text"
                placeholder="560034"
                value={formData.pincode}
                onChange={(e) =>
                  setFormData({ ...formData, pincode: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Total Floors
              </label>
              <input
                type="number"
                min="1"
                value={formData.totalFloors}
                onChange={(e) =>
                  setFormData({ ...formData, totalFloors: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Rooms Count
              </label>
              <input
                type="number"
                min="1"
                value={formData.totalRooms}
                onChange={(e) =>
                  setFormData({ ...formData, totalRooms: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Bed Capacity
              </label>
              <input
                type="number"
                min="1"
                value={formData.totalBeds}
                onChange={(e) =>
                  setFormData({ ...formData, totalBeds: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Amenities Multi-Select */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Select Amenities
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AVAILABLE_AMENITIES.map((amenity) => {
                const selected = formData.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors ${
                      selected
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-medium"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <CheckCircle
                      size={14}
                      className={selected ? "text-emerald-600" : "text-slate-300"}
                    />
                    <span className="truncate">{amenity}</span>
                  </button>
                );
              })}
            </div>
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
              {editingProperty ? "Save Changes" : "Create Property"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.name}"?`}
        message="Are you sure you want to delete this property? This will permanently remove its record."
        confirmText="Delete Property"
        loading={deleting}
      />
    </div>
  );
}

