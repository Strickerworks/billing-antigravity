"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { logAudit } from "@/utils/supabase/audit";

export default function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState("pending"); // pending, approved, rejected, all
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null); // For detail preview sidebar
  const [originalInvoice, setOriginalInvoice] = useState(null); // For diff comparison
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [editForm, setEditForm] = useState({});

  const router = useRouter();
  const { role } = useParams();
  const isAdmin = role === "admin";
  const isStaff = role === "staff";

  useEffect(() => {
    fetchRequests();
  }, [filterStatus, currentPage]);

  useEffect(() => {
    if (selectedRequest && selectedRequest.request_type === "update") {
      fetchOriginalInvoice(selectedRequest.invoice_no);
    } else {
      setOriginalInvoice(null);
    }
  }, [selectedRequest]);

  const fetchRequests = async () => {
    setLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    try {
      let query = supabase
        .from("billing_requests")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      if (!isAdmin) {
        query = query.eq("requested_by", "staff");
      }

      const { data, error, count } = await query.range(from, to);

      if (error) {
        console.error("Error fetching requests:", error);
        alert("Failed to load requests.");
      } else {
        setRequests(data || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleFilterStatusChange = (status) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const fetchOriginalInvoice = async (invoiceNo) => {
    setLoadingOriginal(true);
    const { data, error } = await supabase
      .from("billdata")
      .select("*")
      .eq("invoice_no", invoiceNo)
      .single();

    if (!error) {
      setOriginalInvoice(data);
    } else {
      console.error("Error fetching original invoice:", error);
      setOriginalInvoice(null);
    }
    setLoadingOriginal(false);
  };

  const handleApprove = async (req) => {
    if (!confirm(`Are you sure you want to APPROVE invoice #${req.invoice_no}? This will apply changes to the live invoices database.`)) {
      return;
    }
    setLoading(true);

    const { error: saveError } = await supabase
      .from("billdata")
      .upsert([req.data]);

    if (saveError) {
      console.error("Error saving approved invoice data:", saveError);
      alert("Failed to write invoice to database: " + saveError.message);
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("billing_requests")
      .update({ status: "approved" })
      .eq("id", req.id);

    if (updateError) {
      console.error("Error updating request status:", updateError);
      alert("Invoice was created, but failed to mark request status as approved.");
    } else {
      await logAudit({
        requestId: req.id,
        requestType: `bill_pass_${req.request_type}`,
        submittedBy: req.requested_by || "staff",
        submittedAt: req.created_at,
        status: "Approved",
        actionBy: "admin",
        actionAt: new Date().toISOString(),
        payload: req.data,
      });
    }

    setSelectedRequest(null);
    fetchRequests();
  };

  const handleReject = async (req) => {
    if (!confirm(`Are you sure you want to REJECT invoice #${req.invoice_no}? This change will be permanently ignored.`)) {
      return;
    }
    setLoading(true);

    const { error } = await supabase
      .from("billing_requests")
      .update({ status: "rejected" })
      .eq("id", req.id);

    if (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request.");
    } else {
      await logAudit({
        requestId: req.id,
        requestType: `bill_pass_${req.request_type}`,
        submittedBy: req.requested_by || "staff",
        submittedAt: req.created_at,
        status: "Rejected",
        actionBy: "admin",
        actionAt: new Date().toISOString(),
        payload: req.data,
      });
    }

    setSelectedRequest(null);
    fetchRequests();
  };

  const handleDelete = async (req) => {
    if (!confirm("Are you sure you want to cancel and delete this pending invoice request? This cannot be undone.")) {
      return;
    }
    setLoading(true);

    await logAudit({
      requestId: req.id,
      requestType: `bill_pass_${req.request_type}`,
      submittedBy: req.requested_by || "staff",
      submittedAt: req.created_at,
      status: "Deleted",
      actionBy: "staff",
      actionAt: new Date().toISOString(),
      payload: req.data,
    });

    const { error } = await supabase.from("billing_requests").delete().eq("id", req.id);

    if (error) {
      console.error("Error deleting request:", error);
      alert("Failed to delete request.");
    } else {
      alert("Request deleted successfully.");
    }

    setSelectedRequest(null);
    fetchRequests();
  };

  const openEditModal = (req) => {
    setEditingRequest(req);
    setEditForm({
      customer_name: req.data?.customer_name || "",
      customer_gst: req.data?.customer_gst || "",
      grand_total: req.data?.grand_total || 0,
      payment_account: req.data?.payment_account || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingRequest) return;
    setLoading(true);

    const updateData = {
      data: {
        ...editingRequest.data,
        customer_name: editForm.customer_name,
        customer_gst: editForm.customer_gst,
        grand_total: parseFloat(editForm.grand_total),
        payment_account: editForm.payment_account,
      },
    };

    const { error } = await supabase
      .from("billing_requests")
      .update(updateData)
      .eq("id", editingRequest.id);

    if (error) {
      console.error("Error updating request:", error);
      alert("Failed to update request.");
    } else {
      await logAudit({
        requestId: editingRequest.id,
        requestType: `bill_pass_${editingRequest.request_type}`,
        submittedBy: editingRequest.requested_by || "staff",
        submittedAt: editingRequest.created_at,
        status: "Edited",
        actionBy: "staff",
        actionAt: new Date().toISOString(),
        payload: updateData.data,
      });

      alert("Invoice request updated successfully.");
      setIsEditModalOpen(false);
      setSelectedRequest(null);
      fetchRequests();
    }
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
        return {
          backgroundColor: "var(--text-primary)",
          color: "var(--bg-card)",
          padding: "0.25rem 0.6rem",
          borderRadius: "100px",
          fontSize: "0.75rem",
          fontWeight: 600,
        };
      case "rejected":
        return {
          backgroundColor: "var(--border)",
          color: "var(--text-secondary)",
          textDecoration: "line-through",
          padding: "0.25rem 0.6rem",
          borderRadius: "100px",
          fontSize: "0.75rem",
          fontWeight: 600,
        };
      default:
        return {
          backgroundColor: "var(--border)",
          color: "var(--text-primary)",
          border: "1px solid #d1d5db",
          padding: "0.25rem 0.6rem",
          borderRadius: "100px",
          fontSize: "0.75rem",
          fontWeight: 600,
        };
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case "create":
        return { color: "#10b981", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase" };
      case "duplicate":
        return { color: "#f59e0b", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase" };
      default:
        return { color: "#3b82f6", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase" };
    }
  };

  const getDifferences = () => {
    if (!selectedRequest) return [];
    const proposed = selectedRequest.data;

    if (selectedRequest.request_type !== "update") {
      return [
        { field: "Customer Name", oldVal: "None (New Invoice)", newVal: proposed.customer_name },
        { field: "Customer GST", oldVal: "None (New Invoice)", newVal: proposed.customer_gst },
        { field: "Bill Date", oldVal: "None (New Invoice)", newVal: proposed.bill_date },
        { field: "Grand Total", oldVal: "None (New Invoice)", newVal: fmt(proposed.grand_total) },
        { field: "Payment Account", oldVal: "None (New Invoice)", newVal: proposed.payment_account || "—" },
        { field: "Items List", oldVal: "None (New Invoice)", newVal: `${proposed.content?.length || 0} items` },
      ];
    }

    if (loadingOriginal) {
      return [{ field: "Loading original...", oldVal: "Comparing...", newVal: "Please wait" }];
    }

    if (!originalInvoice) {
      return [{ field: "Original Not Found", oldVal: "Data unavailable", newVal: "Full overwrite will occur" }];
    }

    const original = originalInvoice;
    const diffs = [];

    const compareField = (label, key, isAmount = false) => {
      const oldV = original[key];
      const newV = proposed[key];
      if (oldV !== newV) {
        diffs.push({
          field: label,
          oldVal: isAmount ? fmt(oldV) : oldV || "—",
          newVal: isAmount ? fmt(newV) : newV || "—",
        });
      }
    };

    compareField("Customer Name", "customer_name");
    compareField("Customer GST", "customer_gst");
    compareField("Bill Date", "bill_date");
    compareField("Payment Account", "payment_account");
    compareField("CGST %", "cgst_percentage");
    compareField("SGST %", "sgst_percentage");
    compareField("IGST %", "igst_percentage");
    compareField("Grand Total", "grand_total", true);

    const oldContentStr = JSON.stringify(original.content || []);
    const newContentStr = JSON.stringify(proposed.content || []);
    if (oldContentStr !== newContentStr) {
      diffs.push({
        field: "Items List",
        oldVal: `${original.content?.length || 0} items`,
        newVal: `${proposed.content?.length || 0} items`,
        itemsChanged: true,
      });
    }

    const oldAddStr = JSON.stringify(original.additional_charges || []);
    const newAddStr = JSON.stringify(proposed.additional_charges || []);
    if (oldAddStr !== newAddStr) {
      diffs.push({
        field: "Additional Charges",
        oldVal: `${original.additional_charges?.length || 0} charges`,
        newVal: `${proposed.additional_charges?.length || 0} charges`,
        addChargesChanged: true,
      });
    }

    return diffs;
  };

  const diffs = getDifferences();

  return (
    <div className="page-content" style={{ position: "relative" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .requests-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
          align-items: start;
        }
        @media (min-width: 869px) {
          .requests-grid.has-sidebar {
            grid-template-columns: 1fr 400px;
          }
        }
        
        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }
        @media (max-width: 480px) {
          .comparison-grid {
            grid-template-columns: 1fr;
          }
        }
      `,
      }} />

      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="page-title">{isAdmin ? "Invoice Requests" : "Invoice Requests"}</h1>
            <p className="page-subtitle">
              {isAdmin
                ? "Review and approve billing creations, updates, or duplicates."
                : "Track, edit, or cancel your submitted invoice change requests."}
            </p>
          </div>
          <button onClick={() => router.push(`/${role}`)} className="btn btn-secondary">
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
        {["pending", "approved", "rejected", "all"].map((status) => (
          <button
            key={status}
            onClick={() => handleFilterStatusChange(status)}
            className={`btn btn-sm ${filterStatus === status ? "btn-primary" : "btn-outline"}`}
            style={{ textTransform: "capitalize" }}
          >
            {status}
          </button>
        ))}
      </div>

      <div className={`requests-grid ${selectedRequest ? "has-sidebar" : ""}`}>
        {/* Main Requests Table */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {loading ? (
              <div className="empty-state">
                <div className="empty-state-icon">⏳</div>
                <div className="empty-state-text">Loading requests...</div>
              </div>
            ) : requests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✉</div>
                <div className="empty-state-text">No invoice requests found</div>
                <div className="empty-state-sub">No invoice requests are currently pending.</div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Submitted At</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr
                        key={req.id}
                        className="fade-in"
                        style={selectedRequest?.id === req.id ? { backgroundColor: "var(--bg-card)" } : {}}
                      >
                        <td>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>#{req.invoice_no}</span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{req.data?.customer_name || "—"}</td>
                        <td>
                          <span style={getTypeStyle(req.request_type)}>{req.request_type}</span>
                        </td>
                        <td>
                          <span style={getStatusStyle(req.status)}>{req.status}</span>
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{formatDate(req.created_at)}</td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center" }}>
                            <button onClick={() => setSelectedRequest(req)} className="btn btn-sm btn-secondary">
                              Details
                            </button>

                            {isAdmin && req.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApprove(req)}
                                  className="btn btn-sm btn-primary"
                                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(req)}
                                  className="btn btn-sm btn-outline"
                                  style={{ color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.25)", padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {!isAdmin && req.status === "pending" && (
                              <>
                                <button
                                  onClick={() => openEditModal(req)}
                                  className="btn btn-sm btn-outline"
                                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(req)}
                                  className="btn btn-sm btn-outline"
                                  style={{ color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.25)", padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                                >
                                  Cancel
                                </button>
                              </>
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
        {selectedRequest && (
          <div className="card fade-in" style={{ border: "1px solid var(--border)", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <p style={{ fontWeight: 700, margin: 0, fontSize: "0.95rem" }}>
                  {selectedRequest.request_type === "update" ? "Proposed Changes" : "New Invoice Preview"}
                </p>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  Invoice #{selectedRequest.invoice_no} ({selectedRequest.request_type})
                </span>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.825rem" }}>
              {diffs.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", textAlign: "center", margin: "1rem 0" }}>
                  No basic field differences detected.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  {diffs.map((diff, idx) => (
                    <div key={idx} style={{ borderBottom: "1px solid var(--bg-elevated)", paddingBottom: "0.5rem" }}>
                      <p style={{ fontWeight: 600, margin: "0 0 0.25rem", color: "#4b5563", fontSize: "0.78rem" }}>
                        {diff.field}
                      </p>
                      {selectedRequest.request_type === "update" && diff.oldVal !== undefined ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{ color: "var(--text-muted)", textDecoration: "line-through", whiteSpace: "nowrap" }}>
                            {diff.oldVal}
                          </span>
                          <span style={{ color: "var(--text-muted)" }}>&rarr;</span>
                          <strong style={{ color: "var(--text-primary)" }}>{diff.newVal}</strong>
                        </div>
                      ) : (
                        <strong style={{ color: "var(--text-primary)" }}>{diff.newVal}</strong>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Items Summary (for Billing Create/Duplicate) */}
              {selectedRequest.request_type !== "update" && (
                <div>
                  <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: "0.5rem 0 0.25rem", fontSize: "0.8rem" }}>
                    Content Summary:
                  </p>
                  <div style={{ maxHeight: "150px", overflowY: "auto", background: "var(--bg-card)", borderRadius: "6px", padding: "0.5rem", border: "1px solid var(--bg-elevated)" }}>
                    {selectedRequest.data?.content?.map((item, idx) => (
                      <div key={idx} style={{ padding: "0.25rem 0", fontSize: "0.75rem", borderBottom: idx < selectedRequest.data.content.length - 1 ? "1px dashed var(--border)" : "none" }}>
                        <strong>{item.sno}. {item.description}</strong>
                        <br />
                        <span style={{ color: "var(--text-secondary)" }}>
                          {item.unit} Unit @ {fmt(item.rate)} = {fmt(item.amount)}
                        </span>
                      </div>
                    )) || <p style={{ margin: 0, color: "var(--text-muted)" }}>No items found</p>}
                  </div>
                </div>
              )}

              {isAdmin && selectedRequest.status === "pending" && (
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                  <button onClick={() => handleApprove(selectedRequest)} className="btn btn-primary" style={{ flex: 1, padding: "0.5rem" }}>
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest)}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: "0.5rem", color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.25)" }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingRequest && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="card fade-in" style={{ width: "90%", maxWidth: "500px", padding: "1.5rem", position: "relative" }}>
            <p className="card-title" style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
              Edit Pending Invoice Request
            </p>
            <form onSubmit={handleEditSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="form-label">Customer Name</label>
                  <input
                    type="text"
                    value={editForm.customer_name}
                    onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Customer GST</label>
                  <input
                    type="text"
                    value={editForm.customer_gst}
                    onChange={(e) => setEditForm({ ...editForm, customer_gst: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Grand Total (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.grand_total}
                    onChange={(e) => setEditForm({ ...editForm, grand_total: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Payment Account</label>
                  <select
                    value={editForm.payment_account}
                    onChange={(e) => setEditForm({ ...editForm, payment_account: e.target.value })}
                    className="form-select"
                  >
                    <option value="">Select Account</option>
                    <option value="Bank of India - THE HERITAGE TRAVEL">Bank of India — Heritage Travel</option>
                    <option value="ICICI Bank - THE HERITAGE GROUP">ICICI Bank — Heritage Group</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
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
