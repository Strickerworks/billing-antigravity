"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function LogDriverPaymentPage() {
  const { role, id } = useParams();
  const driverId = parseInt(id);
  const router = useRouter();
  const isAdmin = role === "admin";

  const [driver, setDriver] = useState(null);
  const [paymentsHistory, setPaymentsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentType, setPaymentType] = useState("salary_paid"); // 'salary_paid', 'deduction', 'advance'
  const [paymentComment, setPaymentComment] = useState("");

  useEffect(() => {
    if (driverId) {
      fetchDriverDetailsAndPayments();
    }
  }, [driverId]);

  const fetchDriverDetailsAndPayments = async () => {
    setLoading(true);
    try {
      // Fetch driver profile
      const { data: driverData, error: driverErr } = await supabase
        .from("drivers")
        .select("name")
        .eq("id", driverId)
        .single();
      if (driverErr) throw driverErr;
      setDriver(driverData);

      // Fetch payment history logs
      const { data: payments, error: paymentsErr } = await supabase
        .from("driver_payments")
        .select("*")
        .eq("driver_id", driverId)
        .order("payment_date", { ascending: false });
      if (paymentsErr) throw paymentsErr;
      setPaymentsHistory(payments || []);

    } catch (err) {
      console.error(err);
      alert("Failed to load driver payment info.");
    }
    setLoading(false);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentAmount || !paymentDate) {
      alert("Please fill amount and date.");
      return;
    }
    setSubmitting(true);

    const payload = {
      driver_id: driverId,
      amount: parseFloat(paymentAmount),
      type: paymentType,
      payment_date: paymentDate,
      comment: paymentComment.trim()
    };

    try {
      if (isAdmin) {
        const { error } = await supabase.from("driver_payments").insert([payload]);
        if (error) throw error;

        // Auto raise expense ticket for Salary Paid or Advance
        if (paymentType === "salary_paid" || paymentType === "advance") {
          const category = "Driver Payment";
          const label = paymentType === "salary_paid" ? "Salary Payment" : "Salary Advance";
          await supabase.from("expense_reports").insert([{
            amount: payload.amount,
            category,
            comment: `[Driver: ${driver?.name || "Unknown"}] ${label}: ${payload.comment || "Paid"}`,
            status: "pending",
            requested_by: "admin"
          }]);
        }
        alert("Payment activity logged successfully and expense ticket created.");
      } else {
        const { error } = await supabase.from("fleet_requests").insert([{
          request_type: "log_driver_payment",
          payload,
          requested_by: "staff",
          status: "pending"
        }]);
        if (error) throw error;
        alert("Payment request submitted to Admin for approval.");
      }
      router.push(`/${role}/drivers/${driverId}`);
    } catch (err) {
      alert(err.message || "Failed to log payment activity");
    }
    setSubmitting(false);
  };

  if (loading && !driver) {
    return <div className="page-content">Loading payment records...</div>;
  }

  return (
    <div className="page-content" style={{ maxWidth: 800, paddingBottom: "3rem" }}>
      <div style={{ paddingTop: "1rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <Link href={`/${role}/drivers/${driverId}`} style={{ textDecoration: "none", color: "#111827", fontWeight: 600, fontSize: "0.9rem" }}>
            ← Back to Profile
          </Link>
        </div>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "#111827" }}>
            {driver?.name}
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
            {isAdmin ? "Log Salary/Payment Activity Directly" : "Request Salary/Payment Activity"}
          </p>
        </div>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {/* Log Payment Form */}
      <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "#111827" }}>New Payment Form</h2>
        <form onSubmit={handlePaymentSubmit} className="form-grid-2">
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Amount (₹) *</label>
            <input type="number" className="form-input" placeholder="Enter amount" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Payment Date *</label>
            <input type="date" className="form-input" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Activity Type *</label>
            <select className="form-input" value={paymentType} onChange={(e) => setPaymentType(e.target.value)} required>
              <option value="salary_paid">Salary Paid</option>
              <option value="advance">Advance Taken</option>
              <option value="deduction">Deduction</option>
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Remarks / Description</label>
            <input type="text" className="form-input" placeholder="e.g. Salary, trip advance" value={paymentComment} onChange={(e) => setPaymentComment(e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ fontSize: "0.85rem", padding: "0.6rem 2rem", background: "#111827", color: "#ffffff", borderColor: "#111827" }}
            >
              {submitting ? "Processing..." : isAdmin ? "Save Record" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>

      {/* Payment & Advances Ledger */}
      <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "#111827" }}>Payment & Advances History</h2>
        {paymentsHistory.length === 0 ? (
          <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>No payments logs recorded.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {paymentsHistory.map((p) => {
              let badgeColor = "#047857";
              let bgBadge = "#d1fae5";
              let label = "Salary Paid";

              if (p.type === "advance") {
                badgeColor = "#b45309";
                bgBadge = "#fef3c7";
                label = "Advance Taken";
              } else if (p.type === "deduction") {
                badgeColor = "#b91c1c";
                bgBadge = "#fee2e2";
                label = "Deduction";
              }

              return (
                <div key={p.id} className="log-row" style={{ paddingBottom: "0.6rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827" }}>
                        ₹{parseFloat(p.amount).toLocaleString()}
                      </span>
                      <span style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: badgeColor,
                        background: bgBadge,
                        padding: "0.15rem 0.4rem",
                        borderRadius: "4px",
                        textTransform: "uppercase"
                      }}>{label}</span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.15rem" }}>
                      {p.comment || "No comment"}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#9ca3af", textAlign: "right" }}>
                    <div>Log Date: {new Date(p.payment_date).toLocaleDateString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
