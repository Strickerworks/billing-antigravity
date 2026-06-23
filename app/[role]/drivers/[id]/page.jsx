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
  const [paymentsHistory, setPaymentsHistory] = useState([]);
  const [leavesHistory, setLeavesHistory] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleDeleteDriver = async () => {
    if (!confirm(`Are you sure you want to delete driver ${driver?.name} permanently?`)) {
      return;
    }
    try {
      const { error } = await supabase.from("drivers").delete().eq("id", driverId);
      if (error) throw error;
      alert("Driver profile deleted successfully.");
      router.push(`/${role}/drivers`);
    } catch (err) {
      alert("Failed to delete driver: " + err.message);
    }
  };

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

      // 2. Get assigned vehicle history
      const { data: historyList } = await supabase
        .from("car_driver_history")
        .select("assigned_at, cars(name, registration_name)")
        .eq("driver_id", driverId)
        .order("assigned_at", { ascending: false });

      setVehicleHistory(historyList || []);

      // 3. Get driver payments logs
      const { data: payHistory } = await supabase
        .from("driver_payments")
        .select("*")
        .eq("driver_id", driverId)
        .order("payment_date", { ascending: false });
      setPaymentsHistory(payHistory || []);

      // 4. Get driver leaves logs
      const { data: leaves } = await supabase
        .from("driver_leaves")
        .select("*")
        .eq("driver_id", driverId)
        .order("start_date", { ascending: false });
      setLeavesHistory(leaves || []);

      // 5. Get pending fleet requests
      const { data: allPending } = await supabase
        .from("fleet_requests")
        .select("*")
        .eq("status", "pending");
      
      const driverPendingPayments = (allPending || []).filter(
        (req) => req.request_type === "log_driver_payment" && req.payload && req.payload.driver_id === driverId
      );
      setPendingPayments(driverPendingPayments);

      const driverPendingLeaves = (allPending || []).filter(
        (req) => req.request_type === "log_driver_leave" && req.payload && req.payload.driver_id === driverId
      );
      setPendingLeaves(driverPendingLeaves);

    } catch (err) {
      console.error("Error loading driver details:", err);
      alert("Failed to load driver profile.");
    }
    setLoading(false);
  };

  if (loading && !driver) {
    return <div className="page-content">Loading driver profile...</div>;
  }

  if (!driver) {
    return <div className="page-content">Driver not found. <Link href={`/${role}/drivers`}>Back to Registry</Link></div>;
  }

  // Monthly balance calculations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const thisMonthPayments = paymentsHistory.filter((p) => {
    const pDate = new Date(p.payment_date);
    return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth;
  });

  const totalPaid = thisMonthPayments
    .filter((p) => p.type === "salary_paid")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const totalDeductions = thisMonthPayments
    .filter((p) => p.type === "deduction")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const totalAdvances = thisMonthPayments
    .filter((p) => p.type === "advance")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const baseSalary = parseFloat(driver.salary || 0);
  const leftoverBalance = baseSalary - (totalPaid + totalDeductions + totalAdvances);

  // Leave calculations
  const totalLeaveDays = leavesHistory.reduce((sum, l) => {
    const sDate = new Date(l.start_date);
    const eDate = new Date(l.end_date);
    const diff = Math.ceil(Math.abs(eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;
    return sum + diff;
  }, 0);

  const thisMonthLeaveDays = leavesHistory
    .filter((l) => {
      const sDate = new Date(l.start_date);
      return sDate.getFullYear() === currentYear && sDate.getMonth() === currentMonth;
    })
    .reduce((sum, l) => {
      const sDate = new Date(l.start_date);
      const eDate = new Date(l.end_date);
      const diff = Math.ceil(Math.abs(eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;
      return sum + diff;
    }, 0);

  // Uniform styling for all action buttons (black background, white font)
  const buttonStyle = {
    fontSize: "0.85rem",
    fontWeight: 600,
    background: "#111827",
    color: "#ffffff",
    border: "1px solid #111827",
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
      {/* Title & Action Buttons Section */}
      <div style={{ padding: "1.5rem 0" }}>
        <div style={{ marginBottom: "1rem" }}>
          <Link href={`/${role}/drivers`} style={{ textDecoration: "none", color: "#111827", fontWeight: 600, fontSize: "0.9rem" }}>
            ← Back to Registry
          </Link>
        </div>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, color: "#111827" }}>
            {driver.name}
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#6b7280", margin: "0.25rem 0 1.25rem" }}>
            Contact: {driver.phone}
          </p>
        </div>

        {/* Buttons placed below the name in a clean row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.50rem" }}>
          <Link href={`/${role}/drivers/${driverId}/leave`} style={buttonStyle}>
            📅 Log Leave
          </Link>
          <Link href={`/${role}/drivers/${driverId}/payment`} style={buttonStyle}>
            💵 Log Payment
          </Link>
          <Link href={`/${role}/drivers/${driverId}/edit`} style={buttonStyle}>
            ✎ Edit Profile
          </Link>
          {isAdmin && (
            <button onClick={handleDeleteDriver} style={{ ...buttonStyle, background: "#ef4444", borderColor: "#ef4444" }}>
              🗑 Delete Profile
            </button>
          )}
        </div>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {/* Salary & Balance Summary Banner */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
        {/* Row 1: Finance Summary */}
        <div className="card" style={{
          padding: "1.25rem",
          background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
          border: "1px solid #bbf7d0",
          borderRadius: "8px"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.7rem", color: "#15803d", fontWeight: 700, textTransform: "uppercase" }}>Monthly Base Salary</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#166534", marginTop: "0.25rem" }}>₹{baseSalary.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "#15803d", fontWeight: 700, textTransform: "uppercase" }}>Salary Paid</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#166534", marginTop: "0.25rem" }}>₹{totalPaid.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "#b45309", fontWeight: 700, textTransform: "uppercase" }}>Advances Taken</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#92400e", marginTop: "0.25rem" }}>₹{totalAdvances.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "#b91c1c", fontWeight: 700, textTransform: "uppercase" }}>Deductions</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#991b1b", marginTop: "0.25rem" }}>₹{totalDeductions.toLocaleString()}</div>
            </div>
            <div style={{ borderLeft: "1px solid #bbf7d0", paddingLeft: "1rem" }}>
              <div style={{ fontSize: "0.7rem", color: "#1e40af", fontWeight: 700, textTransform: "uppercase" }}>Leftover Balance</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: leftoverBalance >= 0 ? "#1e3a8a" : "#b91c1c", marginTop: "0.25rem" }}>
                ₹{leftoverBalance.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Leaves Summary */}
        <div className="card" style={{
          padding: "1rem 1.25rem",
          background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
          border: "1px solid #fde68a",
          borderRadius: "8px",
          display: "flex",
          gap: "2rem"
        }}>
          <div>
            <span style={{ fontSize: "0.7rem", color: "#92400e", fontWeight: 700, textTransform: "uppercase" }}>Leaves Taken (This Month)</span>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#78350f", marginTop: "0.15rem" }}>{thisMonthLeaveDays} Days</div>
          </div>
          <div style={{ borderLeft: "1px solid #fde68a", paddingLeft: "2rem" }}>
            <span style={{ fontSize: "0.7rem", color: "#92400e", fontWeight: 700, textTransform: "uppercase" }}>Total Leaves (All Time)</span>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#78350f", marginTop: "0.15rem" }}>{totalLeaveDays} Days</div>
          </div>
        </div>
      </div>

      {/* Pending payments warning indicator for Staff */}
      {(pendingPayments.length > 0 || pendingLeaves.length > 0) && (
        <div style={{
          padding: "1rem",
          background: "#fffbeb",
          border: "1px solid #fef3c7",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem"
        }}>
          <div style={{ fontWeight: 700, color: "#92400e", fontSize: "0.85rem" }}>
            ⚠️ Pending Fleet Request(s) Awaiting Approval:
          </div>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.8rem", color: "#b45309" }}>
            {pendingPayments.map((req) => (
              <li key={req.id}>
                <strong>{req.payload.type?.replace("_", " ").toUpperCase()}</strong> of <strong>₹{req.payload.amount?.toLocaleString()}</strong> requested on {new Date(req.created_at).toLocaleDateString()}
              </li>
            ))}
            {pendingLeaves.map((req) => (
              <li key={req.id}>
                <strong>LEAVE LOG</strong> from {new Date(req.payload.start_date).toLocaleDateString()} to {new Date(req.payload.end_date).toLocaleDateString()} requested on {new Date(req.created_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Profile Information & Vehicle Logs shown cleanly in vertical hierarchy */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* 1. Profile Information */}
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

        {/* 2. Assigned Vehicle Logs */}
        <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb" }}>
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
    </div>
  );
}
