"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function FetchInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchAllInvoices();
  }, []);

  const fetchAllInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("billdata")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invoices:", error);
      alert("Could not load invoices.");
    } else {
      setInvoices(data);
    }
    setLoading(false);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const term = searchTerm.toLowerCase();
    return (
      String(invoice.invoice_no || "").toLowerCase().includes(term) ||
      invoice.customer_name?.toLowerCase().includes(term) ||
      invoice.customer_gst?.toLowerCase().includes(term)
    );
  });

  const handleView = (invoice_no) => {
    router.push(`/admin/view/${invoice_no}`);
  };

  const handleEdit = (invoice_no) => {
    router.push(`/admin/edit?invoice=${invoice_no}`);
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return "—";
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const fmt = (num) => `₹${parseFloat(num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div className="page-content">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="page-title">All Invoices</h1>
            <p className="page-subtitle">
              {loading ? "Loading..." : `${filteredInvoices.length} invoice${filteredInvoices.length !== 1 ? "s" : ""}${searchTerm ? " found" : " total"}`}
            </p>
          </div>
          <button
            onClick={() => router.push("/admin/add-invoice")}
            className="btn btn-primary"
          >
            + New Invoice
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: "1rem", padding: "1rem 1.25rem" }}>
        <div className="search-bar">
          <span className="search-bar-icon">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice number, customer name, or GST..."
            className="form-input"
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <div className="empty-state-text">Loading invoices...</div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-text">No invoices found</div>
            <div className="empty-state-sub">
              {searchTerm ? "Try a different search term." : "Create your first invoice to get started."}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Customer</th>
                  <th>GST No.</th>
                  <th>Date</th>
                  <th style={{ textAlign: "right" }}>Grand Total</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.invoice_no} className="fade-in">
                    <td>
                      <span style={{ fontWeight: 600, color: "#1a1d23" }}>#{inv.invoice_no}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{inv.customer_name}</td>
                    <td style={{ color: "#9ca3af", fontFamily: "monospace", fontSize: "0.8rem" }}>{inv.customer_gst}</td>
                    <td style={{ color: "#6b7280" }}>{formatDate(inv.created_at)}</td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "#1a1d23" }}>
                      {fmt(inv.grand_total)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                        <button
                          onClick={() => handleView(inv.invoice_no)}
                          className="btn btn-sm btn-secondary"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(inv.invoice_no)}
                          className="btn btn-sm btn-outline"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
