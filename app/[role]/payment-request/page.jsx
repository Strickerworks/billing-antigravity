"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { logAudit } from "@/utils/supabase/audit";

export default function PaymentRequestsHistoryPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalReceivedAmount, setTotalReceivedAmount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  
  // Modal for Editing pending requests
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [editPaymentMode, setEditPaymentMode] = useState("UPI");
  const [editComment, setEditComment] = useState("");
  const [updating, setUpdating] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const router = useRouter();
  const { role } = useParams();
  const isAdmin = role === "admin";
  const isStaff = role === "staff";

  useEffect(() => {
    fetchRequests();
  }, [currentPage]);

  const fetchRequests = async () => {
    setLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    try {
      // 1. Fetch payment request items with range selection
      let query = supabase
        .from("payment_acknowledgement_requests")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        query = query.eq("requested_by", "staff");
      }

      const { data: requestsData, error: requestsError, count } = await query.range(from, to);
      
      // 2. Fetch payments received from billdata (KPI total)
      const { data: receivedData, error: receivedError } = await supabase
        .from("billdata")
        .select("grand_total")
        .eq("active_status", "active")
        .eq("payment_status", "Received");

      // 3. Fetch pending requests count (KPI pending count)
      let pendingQuery = supabase
        .from("payment_acknowledgement_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (!isAdmin) {
        pendingQuery = pendingQuery.eq("requested_by", "staff");
      }
      const { count: pendingHeadCount } = await pendingQuery;

      if (requestsError || receivedError) {
        console.error("Error fetching payment requests:", requestsError || receivedError);
        alert("Failed to load payment requests.");
      } else {
        setRequests(requestsData || []);
        setTotalCount(count || 0);
        setPendingCount(pendingHeadCount || 0);

        const totalAmt = (receivedData || []).reduce((sum, item) => sum + parseFloat(item.grand_total || 0), 0);
        setTotalReceivedAmount(totalAmt);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleApprove = async (req) => {
    if (!confirm(`Are you sure you want to approve payment of Invoice #${req.invoice_no}?`)) {
      return;
    }
    setLoading(true);

    const { error: saveError } = await supabase
      .from("billdata")
      .update({
        payment_status: "Received",
        payment_mode: req.payment_mode,
        payment_comment: req.comment,
      })
      .eq("invoice_no", req.invoice_no);

    if (saveError) {
      console.error("Error updating invoice payment status:", saveError);
      alert("Failed to update invoice: " + saveError.message);
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("payment_acknowledgement_requests")
      .update({ status: "approved" })
      .eq("id", req.id);

    if (updateError) {
      console.error("Error updating request:", updateError);
    } else {
      await logAudit({
        requestId: req.id,
        requestType: "payment_acknowledgement",
        submittedBy: req.requested_by || "staff",
        submittedAt: req.created_at,
        status: "Approved",
        actionBy: "admin",
        actionAt: new Date().toISOString(),
        payload: {
          invoice_no: req.invoice_no,
          payment_mode: req.payment_mode,
          comment: req.comment,
        },
      });
      fetchRequests();
    }
    setLoading(false);
  };

  const handleReject = async (req) => {
    if (!confirm(`Are you sure you want to reject payment of Invoice #${req.invoice_no}?`)) {
      return;
    }
    setLoading(true);

    const { error } = await supabase
      .from("payment_acknowledgement_requests")
      .update({ status: "rejected" })
      .eq("id", req.id);

    if (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request.");
    } else {
      await logAudit({
        requestId: req.id,
        requestType: "payment_acknowledgement",
        submittedBy: req.requested_by || "staff",
        submittedAt: req.created_at,
        status: "Rejected",
        actionBy: "admin",
        actionAt: new Date().toISOString(),
        payload: {
          invoice_no: req.invoice_no,
          payment_mode: req.payment_mode,
          comment: req.comment,
        },
      });
      fetchRequests();
    }
    setLoading(false);
  };

  const handleRevert = async (req) => {
    if (!confirm(`Are you sure you want to REVERT payment approval for Invoice #${req.invoice_no}?`)) {
      return;
    }
    setLoading(true);

    if (req.status === "approved") {
      const { error: resetError } = await supabase
        .from("billdata")
        .update({
          payment_status: "Not Received",
          payment_mode: null,
          payment_comment: null,
        })
        .eq("invoice_no", req.invoice_no);

      if (resetError) {
        console.error("Error resetting invoice payment status:", resetError);
        alert("Failed to reset invoice fields: " + resetError.message);
        setLoading(false);
        return;
      }
    }

    const { error: updateError } = await supabase
      .from("payment_acknowledgement_requests")
      .update({ status: "pending" })
      .eq("id", req.id);

    if (updateError) {
      console.error("Error reverting request status:", updateError);
      alert("Failed to revert request: " + updateError.message);
    } else {
      await logAudit({
        requestId: req.id,
        requestType: "payment_acknowledgement",
        submittedBy: req.requested_by || "staff",
        submittedAt: req.created_at,
        status: "Reverted",
        actionBy: "admin",
        actionAt: new Date().toISOString(),
        payload: {
          invoice_no: req.invoice_no,
          payment_mode: req.payment_mode,
          comment: req.comment,
        },
      });
      fetchRequests();
    }
    setLoading(false);
  };

  const handleDelete = async (req) => {
    if (!confirm("Are you sure you want to cancel and delete this pending request?")) {
      return;
    }
    setLoading(true);

    await logAudit({
      requestId: req.id,
      requestType: "payment_acknowledgement",
      submittedBy: req.requested_by || "staff",
      submittedAt: req.created_at,
      status: "Deleted",
      actionBy: role,
      actionAt: new Date().toISOString(),
      payload: {
        invoice_no: req.invoice_no,
        payment_mode: req.payment_mode,
        comment: req.comment,
      },
    });

    const { error } = await supabase
      .from("payment_acknowledgement_requests")
      .delete()
      .eq("id", req.id);

    if (error) {
      console.error("Error deleting request:", error);
      alert("Failed to delete request.");
    } else {
      fetchRequests();
    }
    setLoading(false);
  };

  const openEditModal = (req) => {
    setEditingRequest(req);
    setEditPaymentMode(req.payment_mode || "UPI");
    setEditComment(req.comment || "");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingRequest) return;
    setUpdating(true);

    const { error } = await supabase
      .from("payment_acknowledgement_requests")
      .update({
        payment_mode: editPaymentMode,
        comment: editComment,
      })
      .eq("id", editingRequest.id);

    if (error) {
      console.error("Error updating request:", error);
      alert("Failed to update request.");
    } else {
      await logAudit({
        requestId: editingRequest.id,
        requestType: "payment_acknowledgement",
        submittedBy: editingRequest.requested_by || "staff",
        submittedAt: editingRequest.created_at,
        status: "Edited",
        actionBy: role,
        actionAt: new Date().toISOString(),
        payload: {
          invoice_no: editingRequest.invoice_no,
          payment_mode: editPaymentMode,
          comment: editComment,
        },
      });

      alert("Request updated successfully.");
      setIsEditModalOpen(false);
      fetchRequests();
    }
    setUpdating(false);
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

  const fmt = (num) =>
    `₹${parseFloat(num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const getStatusStyle = (status) => {
    switch (status) {
      case "approved":
        return { backgroundColor: "var(--text-primary)", color: "var(--bg-card)", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600 };
      case "rejected":
        return { backgroundColor: "var(--border)", color: "var(--text-secondary)", textDecoration: "line-through", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600 };
      default:
        return { backgroundColor: "var(--border)", color: "var(--text-primary)", border: "1px solid #d1d5db", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600 };
    }
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="page-title">Payment Requests</h1>
            <p className="page-subtitle">
              {isAdmin
                ? "Review and approve payment acknowledgement requests from staff."
                : "Track the status of payment request acknowledgements you raised."}
            </p>
          </div>
          <button onClick={() => router.push(`/${role}`)} className="btn btn-secondary">
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1rem",
        marginBottom: "1.5rem"
      }}>
        {/* Total Payments Received */}
        <div className="card fade-in" style={{
          background: "linear-gradient(135deg, var(--badge-success-bg) 0%, var(--badge-success-bg) 100%)",
          border: "1px solid var(--badge-success-border)",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          padding: "1rem 1.25rem"
        }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--badge-success-text)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Total Payments Confirmed
          </span>
          <span style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--badge-success-text)" }}>
            {fmt(totalReceivedAmount)}
          </span>
        </div>

        {/* Pending Reviews */}
        <div className="card fade-in" style={{
          background: "linear-gradient(135deg, var(--badge-warning-bg) 0%, var(--badge-warning-bg) 100%)",
          border: "1px solid var(--badge-warning-border)",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          padding: "1rem 1.25rem"
        }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--badge-warning-text)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Pending to be Reviewed
          </span>
          <span style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--badge-warning-text)" }}>
            {pendingCount} request{pendingCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* History table */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem 0" }}>
            <p className="card-title">Payment Acknowledger Logs</p>
          </div>
          {loading ? (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <div className="empty-state-text">Loading requests...</div>
            </div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <div className="empty-state-text">No payment requests found</div>
              <div className="empty-state-sub">
                No payment acknowledgement requests have been raised yet. Submit one from the dashboard!
              </div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Payment Mode</th>
                    <th>Status</th>
                    <th>Comment</th>
                    <th>Submitted By</th>
                    <th>Submitted At</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="fade-in">
                      <td>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>#{req.invoice_no}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{req.payment_mode}</td>
                      <td>
                        <span style={getStatusStyle(req.status)}>{req.status}</span>
                      </td>
                      <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {req.comment || "—"}
                      </td>
                      <td style={{ textTransform: "capitalize", fontWeight: 500 }}>{req.requested_by}</td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{formatDate(req.created_at)}</td>
                      <td style={{ textAlign: "center" }}>
                        {/* Admin actions */}
                        {isAdmin && (
                          req.status === "pending" ? (
                            <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center" }}>
                              <button onClick={() => handleApprove(req)} className="btn btn-sm btn-primary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(req)}
                                className="btn btn-sm btn-outline"
                                style={{ color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.25)", padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", alignItems: "center" }}>
                              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{req.status}</span>
                              <button
                                onClick={() => handleRevert(req)}
                                className="btn btn-sm btn-outline"
                                style={{ padding: "0.15rem 0.4rem", fontSize: "0.7rem" }}
                              >
                                Revert
                              </button>
                              <button
                                onClick={() => handleDelete(req)}
                                className="btn btn-sm btn-outline"
                                style={{ color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.1)", padding: "0.15rem 0.4rem", fontSize: "0.7rem" }}
                              >
                                Delete
                              </button>
                            </div>
                          )
                        )}

                        {/* Staff actions */}
                        {isStaff && (
                          req.status === "pending" ? (
                            <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center" }}>
                              <button onClick={() => openEditModal(req)} className="btn btn-sm btn-outline" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(req)}
                                className="btn btn-sm btn-outline"
                                style={{ color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.25)", padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Processed</span>
                          )
                        )}
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

      {/* Edit Modal */}
      {isEditModalOpen && editingRequest && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="card fade-in"
            style={{ width: "90%", maxWidth: "450px", padding: "1.5rem", position: "relative" }}
          >
            <p className="card-title" style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
              Edit Pending Payment Request (Invoice #{editingRequest.invoice_no})
            </p>
            <form onSubmit={handleEditSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="form-label">Mode of Payment</label>
                  <select
                    value={editPaymentMode}
                    onChange={(e) => setEditPaymentMode(e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Comment</label>
                  <textarea
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    className="form-textarea"
                    placeholder="Update comments..."
                    rows={3}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
