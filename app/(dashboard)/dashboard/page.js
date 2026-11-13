"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  BedDouble,
  Users,
  Receipt,
  Wallet,
  Wrench,
  TrendingUp,
  AlertCircle,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  IndianRupee,
  Layers,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeProperties } from "@/lib/repositories/propertyRepo";
import { subscribeRooms, subscribeBeds } from "@/lib/repositories/roomBedRepo";
import { subscribeTenants } from "@/lib/repositories/tenantRepo";
import { subscribeInvoices, subscribePayments } from "@/lib/repositories/rentRepo";
import { subscribeExpenses } from "@/lib/repositories/expenseRepo";
import { subscribeMaintenance } from "@/lib/repositories/maintenanceRepo";

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    let loadedCount = 0;
    const checkDone = () => {
      loadedCount += 1;
      if (loadedCount >= 7) setLoading(false);
    };

    const unsubProps = subscribeProperties(user.uid, (data) => {
      setProperties(data);
      checkDone();
    });
    const unsubRooms = subscribeRooms(user.uid, (data) => {
      setRooms(data);
      checkDone();
    });
    const unsubBeds = subscribeBeds(user.uid, (data) => {
      setBeds(data);
      checkDone();
    });
    const unsubTenants = subscribeTenants(user.uid, (data) => {
      setTenants(data);
      checkDone();
    });
    const unsubInvoices = subscribeInvoices(user.uid, (data) => {
      setInvoices(data);
      checkDone();
    });
    const unsubPayments = subscribePayments(user.uid, (data) => {
      setPayments(data);
      checkDone();
    });
    const unsubExpenses = subscribeExpenses(user.uid, (data) => {
      setExpenses(data);
      checkDone();
    });
    const unsubMaint = subscribeMaintenance(user.uid, (data) => {
      setMaintenance(data);
    });

    return () => {
      unsubProps();
      unsubRooms();
      unsubBeds();
      unsubTenants();
      unsubInvoices();
      unsubPayments();
      unsubExpenses();
      unsubMaint();
    };
  }, [user?.uid]);

  // Derived real business metrics
  const totalProperties = properties.length;
  const totalRooms = rooms.length;
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === "Occupied").length;
  const vacantBeds = totalBeds - occupiedBeds;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const totalInvoicedRent = invoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  const totalCollectedRent = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalPendingRent = invoices
    .filter((i) => i.status !== "Paid")
    .reduce((sum, i) => sum + (Number(i.pendingAmount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netIncome = totalCollectedRent - totalExpenses;

  // Active tenants
  const activeTenants = tenants.filter((t) => t.status === "Active");

  // Recent payments
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.createdAt || b.paymentDate) - new Date(a.createdAt || a.paymentDate))
    .slice(0, 5);

  // Pending / Overdue Invoices
  const pendingInvoices = invoices
    .filter((i) => i.status === "Pending" || i.status === "Overdue" || i.status === "Partial")
    .slice(0, 5);

  // Open Maintenance
  const activeMaintenance = maintenance.filter(
    (m) => m.status === "Open" || m.status === "In Progress"
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 text-white shadow-md">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
            Welcome Back
          </span>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
            {userProfile?.fullName || "Property Owner"}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-emerald-100/80">
            Here is your live occupancy, rental cashflow, and maintenance status across all estates.
          </p>
        </div>

        {/* Quick action shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/properties">
            <Button
              size="sm"
              className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-xs"
              icon={Plus}
            >
              Add Property
            </Button>
          </Link>
          <Link href="/tenants">
            <Button
              size="sm"
              className="bg-emerald-500 text-white hover:bg-emerald-400 font-semibold shadow-xs"
              icon={Users}
            >
              Check-in Tenant
            </Button>
          </Link>
          <Link href="/rent">
            <Button
              size="sm"
              className="bg-teal-500 text-white hover:bg-teal-400 font-semibold shadow-xs"
              icon={Receipt}
            >
              Record Payment
            </Button>
          </Link>
        </div>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Properties"
          value={totalProperties}
          subtitle={`${totalRooms} rooms • ${totalBeds} total beds`}
          icon={Building2}
          variant="emerald"
        />
        <StatCard
          title="Bed Occupancy"
          value={`${occupancyRate}%`}
          subtitle={`${occupiedBeds} occupied / ${vacantBeds} vacant`}
          icon={BedDouble}
          variant="blue"
          trend={{ value: `${occupiedBeds} Beds Filled`, positive: true }}
        />
        <StatCard
          title="Collected Rent"
          value={`₹${totalCollectedRent.toLocaleString()}`}
          subtitle={`₹${totalPendingRent.toLocaleString()} pending`}
          icon={IndianRupee}
          variant="emerald"
          trend={{ value: `${payments.length} Payments`, positive: true }}
        />
        <StatCard
          title="Net Cash Flow"
          value={`₹${netIncome.toLocaleString()}`}
          subtitle={`Expenses: ₹${totalExpenses.toLocaleString()}`}
          icon={Wallet}
          variant={netIncome >= 0 ? "emerald" : "red"}
          trend={{
            value: netIncome >= 0 ? "Profitable" : "Deficit",
            positive: netIncome >= 0,
          }}
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Active Tenants
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {activeTenants.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Pending Invoices
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {pendingInvoices.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Open Maintenance
          </p>
          <p className="mt-1 text-2xl font-bold text-rose-600">
            {activeMaintenance.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Vacant Beds
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {vacantBeds}
          </p>
        </div>
      </div>

      {/* Two Column Section: Recent Payments & Pending Invoices / Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Rent Payments */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Receipt size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Recent Rent Payments
                </h3>
                <p className="text-[11px] text-slate-500">
                  Latest payments verified from tenants
                </p>
              </div>
            </div>
            <Link
              href="/rent"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View All <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {recentPayments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No payments recorded yet. Record rent payments from the Rent Collection screen.
              </div>
            ) : (
              recentPayments.map((pay) => (
                <div key={pay.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {pay.tenantName || "Tenant"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {pay.propertyName || "Property"} • {pay.paymentDate} • {pay.paymentMethod || "UPI"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-700">
                      +₹{Number(pay.amount).toLocaleString()}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {pay.receiptNumber || "Verified"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Maintenance & Pending Rent Alerts */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <AlertCircle size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Urgent Attention & Invoices
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pending rent collections and active repairs
                </p>
              </div>
            </div>
            <Link
              href="/maintenance"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Maintenance <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {pendingInvoices.length === 0 && activeMaintenance.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1" />
                All clear! No overdue rent or pending maintenance issues.
              </div>
            ) : (
              <>
                {/* Pending Invoices */}
                {pendingInvoices.slice(0, 3).map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {inv.tenantName} — Pending Rent
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Due: {inv.dueDate || "N/A"} • Room {inv.roomNumber || ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-700">
                        ₹{Number(inv.pendingAmount).toLocaleString()}
                      </span>
                      <Badge variant="warning" size="sm" className="ml-2">
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                ))}

                {/* Active Maintenance */}
                {activeMaintenance.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {req.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {req.propertyName || "Property"} • Priority: {req.priority}
                      </p>
                    </div>
                    <Badge variant={req.priority === "Urgent" ? "danger" : "warning"} size="sm">
                      {req.status}
                    </Badge>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

