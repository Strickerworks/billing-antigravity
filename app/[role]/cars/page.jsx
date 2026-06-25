"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ConfirmModal from "@/components/ConfirmModal";

export default function CarsPage() {
  const router = useRouter();
  const { role } = useParams();
  const isAdmin = role === "admin";

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit Form State
  const [editingCar, setEditingCar] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRegistrationName, setEditRegistrationName] = useState("");

  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: "", message: "", confirmText: "", type: "danger", onConfirm: () => {} });

  useEffect(() => {
    fetchCarsData();
  }, []);

  const fetchCarsData = async () => {
    setLoading(true);
    try {
      const { data: carsList, error: carsErr } = await supabase
        .from("cars")
        .select("*")
        .order("name", { ascending: true });

      if (carsErr) throw carsErr;

      const carsWithDetails = [];

      for (const car of (carsList || [])) {
        const { data: kmData } = await supabase
          .from("car_km_history")
          .select("km_clocked")
          .eq("car_id", car.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const { data: driverData } = await supabase
          .from("car_driver_history")
          .select("assigned_at, driver_id, drivers(name)")
          .eq("car_id", car.id)
          .order("assigned_at", { ascending: false })
          .limit(1);

        carsWithDetails.push({
          ...car,
          currentKm: kmData?.[0]?.km_clocked || "0",
          currentDriver: driverData?.[0]?.drivers?.name || "No Driver Assigned",
          currentDriverId: driverData?.[0]?.driver_id || null,
        });
      }

      setCars(carsWithDetails);
    } catch (err) {
      console.error("Error loading cars:", err);
      alert("Failed to load cars list.");
    }
    setLoading(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editRegistrationName.trim()) {
      alert("Please fill all fields.");
      return;
    }

    setSubmitting(true);
    const carPayload = {
      car_id: editingCar.id,
      name: editName.trim(),
      registration_name: editRegistrationName.trim().toUpperCase()
    };

    if (isAdmin) {
      const { error } = await supabase
        .from("cars")
        .update({
          name: carPayload.name,
          registration_name: carPayload.registration_name
        })
        .eq("id", editingCar.id);

      if (error) {
        alert("Failed to modify vehicle details: " + error.message);
      } else {
        alert("Vehicle details updated successfully.");
        setEditingCar(null);
        fetchCarsData();
      }
    } else {
      const { error } = await supabase.from("fleet_requests").insert([{
        request_type: "edit_car",
        payload: carPayload,
        requested_by: "staff",
        status: "pending"
      }]);
      if (error) {
        alert("Failed to submit update request: " + error.message);
      } else {
        alert("Vehicle update request submitted to Admin for approval.");
        setEditingCar(null);
      }
    }
    setSubmitting(false);
  };

  const handleStartEdit = (car) => {
    setEditingCar(car);
    setEditName(car.name || "");
    setEditRegistrationName(car.registration_name || "");
  };

  const handleDeleteCar = (carId, carReg) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Vehicle?",
      message: `Are you sure you want to delete vehicle ${carReg} permanently?`,
      confirmText: "Yes, Delete",
      type: "danger",
      onConfirm: () => executeDeleteCar(carId)
    });
  };

  const executeDeleteCar = async (carId) => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
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
      <div style={{ paddingTop: "1rem" }}>
        <Link href={`/${role}`} style={{ textDecoration: "none", color: "var(--text-primary)", fontWeight: 600, fontSize: "0.9rem" }}>
          ← Back to Home
        </Link>
      </div>
      <div className="registry-header">
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            Fleet Registry
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0.25rem 0 0" }}>
            {isAdmin ? "Admin Fleet Registry & Controls" : "Submit Vehicle Addition/Modification Requests"}
          </p>
        </div>
        <Link href={`/${role}/cars/add`} className="btn btn-primary" style={{ padding: "0.6rem 1.5rem", fontSize: "0.85rem", fontWeight: 600 }}>
          {isAdmin ? "+ Add Vehicle" : "+ Request Registration"}
        </Link>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {/* Fleet list */}
      <div>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)" }}>Registered Vehicles</h2>

        {loading ? (
          <div style={{ color: "var(--text-secondary)" }}>Loading vehicles...</div>
        ) : cars.length === 0 ? (
          <div style={{
            padding: "3rem",
            background: "var(--bg-card)",
            borderRadius: "8px",
            border: "1px dashed var(--border)",
            textAlign: "center",
            color: "var(--text-secondary)"
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
                  padding: 0,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="fleet-card-row">
                  <div className="fleet-card-info">
                    <div style={{ fontSize: "1.5rem" }}>🚗</div>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1.05rem" }}>{car.name}</div>
                      <span style={{
                        fontSize: "0.75rem",
                        color: "var(--badge-blue-text)",
                        background: "var(--badge-blue-bg)",
                        border: "1px solid var(--badge-blue-border)",
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

                  <div className="fleet-card-actions">
                    <div className="fleet-stat">
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Odometer</span>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 700 }}>{parseFloat(car.currentKm).toLocaleString()} km</span>
                    </div>

                    <div className="fleet-stat">
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Assigned Driver</span>
                      {car.currentDriverId ? (
                        <Link href={`/${role}/drivers/${car.currentDriverId}`} style={{ textDecoration: "none" }}>
                          <span style={{ fontSize: "0.85rem", color: "var(--badge-blue-text)", fontWeight: 700, textDecoration: "underline" }}>{car.currentDriver}</span>
                        </Link>
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 700 }}>{car.currentDriver}</span>
                      )}
                    </div>

                    <div className="fleet-btn-group">
                      <Link href={`/${role}/cars/${car.id}`}>
                        <button className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "0.45rem 1rem" }}>
                          View Logs
                        </button>
                      </Link>

                      <button
                        onClick={() => handleStartEdit(car)}
                        className="btn btn-secondary"
                        style={{ fontSize: "0.8rem", padding: "0.45rem 0.85rem" }}
                      >
                        ✎ Edit
                      </button>

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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Vehicle Modal */}
      {editingCar && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div className="card" style={{ width: "90%", maxWidth: "500px", padding: "1.5rem", background: "var(--bg-card)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
              {isAdmin ? "Modify Vehicle Profile" : "Request Vehicle Modification"}
            </h3>
            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Car Model / Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Registration Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={editRegistrationName}
                  onChange={(e) => setEditRegistrationName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setEditingCar(null)} className="btn btn-secondary" style={{ fontSize: "0.8rem" }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ fontSize: "0.8rem" }}>
                  {submitting ? "Processing..." : isAdmin ? "Save Directly" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        {...confirmConfig}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
    </div>
  );
}
