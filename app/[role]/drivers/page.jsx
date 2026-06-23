"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useParams } from "next/navigation";

export default function DriversPage() {
  const { role } = useParams();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching drivers:", error);
      alert("Failed to load drivers.");
    } else {
      setDrivers(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert("Please fill all fields.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from("drivers")
      .insert([{ name: name.trim(), phone: phone.trim() }]);

    if (error) {
      console.error("Error creating driver:", error);
      alert("Failed to create driver: " + error.message);
    } else {
      setName("");
      setPhone("");
      fetchDrivers();
    }
    setSubmitting(false);
  };

  return (
    <div className="page-content" style={{ maxWidth: 800, paddingBottom: "3rem" }}>
      {/* Title block */}
      <div style={{ padding: "1.5rem 0 1rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em", color: "#1a1d23" }}>
          Manage Drivers
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
          Register and view drivers for the vehicle fleet
        </p>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
        {/* Form to register driver */}
        <div className="card" style={{ padding: "1.5rem", height: "fit-content", background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#111827" }}>Add New Driver</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 500, fontSize: "0.85rem", color: "#374151" }}>Driver Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 500, fontSize: "0.85rem", color: "#374151" }}>Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "0.625rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                marginTop: "0.5rem",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              {submitting ? "Adding..." : "Add Driver"}
            </button>
          </form>
        </div>

        {/* Drivers List */}
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#111827" }}>Drivers Registry</h2>
          {loading ? (
            <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>Loading drivers...</div>
          ) : drivers.length === 0 ? (
            <div style={{
              padding: "2rem",
              background: "#f9fafb",
              borderRadius: "8px",
              border: "1px dashed #e5e7eb",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "0.9rem"
            }}>
              No drivers registered yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="card"
                  style={{
                    padding: "1rem 1.25rem",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "between",
                    alignItems: "center",
                    transition: "transform 0.15s, box-shadow 0.15s"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.1rem"
                    }}>
                      👤
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.95rem" }}>{driver.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>📞 {driver.phone}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
