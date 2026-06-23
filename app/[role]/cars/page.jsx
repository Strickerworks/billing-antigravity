"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function CarsPage() {
  const router = useRouter();
  const { role } = useParams();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [registrationName, setRegistrationName] = useState("");

  useEffect(() => {
    fetchCarsData();
  }, []);

  const fetchCarsData = async () => {
    setLoading(true);
    try {
      // 1. Get all cars
      const { data: carsList, error: carsErr } = await supabase
        .from("cars")
        .select("*")
        .order("name", { ascending: true });

      if (carsErr) throw carsErr;

      const carsWithDetails = [];

      for (const car of (carsList || [])) {
        // Fetch latest KM
        const { data: kmData } = await supabase
          .from("car_km_history")
          .select("km_clocked")
          .eq("car_id", car.id)
          .order("created_at", { ascending: false })
          .limit(1);

        // Fetch latest Service
        const { data: serviceData } = await supabase
          .from("car_service_history")
          .select("service_date")
          .eq("car_id", car.id)
          .order("service_date", { ascending: false })
          .limit(1);

        // Fetch latest Driver Assignment
        const { data: driverData } = await supabase
          .from("car_driver_history")
          .select("assigned_at, drivers(name)")
          .eq("car_id", car.id)
          .order("assigned_at", { ascending: false })
          .limit(1);

        carsWithDetails.push({
          ...car,
          currentKm: kmData?.[0]?.km_clocked || "0",
          lastService: serviceData?.[0]?.service_date || "Never",
          currentDriver: driverData?.[0]?.drivers?.name || "No Driver Assigned",
        });
      }

      setCars(carsWithDetails);
    } catch (err) {
      console.error("Error loading cars registry:", err);
      alert("Failed to load cars list.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !registrationName.trim()) {
      alert("Please fill all fields.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from("cars")
      .insert([
        {
          name: name.trim(),
          registration_name: registrationName.trim().toUpperCase(),
        },
      ]);

    if (error) {
      console.error("Error registering car:", error);
      alert("Failed to register car: " + error.message);
    } else {
      setName("");
      setRegistrationName("");
      fetchCarsData();
    }
    setSubmitting(false);
  };

  return (
    <div className="page-content" style={{ maxWidth: 960, paddingBottom: "3rem" }}>
      {/* Header */}
      <div style={{ padding: "1.5rem 0 1rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em", color: "#1a1d23" }}>
          Fleet Registry & Cars
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
          Manage company vehicles, trace their status, logs, and drivers
        </p>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "2rem" }}>
        {/* Left column: Add new car */}
        <div>
          <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb", position: "sticky", top: "20px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#111827" }}>Register New Vehicle</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 500, fontSize: "0.85rem", color: "#374151" }}>Car Model / Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Toyota LPT 1613"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 500, fontSize: "0.85rem", color: "#374151" }}>Registration Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. KA-01-AB-1234"
                  value={registrationName}
                  onChange={(e) => setRegistrationName(e.target.value)}
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
                {submitting ? "Registering..." : "Register Car"}
              </button>
            </form>
          </div>
        </div>

        {/* Right column: List of Cars */}
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#111827" }}>Vehicles fleet</h2>

          {loading ? (
            <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>Loading vehicles...</div>
          ) : cars.length === 0 ? (
            <div style={{
              padding: "3rem",
              background: "#f9fafb",
              borderRadius: "8px",
              border: "1px dashed #e5e7eb",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "0.9rem"
            }}>
              No vehicles registered yet. Register your first vehicle to start tracking logs.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
              {cars.map((car) => (
                <Link
                  key={car.id}
                  href={`/${role}/cars/${car.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="card action-card fade-in"
                    style={{
                      padding: "1.25rem",
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "transform 0.15s, box-shadow 0.15s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.5rem",
                        color: "#ffffff"
                      }}>
                        🚗
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "#111827", fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {car.name}
                        </div>
                        <div style={{
                          fontSize: "0.75rem",
                          color: "#1e40af",
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          borderRadius: "4px",
                          padding: "0.125rem 0.375rem",
                          display: "inline-block",
                          fontWeight: 600,
                          marginTop: "0.25rem",
                          letterSpacing: "0.02em"
                        }}>
                          {car.registration_name}
                        </div>
                      </div>
                    </div>

                    {/* Stats summary badges */}
                    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <span style={{ fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: 600 }}>Odometer</span>
                        <span style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 700 }}>{parseFloat(car.currentKm).toLocaleString()} km</span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <span style={{ fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: 600 }}>Current Driver</span>
                        <span style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 700 }}>{car.currentDriver}</span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <span style={{ fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: 600 }}>Last Serviced</span>
                        <span style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 700 }}>
                          {car.lastService !== "Never" ? new Date(car.lastService).toLocaleDateString() : "Never"}
                        </span>
                      </div>

                      <div style={{ fontSize: "1.25rem", color: "#9ca3af", paddingLeft: "0.5rem" }}>
                        ➔
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
