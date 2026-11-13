"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  IndianRupee,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertCircle,
  Building,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { subscribeProperties } from "@/lib/repositories/propertyRepo";
import { subscribeRooms, subscribeBeds } from "@/lib/repositories/roomBedRepo";
import { subscribeTenants } from "@/lib/repositories/tenantRepo";
import { subscribeInvoices, subscribePayments } from "@/lib/repositories/rentRepo";
import { subscribeExpenses } from "@/lib/repositories/expenseRepo";

export default function ReportsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Time filter
  const [selectedProperty, setSelectedProperty] = useState("All");

  useEffect(() => {
    if (!user?.uid) return;

    const unsubProps = subscribeProperties(user.uid, (data) => setProperties(data));
    const unsubRooms = subscribeRooms(user.uid, (data) => setRooms(data));
    const unsubBeds = subscribeBeds(user.uid, (data) => setBeds(data));
    const unsubTenants = subscribeTenants(user.uid, (data) => setTenants(data));
    const unsubInv = subscribeInvoices(user.uid, (data) => setInvoices(data));
    const unsubPay = subscribePayments(user.uid, (data) => setPayments(data));
    const unsubExp = subscribeExpenses(user.uid, (data) => {
      setExpenses(data);
      setLoading(false);
    });

    return () => {
      unsubProps();
      unsubRooms();
      unsubBeds();
      unsubTenants();
      unsubInv();
      unsubPay();
      unsubExp();
    };
  }, [user?.uid]);

  // Filter datasets
  const filteredPayments = selectedProperty === "All"
    ? payments
    : payments.filter((p) => p.propertyId === selectedProperty);

  const filteredInvoices = selectedProperty === "All"
    ? invoices
    : invoices.filter((i) => i.propertyId === selectedProperty);

  const filteredExpenses = selectedProperty === "All"
    ? expenses
    : expenses.filter((e) => e.propertyId === selectedProperty);

  const filteredBeds = selectedProperty === "All"
    ? beds
    : beds.filter((b) => b.propertyId === selectedProperty);

  // Financial aggregates
  const totalRevenue = filteredPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalBilled = filteredInvoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const totalPendingRent = filteredInvoices
    .filter((i) => i.status !== "Paid")
    .reduce((s, i) => s + (Number(i.pendingAmount) || 0), 0);
  const totalExp = filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const netProfit = totalRevenue - totalExp;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
  const collectionEfficiency = totalBilled > 0 ? Math.min(100, Math.round((totalRevenue / totalBilled) * 100)) : 100;

  // Occupancy aggregates
  const totalBedCount = filteredBeds.length;
  const occupiedBedCount = filteredBeds.filter((b) => b.status === "Occupied").length;
  const occupancyPercentage = totalBedCount > 0 ? Math.round((occupiedBedCount / totalBedCount) * 100) : 0;

  // Revenue by Property breakdown
  const propertyRevenueBreakdown = properties.map((prop) => {
    const propPayments = payments.filter((p) => p.propertyId === prop.id);
    const propRevenue = propPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const propExpenses = expenses.filter((e) => e.propertyId === prop.id);
    const propTotalExp = propExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const propBeds = beds.filter((b) => b.propertyId === prop.id);
    const propOccupied = propBeds.filter((b) => b.status === "Occupied").length;

    return {
      id: prop.id,
      name: prop.name,
      type: prop.type,
      revenue: propRevenue,
      expenses: propTotalExp,
      net: propRevenue - propTotalExp,
      occupancy: propBeds.length > 0 ? Math.round((propOccupied / propBeds.length) * 100) : 0,
    };
  });

  // Export full Financial Report CSV
  const handleExportFinancialReport = () => {
    const headers = "Property,Type,Revenue Collected (INR),Operating Expenses (INR),Net Cashflow (INR),Occupancy (%)\n";
    const rows = propertyRevenueBreakdown
      .map(
        (p) =>
          `"${p.name}","${p.type}",${p.revenue},${p.expenses},${p.net},${p.occupancy}`
      )
      .join("\n");
    const summary = `\nTotal Collected,${totalRevenue}\nTotal Expenses,${totalExp}\nNet Profit,${netProfit}\nCollection Efficiency,${collectionEfficiency}%\n`;

    const blob = new Blob([headers + rows + summary], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BiD_Rent_Financial_Audit_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Financial summary exported to CSV!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Reports & Business Analytics
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Real-time financial audits, net profits, occupancy rates, and cashflow breakdown
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-emerald-600 shadow-2xs"
          >
            <option value="All">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <Button
            onClick={handleExportFinancialReport}
            variant="outline"
            icon={Download}
            size="md"
          >
            Export Audit
          </Button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Net Profit"
          value={`₹${netProfit.toLocaleString()}`}
          subtitle={`Margin: ${profitMargin}%`}
          icon={IndianRupee}
          variant={netProfit >= 0 ? "emerald" : "red"}
          trend={{ value: `${profitMargin}% Margin`, positive: netProfit >= 0 }}
        />
        <StatCard
          title="Rent Collection Efficiency"
          value={`${collectionEfficiency}%`}
          subtitle={`Pending: ₹${totalPendingRent.toLocaleString()}`}
          icon={Percent}
          variant="blue"
          trend={{ value: `${filteredPayments.length} Collected`, positive: true }}
        />
        <StatCard
          title="Estate Occupancy"
          value={`${occupancyPercentage}%`}
          subtitle={`${occupiedBedCount} / ${totalBedCount} Beds Occupied`}
          icon={Building}
          variant="purple"
        />
        <StatCard
          title="Total Operating Cost"
          value={`₹${totalExp.toLocaleString()}`}
          subtitle={`${filteredExpenses.length} Outlay Vouchers`}
          icon={TrendingUp}
          variant="amber"
        />
      </div>

      {/* Property Revenue Breakdown Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Revenue & Margin by Property
            </h3>
            <p className="text-xs text-slate-500">
              Comparative profitability analysis across your locations
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 pl-4 pr-3 sm:pl-6">Property Name</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Rent Collected</th>
                <th className="px-3 py-3">Expenses</th>
                <th className="px-3 py-3">Net Profit</th>
                <th className="py-3 pl-3 pr-4 text-right sm:pr-6">Occupancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {propertyRevenueBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No properties registered yet. Add properties to view financial breakdown.
                  </td>
                </tr>
              ) : (
                propertyRevenueBreakdown.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="py-3 pl-4 pr-3 sm:pl-6 font-semibold text-slate-900">
                      {row.name}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="emerald" size="sm">
                        {row.type}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 font-semibold text-emerald-700">
                      ₹{row.revenue.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 font-medium text-rose-600">
                      ₹{row.expenses.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 font-bold text-slate-900">
                      ₹{row.net.toLocaleString()}
                    </td>
                    <td className="py-3 pl-3 pr-4 text-right sm:pr-6 font-semibold">
                      {row.occupancy}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

