"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useParams, notFound } from "next/navigation";

export default function RecycleBin() {
  const { role } = useParams();

  if (role !== "admin") {
    notFound();
  }

  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchArchivedInvoices();
  }, []);

  const fetchArchivedInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("billdata")
      .select("*")
      .eq("active_status", "inactive")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching archived invoices:", error);
      alert("Could not load archived invoices.");
    } else {
      setInvoices(data || []);
    }
    setLoading(false);
  };

  const handleRecover = async (invoice_no) => {
    if (!confirm(`Are you sure you want to recover invoice #${invoice_no}?`)) {
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("billdata")
      .update({ active_status: "active" })
      .eq("invoice_no", invoice_no);

    if (error) {
      console.error("Error recovering invoice:", error);
      alert("Failed to recover invoice.");
      setLoading(false);
    } else {
      alert("Invoice recovered successfully!");
      fetchArchivedInvoices();
    }
  };

  const handlePermanentDelete = async (invoice_no) => {
    if (!confirm(`WARNING: Are you sure you want to PERMANENTLY delete invoice #${invoice_no}? This action cannot be undone.`)) {
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("billdata")
      .delete()
      .eq("invoice_no", invoice_no);

    if (error) {
      console.error("Error permanently deleting invoice:", error);
      alert("Failed to delete invoice permanently.");
      setLoading(false);
    } else {
      alert("Invoice permanently deleted.");
      fetchArchivedInvoices();
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const term = searchTerm.toLowerCase();
    return (
      String(invoice.invoice_no || "").toLowerCase().includes(term) ||
      invoice.customer_name?.toLowerCase().includes(term) ||
      invoice.customer_gst?.toLowerCase().includes(term)
    );
  });

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
            <h1 className="page-title">Recycle Bin</h1>
            <p className="page-subtitle">
              {loading ? "Loading..." : `${filteredInvoices.length} archived invoice${filteredInvoices.length !== 1 ? "s" : ""}${searchTerm ? " found" : ""}`}
            </p>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="btn btn-secondary"
          >
            ← Back to Dashboard
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
            placeholder="Search archived invoices..."
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
            <div className="empty-state-text">Loading archives...</div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🗑</div>
            <div className="empty-state-text">Recycle Bin is empty</div>
            <div className="empty-state-sub">
              {searchTerm ? "Try a different search term." : "Deleted invoices will appear here for recovery."}
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
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>#{inv.invoice_no}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{inv.customer_name}</td>
                    <td style={{ color: "var(--text-muted)", fontFamily: "monospace", fontSize: "0.8rem" }}>{inv.customer_gst}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{formatDate(inv.created_at)}</td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "var(--text-primary)" }}>
                      {fmt(inv.grand_total)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                        <button
                          onClick={() => handleRecover(inv.invoice_no)}
                          className="btn btn-sm btn-secondary"
                        >
                          Recover
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(inv.invoice_no)}
                          className="btn btn-sm btn-outline"
                          style={{ color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.25)" }}
                        >
                          Delete permanently
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
