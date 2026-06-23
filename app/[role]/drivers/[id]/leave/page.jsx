"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function LogDriverLeavePage() {
  const { role, id } = useParams();
  const driverId = parseInt(id);
  const router = useRouter();
  const isAdmin = role === "admin";

  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  useEffect(() => {
    if (driverId) {
      fetchDriverDetails();
    }
  }, [driverId]);

  const fetchDriverDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("drivers")
        .select("name")
        .eq("id", driverId)
        .single();
      if (error) throw error;
      setDriver(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load driver profile.");
    }
    setLoading(false);
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate) {
      alert("Please specify start and end dates.");
      return;
    }
    if (new Date(leaveStartDate) > new Date(leaveEndDate)) {
      alert("Start Date cannot be after End Date.");
      return;
    }
    setSubmitting(true);

    const payload = {
      driver_id: driverId,
      start_date: leaveStartDate,
      end_date: leaveEndDate,
      reason: leaveReason.trim()
    };

    try {
      if (isAdmin) {
        const { error } = await supabase.from("driver_leaves").insert([payload]);
        if (error) throw error;
        alert("Leave logged successfully.");
      } else {
        const { error } = await supabase.from("fleet_requests").insert([{
          request_type: "log_driver_leave",
          payload,
          requested_by: "staff",
          status: "pending"
        }]);
        if (error) throw error;
        alert("Leave request submitted to Admin for approval.");
      }
      router.push(`/${role}/drivers/${driverId}`);
    } catch (err) {
      alert(err.message || "Failed to log leave record");
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="page-content">Loading driver details...</div>;
  }

  return (
    <div className="page-content" style={{ maxWidth: 800, paddingBottom: "3rem" }}>
      {/* Breadcrumb & Header */}
      <div style={{ padding: "1.5rem 0 1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.5rem" }}>
          <Link href={`/${role}`} style={{ color: "#6b7280" }}>Home</Link> / 
          <Link href={`/${role}/drivers`} style={{ color: "#6b7280" }}>Drivers</Link> /
          <Link href={`/${role}/drivers/${driverId}`} style={{ color: "#6b7280" }}>Profile</Link> /
          <span>Log Leave</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#1a1d23" }}>
              {isAdmin ? "Log Leave Directly" : "Request Leave Record"}
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
              Logging leave for driver: <strong>{driver?.name}</strong>
            </p>
          </div>
          <Link href={`/${role}/drivers/${driverId}`} className="btn btn-secondary" style={{ fontSize: "0.8rem" }}>
            ← Back to Profile
          </Link>
        </div>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      <div className="card" style={{ padding: "2rem", background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <form onSubmit={handleLeaveSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Start Date *</label>
            <input type="date" className="form-input" value={leaveStartDate} onChange={(e) => setLeaveStartDate(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>End Date *</label>
            <input type="date" className="form-input" value={leaveEndDate} onChange={(e) => setLeaveEndDate(e.target.value)} required />
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Reason / Remarks</label>
            <input type="text" className="form-input" placeholder="Leave remarks (e.g. Personal work, Sick leave)" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
            <Link href={`/${role}/drivers/${driverId}`} className="btn btn-secondary" style={{ padding: "0.625rem 1.5rem" }}>
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ padding: "0.625rem 2rem", fontSize: "0.875rem", fontWeight: 600, background: "#f59e0b", borderColor: "#f59e0b" }}
            >
              {submitting ? "Processing..." : isAdmin ? "Save Record" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
