"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function CarKmPage() {
  const { role, id } = useParams();
  const carId = parseInt(id);
  const router = useRouter();
  const isAdmin = role === "admin";

  const [car, setCar] = useState(null);
  const [kmLogs, setKmLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [kmVal, setKmVal] = useState("");
  const [kmComment, setKmComment] = useState("");

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

      const { data: kms, error: kmsErr } = await supabase
        .from("car_km_history")
        .select("*")
        .eq("car_id", carId)
        .order("created_at", { ascending: false });
      if (kmsErr) throw kmsErr;
      setKmLogs(kms || []);

    } catch (err) {
      console.error(err);
      alert("Failed to load odometer details.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!kmVal) {
      alert("Please enter odometer reading.");
      return;
    }
    setSubmitting(true);

    const payload = {
      car_id: carId,
      km_clocked: parseFloat(kmVal),
      comment: kmComment.trim()
    };

    try {
      if (isAdmin) {
        const { error } = await supabase.from("car_km_history").insert([payload]);
        if (error) throw error;
        alert("Odometer log recorded successfully.");
      } else {
        const { error } = await supabase.from("fleet_requests").insert([{
          request_type: "log_km",
          payload,
          requested_by: "staff",
          status: "pending"
        }]);
        if (error) throw error;
        alert("Odometer log request submitted to Admin for approval.");
      }
      router.push(`/${role}/cars/${carId}`);
    } catch (err) {
      alert(err.message || "Failed to log odometer");
    }
    setSubmitting(false);
  };

  if (loading && !car) {
    return <div className="page-content">Loading odometer details...</div>;
  }

  return (
    <div className="page-content" style={{ maxWidth: 800, paddingBottom: "3rem" }}>
      <div style={{ paddingTop: "1rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <Link href={`/${role}/cars/${carId}`} style={{ textDecoration: "none", color: "#111827", fontWeight: 600, fontSize: "0.9rem" }}>
            ← Back to Profile
          </Link>
        </div>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "#111827" }}>
            {car?.name} ({car?.registration_name})
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
            {isAdmin ? "Log Odometer Directly" : "Request Odometer Log"}
          </p>
        </div>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {/* Log Form */}
      <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "#111827" }}>New Odometer Log</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Odometer Reading (KM) *</label>
            <input type="number" className="form-input" placeholder="e.g. 52000" value={kmVal} onChange={(e) => setKmVal(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Comments / Remarks</label>
            <input type="text" className="form-input" placeholder="Trip remarks, post-repair, etc." value={kmComment} onChange={(e) => setKmComment(e.target.value)} />
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

      {/* History Ledger */}
      <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "#111827" }}>Odometer Logs History</h2>
        {kmLogs.length === 0 ? (
          <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>No odometer records.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {kmLogs.map((log) => (
              <div key={log.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.6rem" }}>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
                    {parseFloat(log.km_clocked).toLocaleString()} km
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.15rem" }}>
                    {log.comment || "No comment"}
                  </div>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#9ca3af", textAlign: "right" }}>
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
