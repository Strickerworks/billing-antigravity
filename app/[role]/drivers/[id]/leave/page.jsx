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
  const [leavesHistory, setLeavesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  useEffect(() => {
    if (driverId) {
      fetchDriverDetailsAndLeaves();
    }
  }, [driverId]);

  const fetchDriverDetailsAndLeaves = async () => {
    setLoading(true);
    try {
      // Fetch driver name
      const { data: driverData, error: driverErr } = await supabase
        .from("drivers")
        .select("name")
        .eq("id", driverId)
        .single();
      if (driverErr) throw driverErr;
      setDriver(driverData);

      // Fetch leave history logs
      const { data: leaves, error: leavesErr } = await supabase
        .from("driver_leaves")
        .select("*")
        .eq("driver_id", driverId)
        .order("start_date", { ascending: false });
      if (leavesErr) throw leavesErr;
      setLeavesHistory(leaves || []);

    } catch (err) {
      console.error(err);
      alert("Failed to load driver leaves info.");
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

  if (loading && !driver) {
    return <div className="page-content">Loading leave records...</div>;
  }

  return (
    <div className="page-content" style={{ maxWidth: 800, paddingBottom: "3rem" }}>
      {/* breadcrumbs removed as per request */}
      <div style={{ padding: "1.5rem 0 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "#111827" }}>
            {driver?.name}
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
            {isAdmin ? "Log Leave Directly" : "Request Leave Record"}
          </p>
        </div>
        <Link href={`/${role}/drivers/${driverId}`} className="btn btn-secondary" style={{ fontSize: "0.8rem", background: "#111827", color: "#ffffff", borderColor: "#111827" }}>
          ← Back to Profile
        </Link>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {/* Log Leave Form */}
      <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "#111827" }}>New Leave Form</h2>
        <form onSubmit={handleLeaveSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Start Date *</label>
            <input type="date" className="form-input" value={leaveStartDate} onChange={(e) => setLeaveStartDate(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>End Date *</label>
            <input type="date" className="form-input" value={leaveEndDate} onChange={(e) => setLeaveEndDate(e.target.value)} required />
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Reason / Remarks</label>
            <input type="text" className="form-input" placeholder="e.g. Family emergency, Sick leave" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} />
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

      {/* Leaves History Ledger */}
      <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "#111827" }}>Leave History Records</h2>
        {leavesHistory.length === 0 ? (
          <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>No leave logs recorded.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {leavesHistory.map((leave) => {
              const sDate = new Date(leave.start_date);
              const eDate = new Date(leave.end_date);
              const days = Math.ceil(Math.abs(eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;

              return (
                <div key={leave.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.6rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827" }}>
                        {days} {days === 1 ? "Day" : "Days"} Leave
                      </span>
                      <span style={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: "#92400e",
                        background: "#fffbeb",
                        padding: "0.15rem 0.4rem",
                        borderRadius: "4px"
                      }}>
                        {sDate.toLocaleDateString()} - {eDate.toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.15rem" }}>
                      {leave.reason || "No reason specified"}
                    </div>
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
