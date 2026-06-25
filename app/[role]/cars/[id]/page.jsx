"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ConfirmModal from "@/components/ConfirmModal";

export default function CarDetailPage() {
  const router = useRouter();
  const { role, id } = useParams();
  const carId = parseInt(id);
  const isAdmin = role === "admin";

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentMonthExpensesTotal, setCurrentMonthExpensesTotal] = useState(0);
  const [driverLogs, setDriverLogs] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: "", message: "", confirmText: "", type: "danger", onConfirm: () => {} });

  useEffect(() => {
    if (carId) {
      fetchCarDetails();
    }
  }, [carId]);

  const fetchCarDetails = async () => {
    setLoading(true);
    try {
      // 1. Get Car details
      const { data: carData, error: carErr } = await supabase
        .from("cars")
        .select("*")
        .eq("id", carId)
        .single();

      if (carErr) throw carErr;

      // 2. Fetch driver assignments & pending requests & approved expenses
      const [
        { data: assigns },
        { data: allPending },
        { data: approvedExpenses }
      ] = await Promise.all([
        supabase.from("car_driver_history").select("*, drivers(id, name, phone)").eq("car_id", carId).order("assigned_at", { ascending: false }),
        supabase.from("fleet_requests").select("*").eq("status", "pending"),
        supabase.from("expense_reports").select("amount, created_at").eq("status", "approved").ilike("comment", `%[${carData.registration_name}]%`)
      ]);

      // Calculate monthly expenses
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const thisMonthExpenses = (approvedExpenses || []).filter(exp => {
        const eDate = new Date(exp.created_at);
        return eDate.getFullYear() === currentYear && eDate.getMonth() === currentMonth;
      });

      const totalMonthlyCost = thisMonthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      setCurrentMonthExpensesTotal(totalMonthlyCost);

      setDriverLogs(assigns || []);

      // Filter pending requests for this car
      const carPending = (allPending || []).filter(req => req.payload && req.payload.car_id === carId);
      setPendingRequests(carPending);

      // Determine current driver
      const currentDriver = assigns?.[0]?.drivers?.name || "No Driver Assigned";
      const currentDriverPhone = assigns?.[0]?.drivers?.phone || "";
      const currentDriverId = assigns?.[0]?.drivers?.id || null;

      setCar({
        ...carData,
        currentDriver,
        currentDriverPhone,
        currentDriverId
      });

    } catch (err) {
      console.error("Error loading car details:", err);
      alert("Failed to load details for this vehicle.");
    }
    setLoading(false);
  };

  const handleDeleteCar = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Vehicle?",
      message: `Are you sure you want to delete vehicle ${car?.registration_name} permanently?`,
      confirmText: "Yes, Delete",
      type: "danger",
      onConfirm: executeDeleteCar
    });
  };

  const executeDeleteCar = async () => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
    setSubmitting(true);
    try {
      const { error } = await supabase.from("cars").delete().eq("id", carId);
      if (error) throw error;
      alert("Vehicle profile deleted successfully.");
      router.push(`/${role}/cars`);
    } catch (err) {
      alert("Failed to delete vehicle: " + err.message);
    }
    setSubmitting(false);
  };

  if (loading && !car) {
    return <div className="page-content">Loading vehicle details...</div>;
  }

  if (!car) {
    return (
      <div className="page-content">
        Vehicle not found. <Link href={`/${role}/cars`}>Back to Registry</Link>
      </div>
    );
  }

  // Uniform black button styling
  const buttonStyle = {
    fontSize: "0.85rem",
    fontWeight: 600,
    background: "var(--text-primary)",
    color: "var(--bg-card)",
    border: "1px solid var(--text-primary)",
    padding: "0.5rem 1.25rem",
    borderRadius: "6px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    transition: "background-color 0.2s"
  };

  return (
    <div className="page-content" style={{ maxWidth: 800, paddingBottom: "3rem" }}>
      
      {/* 1. Back button at the top of name */}
      <div style={{ paddingTop: "1rem", marginBottom: "1rem" }}>
        <Link href={`/${role}/cars`} style={{ textDecoration: "none", color: "var(--text-primary)", fontWeight: 600, fontSize: "0.9rem" }}>
          ← Back to Registry
        </Link>
      </div>

      {/* 2. Vehicle Name Header */}
      <div style={{ paddingBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
          {car.name}
        </h1>
        <span style={{
          fontSize: "0.8rem",
          color: "var(--badge-blue-text)",
          background: "var(--badge-blue-bg)",
          border: "1px solid var(--badge-blue-border)",
          borderRadius: "4px",
          padding: "0.2rem 0.6rem",
          display: "inline-block",
          fontWeight: 700,
          marginTop: "0.35rem"
        }}>
          {car.registration_name}
        </span>
      </div>

      {/* 3. Action Buttons below name */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <Link href={`/${role}/cars/${carId}/km`} style={buttonStyle}>
          🚗 Log Odometer
        </Link>
        <Link href={`/${role}/cars/${carId}/service`} style={buttonStyle}>
          🔧 Log Service
        </Link>
        <Link href={`/${role}/cars/${carId}/fuel`} style={buttonStyle}>
          ⛽ Log Fuel
        </Link>
        <Link href={`/${role}/cars/${carId}/insurance`} style={buttonStyle}>
          📄 Log Insurance
        </Link>
        <Link href={`/${role}/cars/${carId}/misc`} style={buttonStyle}>
          💸 Log Misc Cost
        </Link>
        <Link href={`/${role}/cars/${carId}/driver`} style={buttonStyle}>
          👤 Assign Driver
        </Link>
        {isAdmin && (
          <button onClick={handleDeleteCar} disabled={submitting} style={{ ...buttonStyle, background: "#ef4444", borderColor: "#ef4444" }}>
            🗑 Delete Vehicle
          </button>
        )}
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {/* 4. Monthly Expense Banner */}
      <div className="card month-banner" style={{
        padding: "1.25rem",
        background: "linear-gradient(135deg, var(--badge-warning-bg) 0%, var(--badge-warning-bg) 100%)",
        border: "1px solid var(--badge-warning-border)",
        borderRadius: "8px",
        marginBottom: "1.5rem",
      }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--badge-warning-text)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Current Month Fleet Costs ({new Date().toLocaleString('default', { month: 'long' })})
          </span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--badge-warning-text)", marginTop: "0.15rem" }}>
            ₹{currentMonthExpensesTotal.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Pending requests warning indicator for Staff */}
      {pendingRequests.length > 0 && (
        <div style={{
          padding: "1rem",
          background: "var(--badge-warning-bg)",
          border: "1px solid var(--badge-warning-bg)",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem"
        }}>
          <div style={{ fontWeight: 700, color: "var(--badge-warning-text)", fontSize: "0.85rem" }}>
            ⚠️ {pendingRequests.length} Pending Approval Request(s) for this vehicle:
          </div>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.8rem", color: "var(--badge-warning-text)" }}>
            {pendingRequests.map(req => (
              <li key={req.id}>
                <strong>{req.request_type.replace("log_", "").toUpperCase()} log</strong> requested on {new Date(req.created_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 5. Car Information (With Clickable Current Driver Option) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        <div className="card" style={{ padding: "1.5rem", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-primary)" }}>Vehicle Information</h2>
          <div className="info-grid-2">
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Model / Name</span>
              <div style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 600, marginTop: "0.25rem" }}>{car.name}</div>
            </div>

            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Registration Number</span>
              <div style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 600, marginTop: "0.25rem" }}>{car.registration_name}</div>
            </div>

            <div style={{ gridColumn: "1 / -1", borderTop: "1px solid var(--bg-elevated)", paddingTop: "1rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Current Assigned Driver</span>
              <div style={{ marginTop: "0.25rem" }}>
                {car.currentDriverId ? (
                  <Link href={`/${role}/drivers/${car.currentDriverId}`} style={{ textDecoration: "none" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "var(--badge-blue-bg)", color: "var(--badge-blue-text)", padding: "0.4rem 0.8rem", borderRadius: "6px", fontWeight: 700, fontSize: "0.9rem" }}>
                      👤 {car.currentDriver} ({car.currentDriverPhone}) <span style={{ fontSize: "0.75rem" }}>➔ View Profile</span>
                    </div>
                  </Link>
                ) : (
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>
                    No driver assigned currently.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 6. Car's Driver Assignment History */}
        <div className="card" style={{ padding: "1.5rem", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-primary)" }}>Driver Assignment History</h2>
          {driverLogs.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>No driver assignment history.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {driverLogs.map((log) => (
                <div key={log.id} className="log-row" style={{ paddingBottom: "0.5rem" }}>
                  <div>
                    {log.drivers?.id ? (
                      <Link href={`/${role}/drivers/${log.drivers.id}`} style={{ textDecoration: "none", fontWeight: 700, color: "var(--badge-blue-text)" }}>
                        👤 {log.drivers.name}
                      </Link>
                    ) : (
                      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>👤 {log.drivers?.name || "Unassigned"}</span>
                    )}
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.1rem" }}>
                      Phone: {log.drivers?.phone || "N/A"}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "right" }}>
                    <div>Assigned: {new Date(log.assigned_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <ConfirmModal
        {...confirmConfig}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
    </div>
  );
}
