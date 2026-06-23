"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function CarDetailPage() {
  const router = useRouter();
  const { role, id } = useParams();
  const carId = parseInt(id);
  const isAdmin = role === "admin";

  // States
  const [car, setCar] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("km");
  const [submitting, setSubmitting] = useState(false);
  const [currentMonthExpensesTotal, setCurrentMonthExpensesTotal] = useState(0);

  // History states
  const [kmLogs, setKmLogs] = useState([]);
  const [serviceLogs, setServiceLogs] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [insuranceLogs, setInsuranceLogs] = useState([]);
  const [miscLogs, setMiscLogs] = useState([]);
  const [driverLogs, setDriverLogs] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Form states
  const [showLogForm, setShowLogForm] = useState(null);

  // Log Form fields
  const [kmVal, setKmVal] = useState("");
  const [kmComment, setKmComment] = useState("");

  const [serviceDate, setServiceDate] = useState("");
  const [serviceComment, setServiceComment] = useState("");
  const [serviceCost, setServiceCost] = useState("");

  const [fuelLiters, setFuelLiters] = useState("");
  const [fuelMoney, setFuelMoney] = useState("");
  const [fuelComment, setFuelComment] = useState("");

  const [insuranceDate, setInsuranceDate] = useState("");
  const [insuranceFrom, setInsuranceFrom] = useState("");
  const [insuranceTo, setInsuranceTo] = useState("");
  const [insuranceComment, setInsuranceComment] = useState("");
  const [insuranceCost, setInsuranceCost] = useState("");

  const [miscAmount, setMiscAmount] = useState("");
  const [miscComment, setMiscComment] = useState("");

  const [assignDriverId, setAssignDriverId] = useState("");

  useEffect(() => {
    if (carId) {
      fetchCarDetails();
      fetchDriversList();
    }
  }, [carId]);

  const fetchDriversList = async () => {
    const { data } = await supabase.from("drivers").select("*").order("name", { ascending: true });
    setDrivers(data || []);
  };

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

      // 2. Fetch history logs
      const [
        { data: kms },
        { data: services },
        { data: fuels },
        { data: insurances },
        { data: miscs },
        { data: assigns },
        { data: allPending },
        { data: approvedExpenses }
      ] = await Promise.all([
        supabase.from("car_km_history").select("*").eq("car_id", carId).order("created_at", { ascending: false }),
        supabase.from("car_service_history").select("*").eq("car_id", carId).order("service_date", { ascending: false }),
        supabase.from("car_fuel_history").select("*").eq("car_id", carId).order("created_at", { ascending: false }),
        supabase.from("car_insurance_history").select("*").eq("car_id", carId).order("insurance_date", { ascending: false }),
        supabase.from("car_misc_history").select("*").eq("car_id", carId).order("created_at", { ascending: false }),
        supabase.from("car_driver_history").select("*, drivers(id, name, phone)").eq("car_id", carId).order("assigned_at", { ascending: false }),
        supabase.from("fleet_requests").select("*").eq("status", "pending"),
        supabase.from("expense_reports").select("amount, created_at").eq("status", "approved").ilike("comment", `%[${carData.registration_name}]%`)
      ]);

      setKmLogs(kms || []);
      setServiceLogs(services || []);
      setFuelLogs(fuels || []);
      setInsuranceLogs(insurances || []);
      setMiscLogs(miscs || []);
      setDriverLogs(assigns || []);

      // Filter pending requests for this specific car
      const carPending = (allPending || []).filter(req => req.payload && req.payload.car_id === carId);
      setPendingRequests(carPending);

      // Compute current month expenses total
      let monthTotal = 0;
      if (approvedExpenses) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const currentMonthExpenses = approvedExpenses.filter(exp => {
          const expDate = new Date(exp.created_at);
          return expDate >= startOfMonth && expDate <= endOfMonth;
        });

        monthTotal = currentMonthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
      }
      setCurrentMonthExpensesTotal(monthTotal);

      // 3. Compile current info summary
      const currentKm = kms?.[0]?.km_clocked || "0";
      const lastService = services?.[0]?.service_date || "Never";
      const currentDriver = assigns?.[0]?.drivers?.name || "None";
      const currentDriverPhone = assigns?.[0]?.drivers?.phone || "";

      // Insurance active check
      let insuranceStatus = "No active policy";
      if (insurances && insurances.length > 0) {
        const activePolicy = insurances[0];
        const today = new Date().toISOString().split("T")[0];
        if (today >= activePolicy.insurance_from && today <= activePolicy.insurance_to) {
          insuranceStatus = `Active (Expires ${new Date(activePolicy.insurance_to).toLocaleDateString()})`;
        } else {
          insuranceStatus = `Expired on ${new Date(activePolicy.insurance_to).toLocaleDateString()}`;
        }
      }

      setCar({
        ...carData,
        currentKm,
        lastService,
        currentDriver,
        currentDriverPhone,
        currentDriverId: assigns?.[0]?.drivers?.id || null,
        insuranceStatus
      });

    } catch (err) {
      console.error("Error loading car details:", err);
      alert("Failed to load details for this vehicle.");
    }
    setLoading(false);
  };

  const handleLogSubmit = async (e, type) => {
    e.preventDefault();
    setSubmitting(true);
    let payload = {};

    try {
      if (type === "km") {
        if (!kmVal) throw new Error("Please enter Odometer reading");
        payload = { car_id: carId, km_clocked: parseFloat(kmVal), comment: kmComment };
      } else if (type === "service") {
        if (!serviceDate) throw new Error("Please enter service date");
        payload = {
          car_id: carId,
          service_date: serviceDate,
          comment: serviceComment,
          service_cost: serviceCost ? parseFloat(serviceCost) : 0
        };
      } else if (type === "fuel") {
        if (!fuelLiters || !fuelMoney) throw new Error("Please fill fuel metrics");
        payload = { car_id: carId, liters: parseFloat(fuelLiters), money: parseFloat(fuelMoney), comment: fuelComment };
      } else if (type === "insurance") {
        if (!insuranceDate || !insuranceFrom || !insuranceTo) throw new Error("Please specify dates");
        payload = {
          car_id: carId,
          insurance_date: insuranceDate,
          insurance_from: insuranceFrom,
          insurance_to: insuranceTo,
          comment: insuranceComment,
          insurance_cost: insuranceCost ? parseFloat(insuranceCost) : 0
        };
      } else if (type === "misc") {
        if (!miscAmount) throw new Error("Please specify charges amount");
        payload = { car_id: carId, amount: parseFloat(miscAmount), comment: miscComment };
      } else if (type === "driver") {
        if (!assignDriverId) throw new Error("Please choose a driver");
        payload = { car_id: carId, driver_id: parseInt(assignDriverId) };
      }

      if (isAdmin) {
        // Admin executes directly
        let table = "";
        let insertData = { ...payload };

        if (type === "service") {
          table = "car_service_history";
          delete insertData.service_cost;
        } else if (type === "insurance") {
          table = "car_insurance_history";
          delete insertData.insurance_cost;
        } else if (type === "km") { table = "car_km_history"; }
        else if (type === "fuel") { table = "car_fuel_history"; }
        else if (type === "misc") { table = "car_misc_history"; }
        else if (type === "driver") { table = "car_driver_history"; }

        const { error } = await supabase.from(table).insert([insertData]);
        if (error) throw error;

        // Auto raise expense ticket
        const carReg = car.registration_name;
        if (type === "fuel") {
          await supabase.from("expense_reports").insert([{
            amount: parseFloat(payload.money),
            category: "Fuel",
            comment: `[${carReg}] Fuel Fill: ${payload.liters}L - ${payload.comment || 'No remarks'}`,
            status: "pending",
            requested_by: "admin"
          }]);
        } else if (type === "misc") {
          await supabase.from("expense_reports").insert([{
            amount: parseFloat(payload.amount),
            category: "Misc",
            comment: `[${carReg}] Misc Charge: ${payload.comment}`,
            status: "pending",
            requested_by: "admin"
          }]);
        } else if (type === "service" && payload.service_cost > 0) {
          await supabase.from("expense_reports").insert([{
            amount: payload.service_cost,
            category: "Maintenance",
            comment: `[${carReg}] Servicing Cost: ${payload.comment}`,
            status: "pending",
            requested_by: "admin"
          }]);
        } else if (type === "insurance" && payload.insurance_cost > 0) {
          await supabase.from("expense_reports").insert([{
            amount: payload.insurance_cost,
            category: "Insurance",
            comment: `[${carReg}] Insurance Policy: ${payload.comment || 'Renewed'}`,
            status: "pending",
            requested_by: "admin"
          }]);
        }

        alert("Record logged successfully and expense report ticket created.");
      } else {
        const { error } = await supabase.from("fleet_requests").insert([{
          request_type: `log_${type}`,
          payload,
          requested_by: "staff",
          status: "pending"
        }]);
        if (error) throw error;
        alert("Log and expense request submitted to Admin for approval.");
      }

      // Reset forms
      setKmVal(""); setKmComment("");
      setServiceDate(""); setServiceComment(""); setServiceCost("");
      setFuelLiters(""); setFuelMoney(""); setFuelComment("");
      setInsuranceDate(""); setInsuranceFrom(""); setInsuranceTo(""); setInsuranceComment(""); setInsuranceCost("");
      setMiscAmount(""); setMiscComment("");
      setAssignDriverId("");
      setShowLogForm(null);

      await fetchCarDetails();
    } catch (err) {
      alert(err.message || "Failed to log event");
    }
    setSubmitting(false);
  };

  if (loading && !car) {
    return <div className="page-content">Loading vehicle profiles...</div>;
  }

  if (!car) {
    return <div className="page-content">Vehicle profile not found. <Link href={`/${role}/cars`}>Back to Registry</Link></div>;
  }

  return (
    <div className="page-content" style={{ maxWidth: 960, paddingBottom: "3rem" }}>
      {/* Breadcrumb */}
      <div style={{ padding: "1.5rem 0 1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.5rem" }}>
          <Link href={`/${role}`} style={{ color: "#6b7280" }}>Home</Link> / 
          <Link href={`/${role}/cars`} style={{ color: "#6b7280" }}>Cars</Link> /
          <span>Profile</span>
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "#111827" }}>
              {car.name}
            </h1>
            <span style={{
              fontSize: "0.75rem",
              color: "#1e40af",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "4px",
              padding: "0.125rem 0.5rem",
              display: "inline-block",
              fontWeight: 700,
              marginTop: "0.25rem"
            }}>
              {car.registration_name}
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href={`/${role}/cars/${car.id}/expenses`} className="btn btn-primary" style={{ fontSize: "0.8rem", background: "#1f2937", border: "1px solid #1f2937" }}>
              💳 Expense Ledger
            </Link>
            <Link href={`/${role}/cars`} className="btn btn-secondary" style={{ fontSize: "0.8rem" }}>
              ➔ Fleet Registry
            </Link>
          </div>
        </div>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {/* Monthly Expense Top Banner */}
      <div className="card" style={{
        padding: "1rem 1.25rem",
        background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
        border: "1px solid #fde68a",
        borderRadius: "8px",
        marginBottom: "1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "#92400e", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>Current Month Fleet Costs ({new Date().toLocaleString('default', { month: 'long' })})</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#78350f", marginTop: "0.15rem" }}>₹{currentMonthExpensesTotal.toLocaleString()}</div>
        </div>
        <Link href={`/${role}/cars/${car.id}/expenses`}>
          <button className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem", background: "#ffffff", border: "1px solid #fde68a", color: "#78350f" }}>
            View Cost History ➔
          </button>
        </Link>
      </div>

      {/* Pending requests warning indicator for Staff */}
      {pendingRequests.length > 0 && (
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
            ⚠️ {pendingRequests.length} Pending Approval Request(s) for this vehicle:
          </div>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.8rem", color: "#b45309" }}>
            {pendingRequests.map(req => (
              <li key={req.id}>
                <strong>{req.request_type.replace("log_", "").toUpperCase()} log</strong> requested on {new Date(req.created_at).toLocaleDateString()} (Awaiting Admin review)
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Profile Overview Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem"
      }}>
        {car.currentDriverId ? (
          <Link href={`/${role}/drivers?expand=${car.currentDriverId}`} style={{ textDecoration: "none" }}>
            <div className="card action-card" style={{ padding: "1rem 1.25rem", border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}>
              <div style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Current Driver ➔</div>
              <div style={{ fontSize: "1.1rem", color: "#1e40af", fontWeight: 700, marginTop: "0.25rem", textDecoration: "underline" }}>{car.currentDriver}</div>
              {car.currentDriverPhone && <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.1rem" }}>📞 {car.currentDriverPhone}</div>}
            </div>
          </Link>
        ) : (
          <div className="card" style={{ padding: "1rem 1.25rem", border: "1px solid #e5e7eb", background: "#f9fafb" }}>
            <div style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Current Driver</div>
            <div style={{ fontSize: "1.1rem", color: "#111827", fontWeight: 700, marginTop: "0.25rem" }}>{car.currentDriver}</div>
            {car.currentDriverPhone && <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.1rem" }}>📞 {car.currentDriverPhone}</div>}
          </div>
        )}

        <div className="card" style={{ padding: "1rem 1.25rem", border: "1px solid #e5e7eb", background: "#f9fafb" }}>
          <div style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Odometer Clocked</div>
          <div style={{ fontSize: "1.1rem", color: "#111827", fontWeight: 700, marginTop: "0.25rem" }}>{parseFloat(car.currentKm).toLocaleString()} km</div>
        </div>

        <div className="card" style={{ padding: "1rem 1.25rem", border: "1px solid #e5e7eb", background: "#f9fafb" }}>
          <div style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Last Serviced</div>
          <div style={{ fontSize: "1.1rem", color: "#111827", fontWeight: 700, marginTop: "0.25rem" }}>
            {car.lastService !== "Never" ? new Date(car.lastService).toLocaleDateString() : "Never"}
          </div>
        </div>

        <div className="card" style={{ padding: "1rem 1.25rem", border: "1px solid #e5e7eb", background: "#f9fafb" }}>
          <div style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Insurance Coverage</div>
          <div style={{ fontSize: "0.85rem", color: "#111827", fontWeight: 700, marginTop: "0.25rem" }}>{car.insuranceStatus}</div>
        </div>
      </div>

      {/* Action panel */}
      <div className="card" style={{ padding: "1.25rem", marginBottom: "2rem", background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <h2 style={{ fontSize: "0.95rem", fontWeight: 700, textTransform: "uppercase", color: "#374151", margin: "0 0 1rem", letterSpacing: "0.02em" }}>
          {isAdmin ? "Log Vehicle Activity Directly" : "Request Vehicle Activity Log"}
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <button onClick={() => setShowLogForm(showLogForm === "km" ? null : "km")} className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "0.5rem 0.85rem" }}>⏱ Log Odometer</button>
          <button onClick={() => setShowLogForm(showLogForm === "service" ? null : "service")} className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "0.5rem 0.85rem" }}>🛠 Log Service</button>
          <button onClick={() => setShowLogForm(showLogForm === "fuel" ? null : "fuel")} className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "0.5rem 0.85rem" }}>⛽ Log Fuel Fill</button>
          <button onClick={() => setShowLogForm(showLogForm === "insurance" ? null : "insurance")} className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "0.5rem 0.85rem" }}>🛡 Log Insurance</button>
          <button onClick={() => setShowLogForm(showLogForm === "misc" ? null : "misc")} className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "0.5rem 0.85rem" }}>⚙ Log Misc Cost</button>
          <button onClick={() => setShowLogForm(showLogForm === "driver" ? null : "driver")} className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.5rem 0.85rem" }}>👤 Assign Driver</button>
        </div>

        {/* Form panel */}
        {showLogForm && (
          <div style={{ marginTop: "1.25rem", padding: "1.25rem", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "1rem", color: "#111827" }}>
              {showLogForm === "km" && (isAdmin ? "Record Odometer Reading" : "Request Odometer Record")}
              {showLogForm === "service" && (isAdmin ? "Record Vehicle Servicing" : "Request Service Record")}
              {showLogForm === "fuel" && (isAdmin ? "Record Fuel Fill Up" : "Request Fuel Record")}
              {showLogForm === "insurance" && (isAdmin ? "Record Insurance Policy Update" : "Request Insurance Update")}
              {showLogForm === "misc" && (isAdmin ? "Record Miscellaneous Fleet Cost" : "Request Misc Cost Record")}
              {showLogForm === "driver" && (isAdmin ? "Assign Driver to Vehicle" : "Request Driver Assignment")}
            </h3>

            <form onSubmit={(e) => handleLogSubmit(e, showLogForm)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {showLogForm === "km" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Kilometer Clocked</label>
                    <input type="number" className="form-input" placeholder="Odometer value" value={kmVal} onChange={(e) => setKmVal(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Optional Comment</label>
                    <input type="text" className="form-input" placeholder="Details/Reason" value={kmComment} onChange={(e) => setKmComment(e.target.value)} />
                  </div>
                </div>
              )}

              {showLogForm === "service" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Date of Service</label>
                    <input type="date" className="form-input" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cost of Service (₹)</label>
                    <input type="number" className="form-input" placeholder="Optional service cost" value={serviceCost} onChange={(e) => setServiceCost(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Details / Comment</label>
                    <input type="text" className="form-input" placeholder="Servicing details..." value={serviceComment} onChange={(e) => setServiceComment(e.target.value)} required />
                  </div>
                </div>
              )}

              {showLogForm === "fuel" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Fuel Liter Quantity</label>
                    <input type="number" step="0.01" className="form-input" placeholder="Liters" value={fuelLiters} onChange={(e) => setFuelLiters(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount Charged (Money)</label>
                    <input type="number" step="0.01" className="form-input" placeholder="Cost in ₹" value={fuelMoney} onChange={(e) => setFuelMoney(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Optional Comment</label>
                    <input type="text" className="form-input" placeholder="Remarks" value={fuelComment} onChange={(e) => setFuelComment(e.target.value)} />
                  </div>
                </div>
              )}

              {showLogForm === "insurance" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Date Insured</label>
                    <input type="date" className="form-input" value={insuranceDate} onChange={(e) => setInsuranceDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valid From</label>
                    <input type="date" className="form-input" value={insuranceFrom} onChange={(e) => setInsuranceFrom(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valid Till / To</label>
                    <input type="date" className="form-input" value={insuranceTo} onChange={(e) => setInsuranceTo(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Policy Cost (₹)</label>
                    <input type="number" className="form-input" placeholder="Policy amount" value={insuranceCost} onChange={(e) => setInsuranceCost(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label className="form-label">Provider / Policy Info</label>
                    <input type="text" className="form-input" placeholder="Policy details" value={insuranceComment} onChange={(e) => setInsuranceComment(e.target.value)} />
                  </div>
                </div>
              )}

              {showLogForm === "misc" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Amount (₹)</label>
                    <input type="number" className="form-input" placeholder="Cost" value={miscAmount} onChange={(e) => setMiscAmount(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description / Remarks</label>
                    <input type="text" className="form-input" placeholder="Reason/remarks" value={miscComment} onChange={(e) => setMiscComment(e.target.value)} required />
                  </div>
                </div>
              )}

              {showLogForm === "driver" && (
                <div className="form-group">
                  <label className="form-label">Select Driver</label>
                  <select className="form-input" value={assignDriverId} onChange={(e) => setAssignDriverId(e.target.value)} required>
                    <option value="">-- Select driver --</option>
                    {drivers.map(drv => (
                      <option key={drv.id} value={drv.id}>{drv.name} ({drv.phone})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button type="button" onClick={() => setShowLogForm(null)} className="btn btn-secondary" style={{ fontSize: "0.8rem" }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ fontSize: "0.8rem" }}>
                  {submitting ? "Submitting..." : isAdmin ? "Save Record" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* History timelines tabbed navigation */}
      <div>
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: "1rem", overflowX: "auto" }}>
          <button onClick={() => setActiveTab("km")} style={{ background: "none", border: "none", borderBottom: activeTab === "km" ? "3px solid #111827" : "none", color: activeTab === "km" ? "#111827" : "#6b7280", fontWeight: activeTab === "km" ? 700 : 500, padding: "0.75rem 1rem", cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap" }}>⏱ Odometer History</button>
          <button onClick={() => setActiveTab("service")} style={{ background: "none", border: "none", borderBottom: activeTab === "service" ? "3px solid #111827" : "none", color: activeTab === "service" ? "#111827" : "#6b7280", fontWeight: activeTab === "service" ? 700 : 500, padding: "0.75rem 1rem", cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap" }}>🛠 Service History</button>
          <button onClick={() => setActiveTab("fuel")} style={{ background: "none", border: "none", borderBottom: activeTab === "fuel" ? "3px solid #111827" : "none", color: activeTab === "fuel" ? "#111827" : "#6b7280", fontWeight: activeTab === "fuel" ? 700 : 500, padding: "0.75rem 1rem", cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap" }}>⛽ Fuel History</button>
          <button onClick={() => setActiveTab("insurance")} style={{ background: "none", border: "none", borderBottom: activeTab === "insurance" ? "3px solid #111827" : "none", color: activeTab === "insurance" ? "#111827" : "#6b7280", fontWeight: activeTab === "insurance" ? 700 : 500, padding: "0.75rem 1rem", cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap" }}>🛡 Insurance History</button>
          <button onClick={() => setActiveTab("misc")} style={{ background: "none", border: "none", borderBottom: activeTab === "misc" ? "3px solid #111827" : "none", color: activeTab === "misc" ? "#111827" : "#6b7280", fontWeight: activeTab === "misc" ? 700 : 500, padding: "0.75rem 1rem", cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap" }}>⚙ Miscellaneous Costs</button>
          <button onClick={() => setActiveTab("drivers")} style={{ background: "none", border: "none", borderBottom: activeTab === "drivers" ? "3px solid #111827" : "none", color: activeTab === "drivers" ? "#111827" : "#6b7280", fontWeight: activeTab === "drivers" ? 700 : 500, padding: "0.75rem 1rem", cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap" }}>👤 Driver Assignments</button>
        </div>

        {/* Timelines content */}
        <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb" }}>
          {activeTab === "km" && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Odometer logs</h3>
              {kmLogs.length === 0 ? <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>No odometer records found.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {kmLogs.map(log => (
                    <div key={log.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{parseFloat(log.km_clocked).toLocaleString()} km</div>
                        <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{log.comment || "No comment"}</div>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "service" && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Service logs</h3>
              {serviceLogs.length === 0 ? <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>No service records found.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {serviceLogs.map(log => (
                    <div key={log.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Serviced on {new Date(log.service_date).toLocaleDateString()}</div>
                        <div style={{ fontSize: "0.8rem", color: "#374151" }}>{log.comment}</div>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "fuel" && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Fuel history</h3>
              {fuelLogs.length === 0 ? <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>No fuel records found.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {fuelLogs.map(log => (
                    <div key={log.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>₹{parseFloat(log.money).toLocaleString()} for {log.liters} Liters</div>
                        <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{log.comment || "No remarks"}</div>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "insurance" && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Insurance logs</h3>
              {insuranceLogs.length === 0 ? <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>No insurance policy history found.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {insuranceLogs.map(log => (
                    <div key={log.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Policy: {new Date(log.insurance_from).toLocaleDateString()} to {new Date(log.insurance_to).toLocaleDateString()}</div>
                        <div style={{ fontSize: "0.8rem", color: "#374151" }}>Provider: {log.comment || "None"}</div>
                        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Insured Date: {new Date(log.insurance_date).toLocaleDateString()}</div>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "misc" && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Miscellaneous costs log</h3>
              {miscLogs.length === 0 ? <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>No miscellaneous costs recorded.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {miscLogs.map(log => (
                    <div key={log.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#9f1239" }}>₹{parseFloat(log.amount).toLocaleString()}</div>
                        <div style={{ fontSize: "0.8rem", color: "#374151" }}>{log.comment}</div>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "drivers" && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Driver assignment history</h3>
              {driverLogs.length === 0 ? <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>No driver assignments found.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {driverLogs.map(log => (
                    <div key={log.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>👤 {log.drivers?.name || "Unknown Driver"}</div>
                        <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>📞 {log.drivers?.phone}</div>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                        Assigned: {new Date(log.assigned_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
