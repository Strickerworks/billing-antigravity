"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";

export default function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState("pending"); // pending, approved, rejected, all
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null); // For detail preview sidebar
  const [originalInvoice, setOriginalInvoice] = useState(null); // For diff comparison
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  const router = useRouter();
  const { role } = useParams();
  const isAdmin = role === "admin";

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  useEffect(() => {
    if (selectedRequest && selectedRequest.request_type === "update") {
      fetchOriginalInvoice(selectedRequest.invoice_no);
    } else {
      setOriginalInvoice(null);
    }
  }, [selectedRequest]);

  const fetchRequests = async () => {
    setLoading(true);
    let query = supabase
      .from("billing_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    // Staff should only see their own requests
    if (!isAdmin) {
      query = query.eq("requested_by", "staff");
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching requests:", error);
      alert("Failed to load requests.");
    } else {
      setRequests(data || []);
    }
    setLoading(false);
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

    // 1. Write the payload data into the main 'billdata' table
    const { error: saveError } = await supabase
      .from("billdata")
      .upsert([req.data]);

    if (saveError) {
      console.error("Error saving approved invoice data:", saveError);
      alert("Failed to write invoice to database: " + saveError.message);
      setLoading(false);
      return;
    }

    // 2. Mark the change request status as 'approved'
    const { error: updateError } = await supabase
      .from("billing_requests")
      .update({ status: "approved" })
      .eq("id", req.id);

    if (updateError) {
      console.error("Error updating request status:", updateError);
      alert("Invoice was created, but failed to mark request status as approved.");
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
    }

    setSelectedRequest(null);
    fetchRequests();
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return "—";
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const fmt = (num) => `₹${parseFloat(num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const getStatusStyle = (status) => {
    switch (status) {
      case "approved":
        return { backgroundColor: "#111111", color: "#ffffff", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600 };
      case "rejected":
        return { backgroundColor: "#e5e7eb", color: "#6b7280", textDecoration: "line-through", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600 };
      default:
        return { backgroundColor: "#e5e7eb", color: "#111111", border: "1px solid #d1d5db", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600 };
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

    // For new/duplicate requests, everything is new, so show core creation details
    if (selectedRequest.request_type !== "update") {
      return [
        { field: "Customer Name", oldVal: "None (New Invoice)", newVal: proposed.customer_name },
        { field: "Customer GST", oldVal: "None (New Invoice)", newVal: proposed.customer_gst },
        { field: "Bill Date", oldVal: "None (New Invoice)", newVal: proposed.bill_date },
        { field: "Grand Total", oldVal: "None (New Invoice)", newVal: fmt(proposed.grand_total) },
        { field: "Payment Account", oldVal: "None (New Invoice)", newVal: proposed.payment_account || "—" },
        { field: "Items List", oldVal: "None (New Invoice)", newVal: `${proposed.content?.length || 0} items` }
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
          oldVal: isAmount ? fmt(oldV) : (oldV || "—"),
          newVal: isAmount ? fmt(newV) : (newV || "—")
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

    // Compare content items
    const oldContentStr = JSON.stringify(original.content || []);
    const newContentStr = JSON.stringify(proposed.content || []);
    if (oldContentStr !== newContentStr) {
      diffs.push({
        field: "Items List",
        oldVal: `${original.content?.length || 0} items`,
        newVal: `${proposed.content?.length || 0} items`,
        itemsChanged: true
      });
    }

    // Compare additional charges
    const oldAddStr = JSON.stringify(original.additional_charges || []);
    const newAddStr = JSON.stringify(proposed.additional_charges || []);
    if (oldAddStr !== newAddStr) {
      diffs.push({
        field: "Additional Charges",
        oldVal: `${original.additional_charges?.length || 0} charges`,
        newVal: `${proposed.additional_charges?.length || 0} charges`,
        addChargesChanged: true
      });
    }

    return diffs;
  };

  const diffs = getDifferences();
  const itemsChanged = diffs.some(d => d.itemsChanged);

  return (
    <div className="page-content" style={{ position: "relative" }}>
      {/* Responsive stylesheet for the requests layout */}
      <style dangerouslySetInnerHTML={{__html: `
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
      `}} />

      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="page-title">{isAdmin ? "Approval Requests" : "My Requests"}</h1>
            <p className="page-subtitle">
              {isAdmin ? "Manage and approve billing updates made by staff members." : "Track status of your submitted invoice change requests."}
            </p>
          </div>
          <button
            onClick={() => router.push(`/${role}`)}
            className="btn btn-secondary"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
        {["pending", "approved", "rejected", "all"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`btn btn-sm ${filterStatus === status ? "btn-primary" : "btn-outline"}`}
            style={{ textTransform: "capitalize" }}
          >
            {status}
          </button>
        ))}
      </div>

      <div className={`requests-grid ${selectedRequest ? "has-sidebar" : ""}`}>
        {/* Main Requests Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <div className="empty-state-text">Loading requests...</div>
            </div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✉</div>
              <div className="empty-state-text">No requests found</div>
              <div className="empty-state-sub">
                No change requests are currently recorded in the system.
              </div>
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
                      style={selectedRequest?.id === req.id ? { backgroundColor: "#f9fafb" } : {}}
                    >
                      <td>
                        <span style={{ fontWeight: 600, color: "#1a1d23" }}>#{req.invoice_no}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{req.data?.customer_name || "—"}</td>
                      <td>
                        <span style={getTypeStyle(req.request_type)}>{req.request_type}</span>
                      </td>
                      <td>
                        <span style={getStatusStyle(req.status)}>{req.status}</span>
                      </td>
                      <td style={{ color: "#6b7280", fontSize: "0.8rem" }}>{formatDate(req.created_at)}</td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="btn btn-sm btn-secondary"
                          >
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar Details Panel */}
        {selectedRequest && (
          <div className="card fade-in" style={{ border: "1px solid #e5e7eb", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <p style={{ fontWeight: 700, margin: 0, fontSize: "0.95rem" }}>
                  {selectedRequest.request_type === "update" ? "Proposed Changes" : "New Invoice Preview"}
                </p>
                <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>
                  Invoice #{selectedRequest.invoice_no} ({selectedRequest.request_type})
                </span>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "#9ca3af" }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.825rem" }}>
              {diffs.length === 0 ? (
                <p style={{ color: "#6b7280", textAlign: "center", margin: "1rem 0" }}>
                  No basic field differences detected.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  {diffs.map((diff, idx) => (
                    <div key={idx} style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
                      <p style={{ fontWeight: 600, margin: "0 0 0.25rem", color: "#4b5563", fontSize: "0.78rem" }}>
                        {diff.field}
                      </p>
                      {selectedRequest.request_type === "update" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{ color: "#9ca3af", textDecoration: "line-through", whiteSpace: "nowrap" }}>
                            {diff.oldVal}
                          </span>
                          <span style={{ color: "#9ca3af" }}>&rarr;</span>
                          <strong style={{ color: "#111111" }}>
                            {diff.newVal}
                          </strong>
                        </div>
                      ) : (
                        <strong style={{ color: "#111111" }}>
                          {diff.newVal}
                        </strong>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Items Side-by-Side Comparison (only for update requests when content changed) */}
              {selectedRequest.request_type === "update" && itemsChanged && originalInvoice && (
                <div style={{ marginTop: "0.25rem" }}>
                  <p style={{ fontWeight: 600, color: "#4b5563", margin: "0 0 0.35rem", fontSize: "0.78rem" }}>
                    Items Comparison:
                  </p>
                  <div className="comparison-grid">
                    <div>
                      <span style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 600 }}>Original:</span>
                      <div style={{ maxHeight: "160px", overflowY: "auto", background: "#f9fafb", borderRadius: "6px", padding: "0.4rem", border: "1px solid #e5e7eb", fontSize: "0.72rem" }}>
                        {originalInvoice.content?.map((item, idx) => (
                          <div key={idx} style={{ borderBottom: idx < originalInvoice.content.length - 1 ? "1px dashed #e5e7eb" : "none", paddingBottom: "4px", marginBottom: "4px" }}>
                            <strong>{item.sno}. {item.description}</strong><br />
                            <span style={{ color: "#6b7280" }}>{item.unit} x {fmt(item.rate)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 600 }}>Proposed:</span>
                      <div style={{ maxHeight: "160px", overflowY: "auto", background: "#f9fafb", borderRadius: "6px", padding: "0.4rem", border: "1px solid #e5e7eb", fontSize: "0.72rem" }}>
                        {selectedRequest.data?.content?.map((item, idx) => (
                          <div key={idx} style={{ borderBottom: idx < selectedRequest.data.content.length - 1 ? "1px dashed #e5e7eb" : "none", paddingBottom: "4px", marginBottom: "4px" }}>
                            <strong>{item.sno}. {item.description}</strong><br />
                            <span style={{ color: "#6b7280" }}>{item.unit} x {fmt(item.rate)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Items Summary list (only for CREATE / DUPLICATE requests) */}
              {selectedRequest.request_type !== "update" && (
                <div>
                  <p style={{ fontWeight: 600, color: "#374151", margin: "0.5rem 0 0.25rem", fontSize: "0.8rem" }}>Content Summary:</p>
                  <div style={{ maxHeight: "150px", overflowY: "auto", background: "#f9fafb", borderRadius: "6px", padding: "0.5rem", border: "1px solid #f3f4f6" }}>
                    {selectedRequest.data?.content?.map((item, idx) => (
                      <div key={idx} style={{ padding: "0.25rem 0", fontSize: "0.75rem", borderBottom: idx < selectedRequest.data.content.length - 1 ? "1px dashed #e5e7eb" : "none" }}>
                        <strong>{item.sno}. {item.description}</strong><br />
                        <span style={{ color: "#6b7280" }}>{item.unit} Unit @ {fmt(item.rate)} = {fmt(item.amount)}</span>
                      </div>
                    )) || <p style={{ margin: 0, color: "#9ca3af" }}>No items found</p>}
                  </div>
                </div>
              )}

              {isAdmin && selectedRequest.status === "pending" && (
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                  <button
                    onClick={() => handleApprove(selectedRequest)}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: "0.5rem" }}
                  >
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
    </div>
  );
}
