"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import { useParams } from "next/navigation";

export default function AdminPage() {
  const { role } = useParams();
  const isAdmin = role === "admin";
  const prefix = `/${role}`;

  const [stats, setStats] = useState({
    approvedBillsCount: 0,
    pendingInvoicesCount: 0,
    pendingExpensesCount: 0,
    pendingPaymentsCount: 0,
    totalCarsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // 1. Approved bills count
      const { count: billsCount } = await supabase
        .from("billdata")
        .select("*", { count: "exact", head: true })
        .eq("active_status", "active");

      // 2. Pending Invoice Requests
      const { count: pendingInvoices } = await supabase
        .from("billing_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // 3. Pending Expense Requests
      const { count: pendingExpenses } = await supabase
        .from("expense_reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // 4. Pending Payment Requests
      const { count: pendingPayments } = await supabase
        .from("payment_acknowledgement_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // 5. Total Cars
      const { count: carsCount } = await supabase
        .from("cars")
        .select("*", { count: "exact", head: true });
        
      setStats({
        approvedBillsCount: billsCount || 0,
        pendingInvoicesCount: pendingInvoices || 0,
        pendingExpensesCount: pendingExpenses || 0,
        pendingPaymentsCount: pendingPayments || 0,
        totalCarsCount: carsCount || 0,
      });
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
    }
    setLoading(false);
  };

  // Define actions for three sections
  const invoiceActions = [
    { href: `${prefix}/add-invoice`, icon: "＋", label: "New Invoice", desc: "Create tax invoice from scratch" },
    { href: `${prefix}/fetch`, icon: "≡", label: "All Invoices", desc: "Browse and search all saved invoices" },
    { href: `${prefix}/edit`, icon: "✎", label: "Edit Invoice", desc: "Modify an existing invoice by number" },
    { href: `${prefix}/duplicate`, icon: "⎘", label: "Duplicate Invoice", desc: "Copy an invoice with a new number" },
    { href: `${prefix}/view`, icon: "◉", label: "View Invoice", desc: "Preview invoice as PDF in browser" },
    { href: `${prefix}/print`, icon: "↓", label: "Download PDF", desc: "Download invoice as a PDF file" },
  ];

  if (isAdmin) {
    invoiceActions.push({ href: `${prefix}/recycle-bin`, icon: "🗑", label: "Recycle Bin", desc: "Recover or permanently delete archived invoices" });
  }

  const logActions = [
    { href: `${prefix}/expenses/add`, icon: "💸", label: "Add Expense", desc: "Report business or travel expenses" },
    { href: `${prefix}/payment-request/add`, icon: "💳", label: "Add Payment Request", desc: "Acknowledge client payment for pending bills" },
  ];

  const reviewActions = [
    { href: `${prefix}/requests`, icon: "✉", label: "Invoice Requests", desc: "Track status of invoice creations/updates" },
    { href: `${prefix}/expenses`, icon: "📋", label: "Expense Requests", desc: "Track and manage expense submissions" },
    { href: `${prefix}/payment-request`, icon: "🏷", label: "Payment Requests", desc: "Track payment acknowledgement logs" },
    { href: `${prefix}/fleet-requests`, icon: "🚚", label: "Fleet Requests", desc: "Track and approve car & driver updates" },
    { href: `${prefix}/audit-log`, icon: "📜", label: "Audit Log", desc: "Unified timeline logs of all updates" },
  ];

  const fleetActions = [
    { href: `${prefix}/cars`, icon: "🚗", label: "Cars Profile", desc: "View vehicle logs, service records, and fuel history" },
    { href: `${prefix}/drivers`, icon: "👤", label: "Manage Drivers", desc: "Register drivers and view contact details" },
  ];

  return (
    <div className="page-content" style={{ maxWidth: 860, paddingBottom: "3rem" }}>
      {/* Hero Header */}
      <div style={{ padding: "1.5rem 0 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div style={{
            width: 40, height: 40, background: "#2c2c2c", borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 18, fontWeight: 700
          }}>H</div>
          <div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em", color: "#1a1d23" }}>
              Heritage Invoice
            </h1>
            <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: 0 }}>
              The Heritage Group · {role.toUpperCase()} Portal
            </p>
          </div>
        </div>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {/* Dashboard Metrics Panel */}
      <p className="section-title" style={{ marginBottom: "1rem" }}>
        {role === "admin" ? "Admin Insights" : "Staff Performance Summary"}
      </p>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ height: "100px", background: "#f9fafb", border: "1px dashed #e5e7eb" }} />
          ))}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem"
        }}>
          {/* Card 1 */}
          <div className="card fade-in" style={{
            background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
            border: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            padding: "1.25rem"
          }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Approved Bills
            </span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111111" }}>
              {stats.approvedBillsCount}
            </span>
            <span style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: 500 }}>
              ↑ Active Invoices
            </span>
          </div>

          {/* Card 2 */}
          <div className="card fade-in" style={{
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            border: "1px solid #fde68a",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            padding: "1.25rem"
          }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Pending Invoices
            </span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#78350f" }}>
              {stats.pendingInvoicesCount}
            </span>
            <span style={{ fontSize: "0.7rem", color: "#b45309", fontWeight: 500 }}>
              Awaiting Approval
            </span>
          </div>

          {/* Card 3 */}
          <div className="card fade-in" style={{
            background: "linear-gradient(135deg, #fff5f5 0%, #ffe4e6 100%)",
            border: "1px solid #fecdd3",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            padding: "1.25rem"
          }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9f1239", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Pending Expenses
            </span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#881337" }}>
              {stats.pendingExpensesCount}
            </span>
            <span style={{ fontSize: "0.7rem", color: "#be123c", fontWeight: 500 }}>
              Awaiting Approval
            </span>
          </div>

          {/* Card 4 */}
          <div className="card fade-in" style={{
            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
            border: "1px solid #bbf7d0",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            padding: "1.25rem"
          }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#166534", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Pending Payments
            </span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#14532d" }}>
              {stats.pendingPaymentsCount}
            </span>
            <span style={{ fontSize: "0.7rem", color: "#15803d", fontWeight: 500 }}>
              Awaiting Approval
            </span>
          </div>

          {/* Card 5: Fleet Vehicles */}
          <div className="card fade-in" style={{
            background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
            border: "1px solid #d1d5db",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            padding: "1.25rem"
          }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Fleet Vehicles
            </span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1f2937" }}>
              {stats.totalCarsCount}
            </span>
            <span style={{ fontSize: "0.7rem", color: "#4b5563", fontWeight: 500 }}>
              Registered Fleet
            </span>
          </div>
        </div>
      )}

      {/* THREE SECTIONS LAYOUT */}
      
      {/* Section 1: Invoices */}
      <div style={{ marginBottom: "2rem" }}>
        <p className="section-title" style={{ marginBottom: "0.75rem" }}>📄 Invoices</p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "0.875rem",
        }}>
          {invoiceActions.map((action) => (
            <Link key={action.href} href={action.href} className="action-card fade-in">
              <div className="action-card-icon">{action.icon}</div>
              <div>
                <div className="action-card-label">{action.label}</div>
                <div className="action-card-desc">{action.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Section 2: Log New Requests */}
      <div style={{ marginBottom: "2rem" }}>
        <p className="section-title" style={{ marginBottom: "0.75rem" }}>➕ Log New Requests</p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "0.875rem",
        }}>
          {logActions.map((action) => (
            <Link key={action.href} href={action.href} className="action-card fade-in">
              <div className="action-card-icon">{action.icon}</div>
              <div>
                <div className="action-card-label">{action.label}</div>
                <div className="action-card-desc">{action.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Section 3: Track & Review Requests */}
      <div style={{ marginBottom: "2rem" }}>
        <p className="section-title" style={{ marginBottom: "0.75rem" }}>✉ Track &amp; Review Requests</p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "0.875rem",
        }}>
          {reviewActions.map((action) => (
            <Link key={action.href} href={action.href} className="action-card fade-in">
              <div className="action-card-icon">{action.icon}</div>
              <div>
                <div className="action-card-label">{action.label}</div>
                <div className="action-card-desc">{action.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Section 4: Fleet & Vehicles */}
      <div style={{ marginBottom: "2rem" }}>
        <p className="section-title" style={{ marginBottom: "0.75rem" }}>🚗 Fleet &amp; Vehicles</p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "0.875rem",
        }}>
          {fleetActions.map((action) => (
            <Link key={action.href} href={action.href} className="action-card fade-in">
              <div className="action-card-icon">{action.icon}</div>
              <div>
                <div className="action-card-label">{action.label}</div>
                <div className="action-card-desc">{action.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="footer">
        © 2026 The Heritage Group · All rights reserved
      </div>
    </div>
  );
}
