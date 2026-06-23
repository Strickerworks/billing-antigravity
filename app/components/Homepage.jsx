"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Homepage() {
  const pathname = usePathname();
  const isStaff = pathname.startsWith("/staff");
  const prefix = isStaff ? "/staff" : "/admin";

  const actions = [
    {
      href: `${prefix}/add-invoice`,
      icon: "＋",
      label: "New Invoice",
      description: "Create a fresh invoice from scratch",
    },
    {
      href: `${prefix}/fetch`,
      icon: "≡",
      label: "All Invoices",
      description: "Browse and search all saved invoices",
    },
    {
      href: `${prefix}/edit`,
      icon: "✎",
      label: "Edit Invoice",
      description: "Modify an existing invoice by number",
    },
    {
      href: `${prefix}/duplicate`,
      icon: "⎘",
      label: "Duplicate",
      description: "Copy an invoice with a new number",
    },
    {
      href: `${prefix}/view`,
      icon: "◉",
      label: "View Invoice",
      description: "Preview invoice as PDF in browser",
    },
    {
      href: `${prefix}/print`,
      icon: "↓",
      label: "Download PDF",
      description: "Download invoice as a PDF file",
    },
  ];

  if (!isStaff) {
    actions.push({
      href: "/admin/recycle-bin",
      icon: "🗑",
      label: "Recycle Bin",
      description: "Recover or permanently delete archived invoices",
    });
    actions.push({
      href: "/admin/requests",
      icon: "✉",
      label: "Invoice Requests",
      description: "Review and approve/reject staff billing updates",
    });
    actions.push({
      href: "/admin/expenses",
      icon: "💸",
      label: "Expense Requests",
      description: "Review and manage business expenses",
    });
  } else {
    actions.push({
      href: "/staff/requests",
      icon: "✉",
      label: "Invoice Requests",
      description: "Track status of your submitted change requests",
    });
    actions.push({
      href: "/staff/expenses",
      icon: "💸",
      label: "Expense Requests",
      description: "Submit and track business expenses",
    });
    actions.push({
      href: "/staff/payment-request",
      icon: "💳",
      label: "Payment Requests",
      description: "Acknowledge and request approval for customer payments",
    });
  }

  return (
    <div className="page-content" style={{ maxWidth: 860 }}>
      {/* Hero */}
      <div style={{ padding: "2.5rem 0 2rem" }}>
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
              The Heritage Group
            </p>
          </div>
        </div>
        <p style={{ fontSize: "0.9rem", color: "#6b7280", margin: "1rem 0 0", maxWidth: 460, lineHeight: 1.6 }}>
          A professional invoicing platform for managing tax invoices, generating PDFs and tracking billing records.
        </p>
      </div>

      <hr className="divider" />

      {/* Action Grid */}
      <p className="section-title" style={{ marginBottom: "1rem" }}>Quick Actions</p>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: "0.875rem",
      }}>
      {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="action-card fade-in"
          >
              <div className="action-card-icon">
                {action.icon}
              </div>
              <div>
                <div className="action-card-label">{action.label}</div>
                <div className="action-card-desc">{action.description}</div>
              </div>
          </Link>
        ))}
      </div>

      <div className="footer">
        © 2026 The Heritage Group · All rights reserved
      </div>
    </div>
  );
}
