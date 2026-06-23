"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";

export default function FetchInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const router = useRouter();
  const { role } = useParams();
  const isAdmin = role === "admin";

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    try {
      // Fetch invoices with pagination range selection
      let query = supabase
        .from("billdata")
        .select("*", { count: "exact" })
        .eq("active_status", "active")
        .order("created_at", { ascending: false });

      if (searchTerm.trim()) {
        const term = searchTerm.trim();
        if (!isNaN(term)) {
          query = query.eq("invoice_no", parseInt(term));
        } else {
          query = query.or(`customer_name.ilike.%${term}%,customer_gst.ilike.%${term}%`);
        }
      }

      const { data: invoicesData, error: invoicesError, count } = await query.range(from, to);

      // Fetch payment requests (usually small dataset, fetched for status tags lookup)
      const { data: reqsData, error: reqsError } = await supabase
        .from("payment_acknowledgement_requests")
        .select("*");

      if (invoicesError || reqsError) {
        console.error("Error fetching data:", invoicesError || reqsError);
        alert("Could not load invoices.");
      } else {
        setInvoices(invoicesData || []);
        setTotalCount(count || 0);
        setPaymentRequests(reqsData || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (invoice_no) => {
    if (!confirm(`Are you sure you want to move invoice #${invoice_no} to the Recycle Bin?`)) {
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("billdata")
      .update({ active_status: "inactive" })
      .eq("invoice_no", invoice_no);

    if (error) {
      console.error("Error soft-deleting invoice:", error);
      alert("Failed to delete invoice.");
      setLoading(false);
    } else {
      fetchData();
    }
  };

  const getInvoicePaymentStatus = (invoice) => {
    if (invoice.payment_status === "Received") {
      return { label: "Received", style: { backgroundColor: "#111111", color: "#ffffff" } };
    }

    const pendingReq = paymentRequests.find(
      (r) => r.invoice_no === invoice.invoice_no && r.status === "pending"
    );
    if (pendingReq) {
      return { label: "Pending Approval", style: { backgroundColor: "#f59e0b", color: "#ffffff" } };
    }

    return { label: "Not Received", style: { backgroundColor: "#e5e7eb", color: "#6b7280" } };
  };

  const handleView = (invoice_no) => {
    router.push(`/${role}/view/${invoice_no}`);
  };

  const handleEdit = (invoice_no) => {
    router.push(`/${role}/edit?invoice=${invoice_no}`);
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return "—";
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const fmt = (num) =>
    `₹${parseFloat(num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div className="page-content">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="page-title">All Invoices</h1>
            <p className="page-subtitle">
              {loading
                ? "Loading..."
                : `${totalCount} invoice${totalCount !== 1 ? "s" : ""}${
                    searchTerm ? " found" : " total"
                  }`}
            </p>
          </div>
          <button onClick={() => router.push(`/${role}/add-invoice`)} className="btn btn-primary">
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
            onChange={handleSearchChange}
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
        ) : invoices.length === 0 ? (
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
                  <th>Payment</th>
                  <th style={{ textAlign: "right" }}>Grand Total</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const pStatus = getInvoicePaymentStatus(inv);
                  return (
                    <tr key={inv.invoice_no} className="fade-in">
                      <td>
                        <span style={{ fontWeight: 600, color: "#1a1d23" }}>#{inv.invoice_no}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{inv.customer_name}</td>
                      <td style={{ color: "#9ca3af", fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {inv.customer_gst}
                      </td>
                      <td style={{ color: "#6b7280" }}>{formatDate(inv.bill_date)}</td>
                      <td>
                        <span
                          style={{
                            padding: "0.25rem 0.6rem",
                            borderRadius: "100px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            ...pStatus.style,
                          }}
                        >
                          {pStatus.label}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: "#1a1d23" }}>
                        {fmt(inv.grand_total)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", alignItems: "center" }}>
                          <button onClick={() => handleView(inv.invoice_no)} className="btn btn-sm btn-secondary">
                            View
                          </button>
                          <button onClick={() => handleEdit(inv.invoice_no)} className="btn btn-sm btn-outline">
                            Edit
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(inv.invoice_no)}
                              className="btn btn-sm btn-outline"
                              style={{ color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.25)" }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && totalCount > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "0 0.5rem" }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || loading}
            className="btn btn-secondary"
            style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
          >
            ◀ Previous
          </button>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4b5563" }}>
            Page {currentPage} of {Math.max(Math.ceil(totalCount / itemsPerPage), 1)}
          </span>
          <button
            onClick={() => setCurrentPage(prev => (prev * itemsPerPage < totalCount ? prev + 1 : prev))}
            disabled={currentPage * itemsPerPage >= totalCount || loading}
            className="btn btn-secondary"
            style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
          >
            Next ▶
          </button>
        </div>
      )}
    </div>
  );
}
