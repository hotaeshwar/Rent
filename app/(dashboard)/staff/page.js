"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  DollarSign,
  UserX,
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
  subscribeStaff,
  subscribeAttendance,
  subscribeSalaryRecords,
  createStaff,
  updateStaff,
  deleteStaff,
  markAttendance,
  recordSalaryPayment,
} from "@/lib/repositories/staffRepo";

const STAFF_ROLES = [
  "Manager / Warden",
  "Cleaner / Housekeeper",
  "Security Guard",
  "Cook / Mess Staff",
  "Electrician",
  "Plumber",
  "Maintenance Tech",
  "Other",
];

export default function StaffPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState("members"); // members, attendance, salaries
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [staffForm, setStaffForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    role: "Cleaner / Housekeeper",
    propertyId: "",
    salary: "15000",
    shift: "Day (8 AM - 5 PM)",
    joiningDate: new Date().toISOString().split("T")[0],
    status: "Active",
  });

  const [attendanceForm, setAttendanceForm] = useState({
    staffId: "",
    date: new Date().toISOString().split("T")[0],
    status: "Present",
    notes: "",
  });

  const currentMonthYear = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  const [salaryForm, setSalaryForm] = useState({
    staffId: "",
    month: currentMonthYear,
    salaryAmount: "15000",
    bonus: "0",
    deduction: "0",
    paymentMethod: "Bank Transfer",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (!user?.uid) return;

    const unsubProps = subscribeProperties(user.uid, (data) => setProperties(data));
    const unsubStaff = subscribeStaff(user.uid, (data) => {
      setStaff(data);
      setLoading(false);
    });
    const unsubAtt = subscribeAttendance(user.uid, (data) => setAttendance(data));
    const unsubSal = subscribeSalaryRecords(user.uid, (data) => setSalaryRecords(data));

    return () => {
      unsubProps();
      unsubStaff();
      unsubAtt();
      unsubSal();
    };
  }, [user?.uid]);

  const handleOpenAddStaff = () => {
    setEditingStaff(null);
    setStaffForm({
      fullName: "",
      phone: "",
      email: "",
      role: "Cleaner / Housekeeper",
      propertyId: properties[0]?.id || "",
      salary: "15000",
      shift: "Day (8 AM - 5 PM)",
      joiningDate: new Date().toISOString().split("T")[0],
      status: "Active",
    });
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (st) => {
    setEditingStaff(st);
    setStaffForm({
      fullName: st.fullName || "",
      phone: st.phone || "",
      email: st.email || "",
      role: st.role || "Cleaner / Housekeeper",
      propertyId: st.propertyId || "",
      salary: String(st.salary || "15000"),
      shift: st.shift || "Day (8 AM - 5 PM)",
      joiningDate: st.joiningDate || new Date().toISOString().split("T")[0],
      status: st.status || "Active",
    });
    setIsStaffModalOpen(true);
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    if (!staffForm.fullName.trim()) {
      showToast("Staff name is required", "error");
      return;
    }
    const prop = properties.find((p) => p.id === staffForm.propertyId);

    try {
      setSubmitting(true);
      if (editingStaff) {
        await updateStaff(user.uid, editingStaff.id, {
          ...staffForm,
          propertyName: prop?.name || "",
        });
        showToast("Staff details updated!");
      } else {
        await createStaff(user.uid, {
          ...staffForm,
          propertyName: prop?.name || "",
        });
        showToast("New staff member enrolled!");
      }
      setIsStaffModalOpen(false);
    } catch (err) {
      showToast("Failed to save staff record: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      await deleteStaff(user.uid, deleteTarget.id);
      showToast("Staff profile removed.");
      setDeleteTarget(null);
    } catch (err) {
      showToast("Failed to delete staff member", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Attendance
  const handleOpenAttendance = () => {
    if (staff.length === 0) {
      showToast("Enroll staff members first", "error");
      return;
    }
    setAttendanceForm({
      staffId: staff[0]?.id || "",
      date: new Date().toISOString().split("T")[0],
      status: "Present",
      notes: "",
    });
    setIsAttendanceModalOpen(true);
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    const targetStaff = staff.find((s) => s.id === attendanceForm.staffId);
    if (!targetStaff) return;

    try {
      setSubmitting(true);
      await markAttendance(user.uid, {
        ...attendanceForm,
        staffName: targetStaff.fullName,
      });
      showToast(`Attendance logged for ${targetStaff.fullName}!`);
      setIsAttendanceModalOpen(false);
    } catch (err) {
      showToast("Failed to log attendance", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Salary
  const handleOpenSalary = () => {
    if (staff.length === 0) {
      showToast("Enroll staff members first", "error");
      return;
    }
    const firstStaff = staff[0];
    setSalaryForm({
      staffId: firstStaff.id,
      month: currentMonthYear,
      salaryAmount: String(firstStaff.salary || "15000"),
      bonus: "0",
      deduction: "0",
      paymentMethod: "Bank Transfer",
      paymentDate: new Date().toISOString().split("T")[0],
    });
    setIsSalaryModalOpen(true);
  };

  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    const targetStaff = staff.find((s) => s.id === salaryForm.staffId);
    if (!targetStaff) return;

    try {
      setSubmitting(true);
      await recordSalaryPayment(user.uid, {
        ...salaryForm,
        staffName: targetStaff.fullName,
      });
      showToast(`Salary disbursement recorded for ${targetStaff.fullName}!`);
      setIsSalaryModalOpen(false);
    } catch (err) {
      showToast("Failed to log salary payment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStaff = staff.filter((s) => {
    return (
      s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Staff & Personnel Management
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Manage hostel wardens, security, housekeeping, track daily attendance, and salary slips
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenAttendance}
            variant="outline"
            icon={Calendar}
            size="md"
          >
            Mark Attendance
          </Button>
          <Button
            onClick={handleOpenSalary}
            variant="outline"
            icon={DollarSign}
            size="md"
          >
            Disburse Salary
          </Button>
          <Button onClick={handleOpenAddStaff} icon={Plus} size="md">
            Enroll Staff
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "members"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Staff Directory ({staff.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("attendance")}
            className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "attendance"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Attendance Logs ({attendance.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("salaries")}
            className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "salaries"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Salary Payments ({salaryRecords.length})
          </button>
        </div>
      </div>

      {/* Staff Directory Tab */}
      {activeTab === "members" && (
        <>
          {filteredStaff.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No staff enrolled yet"
              description="Add wardens, cleaners, security guards, and maintenance personnel to your team."
              actionLabel="Enroll Staff Member"
              onAction={handleOpenAddStaff}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStaff.map((member) => (
                <div
                  key={member.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="emerald" size="sm" className="mb-1">
                        {member.role}
                      </Badge>
                      <h3 className="font-bold text-slate-900 text-base">
                        {member.fullName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {member.propertyName || "All Properties"}
                      </p>
                    </div>

                    <Badge
                      variant={member.status === "Active" ? "success" : "default"}
                      size="sm"
                    >
                      {member.status}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400" />
                      <span>{member.phone || "No phone"}</span>
                    </div>
                    {member.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-slate-400" />
                        <span>{member.email}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-400">Shift:</span>
                      <span className="font-medium">{member.shift}</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold text-emerald-800 pt-1">
                      <span>Monthly Wage:</span>
                      <span>₹{Number(member.salary).toLocaleString()}/mo</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => handleOpenEditStaff(member)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-700"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(member)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 sm:pl-6">Date</th>
                  <th className="px-3 py-3.5">Staff Name</th>
                  <th className="px-3 py-3.5">Attendance Status</th>
                  <th className="py-3.5 pl-3 pr-4 text-right sm:pr-6">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No attendance logged yet. Click &quot;Mark Attendance&quot; above.
                    </td>
                  </tr>
                ) : (
                  attendance.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50">
                      <td className="py-3.5 pl-4 pr-3 sm:pl-6 font-medium text-slate-900">
                        {att.date}
                      </td>
                      <td className="px-3 py-3.5 font-semibold text-slate-800">
                        {att.staffName}
                      </td>
                      <td className="px-3 py-3.5">
                        <Badge
                          variant={
                            att.status === "Present"
                              ? "success"
                              : att.status === "Half-day"
                              ? "warning"
                              : "danger"
                          }
                          size="sm"
                        >
                          {att.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 pl-3 pr-4 text-right sm:pr-6 text-slate-500 text-xs">
                        {att.notes || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salaries Tab */}
      {activeTab === "salaries" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 sm:pl-6">Month</th>
                  <th className="px-3 py-3.5">Staff Name</th>
                  <th className="px-3 py-3.5">Base Salary</th>
                  <th className="px-3 py-3.5">Bonus / Deduction</th>
                  <th className="px-3 py-3.5">Net Disbursed</th>
                  <th className="px-3 py-3.5">Payment Date</th>
                  <th className="py-3.5 pl-3 pr-4 text-right sm:pr-6">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {salaryRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No salary records logged yet. Click &quot;Disburse Salary&quot; above.
                    </td>
                  </tr>
                ) : (
                  salaryRecords.map((sal) => (
                    <tr key={sal.id} className="hover:bg-slate-50">
                      <td className="py-3.5 pl-4 pr-3 sm:pl-6 font-medium text-slate-900">
                        {sal.month}
                      </td>
                      <td className="px-3 py-3.5 font-semibold text-slate-800">
                        {sal.staffName}
                      </td>
                      <td className="px-3 py-3.5 text-slate-700">
                        ₹{Number(sal.salaryAmount).toLocaleString()}
                      </td>
                      <td className="px-3 py-3.5 text-xs text-slate-500">
                        +₹{Number(sal.bonus || 0)} / -₹{Number(sal.deduction || 0)}
                      </td>
                      <td className="px-3 py-3.5 font-bold text-emerald-700">
                        ₹{Number(sal.netPaid).toLocaleString()}
                      </td>
                      <td className="px-3 py-3.5 text-xs text-slate-500">
                        {sal.paymentDate}
                      </td>
                      <td className="py-3.5 pl-3 pr-4 text-right sm:pr-6">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {sal.paymentMethod || "Bank"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        title={editingStaff ? "Edit Staff Details" : "Enroll Staff Member"}
        subtitle="Manage employees, roles, salaries, and assign buildings"
      >
        <form onSubmit={handleStaffSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar"
              value={staffForm.fullName}
              onChange={(e) =>
                setStaffForm({ ...staffForm, fullName: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="+91 9876543210"
                value={staffForm.phone}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, phone: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Role / Designation
              </label>
              <select
                value={staffForm.role}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, role: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Assigned Property
              </label>
              <select
                value={staffForm.propertyId}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, propertyId: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
              >
                <option value="">All Properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Monthly Wage (₹)
              </label>
              <input
                type="number"
                value={staffForm.salary}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, salary: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Working Shift
              </label>
              <input
                type="text"
                placeholder="Day (8 AM - 5 PM)"
                value={staffForm.shift}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, shift: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Status
              </label>
              <select
                value={staffForm.status}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, status: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsStaffModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} size="md">
              {editingStaff ? "Save Changes" : "Enroll Personnel"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Attendance Modal */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title="Mark Staff Attendance"
        subtitle="Log presence, half-day, or approved leave"
      >
        <form onSubmit={handleAttendanceSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Staff Member <span className="text-red-500">*</span>
            </label>
            <select
              value={attendanceForm.staffId}
              onChange={(e) =>
                setAttendanceForm({
                  ...attendanceForm,
                  staffId: e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.role})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Date
              </label>
              <input
                type="date"
                value={attendanceForm.date}
                onChange={(e) =>
                  setAttendanceForm({ ...attendanceForm, date: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Status
              </label>
              <select
                value={attendanceForm.status}
                onChange={(e) =>
                  setAttendanceForm({
                    ...attendanceForm,
                    status: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Half-day">Half-day</option>
                <option value="Leave">On Leave</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Late entry by 1 hour"
              value={attendanceForm.notes}
              onChange={(e) =>
                setAttendanceForm({ ...attendanceForm, notes: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsAttendanceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} size="md">
              Log Attendance
            </Button>
          </div>
        </form>
      </Modal>

      {/* Salary Modal */}
      <Modal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        title="Record Salary Disbursement"
        subtitle="Log employee salary payments and bonuses"
      >
        <form onSubmit={handleSalarySubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Staff Member <span className="text-red-500">*</span>
            </label>
            <select
              value={salaryForm.staffId}
              onChange={(e) => {
                const s = staff.find((m) => m.id === e.target.value);
                setSalaryForm({
                  ...salaryForm,
                  staffId: e.target.value,
                  salaryAmount: String(s?.salary || salaryForm.salaryAmount),
                });
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.role})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Payment Month
              </label>
              <input
                type="text"
                value={salaryForm.month}
                onChange={(e) =>
                  setSalaryForm({ ...salaryForm, month: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Base Salary (₹)
              </label>
              <input
                type="number"
                value={salaryForm.salaryAmount}
                onChange={(e) =>
                  setSalaryForm({
                    ...salaryForm,
                    salaryAmount: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Bonus / Overtime (₹)
              </label>
              <input
                type="number"
                value={salaryForm.bonus}
                onChange={(e) =>
                  setSalaryForm({ ...salaryForm, bonus: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Deductions (₹)
              </label>
              <input
                type="number"
                value={salaryForm.deduction}
                onChange={(e) =>
                  setSalaryForm({
                    ...salaryForm,
                    deduction: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Net Amount Paid:</span>
            <span className="text-base font-bold text-emerald-800">
              ₹
              {(
                Number(salaryForm.salaryAmount || 0) +
                Number(salaryForm.bonus || 0) -
                Number(salaryForm.deduction || 0)
              ).toLocaleString()}
            </span>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsSalaryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} size="md">
              Confirm Disbursement
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteStaff}
        title={`Delete staff profile?`}
        message="Are you sure you want to remove this staff record?"
        confirmText="Remove"
        loading={submitting}
      />
    </div>
  );
}

