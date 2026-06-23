"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function CarsPage() {
  const router = useRouter();
  const { role } = useParams();
  const isAdmin = role === "admin";

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
          currentDriver: driverData?.[0]?.drivers?.name || "No Driver Assigned",
        });
      }

      setCars(carsWithDetails);
    } catch (err) {
      console.error("Error loading cars:", err);
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
    const carPayload = {
      name: name.trim(),
      registration_name: registrationName.trim().toUpperCase()
    };

    if (isAdmin) {
      // Admin writes directly
      const { error } = await supabase.from("cars").insert([carPayload]);
      if (error) {
        alert("Failed to register car: " + error.message);
      } else {
        alert("Vehicle registered successfully.");
        setName("");
        setRegistrationName("");
        fetchCarsData();
      }
    } else {
      // Staff creates request
      const { error } = await supabase.from("fleet_requests").insert([{
        request_type: "add_car",
        payload: carPayload,
        requested_by: "staff",
        status: "pending"
      }]);
      if (error) {
        alert("Failed to submit request: " + error.message);
      } else {
        alert("Vehicle registration request submitted to Admin for approval.");
        setName("");
        setRegistrationName("");
      }
    }
    setSubmitting(false);
  };

  const handleDeleteCar = async (carId, carReg) => {
    if (!confirm(`Are you sure you want to delete vehicle ${carReg} permanently?`)) {
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("cars").delete().eq("id", carId);
    if (error) {
      alert("Failed to delete vehicle: " + error.message);
    } else {
      alert("Vehicle deleted successfully.");
      fetchCarsData();
    }
    setSubmitting(false);
  };

  return (
    <div className="page-content" style={{ maxWidth: 960, paddingBottom: "3rem" }}>
      {/* Header */}
      <div style={{ padding: "1.5rem 0 1rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#1a1d23" }}>
          Fleet Registry
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
          {isAdmin ? "Admin Fleet Registry & Controls" : "Submit Vehicle Addition Requests"}
        </p>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {/* Register vehicle form */}
      <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#111827" }}>
          {isAdmin ? "Register New Vehicle" : "Request Vehicle Registration"}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
          <div className="form-group" style={{ flex: "1 1 250px" }}>
            <label className="form-label" style={{ fontWeight: 500, fontSize: "0.85rem" }}>Car Model / Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Tata Prima 4925"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ flex: "1 1 200px" }}>
            <label className="form-label" style={{ fontWeight: 500, fontSize: "0.85rem" }}>Registration Number</label>
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
            style={{ height: "42px", padding: "0.625rem 2rem", fontSize: "0.875rem", fontWeight: 600 }}
          >
            {submitting ? "Processing..." : isAdmin ? "Register Vehicle" : "Submit Request"}
          </button>
        </form>
      </div>

      {/* Fleet list */}
      <div>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#111827" }}>Registered Vehicles</h2>

        {loading ? (
          <div style={{ color: "#6b7280" }}>Loading vehicles...</div>
        ) : cars.length === 0 ? (
          <div style={{
            padding: "3rem",
            background: "#f9fafb",
            borderRadius: "8px",
            border: "1px dashed #e5e7eb",
            textAlign: "center",
            color: "#6b7280"
          }}>
            No vehicles registered in the fleet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {cars.map((car) => (
              <div
                key={car.id}
                className="card"
                style={{
                  padding: "1.25rem",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ fontSize: "1.5rem" }}>🚗</div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#111827", fontSize: "1.05rem" }}>{car.name}</div>
                    <span style={{
                      fontSize: "0.75rem",
                      color: "#1e40af",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: "4px",
                      padding: "0.125rem 0.375rem",
                      display: "inline-block",
                      fontWeight: 600,
                      marginTop: "0.25rem"
                    }}>
                      {car.registration_name}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span style={{ fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: 700 }}>Odometer</span>
                    <span style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 700 }}>{parseFloat(car.currentKm).toLocaleString()} km</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span style={{ fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: 700 }}>Assigned Driver</span>
                    <span style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 700 }}>{car.currentDriver}</span>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", marginLeft: "1rem" }}>
                    <Link href={`/${role}/cars/${car.id}`}>
                      <button className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "0.45rem 1rem" }}>
                        View Logs
                      </button>
                    </Link>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteCar(car.id, car.registration_name)}
                        className="btn btn-secondary"
                        style={{
                          padding: "0.45rem 0.75rem",
                          fontSize: "0.8rem",
                          color: "#b91c1c",
                          border: "1px solid #fee2e2",
                          background: "#fef2f2"
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
