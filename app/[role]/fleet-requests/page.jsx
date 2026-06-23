"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";

export default function FleetRequestsPage() {
  const { role } = useParams();
  const router = useRouter();
  const isAdmin = role === "admin";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal State
  const [editingRequest, setEditingRequest] = useState(null);
  const [editPayload, setEditPayload] = useState({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    let query = supabase.from("fleet_requests").select("*").order("created_at", { ascending: false });
    
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

  const handleApprove = async (req) => {
    if (!confirm(`Are you sure you want to approve this "${req.request_type}" request?`)) {
      return;
    }
    setSubmitting(true);
    try {
      const payload = req.payload;

      // Execute SQL based on request_type
      if (req.request_type === "add_car") {
        const { error } = await supabase.from("cars").insert([{
          name: payload.name,
          registration_name: payload.registration_name.toUpperCase()
        }]);
        if (error) throw error;

      } else if (req.request_type === "edit_car") {
        const { error } = await supabase.from("cars").update({
          name: payload.name,
          registration_name: payload.registration_name.toUpperCase()
        }).eq("id", payload.car_id);
        if (error) throw error;

      } else if (req.request_type === "add_driver") {
        const { error } = await supabase.from("drivers").insert([{
          name: payload.name,
          phone: payload.phone,
          dob: payload.dob || null,
          aadhar_number: payload.aadhar_number || null,
          address: payload.address || null,
          license_number: payload.license_number || null,
          date_of_joining: payload.date_of_joining || null
        }]);
        if (error) throw error;

      } else if (req.request_type === "edit_driver") {
        const { error } = await supabase.from("drivers").update({
          name: payload.name,
          phone: payload.phone,
          dob: payload.dob || null,
          aadhar_number: payload.aadhar_number || null,
          address: payload.address || null,
          license_number: payload.license_number || null,
          date_of_joining: payload.date_of_joining || null
        }).eq("id", payload.driver_id);
        if (error) throw error;

      } else if (req.request_type === "log_km") {
        const { error } = await supabase.from("car_km_history").insert([{
          car_id: payload.car_id,
          km_clocked: payload.km_clocked,
          comment: payload.comment
        }]);
        if (error) throw error;

      } else if (req.request_type === "log_service") {
        const { error } = await supabase.from("car_service_history").insert([{
          car_id: payload.car_id,
          service_date: payload.service_date,
          comment: payload.comment
        }]);
        if (error) throw error;

      } else if (req.request_type === "log_fuel") {
        const { error } = await supabase.from("car_fuel_history").insert([{
          car_id: payload.car_id,
          liters: payload.liters,
          money: payload.money,
          comment: payload.comment
        }]);
        if (error) throw error;

      } else if (req.request_type === "log_insurance") {
        const { error } = await supabase.from("car_insurance_history").insert([{
          car_id: payload.car_id,
          insurance_date: payload.insurance_date,
          insurance_from: payload.insurance_from,
          insurance_to: payload.insurance_to,
          comment: payload.comment
        }]);
        if (error) throw error;

      } else if (req.request_type === "log_misc") {
        const { error } = await supabase.from("car_misc_history").insert([{
          car_id: payload.car_id,
          amount: payload.amount,
          comment: payload.comment
        }]);
        if (error) throw error;

      } else if (req.request_type === "assign_driver") {
        const { error } = await supabase.from("car_driver_history").insert([{
          car_id: payload.car_id,
          driver_id: payload.driver_id
        }]);
        if (error) throw error;
      }

      // Mark request as approved
      const { error: reqErr } = await supabase
        .from("fleet_requests")
        .update({
          status: "approved",
          resolved_by: "admin",
          resolved_at: new Date().toISOString()
        })
        .eq("id", req.id);

      if (reqErr) throw reqErr;

      alert("Request approved successfully.");
      fetchRequests();
    } catch (err) {
      console.error("Error approving request:", err);
      alert("Failed to approve request: " + err.message);
    }
    setSubmitting(false);
  };

  const handleReject = async (req) => {
    if (!confirm(`Are you sure you want to reject this request?`)) {
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("fleet_requests")
      .update({
        status: "rejected",
        resolved_by: "admin",
        resolved_at: new Date().toISOString()
      })
      .eq("id", req.id);

    if (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request.");
    } else {
      fetchRequests();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this request permanently?")) {
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("fleet_requests").delete().eq("id", id);
    if (error) {
      console.error("Error deleting request:", error);
      alert("Failed to delete request.");
    } else {
      fetchRequests();
    }
    setSubmitting(false);
  };

  const handleEditOpen = (req) => {
    setEditingRequest(req);
    setEditPayload({ ...req.payload });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase
      .from("fleet_requests")
      .update({ payload: editPayload })
      .eq("id", editingRequest.id);

    if (error) {
      console.error("Error updating request:", error);
      alert("Failed to update request.");
    } else {
      setEditingRequest(null);
      fetchRequests();
    }
    setSubmitting(false);
  };

  const renderPayloadSummary = (req) => {
    const p = req.payload;
    switch (req.request_type) {
      case "add_car":
        return `Add Vehicle: ${p.name} (${p.registration_name})`;
      case "edit_car":
        return `Edit Vehicle ID ${p.car_id}: ${p.name} (${p.registration_name})`;
      case "add_driver":
        return `Add Driver: ${p.name} (Phone: ${p.phone}, Aadhar: ${p.aadhar_number || 'N/A'})`;
      case "edit_driver":
        return `Edit Driver ID ${p.driver_id}: ${p.name} (Phone: ${p.phone})`;
      case "log_km":
        return `Odometer update: ${parseFloat(p.km_clocked).toLocaleString()} km [Comment: ${p.comment || 'None'}]`;
      case "log_service":
        return `Service Log: Serviced on ${new Date(p.service_date).toLocaleDateString()} [Comment: ${p.comment}]`;
      case "log_fuel":
        return `Fuel log: ₹${parseFloat(p.money).toLocaleString()} for ${p.liters} Liters [Comment: ${p.comment || 'None'}]`;
      case "log_insurance":
        return `Insurance Update: Insured on ${new Date(p.insurance_date).toLocaleDateString()} (From: ${p.insurance_from} To: ${p.insurance_to}) [Info: ${p.comment || 'None'}]`;
      case "log_misc":
        return `Misc cost: ₹${parseFloat(p.amount).toLocaleString()} [Reason: ${p.comment}]`;
      case "assign_driver":
        return `Assign Driver Assignment: Driver ID ${p.driver_id}`;
      default:
        return JSON.stringify(p);
    }
  };

  return (
    <div className="page-content" style={{ maxWidth: 960, paddingBottom: "3rem" }}>
      <div style={{ padding: "1.5rem 0 1rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#1a1d23" }}>
          Fleet Approval Queue
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
          Track and review staff requests for vehicle registrations, edits, and logging activity
        </p>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {loading ? (
        <div style={{ color: "#6b7280" }}>Loading queue...</div>
      ) : requests.length === 0 ? (
        <div style={{
          padding: "3rem",
          background: "#f9fafb",
          borderRadius: "8px",
          border: "1px dashed #e5e7eb",
          textAlign: "center",
          color: "#6b7280",
          fontSize: "0.9rem"
        }}>
          No requests in queue.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {requests.map((req) => (
            <div
              key={req.id}
              className="card"
              style={{
                padding: "1.25rem",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#4b5563",
                    background: "#f3f4f6",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    letterSpacing: "0.02em"
                  }}>
                    {req.request_type.replace("_", " ")}
                  </span>
                  <div style={{ fontWeight: 600, color: "#111827", fontSize: "1rem", marginTop: "0.5rem" }}>
                    {renderPayloadSummary(req)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem" }}>
                    Requested by: <span style={{ fontWeight: 600, color: "#4b5563" }}>{req.requested_by}</span> on {new Date(req.created_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    color: req.status === "pending" ? "#92400e" : req.status === "approved" ? "#166534" : "#991b1b",
                    background: req.status === "pending" ? "#fffbeb" : req.status === "approved" ? "#f0fdf4" : "#fef2f2"
                  }}>
                    {req.status.toUpperCase()}
                  </span>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    {isAdmin && req.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={submitting}
                          className="btn btn-primary"
                          style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem", background: "#166534", border: "1px solid #166534" }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req)}
                          disabled={submitting}
                          className="btn btn-secondary"
                          style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem", color: "#991b1b" }}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {!isAdmin && req.status === "pending" && (
                      <button
                        onClick={() => handleEditOpen(req)}
                        className="btn btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem" }}
                      >
                        Edit
                      </button>
                    )}

                    {(isAdmin || req.requested_by === "staff") && (
                      <button
                        onClick={() => handleDelete(req.id)}
                        disabled={submitting}
                        className="btn btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem", color: "#991b1b" }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Payload Modal */}
      {editingRequest && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div className="card" style={{ width: "90%", maxWidth: "500px", padding: "1.5rem", background: "#ffffff" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Edit Fleet Request</h3>
            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Dynamic inputs based on request_type */}
              {editingRequest.request_type.includes("car") && (
                <>
                  <div className="form-group">
                    <label className="form-label">Car Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editPayload.name || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Registration Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editPayload.registration_name || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, registration_name: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              {editingRequest.request_type.includes("driver") && (
                <>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editPayload.name || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editPayload.phone || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Aadhar Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editPayload.aadhar_number || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, aadhar_number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-input"
                      value={editPayload.address || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, address: e.target.value })}
                    />
                  </div>
                </>
              )}

              {editingRequest.request_type === "log_km" && (
                <>
                  <div className="form-group">
                    <label className="form-label">Odometer Reading</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editPayload.km_clocked || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, km_clocked: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Comment</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editPayload.comment || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, comment: e.target.value })}
                    />
                  </div>
                </>
              )}

              {editingRequest.request_type === "log_service" && (
                <>
                  <div className="form-group">
                    <label className="form-label">Service Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editPayload.service_date || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, service_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Comment</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editPayload.comment || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, comment: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              {editingRequest.request_type === "log_fuel" && (
                <>
                  <div className="form-group">
                    <label className="form-label">Liters</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={editPayload.liters || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, liters: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Money Charged (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={editPayload.money || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, money: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Comment</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editPayload.comment || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, comment: e.target.value })}
                    />
                  </div>
                </>
              )}

              {editingRequest.request_type === "log_insurance" && (
                <>
                  <div className="form-group">
                    <label className="form-label">Insurance Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editPayload.insurance_date || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, insurance_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">From</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editPayload.insurance_from || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, insurance_from: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">To</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editPayload.insurance_to || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, insurance_to: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Comment</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editPayload.comment || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, comment: e.target.value })}
                    />
                  </div>
                </>
              )}

              {editingRequest.request_type === "log_misc" && (
                <>
                  <div className="form-group">
                    <label className="form-label">Amount</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editPayload.amount || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, amount: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Comment</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editPayload.comment || ""}
                      onChange={(e) => setEditPayload({ ...editPayload, comment: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setEditingRequest(null)} className="btn btn-secondary" style={{ fontSize: "0.8rem" }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ fontSize: "0.8rem" }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
