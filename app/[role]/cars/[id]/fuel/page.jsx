"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function CarFuelPage() {
  const { role, id } = useParams();
  const carId = parseInt(id);
  const router = useRouter();
  const isAdmin = role === "admin";

  const [car, setCar] = useState(null);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [fuelLiters, setFuelLiters] = useState("");
  const [fuelMoney, setFuelMoney] = useState("");
  const [fuelComment, setFuelComment] = useState("");

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

      const { data: fuels, error: fuelsErr } = await supabase
        .from("car_fuel_history")
        .select("*")
        .eq("car_id", carId)
        .order("created_at", { ascending: false });
      if (fuelsErr) throw fuelsErr;
      setFuelLogs(fuels || []);

    } catch (err) {
      console.error(err);
      alert("Failed to load fuel records.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fuelLiters || !fuelMoney) {
      alert("Please fill fuel metrics.");
      return;
    }
    setSubmitting(true);

    const payload = {
      car_id: carId,
      liters: parseFloat(fuelLiters),
      money: parseFloat(fuelMoney),
      comment: fuelComment.trim()
    };

    try {
      if (isAdmin) {
        // Admin inserts to car_fuel_history directly and creates expense
        const { error } = await supabase.from("car_fuel_history").insert([payload]);
        if (error) throw error;

        // Auto raise expense ticket
        await supabase.from("expense_reports").insert([{
          amount: payload.money,
          category: "Fuel Cost",
          comment: `[${car.registration_name}] Fuel refill: ${payload.liters} Liters. ${payload.comment || ""}`,
          status: "pending",
          requested_by: "admin"
        }]);

        alert("Fuel refill logged successfully and expense ticket created.");
      } else {
        const { error } = await supabase.from("fleet_requests").insert([{
          request_type: "log_fuel",
          payload,
          requested_by: "staff",
          status: "pending"
        }]);
        if (error) throw error;
        alert("Fuel log request submitted to Admin for approval.");
      }
      router.push(`/${role}/cars/${carId}`);
    } catch (err) {
      alert(err.message || "Failed to log fuel record");
    }
    setSubmitting(false);
  };

  if (loading && !car) {
    return <div className="page-content">Loading fuel logs...</div>;
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
            {isAdmin ? "Log Fuel Refill Directly" : "Request Fuel Refill Log"}
          </p>
        </div>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {/* Log Form */}
      <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "#111827" }}>New Fuel Log</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Refilled Liters *</label>
            <input type="number" step="any" className="form-input" placeholder="e.g. 45" value={fuelLiters} onChange={(e) => setFuelLiters(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Total Cost Paid (₹) *</label>
            <input type="number" step="any" className="form-input" placeholder="e.g. 4500" value={fuelMoney} onChange={(e) => setFuelMoney(e.target.value)} required />
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Remarks / Description</label>
            <input type="text" className="form-input" placeholder="e.g. Full tank refill, trip fuel" value={fuelComment} onChange={(e) => setFuelComment(e.target.value)} />
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
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "#111827" }}>Fuel Refill logs</h2>
        {fuelLogs.length === 0 ? (
          <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>No fuel records logged.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {fuelLogs.map((log) => (
              <div key={log.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.6rem" }}>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
                    ₹{parseFloat(log.money).toLocaleString()} for {log.liters} Liters
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
