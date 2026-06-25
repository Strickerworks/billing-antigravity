"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { logAudit } from "@/utils/supabase/audit";

export default function AddPaymentRequestPage() {
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const { role } = useParams();

  useEffect(() => {
    fetchUnpaidInvoices();
  }, []);

  const fetchUnpaidInvoices = async () => {
    setLoading(true);
    try {
      // Get unpaid active invoices
      const { data: invoicesData } = await supabase
        .from("billdata")
        .select("invoice_no, customer_name, grand_total")
        .eq("active_status", "active")
        .eq("payment_status", "Not Received")
        .order("invoice_no", { ascending: false });

      // Get pending requests
      const { data: reqsData } = await supabase
        .from("payment_acknowledgement_requests")
        .select("invoice_no")
        .eq("status", "pending");

      const pendingNos = new Set((reqsData || []).map((r) => r.invoice_no));
      const available = (invoicesData || []).filter((inv) => !pendingNos.has(inv.invoice_no));

      setUnpaidInvoices(available);
    } catch (err) {
      console.error("Error fetching unpaid invoices:", err);
    }
    setLoading(false);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceNo) {
      alert("Please select an unpaid invoice.");
      return;
    }
    setSubmitting(true);

    const invoiceNoInt = parseInt(selectedInvoiceNo, 10);

    const { data, error } = await supabase
      .from("payment_acknowledgement_requests")
      .insert([
        {
          invoice_no: invoiceNoInt,
          payment_mode: paymentMode,
          comment: comment,
          status: "pending",
          requested_by: role,
        },
      ])
      .select();

    if (error) {
      console.error("Error submitting payment acknowledgement:", error);
      alert("Failed to submit request: " + error.message);
    } else {
      if (data && data[0]) {
        await logAudit({
          requestId: data[0].id,
          requestType: "payment_acknowledgement",
          submittedBy: role,
          status: "Pending",
          payload: {
            invoice_no: invoiceNoInt,
            payment_mode: paymentMode,
            comment: comment,
          },
        });
      }

      alert(`Payment request submitted for Invoice #${invoiceNoInt}!`);
      router.push(`/${role}/payment-request`);
    }
    setSubmitting(false);
  };

  const fmt = (num) =>
    `₹${parseFloat(num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div className="page-content" style={{ maxWidth: "550px" }}>
      <div className="page-header">
        <h1 className="page-title">Submit Payment Request</h1>
        <p className="page-subtitle">Submit a customer payment receipt acknowledgement for administrator approval.</p>
      </div>

      <div className="card fade-in">
        <p className="card-title">Payment Details</p>
        {loading ? (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Loading unpaid invoices...</p>
        ) : unpaidInvoices.length === 0 ? (
          <div style={{ padding: "1rem 0", textAlign: "center" }}>
            <p style={{ fontWeight: 600, color: "#1f2937", margin: "0 0 0.5rem" }}>All caught up!</p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: 0 }}>
              There are no unpaid invoices pending payment request acknowledgements.
            </p>
            <button
              onClick={() => router.push(`/${role}`)}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: "1rem" }}
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitRequest}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label className="form-label">Unpaid Invoice</label>
                <select
                  value={selectedInvoiceNo}
                  onChange={(e) => setSelectedInvoiceNo(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">Select Invoice</option>
                  {unpaidInvoices.map((inv) => (
                    <option key={inv.invoice_no} value={inv.invoice_no}>
                      #{inv.invoice_no} — {inv.customer_name} ({fmt(inv.grand_total)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Mode of Payment</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
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
                <label className="form-label">Comment / Transaction ID (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="form-textarea"
                  placeholder="Enter Transaction ID, bank references, or notes..."
                  rows={4}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => router.push(`/${role}`)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Payment Request"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
