"use client";
import React from "react";
import Link from "next/link";

const actions = [
  {
    href: "/admin/add-invoice",
    icon: "＋",
    label: "New Invoice",
    description: "Create a fresh invoice from scratch",
  },
  {
    href: "/admin/fetch",
    icon: "≡",
    label: "All Invoices",
    description: "Browse and search all saved invoices",
  },
  {
    href: "/admin/edit",
    icon: "✎",
    label: "Edit Invoice",
    description: "Modify an existing invoice by number",
  },
  {
    href: "/admin/duplicate",
    icon: "⎘",
    label: "Duplicate",
    description: "Copy an invoice with a new number",
  },
  {
    href: "/admin/view",
    icon: "◉",
    label: "View Invoice",
    description: "Preview invoice as PDF in browser",
  },
  {
    href: "/admin/print",
    icon: "↓",
    label: "Download PDF",
    description: "Download invoice as a PDF file",
  },
];

export default function Homepage() {
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
        © 2025 The Heritage Group · All rights reserved
      </div>
    </div>
  );
}
