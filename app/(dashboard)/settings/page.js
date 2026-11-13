"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  User,
  Building,
  KeyRound,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Clock,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import Button from "@/components/ui/Button";
import PasswordInput from "@/components/ui/PasswordInput";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import {
  getOwnerSettings,
  saveOwnerSettings,
} from "@/lib/repositories/settingsRepo";

export default function SettingsPage() {
  const { user, userProfile, changePassword, updateUserProfile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("business"); // business, preferences, security
  const [loading, setLoading] = useState(true);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingRules, setSavingRules] = useState(false);

  // Business & Profile Settings
  const [settingsForm, setSettingsForm] = useState({
    businessName: "BiD Rent Manager PG",
    ownerName: "",
    phone: "",
    email: "",
    address: "",
    currency: "₹",
    rentDueDay: "5",
    gracePeriodDays: "3",
    emailNotifications: true,
    rentReminders: true,
    maintenanceAlerts: true,
  });

  // Password Change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const fetchSettings = async () => {
      try {
        const data = await getOwnerSettings(user.uid);
        setSettingsForm({
          businessName: data.businessName || userProfile?.businessName || "BiD Rent Manager PG",
          ownerName: data.ownerName || userProfile?.fullName || user?.displayName || "",
          phone: data.phone || userProfile?.phone || "",
          email: user?.email || data.email || "",
          address: data.address || userProfile?.address || "",
          currency: data.currency || "₹",
          rentDueDay: String(data.rentDueDay || "5"),
          gracePeriodDays: String(data.gracePeriodDays || "3"),
          emailNotifications: data.emailNotifications ?? true,
          rentReminders: data.rentReminders ?? true,
          maintenanceAlerts: data.maintenanceAlerts ?? true,
        });
      } catch (err) {
        console.error("Fetch settings error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user?.uid, userProfile, user?.displayName, user?.email]);

  // Save Business Profile
  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    if (!settingsForm.businessName.trim()) {
      showToast("Business or PG brand name is required", "error");
      return;
    }

    try {
      setSavingBusiness(true);
      
      // 1. Save in owner settings collection
      await saveOwnerSettings(user.uid, settingsForm);

      // 2. Sync to user profile document & context memory
      if (updateUserProfile) {
        await updateUserProfile({
          fullName: settingsForm.ownerName.trim(),
          businessName: settingsForm.businessName.trim(),
          phone: settingsForm.phone.trim(),
          address: settingsForm.address.trim(),
        });
      }

      showToast("Business profile saved & synchronized successfully!");
    } catch (err) {
      console.error("Save business error:", err);
      showToast("Failed to save business details: " + err.message, "error");
    } finally {
      setSavingBusiness(false);
    }
  };

  // Save Rent Cycle & Rules
  const handleSaveRules = async (e) => {
    e.preventDefault();
    try {
      setSavingRules(true);
      await saveOwnerSettings(user.uid, settingsForm);
      showToast("Rent cycle rules & preferences updated successfully!");
    } catch (err) {
      console.error("Save rules error:", err);
      showToast("Failed to update preferences: " + err.message, "error");
    } finally {
      setSavingRules(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    try {
      setPwdLoading(true);
      await changePassword(newPassword);
      showToast("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Change password error:", err);
      showToast("Failed to change password. You may need to re-login first.", "error");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Account & Estate Settings
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Configure business details, rent cycle rules, notifications, and security credentials
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("business")}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "business"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Business Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preferences")}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "preferences"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Rent Cycle & Rules
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "security"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Security & Password
        </button>
      </div>

      {/* Business Tab */}
      {activeTab === "business" && (
        <form onSubmit={handleSaveBusiness} className="space-y-5 max-w-2xl">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Organization & Contact Details
            </h3>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Business / PG Brand Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rent Manager PG, Royal Residency"
                value={settingsForm.businessName}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    businessName: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Owner Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={settingsForm.ownerName}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      ownerName: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Support Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={settingsForm.phone}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, phone: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Registered Email Address
              </label>
              <input
                type="email"
                disabled
                value={settingsForm.email}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-500 cursor-not-allowed"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Managed via Firebase Authentication
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Head Office / Property Address
              </label>
              <input
                type="text"
                placeholder="Full address of main office or PG"
                value={settingsForm.address}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    address: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={savingBusiness} icon={Save} size="md">
              Save Business Details
            </Button>
          </div>
        </form>
      )}

      {/* Rent Cycle & Rules Tab */}
      {activeTab === "preferences" && (
        <form onSubmit={handleSaveRules} className="space-y-5 max-w-2xl">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Rent Collection Preferences
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Monthly Rent Due Day
                </label>
                <select
                  value={settingsForm.rentDueDay}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      rentDueDay: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
                >
                  <option value="1">1st of the month</option>
                  <option value="5">5th of the month</option>
                  <option value="10">10th of the month</option>
                  <option value="15">15th of the month</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Grace Period (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={settingsForm.gracePeriodDays}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      gracePeriodDays: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Display Currency Symbol
              </label>
              <input
                type="text"
                value={settingsForm.currency}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    currency: e.target.value,
                  })
                }
                className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            {/* Notification Checkboxes */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                Automated Alerts & Reminders
              </span>
              <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={settingsForm.rentReminders}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, rentReminders: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Send automated rent due reminders to tenants via notifications</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={settingsForm.maintenanceAlerts}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, maintenanceAlerts: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Alert on urgent maintenance tickets logged by staff or tenants</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={savingRules} icon={Save} size="md">
              Save Rent Rules & Preferences
            </Button>
          </div>
        </form>
      )}

      {/* Security & Password Tab */}
      {activeTab === "security" && (
        <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Change Account Password
            </h3>

            <PasswordInput
              id="newPassword"
              label="New Password"
              required
              placeholder="Min. 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <PasswordInput
              id="confirmNewPassword"
              label="Confirm New Password"
              required
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={pwdLoading} icon={KeyRound} size="md">
              Update Password
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
