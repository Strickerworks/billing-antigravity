"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function CarInsurancePage() {
  const { role, id } = useParams();
  const carId = parseInt(id);
  const router = useRouter();
  const isAdmin = role === "admin";

  const [car, setCar] = useState(null);
  const [insuranceLogs, setInsuranceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [insuranceDate, setInsuranceDate] = useState("");
  const [insuranceFrom, setInsuranceFrom] = useState("");
  const [insuranceTo, setInsuranceTo] = useState("");
  const [insuranceComment, setInsuranceComment] = useState("");
  const [insuranceCost, setInsuranceCost] = useState("");

  useEffect(() => {
    if (carId) {
      fetchCarDetailsAndLogs();
    }
  }, [carId]);

  const fetchCarDetailsAndLogs = async () => {
    setLoading(true);
    try {
      const { data: carData, error: carErr } = await supabase
        .from("cars")
        .select("*")
        .eq("id", carId)
        .single();
      if (carErr) throw carErr;
      setCar(carData);

      const { data: insurances, error: insurancesErr } = await supabase
        .from("car_insurance_history")
        .select("*")
        .eq("car_id", carId)
        .order("insurance_date", { ascending: false });
      if (insurancesErr) throw insurancesErr;
      setInsuranceLogs(insurances || []);

    } catch (err) {
      console.error(err);
      alert("Failed to load insurance details.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!insuranceDate || !insuranceFrom || !insuranceTo) {
      alert("Please specify dates.");
      return;
    }
    setSubmitting(true);

    const cost = insuranceCost ? parseFloat(insuranceCost) : 0;
    const payload = {
      car_id: carId,
      insurance_date: insuranceDate,
      insurance_from: insuranceFrom,
      insurance_to: insuranceTo,
      comment: insuranceComment.trim(),
      insurance_cost: cost
    };

    try {
      if (isAdmin) {
        // Admin inserts to car_insurance_history directly and creates expense
        const insertData = { ...payload };
        delete insertData.insurance_cost;

        const { error } = await supabase.from("car_insurance_history").insert([insertData]);
        if (error) throw error;

        // Auto raise expense ticket
        await supabase.from("expense_reports").insert([{
          amount: cost,
          category: "Vehicle Insurance",
          comment: `[${car.registration_name}] Insurance Renewal: ${payload.comment || "Policy"}`,
          status: "pending",
          requested_by: "admin"
        }]);

        alert("Insurance renewal logged successfully and expense ticket created.");
      } else {
        const { error } = await supabase.from("fleet_requests").insert([{
          request_type: "log_insurance",
          payload,
          requested_by: "staff",
          status: "pending"
        }]);
        if (error) throw error;
        alert("Insurance log request submitted to Admin for approval.");
      }
      router.push(`/${role}/cars/${carId}`);
    } catch (err) {
      alert(err.message || "Failed to log insurance");
    }
    setSubmitting(false);
  };

  if (loading && !car) {
    return <div className="page-content">Loading insurance details...</div>;
  }

  return (
    <div className="page-content" style={{ maxWidth: 800, paddingBottom: "3rem" }}>
      <div style={{ padding: "1.5rem 0 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "#111827" }}>
            {car?.name} ({car?.registration_name})
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
            {isAdmin ? "Log Insurance Renewal Directly" : "Request Insurance Renewal Log"}
          </p>
        </div>
        <Link href={`/${role}/cars/${carId}`} className="btn btn-secondary" style={{ fontSize: "0.8rem", background: "#111827", color: "#ffffff", borderColor: "#111827" }}>
          ← Back to Profile
        </Link>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {/* Log Form */}
      <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "#111827" }}>New Insurance Renewal</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Payment/Log Date *</label>
            <input type="date" className="form-input" value={insuranceDate} onChange={(e) => setInsuranceDate(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Total Premium Cost (₹)</label>
            <input type="number" className="form-input" placeholder="e.g. 24000" value={insuranceCost} onChange={(e) => setInsuranceCost(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Coverage Valid From *</label>
            <input type="date" className="form-input" value={insuranceFrom} onChange={(e) => setInsuranceFrom(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Coverage Valid To *</label>
            <input type="date" className="form-input" value={insuranceTo} onChange={(e) => setInsuranceTo(e.target.value)} required />
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Policy Details / Remarks</label>
            <input type="text" className="form-input" placeholder="Policy Company, policy number, etc." value={insuranceComment} onChange={(e) => setInsuranceComment(e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ fontSize: "0.85rem", padding: "0.6rem 2rem", background: "#111827", color: "#ffffff", borderColor: "#111827" }}
            >
              {submitting ? "Processing..." : isAdmin ? "Save Record" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>

      {/* History Ledger */}
      <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "#111827" }}>Insurance Policies History</h2>
        {insuranceLogs.length === 0 ? (
          <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>No insurance records logged.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {insuranceLogs.map((log) => (
              <div key={log.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.6rem" }}>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
                    Policy Renewal Date: {new Date(log.insurance_date).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#4b5563", marginTop: "0.15rem" }}>
                    Coverage Period: {new Date(log.insurance_from).toLocaleDateString()} to {new Date(log.insurance_to).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.1rem" }}>
                    {log.comment || "No policy number provided"}
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
