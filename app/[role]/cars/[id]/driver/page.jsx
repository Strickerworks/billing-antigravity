"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function CarDriverPage() {
  const { role, id } = useParams();
  const carId = parseInt(id);
  const router = useRouter();
  const isAdmin = role === "admin";

  const [car, setCar] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [driverLogs, setDriverLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [assignDriverId, setAssignDriverId] = useState("");

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

      const [
        { data: allDrivers },
        { data: assigns }
      ] = await Promise.all([
        supabase.from("drivers").select("*").order("name", { ascending: true }),
        supabase.from("car_driver_history").select("*, drivers(id, name, phone)").eq("car_id", carId).order("assigned_at", { ascending: false })
      ]);

      setDrivers(allDrivers || []);
      setDriverLogs(assigns || []);

    } catch (err) {
      console.error(err);
      alert("Failed to load details.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assignDriverId) {
      alert("Please choose a driver.");
      return;
    }
    setSubmitting(true);

    const payload = {
      car_id: carId,
      driver_id: parseInt(assignDriverId)
    };

    try {
      if (isAdmin) {
        const { error } = await supabase.from("car_driver_history").insert([payload]);
        if (error) throw error;
        alert("Driver assigned successfully.");
      } else {
        const { error } = await supabase.from("fleet_requests").insert([{
          request_type: "assign_driver",
          payload,
          requested_by: "staff",
          status: "pending"
        }]);
        if (error) throw error;
        alert("Driver assignment request submitted to Admin for approval.");
      }
      router.push(`/${role}/cars/${carId}`);
    } catch (err) {
      alert(err.message || "Failed to assign driver");
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
          <Link href={`/${role}/cars/${carId}`} style={{ textDecoration: "none", color: "#111827", fontWeight: 600, fontSize: "0.9rem" }}>
            ← Back to Profile
          </Link>
        </div>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "#111827" }}>
            {car?.name} ({car?.registration_name})
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
            {isAdmin ? "Assign Driver Directly" : "Request Driver Assignment"}
          </p>
        </div>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {/* Log Form */}
      <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "#111827" }}>Choose Driver</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "1.25rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-group" style={{ flex: 1, minWidth: "200px" }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Select Driver *</label>
            <select className="form-input" value={assignDriverId} onChange={(e) => setAssignDriverId(e.target.value)} required>
              <option value="">-- Select Driver --</option>
              {drivers.map((drv) => (
                <option key={drv.id} value={drv.id}>{drv.name} ({drv.phone})</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ height: "42px", fontSize: "0.85rem", padding: "0.6rem 2rem", background: "#111827", color: "#ffffff", borderColor: "#111827" }}
          >
            {submitting ? "Processing..." : isAdmin ? "Assign Driver" : "Submit Request"}
          </button>
        </form>
      </div>

      {/* History Ledger */}
      <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "#111827" }}>Driver Assignment History</h2>
        {driverLogs.length === 0 ? (
          <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>No driver assignments recorded.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {driverLogs.map((log) => (
              <div key={log.id} className="log-row">
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
                    👤 {log.drivers?.name || "Unassigned"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.15rem" }}>
                    Phone: {log.drivers?.phone || "N/A"}
                  </div>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#9ca3af", textAlign: "right" }}>
                  <div>Assigned: {new Date(log.assigned_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
