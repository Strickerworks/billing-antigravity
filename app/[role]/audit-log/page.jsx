"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [filterType, setFilterType] = useState("all"); // all, bill_pass, payment, expense
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const router = useRouter();
  const { role } = useParams();
  const isAdmin = role === "admin";

  useEffect(() => {
    fetchLogs();
  }, [filterType, currentPage]);

  const fetchLogs = async () => {
    setLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    try {
      let query = supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .order("submitted_at", { ascending: false });

      if (filterType !== "all") {
        if (filterType === "bill_pass") {
          query = query.like("request_type", "bill_pass_%");
        } else if (filterType === "payment") {
          query = query.eq("request_type", "payment_acknowledgement");
        } else if (filterType === "expense") {
          query = query.eq("request_type", "expense_report");
        }
      }

      const { data, error, count } = await query.range(from, to);
      if (error) {
        console.error("Error fetching audit logs:", error);
        alert("Failed to load audit logs.");
      } else {
        setLogs(data || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handleDeleteLog = async (logId) => {
    if (!confirm("Are you sure you want to permanently delete this audit log record? This cannot be undone.")) {
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("audit_logs").delete().eq("id", logId);
    if (error) {
      console.error("Error deleting audit log:", error);
      alert("Failed to delete log record.");
    } else {
      alert("Audit log record deleted.");
      setSelectedLog(null);
      fetchLogs();
    }
    setLoading(false);
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return "—";
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeStyle = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return { backgroundColor: "var(--text-primary)", color: "var(--bg-card)", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 600 };
      case "rejected":
        return { backgroundColor: "#fee2e2", color: "#991b1b", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 600 };
      case "pending":
        return { backgroundColor: "var(--badge-warning-bg)", color: "var(--badge-warning-text)", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 600 };
      case "deleted":
        return { backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", textDecoration: "line-through", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 600 };
      case "edited":
        return { backgroundColor: "#e0f2fe", color: "#075985", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 600 };
      case "reverted":
        return { backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px dashed #d1d5db", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 600 };
      default:
        return { backgroundColor: "var(--border)", color: "var(--text-primary)", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 600 };
    }
  };

  const fmt = (num) =>
    `₹${parseFloat(num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const getRequestTypeLabel = (type) => {
    if (type.startsWith("bill_pass_")) {
      return `Bill Pass: ${type.replace("bill_pass_", "").toUpperCase()}`;
    }
    if (type === "payment_acknowledgement") {
      return "Payment Acknowledgement";
    }
    if (type === "expense_report") {
      return "Expense Report";
    }
    return type;
  };

  return (
    <div className="page-content" style={{ position: "relative" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .audit-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
          align-items: start;
        }
        @media (min-width: 869px) {
          .audit-grid.has-sidebar {
            grid-template-columns: 1fr 380px;
          }
        }
      `,
      }} />

      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="page-title">Audit Trail &amp; History</h1>
            <p className="page-subtitle">A unified history log of all billing creations, payment acknowledgements, and expenses.</p>
          </div>
          <button onClick={() => router.push(`/${role}`)} className="btn btn-secondary">
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
        {[
          { id: "all", label: "All Logs" },
          { id: "bill_pass", label: "Invoices" },
          { id: "payment", label: "Payments" },
          { id: "expense", label: "Expenses" },
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => handleFilterChange(type.id)}
            className={`btn btn-sm ${filterType === type.id ? "btn-primary" : "btn-outline"}`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className={`audit-grid ${selectedLog ? "has-sidebar" : ""}`}>
        {/* Main Log Table */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {loading ? (
              <div className="empty-state">
                <div className="empty-state-icon">⏳</div>
                <div className="empty-state-text">Loading logs...</div>
              </div>
            ) : logs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📜</div>
                <div className="empty-state-text">No audit history found</div>
                <div className="empty-state-sub">History of requests will display here as they are processed.</div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Submitted By</th>
                      <th>Submitted At</th>
                      <th>Action/Status</th>
                      <th>Processed By</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="fade-in"
                        style={selectedLog?.id === log.id ? { backgroundColor: "var(--bg-card)" } : {}}
                      >
                        <td style={{ fontWeight: 600 }}>{getRequestTypeLabel(log.request_type)}</td>
                        <td>
                          <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{log.submitted_by}</span>
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{formatDate(log.submitted_at)}</td>
                        <td>
                          <span style={getStatusBadgeStyle(log.status)}>{log.status}</span>
                        </td>
                        <td>
                          {log.action_by ? (
                            <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>
                              {log.action_by} <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>({formatDate(log.action_at)})</span>
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>—</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", alignItems: "center" }}>
                            <button onClick={() => setSelectedLog(log)} className="btn btn-sm btn-secondary">
                              View
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteLog(log.id)}
                                className="btn btn-sm btn-outline"
                                style={{ color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.25)" }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {!loading && totalCount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0.5rem" }}>
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

        {/* Sidebar Details Panel */}
        {selectedLog && (
          <div className="card fade-in" style={{ border: "1px solid var(--border)", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <p style={{ fontWeight: 700, margin: 0, fontSize: "0.95rem" }}>Log Payload Details</p>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  Log #{selectedLog.id} ({getRequestTypeLabel(selectedLog.request_type)})
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.825rem" }}>
              <div>
                <p style={{ fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 0.25rem", fontSize: "0.75rem" }}>
                  Request Identifier
                </p>
                <strong>{selectedLog.request_id || "—"}</strong>
              </div>

              <div>
                <p style={{ fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 0.25rem", fontSize: "0.75rem" }}>
                  Status Trail
                </p>
                <span style={getStatusBadgeStyle(selectedLog.status)}>{selectedLog.status}</span>
              </div>

              <hr className="divider" style={{ margin: "0.25rem 0" }} />

              <div>
                <p style={{ fontWeight: 600, color: "#4b5563", margin: "0 0 0.5rem", fontSize: "0.78rem" }}>
                  Payload Submitted Values:
                </p>
                <div style={{
                  background: "var(--bg-card)", borderRadius: "6px", padding: "0.75rem", border: "1px solid var(--border)",
                  maxHeight: "300px", overflowY: "auto", fontFamily: "monospace", fontSize: "0.78rem", whiteSpace: "pre-wrap"
                }}>
                  {selectedLog.payload ? (
                    <div>
                      {selectedLog.request_type.startsWith("bill_pass_") && (
                        <div>
                          <strong>Customer Name:</strong> {selectedLog.payload.customer_name || "—"}<br />
                          <strong>Customer GST:</strong> {selectedLog.payload.customer_gst || "—"}<br />
                          <strong>Date:</strong> {selectedLog.payload.bill_date || "—"}<br />
                          <strong>Grand Total:</strong> {fmt(selectedLog.payload.grand_total)}<br />
                          <strong>Account:</strong> {selectedLog.payload.payment_account || "—"}<br />
                          <strong>Items Count:</strong> {selectedLog.payload.content?.length || 0} items
                        </div>
                      )}
                      {selectedLog.request_type === "payment_acknowledgement" && (
                        <div>
                          <strong>Invoice No:</strong> #{selectedLog.payload.invoice_no}<br />
                          <strong>Payment Mode:</strong> {selectedLog.payload.payment_mode}<br />
                          <strong>Comment/Notes:</strong> {selectedLog.payload.comment || "—"}
                        </div>
                      )}
                      {selectedLog.request_type === "expense_report" && (
                        <div>
                          <strong>Category:</strong> {selectedLog.payload.category}<br />
                          <strong>Amount:</strong> {fmt(selectedLog.payload.amount)}<br />
                          <strong>Comment:</strong> {selectedLog.payload.comment || "—"}
                        </div>
                      )}
                      <div style={{ marginTop: "1rem", borderTop: "1px dashed #d1d5db", paddingTop: "0.5rem", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                        Raw JSON:<br />
                        {JSON.stringify(selectedLog.payload, null, 2)}
                      </div>
                    </div>
                  ) : (
                    "No payload recorded."
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
