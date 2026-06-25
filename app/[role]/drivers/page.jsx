"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmModal from "@/components/ConfirmModal";

export default function DriversPage() {
  const { role } = useParams();
  const router = useRouter();
  const isAdmin = role === "admin";

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [driverCarMap, setDriverCarMap] = useState({});

  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: "", message: "", confirmText: "", type: "danger", onConfirm: () => {} });

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

  const handleDeleteDriver = (driverId, driverName) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Driver?",
      message: `Are you sure you want to delete driver ${driverName} permanently?`,
      confirmText: "Yes, Delete",
      type: "danger",
      onConfirm: () => executeDeleteDriver(driverId)
    });
  };

  const executeDeleteDriver = async (driverId) => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
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

  return (
    <div className="page-content" style={{ maxWidth: 900, paddingBottom: "3rem" }}>
      <div style={{ paddingTop: "1rem" }}>
        <Link href={`/${role}`} style={{ textDecoration: "none", color: "var(--text-primary)", fontWeight: 600, fontSize: "0.9rem" }}>
          ← Back to Home
        </Link>
      </div>
      <div className="registry-header">
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            Drivers Portal
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0.25rem 0 0" }}>
            {isAdmin ? "Admin Registry & Controls" : "Submit Driver Registry/Edit Requests"}
          </p>
        </div>
        <Link href={`/${role}/drivers/add`} className="btn btn-primary" style={{ padding: "0.6rem 1.5rem", fontSize: "0.85rem", fontWeight: 600 }}>
          {isAdmin ? "+ Add New Driver" : "+ Request Driver Registration"}
        </Link>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {/* Drivers List */}
      <div>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)" }}>Registered Drivers Fleet</h2>

        {loading ? (
          <div style={{ color: "var(--text-secondary)" }}>Loading registry...</div>
        ) : drivers.length === 0 ? (
          <div style={{
            padding: "2rem",
            background: "var(--bg-card)",
            borderRadius: "8px",
            border: "1px dashed var(--border)",
            textAlign: "center",
            color: "var(--text-secondary)"
          }}>
            No driver profiles registered in the system.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {drivers.map((driver) => {
              const currentCarReg = driverCarMap[driver.id];

              return (
                <div
                  key={driver.id}
                  className="card"
                  style={{
                    padding: 0,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    overflow: "hidden"
                  }}
                >
                  {/* Summary row */}
                  <div className="fleet-card-row">
                    <div className="fleet-card-info">
                      <div style={{ fontSize: "1.5rem" }}>👤</div>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>{driver.name}</div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>💰 Salary: ₹{parseFloat(driver.salary || 0).toLocaleString()} / month</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>📞 {driver.phone}</div>
                      </div>
                    </div>

                    <div className="fleet-card-actions">
                      {currentCarReg ? (
                        <span style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#1e3a8a",
                          background: "#dbeafe",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          whiteSpace: "nowrap"
                        }}>
                          🚗 {currentCarReg}
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>No vehicle assigned</span>
                      )}

                      <div className="fleet-btn-group">
                        <Link href={`/${role}/drivers/${driver.id}`}>
                          <button
                            className="btn btn-primary"
                            style={{
                              padding: "0.45rem 0.85rem",
                              fontSize: "0.75rem"
                            }}
                          >
                            View Profile
                          </button>
                        </Link>

                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteDriver(driver.id, driver.name)}
                            className="btn btn-secondary"
                            style={{
                              padding: "0.45rem 0.75rem",
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        {...confirmConfig}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
    </div>
  );
}
