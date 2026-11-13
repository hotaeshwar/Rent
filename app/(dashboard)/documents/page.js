"use client";

import React, { useState, useEffect } from "react";
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  Trash2,
  Download,
  Eye,
  FileText,
  UploadCloud,
  File,
  HardDrive,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import {
  subscribeDocuments,
  uploadDocumentFile,
  saveDocumentRecord,
  deleteDocumentRecord,
} from "@/lib/repositories/documentRepo";

const CATEGORIES = [
  "Lease Agreement",
  "Tenant ID Proof",
  "Property Document",
  "Utility Bill",
  "Tax Receipt",
  "Maintenance Invoice",
  "Other",
];

export default function DocumentsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Upload Form
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "Lease Agreement",
    notes: "",
  });

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeDocuments(user.uid, (data) => {
      setDocuments(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user?.uid]);

  const handleOpenUpload = () => {
    setSelectedFile(null);
    setFormData({
      title: "",
      category: "Lease Agreement",
      notes: "",
    });
    setIsUploadModalOpen(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!formData.title) {
        setFormData((prev) => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, ""),
        }));
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast("Please choose a file to upload", "error");
      return;
    }
    if (!formData.title.trim()) {
      showToast("Document title is required", "error");
      return;
    }

    try {
      setSubmitting(true);
      // Upload to Firebase Storage
      const uploadRes = await uploadDocumentFile(user.uid, selectedFile, "documents");

      // Save record in Firestore
      await saveDocumentRecord(user.uid, {
        title: formData.title.trim(),
        category: formData.category,
        notes: formData.notes,
        fileUrl: uploadRes.downloadURL,
        storagePath: uploadRes.storagePath,
        fileName: uploadRes.fileName,
        fileSize: uploadRes.fileSize,
        fileType: uploadRes.fileType,
        uploadedAt: new Date().toISOString(),
      });

      showToast("Document uploaded securely to Firebase Storage!");
      setIsUploadModalOpen(false);
    } catch (err) {
      console.error("Upload document error:", err);
      showToast("Failed to upload document: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      await deleteDocumentRecord(user.uid, deleteTarget.id, deleteTarget.storagePath);
      showToast("Document deleted successfully.");
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete document error:", err);
      showToast("Failed to delete document", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.fileName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      categoryFilter === "All" || d.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Documents & Cloud Vault
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Securely store tenant agreements, Aadhaar ID proofs, utility bills, and tax certificates
          </p>
        </div>

        <Button onClick={handleOpenUpload} icon={UploadCloud} size="md">
          Upload Document
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
            placeholder="Search documents by title or file name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs sm:text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-emerald-600"
          >
            <option value="All">All Categories ({documents.length})</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No documents uploaded yet"
          description="Keep your rental contracts, tenant ID cards, and tax documents backed up in your Firebase vault."
          actionLabel="Upload First Document"
          onAction={handleOpenUpload}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <FileText size={20} />
                  </div>
                  <Badge variant="emerald" size="sm">
                    {doc.category}
                  </Badge>
                </div>

                <h3 className="font-bold text-slate-900 text-sm line-clamp-1 mt-1">
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {doc.fileName}
                </p>

                {doc.notes && (
                  <p className="mt-2 text-[11px] text-slate-400 line-clamp-2">
                    {doc.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>
                  {doc.fileSize
                    ? `${(doc.fileSize / 1024).toFixed(1)} KB`
                    : "File"}
                </span>

                <div className="flex items-center gap-1.5">
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-700 transition-colors"
                      title="Open Document"
                    >
                      <Eye size={15} />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(doc)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload to Secure Cloud Vault"
        subtitle="Documents are encrypted and isolated to your owner account"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Select File <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-emerald-500 transition-colors cursor-pointer bg-slate-50/50">
              <UploadCloud size={28} className="text-emerald-600 mb-2" />
              <input
                type="file"
                id="docFile"
                required
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx"
              />
              <label
                htmlFor="docFile"
                className="cursor-pointer text-xs font-semibold text-emerald-800 hover:underline"
              >
                {selectedFile ? selectedFile.name : "Click to select a file"}
              </label>
              <p className="mt-1 text-[11px] text-slate-400">
                PDF, PNG, JPG, or DOC (Max 10MB)
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Document Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma Rental Agreement 2026"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
            />
          </div>

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
              Notes
            </label>
            <input
              type="text"
              placeholder="Optional notes or expiry dates"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} size="md">
              Upload Document
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Document?"
        message="This will permanently delete this document and remove its file from cloud storage."
        confirmText="Delete Document"
        loading={submitting}
      />
    </div>
  );
}

