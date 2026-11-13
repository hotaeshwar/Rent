"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Download,
  Calendar,
  Building,
  ArrowDownRight,
  TrendingDown,
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
  subscribeExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/repositories/expenseRepo";

const EXPENSE_CATEGORIES = [
  "Electricity",
  "Water",
  "Internet",
  "Cleaning",
  "Repairs",
  "Maintenance",
  "Staff Salary",
  "Grocery",
  "Security",
  "Other",
];

export default function ExpensesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [propertyFilter, setPropertyFilter] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    category: "Electricity",
    amount: "",
    propertyId: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "UPI",
    paidTo: "",
    notes: "",
  });

  useEffect(() => {
    if (!user?.uid) return;

    const unsubProps = subscribeProperties(user.uid, (data) => setProperties(data));
    const unsubExp = subscribeExpenses(user.uid, (data) => {
      setExpenses(data);
      setLoading(false);
    });

    return () => {
      unsubProps();
      unsubExp();
    };
  }, [user?.uid]);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormData({
      title: "",
      category: "Electricity",
      amount: "",
      propertyId: properties[0]?.id || "",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "UPI",
      paidTo: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp) => {
    setEditingExpense(exp);
    setFormData({
      title: exp.title || "",
      category: exp.category || "Electricity",
      amount: String(exp.amount || ""),
      propertyId: exp.propertyId || "",
      date: exp.date || new Date().toISOString().split("T")[0],
      paymentMethod: exp.paymentMethod || "UPI",
      paidTo: exp.paidTo || "",
      notes: exp.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("Expense title is required", "error");
      return;
    }
    const amount = Number(formData.amount);
    if (!amount || amount <= 0) {
      showToast("Valid expense amount is required", "error");
      return;
    }

    const prop = properties.find((p) => p.id === formData.propertyId);

    try {
      setSubmitting(true);
      if (editingExpense) {
        await updateExpense(user.uid, editingExpense.id, {
          ...formData,
          propertyName: prop?.name || "",
          amount,
        });
        showToast("Expense updated successfully!");
      } else {
        await createExpense(user.uid, {
          ...formData,
          propertyName: prop?.name || "",
          amount,
        });
        showToast("Expense logged successfully!");
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Save expense error:", err);
      showToast("Failed to save expense: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteExpense(user.uid, deleteTarget.id);
      showToast("Expense deleted successfully.");
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete expense error:", err);
      showToast("Failed to delete expense", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      showToast("No expenses to export", "info");
      return;
    }
    const headers = "Date,Title,Category,Property,Amount,Paid To,Payment Method,Notes\n";
    const rows = filteredExpenses
      .map(
        (e) =>
          `"${e.date}","${e.title}","${e.category}","${e.propertyName || ''}",${e.amount},"${e.paidTo || ''}","${e.paymentMethod || ''}","${e.notes || ''}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BiD_Rent_Expenses_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Expense report exported to CSV!");
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.paidTo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.propertyName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      categoryFilter === "All" || e.category === categoryFilter;
    const matchesProp =
      propertyFilter === "All" || e.propertyId === propertyFilter;
    return matchesSearch && matchesCat && matchesProp;
  });

  const totalFilteredAmount = filteredExpenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Operating Expenses
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Log bills, maintenance outlays, staff salaries, and download cost audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            icon={Download}
            size="md"
          >
            Export CSV
          </Button>
          <Button onClick={handleOpenAdd} icon={Plus} size="md">
            Add Expense
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Logged Expenses
          </span>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            ₹{totalFilteredAmount.toLocaleString()}
          </p>
          <span className="text-xs text-slate-500">
            {filteredExpenses.length} Records matching filters
          </span>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Top Outlay Category
          </span>
          <p className="mt-1 text-xl font-bold text-slate-800">
            Utilities & Electricity
          </p>
          <span className="text-xs text-slate-500">Primary monthly cost</span>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Average Expense
          </span>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            ₹
            {filteredExpenses.length > 0
              ? Math.round(totalFilteredAmount / filteredExpenses.length).toLocaleString()
              : 0}
          </p>
          <span className="text-xs text-slate-500">Per bill entry</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search expenses by title, vendor, property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs sm:text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-emerald-600"
          >
            <option value="All">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

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

      {/* Expenses Table */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No expenses recorded"
          description="Log electricity, water, repairs, groceries, or staff salaries."
          actionLabel="Log Expense"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 sm:pl-6">Expense Title</th>
                  <th className="px-3 py-3.5">Category</th>
                  <th className="px-3 py-3.5">Property</th>
                  <th className="px-3 py-3.5">Date</th>
                  <th className="px-3 py-3.5">Paid To</th>
                  <th className="px-3 py-3.5">Amount</th>
                  <th className="py-3.5 pl-3 pr-4 text-right sm:pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    <td className="py-3.5 pl-4 pr-3 sm:pl-6 font-semibold text-slate-900">
                      {exp.title}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-slate-600">
                      {exp.propertyName || "All Properties"}
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-500">
                      {exp.date}
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-600">
                      {exp.paidTo || "—"} ({exp.paymentMethod || "UPI"})
                    </td>
                    <td className="px-3 py-3.5 font-bold text-rose-600">
                      -₹{Number(exp.amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 pl-3 pr-4 text-right sm:pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(exp)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-700"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(exp)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
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

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? "Edit Expense Entry" : "Record New Expense"}
        subtitle="Log bill payments, groceries, staff salary or estate maintenance"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Expense Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. October BESCOM Electricity Bill"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
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
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="5000"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-rose-700 outline-none focus:border-emerald-600"
              />
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
                <option value="">General / All Properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Date of Expense
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Paid To / Vendor
              </label>
              <input
                type="text"
                placeholder="e.g. BESCOM, Airtel, Housekeeper"
                value={formData.paidTo}
                onChange={(e) =>
                  setFormData({ ...formData, paidTo: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Notes
            </label>
            <input
              type="text"
              placeholder="Optional notes or bill numbers"
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
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} size="md">
              {editingExpense ? "Save Changes" : "Record Expense"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete expense?`}
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        confirmText="Delete Expense"
        loading={deleting}
      />
    </div>
  );
}

