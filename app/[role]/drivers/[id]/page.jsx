"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function DriverDetailPage() {
  const { role, id } = useParams();
  const driverId = parseInt(id);
  const router = useRouter();
  const isAdmin = role === "admin";

  const [driver, setDriver] = useState(null);
  const [vehicleHistory, setVehicleHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal fields
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editAadharNumber, setEditAadharNumber] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editLicenseNumber, setEditLicenseNumber] = useState("");
  const [editDateOfJoining, setEditDateOfJoining] = useState("");

  useEffect(() => {
    if (driverId) {
      fetchDriverDetails();
    }
  }, [driverId]);

  const fetchDriverDetails = async () => {
    setLoading(true);
    try {
      // 1. Get driver profile
      const { data: driverData, error: driverErr } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", driverId)
        .single();

      if (driverErr) throw driverErr;
      setDriver(driverData);

      // Pre-fill edit fields
      setEditName(driverData.name || "");
      setEditPhone(driverData.phone || "");
      setEditDob(driverData.dob || "");
      setEditAadharNumber(driverData.aadhar_number || "");
      setEditAddress(driverData.address || "");
      setEditLicenseNumber(driverData.license_number || "");
      setEditDateOfJoining(driverData.date_of_joining || "");

      // 2. Get assigned vehicle history
      const { data: historyList } = await supabase
        .from("car_driver_history")
        .select("assigned_at, cars(name, registration_name)")
        .eq("driver_id", driverId)
        .order("assigned_at", { ascending: false });

      setVehicleHistory(historyList || []);

    } catch (err) {
      console.error("Error loading driver details:", err);
      alert("Failed to load driver profile.");
    }
    setLoading(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editPhone.trim()) {
      alert("Name and phone are required.");
      return;
    }
    setSubmitting(true);
    const payload = {
      driver_id: driverId,
      name: editName.trim(),
      phone: editPhone.trim(),
      dob: editDob || null,
      aadhar_number: editAadharNumber.trim() || null,
      address: editAddress.trim() || null,
      license_number: editLicenseNumber.trim() || null,
      date_of_joining: editDateOfJoining || null
    };

    try {
      if (isAdmin) {
        const { error } = await supabase
          .from("drivers")
          .update({
            name: payload.name,
            phone: payload.phone,
            dob: payload.dob,
            aadhar_number: payload.aadhar_number,
            address: payload.address,
            license_number: payload.license_number,
            date_of_joining: payload.date_of_joining
          })
          .eq("id", driverId);

        if (error) throw error;
        alert("Driver profile updated successfully.");
        setShowEditModal(false);
        fetchDriverDetails();
      } else {
        const { error } = await supabase.from("fleet_requests").insert([{
          request_type: "edit_driver",
          payload,
          requested_by: "staff",
          status: "pending"
        }]);
        if (error) throw error;
        alert("Driver update request submitted to Admin for approval.");
        setShowEditModal(false);
      }
    } catch (err) {
      alert(err.message || "Failed to update driver");
    }
    setSubmitting(false);
  };

  if (loading && !driver) {
    return <div className="page-content">Loading driver profile...</div>;
  }

  if (!driver) {
    return <div className="page-content">Driver not found. <Link href={`/${role}/drivers`}>Back to Registry</Link></div>;
  }

  return (
    <div className="page-content" style={{ maxWidth: 860, paddingBottom: "3rem" }}>
      {/* Breadcrumb */}
      <div style={{ padding: "1.5rem 0 1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.5rem" }}>
          <Link href={`/${role}`} style={{ color: "#6b7280" }}>Home</Link> / 
          <Link href={`/${role}/drivers`} style={{ color: "#6b7280" }}>Drivers</Link> /
          <span>Profile</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "#111827" }}>
              Driver Profile: {driver.name}
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.15rem 0 0" }}>
              Contact: {driver.phone}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => setShowEditModal(true)} className="btn btn-primary" style={{ fontSize: "0.8rem" }}>
              ✎ Edit Profile
            </button>
            <Link href={`/${role}/drivers`} className="btn btn-secondary" style={{ fontSize: "0.8rem" }}>
              ➔ Drivers List
            </Link>
          </div>
        </div>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "2rem" }}>
        {/* Left Card: Full profile details */}
        <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "#111827" }}>Profile Information</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Full Name</span>
              <div style={{ fontSize: "0.95rem", color: "#111827", fontWeight: 600, marginTop: "0.25rem" }}>{driver.name}</div>
            </div>

            <div>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Phone Number</span>
              <div style={{ fontSize: "0.95rem", color: "#111827", fontWeight: 600, marginTop: "0.25rem" }}>{driver.phone}</div>
            </div>

            <div>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Date of Birth</span>
              <div style={{ fontSize: "0.95rem", color: "#111827", fontWeight: 600, marginTop: "0.25rem" }}>
                {driver.dob ? new Date(driver.dob).toLocaleDateString() : "Not Provided"}
              </div>
            </div>

            <div>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Aadhar Card</span>
              <div style={{ fontSize: "0.95rem", color: "#111827", fontWeight: 600, marginTop: "0.25rem" }}>{driver.aadhar_number || "Not Provided"}</div>
            </div>

            <div>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>License Number</span>
              <div style={{ fontSize: "0.95rem", color: "#111827", fontWeight: 600, marginTop: "0.25rem" }}>{driver.license_number || "Not Provided"}</div>
            </div>

            <div>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Date of Joining</span>
              <div style={{ fontSize: "0.95rem", color: "#111827", fontWeight: 600, marginTop: "0.25rem" }}>
                {driver.date_of_joining ? new Date(driver.date_of_joining).toLocaleDateString() : "Not Provided"}
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Permanent Address</span>
              <div style={{ fontSize: "0.95rem", color: "#374151", fontWeight: 600, marginTop: "0.25rem", whiteSpace: "pre-line" }}>{driver.address || "Not Provided"}</div>
            </div>
          </div>
        </div>

        {/* Right Card: Vehicle Assign History */}
        <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb", height: "fit-content" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "#111827" }}>Assigned Vehicle Logs</h2>
          {vehicleHistory.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>No vehicle assignment records.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {vehicleHistory.map((hist, i) => (
                <div key={i} style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
                  <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.9rem" }}>
                    🚗 {hist.cars?.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#1e40af", fontWeight: 700, marginTop: "0.1rem" }}>
                    {hist.cars?.registration_name}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.15rem" }}>
                    Assigned: {new Date(hist.assigned_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Driver Modal */}
      {showEditModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div className="card" style={{ width: "90%", maxWidth: "600px", padding: "1.5rem", background: "#ffffff" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
              {isAdmin ? "Modify Driver Profile" : "Request Driver Modification"}
            </h3>
            <form onSubmit={handleEditSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input type="date" className="form-input" value={editDob} onChange={(e) => setEditDob(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Aadhar Card</label>
                <input type="text" className="form-input" value={editAadharNumber} onChange={(e) => setEditAadharNumber(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">License Number</label>
                <input type="text" className="form-input" value={editLicenseNumber} onChange={(e) => setEditLicenseNumber(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Date of Joining</label>
                <input type="date" className="form-input" value={editDateOfJoining} onChange={(e) => setEditDateOfJoining(e.target.value)} />
              </div>

              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Home Address</label>
                <textarea className="form-input" rows="2" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary" style={{ fontSize: "0.8rem" }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ fontSize: "0.8rem" }}>
                  {submitting ? "Processing..." : isAdmin ? "Save Directly" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
