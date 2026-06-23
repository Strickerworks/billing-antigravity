"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useParams } from "next/navigation";

export default function DriversPage() {
  const { role } = useParams();
  const isAdmin = role === "admin";

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedDriverId, setExpandedDriverId] = useState(null);
  const [driverCarMap, setDriverCarMap] = useState({});

  // Detailed Form Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [address, setAddress] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");

  useEffect(() => {
    fetchDriversAndAssignments();
  }, []);

  const fetchDriversAndAssignments = async () => {
    setLoading(true);
    try {
      // 1. Fetch drivers list
      const { data: driversList, error: driversErr } = await supabase
        .from("drivers")
        .select("*")
        .order("name", { ascending: true });

      if (driversErr) throw driversErr;

      // 2. Fetch all cars and their latest driver assignments to map current cars
      const { data: carsList } = await supabase.from("cars").select("id, registration_name");
      const activeCarMap = {};

      if (carsList) {
        for (const car of carsList) {
          const { data: latestAssign } = await supabase
            .from("car_driver_history")
            .select("driver_id")
            .eq("car_id", car.id)
            .order("assigned_at", { ascending: false })
            .limit(1);

          if (latestAssign && latestAssign.length > 0) {
            activeCarMap[latestAssign[0].driver_id] = car.registration_name;
          }
        }
      }

      setDrivers(driversList || []);
      setDriverCarMap(activeCarMap);
    } catch (err) {
      console.error("Error loading drivers:", err);
      alert("Failed to load drivers.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert("Please fill name and phone.");
      return;
    }

    setSubmitting(true);
    const driverPayload = {
      name: name.trim(),
      phone: phone.trim(),
      dob: dob || null,
      aadhar_number: aadharNumber.trim() || null,
      address: address.trim() || null,
      license_number: licenseNumber.trim() || null,
      date_of_joining: dateOfJoining || null
    };

    if (isAdmin) {
      // Admins write directly to drivers table
      const { error } = await supabase.from("drivers").insert([driverPayload]);
      if (error) {
        alert("Failed to add driver: " + error.message);
      } else {
        alert("Driver added successfully.");
        clearForm();
        fetchDriversAndAssignments();
      }
    } else {
      // Staff submits a request
      const { error } = await supabase.from("fleet_requests").insert([{
        request_type: "add_driver",
        payload: driverPayload,
        requested_by: "staff",
        status: "pending"
      }]);
      if (error) {
        alert("Failed to submit request: " + error.message);
      } else {
        alert("Driver registration request submitted to Admin for approval.");
        clearForm();
      }
    }
    setSubmitting(false);
  };

  const clearForm = () => {
    setName("");
    setPhone("");
    setDob("");
    setAadharNumber("");
    setAddress("");
    setLicenseNumber("");
    setDateOfJoining("");
  };

  const handleDeleteDriver = async (driverId, driverName) => {
    if (!confirm(`Are you sure you want to delete driver ${driverName} permanently?`)) {
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("drivers").delete().eq("id", driverId);
    if (error) {
      alert("Failed to delete driver: " + error.message);
    } else {
      alert("Driver deleted successfully.");
      fetchDriversAndAssignments();
    }
    setSubmitting(false);
  };

  const toggleExpand = (id) => {
    setExpandedDriverId(expandedDriverId === id ? null : id);
  };

  return (
    <div className="page-content" style={{ maxWidth: 900, paddingBottom: "3rem" }}>
      {/* Title */}
      <div style={{ padding: "1.5rem 0 1rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#1a1d23" }}>
          Drivers Portal
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
          {isAdmin ? "Admin Registry & Controls" : "Submit Driver Registry Requests"}
        </p>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {/* Driver Registration Form */}
      <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#111827" }}>
          {isAdmin ? "Add New Driver" : "Request Driver Registration"}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 500, fontSize: "0.85rem" }}>Full Name</label>
            <input type="text" className="form-input" placeholder="Driver Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 500, fontSize: "0.85rem" }}>Phone Number</label>
            <input type="text" className="form-input" placeholder="Phone contact" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 500, fontSize: "0.85rem" }}>Date of Birth</label>
            <input type="date" className="form-input" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 500, fontSize: "0.85rem" }}>Aadhar Card Number</label>
            <input type="text" className="form-input" placeholder="Aadhar number" value={aadharNumber} onChange={(e) => setAadharNumber(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 500, fontSize: "0.85rem" }}>License Number</label>
            <input type="text" className="form-input" placeholder="DL registration number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 500, fontSize: "0.85rem" }}>Date of Joining</label>
            <input type="date" className="form-input" value={dateOfJoining} onChange={(e) => setDateOfJoining(e.target.value)} />
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label" style={{ fontWeight: 500, fontSize: "0.85rem" }}>Home Address</label>
            <textarea className="form-input" rows="2" placeholder="Residential permanent address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ padding: "0.625rem 2rem", fontSize: "0.875rem", fontWeight: 600 }}
            >
              {submitting ? "Processing..." : isAdmin ? "Add Driver Profile" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>

      {/* Drivers List */}
      <div>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#111827" }}>Registered Drivers Fleet</h2>

        {loading ? (
          <div style={{ color: "#6b7280" }}>Loading registry...</div>
        ) : drivers.length === 0 ? (
          <div style={{
            padding: "2rem",
            background: "#f9fafb",
            borderRadius: "8px",
            border: "1px dashed #e5e7eb",
            textAlign: "center",
            color: "#6b7280"
          }}>
            No driver profiles registered in the system.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {drivers.map((driver) => {
              const isExpanded = expandedDriverId === driver.id;
              const currentCarReg = driverCarMap[driver.id];

              return (
                <div
                  key={driver.id}
                  className="card"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    overflow: "hidden"
                  }}
                >
                  {/* Summary row */}
                  <div
                    onClick={() => toggleExpand(driver.id)}
                    style={{
                      padding: "1rem 1.25rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      background: isExpanded ? "#f9fafb" : "#ffffff"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ fontSize: "1.5rem" }}>👤</div>
                      <div>
                        <div style={{ fontWeight: 700, color: "#111827", fontSize: "1rem" }}>{driver.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>📞 {driver.phone}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                      {currentCarReg ? (
                        <span style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#1e3a8a",
                          background: "#dbeafe",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px"
                        }}>
                          🚗 {currentCarReg}
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>No vehicle assigned</span>
                      )}

                      <span style={{ fontSize: "1rem", color: "#9ca3af" }}>
                        {isExpanded ? "▲" : "▼"}
                      </span>

                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDriver(driver.id, driver.name);
                          }}
                          className="btn btn-secondary"
                          style={{
                            padding: "0.35rem 0.5rem",
                            fontSize: "0.75rem",
                            color: "#b91c1c",
                            border: "1px solid #fee2e2",
                            background: "#fef2f2"
                          }}
                        >
                          🗑 Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded detailed profile */}
                  {isExpanded && (
                    <div style={{
                      padding: "1.25rem",
                      borderTop: "1px solid #e5e7eb",
                      background: "#f9fafb",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "1rem"
                    }}>
                      <div>
                        <span style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Date of Birth</span>
                        <div style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 600, marginTop: "0.15rem" }}>
                          {driver.dob ? new Date(driver.dob).toLocaleDateString() : "Not Provided"}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Aadhar Card</span>
                        <div style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 600, marginTop: "0.15rem" }}>
                          {driver.aadhar_number || "Not Provided"}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>License Number</span>
                        <div style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 600, marginTop: "0.15rem" }}>
                          {driver.license_number || "Not Provided"}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Date of Joining</span>
                        <div style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 600, marginTop: "0.15rem" }}>
                          {driver.date_of_joining ? new Date(driver.date_of_joining).toLocaleDateString() : "Not Provided"}
                        </div>
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <span style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Permanent Address</span>
                        <div style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 600, marginTop: "0.15rem", whiteSpace: "pre-line" }}>
                          {driver.address || "Not Provided"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
