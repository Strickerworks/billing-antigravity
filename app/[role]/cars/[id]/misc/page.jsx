"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function CarMiscPage() {
  const { role, id } = useParams();
  const carId = parseInt(id);
  const router = useRouter();
  const isAdmin = role === "admin";

  const [car, setCar] = useState(null);
  const [miscLogs, setMiscLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [miscAmount, setMiscAmount] = useState("");
  const [miscComment, setMiscComment] = useState("");

  useEffect(() => {
    if (carId) {
      fetchCarDetailsAndLogs();
    }
  }, [carId]);

  const fetchCarDetailsAndLogs = async () => {
    setLoading(true);
    try {
      const { data: carData, error: carErr } = await supabase
        .from("cars")
        .select("*")
        .eq("id", carId)
        .single();
      if (carErr) throw carErr;
      setCar(carData);

      const { data: miscs, error: miscsErr } = await supabase
        .from("car_misc_history")
        .select("*")
        .eq("car_id", carId)
        .order("created_at", { ascending: false });
      if (miscsErr) throw miscsErr;
      setMiscLogs(miscs || []);

    } catch (err) {
      console.error(err);
      alert("Failed to load miscellaneous logs.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!miscAmount) {
      alert("Please specify charges amount.");
      return;
    }
    setSubmitting(true);

    const payload = {
      car_id: carId,
      amount: parseFloat(miscAmount),
      comment: miscComment.trim()
    };

    try {
      if (isAdmin) {
        // Admin inserts to car_misc_history directly and creates expense ticket
        const { error } = await supabase.from("car_misc_history").insert([payload]);
        if (error) throw error;

        // Auto raise expense ticket
        await supabase.from("expense_reports").insert([{
          amount: payload.amount,
          category: "Other Fleet Costs",
          comment: `[${car.registration_name}] Misc expenses: ${payload.comment || "Fines / Pollution card / Cleanings"}`,
          status: "pending",
          requested_by: "admin"
        }]);

        alert("Misc log recorded successfully and expense ticket created.");
      } else {
        const { error } = await supabase.from("fleet_requests").insert([{
          request_type: "log_misc",
          payload,
          requested_by: "staff",
          status: "pending"
        }]);
        if (error) throw error;
        alert("Misc log request submitted to Admin for approval.");
      }
      router.push(`/${role}/cars/${carId}`);
    } catch (err) {
      alert(err.message || "Failed to log miscellaneous cost");
    }
    setSubmitting(false);
  };

  if (loading && !car) {
    return <div className="page-content">Loading details...</div>;
  }

  return (
    <div className="page-content" style={{ maxWidth: 800, paddingBottom: "3rem" }}>
      <div style={{ paddingTop: "1rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <Link href={`/${role}/cars/${carId}`} style={{ textDecoration: "none", color: "var(--text-primary)", fontWeight: 600, fontSize: "0.9rem" }}>
            ← Back to Profile
          </Link>
        </div>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
            {car?.name} ({car?.registration_name})
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0.25rem 0 0" }}>
            {isAdmin ? "Log Misc Costs Directly" : "Request Misc Cost Log"}
          </p>
        </div>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {/* Log Form */}
      <div className="card" style={{ padding: "1.5rem", background: "var(--bg-card)", border: "1px solid var(--border)", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)" }}>New Miscellaneous Cost</h2>
        <form onSubmit={handleSubmit} className="form-grid-2">
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Amount (₹) *</label>
            <input type="number" className="form-input" placeholder="e.g. 500" value={miscAmount} onChange={(e) => setMiscAmount(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Remarks / Description</label>
            <input type="text" className="form-input" placeholder="e.g. Toll taxes, police challan, cleaning charges" value={miscComment} onChange={(e) => setMiscComment(e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ fontSize: "0.85rem", padding: "0.6rem 2rem", background: "var(--text-primary)", color: "var(--bg-card)", borderColor: "var(--text-primary)" }}
            >
              {submitting ? "Processing..." : isAdmin ? "Save Record" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>

      {/* History Ledger */}
      <div className="card" style={{ padding: "1.5rem", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-primary)" }}>Misc Costs Log History</h2>
        {miscLogs.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>No misc costs recorded.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {miscLogs.map((log) => (
              <div key={log.id} className="log-row">
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    ₹{parseFloat(log.amount).toLocaleString()}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                    {log.comment || "No description"}
                  </div>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "right" }}>
                  <div>Logged: {new Date(log.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
