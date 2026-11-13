"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  Trash2,
  CheckCheck,
  AlertCircle,
  Receipt,
  UserPlus,
  LogOut,
  Wrench,
  Clock,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import {
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/lib/repositories/notificationRepo";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeNotifications(user.uid, (data) => {
      setNotifications(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user?.uid]);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationRead(user.uid, id);
    } catch (err) {
      showToast("Failed to mark as read", "error");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(user.uid);
      showToast("All notifications marked as read");
    } catch (err) {
      showToast("Failed to mark all as read", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(user.uid, id);
      showToast("Notification deleted");
    } catch (err) {
      showToast("Failed to delete notification", "error");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIconForType = (type) => {
    switch (type) {
      case "check_in":
        return <UserPlus size={17} className="text-emerald-600" />;
      case "check_out":
        return <LogOut size={17} className="text-amber-600" />;
      case "payment":
        return <Receipt size={17} className="text-teal-600" />;
      case "maintenance":
        return <Wrench size={17} className="text-rose-600" />;
      case "rent_overdue":
        return <AlertCircle size={17} className="text-red-600" />;
      default:
        return <Bell size={17} className="text-emerald-700" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Notifications Center
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Real-time activity alerts on tenant check-ins, rent payments, and maintenance
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllRead}
            variant="outline"
            icon={CheckCheck}
            size="md"
          >
            Mark All Read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up!"
          description="You will receive alerts here when tenants check in, payments are logged, or maintenance tickets are updated."
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start justify-between gap-3 rounded-2xl border p-4 transition-all duration-150 ${
                notif.read
                  ? "border-slate-200/80 bg-white text-slate-700"
                  : "border-emerald-200 bg-emerald-50/40 text-slate-900 shadow-2xs"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    notif.read ? "bg-slate-100" : "bg-emerald-100"
                  }`}
                >
                  {getIconForType(notif.type)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-xs sm:text-sm text-slate-900">
                      {notif.title}
                    </h4>
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">{notif.message}</p>
                  <span className="mt-1 block text-[10px] text-slate-400">
                    {notif.createdAt
                      ? new Date(notif.createdAt).toLocaleString()
                      : "Recently"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!notif.read && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-emerald-700 transition-colors"
                    title="Mark as read"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(notif.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Delete notification"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

