"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function CarServicePage() {
  const { role, id } = useParams();
  const carId = parseInt(id);
  const router = useRouter();
  const isAdmin = role === "admin";

  const [car, setCar] = useState(null);
  const [serviceLogs, setServiceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [serviceDate, setServiceDate] = useState("");
  const [serviceComment, setServiceComment] = useState("");
  const [serviceCost, setServiceCost] = useState("");

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

      const { data: services, error: servicesErr } = await supabase
        .from("car_service_history")
        .select("*")
        .eq("car_id", carId)
        .order("service_date", { ascending: false });
      if (servicesErr) throw servicesErr;
      setServiceLogs(services || []);

    } catch (err) {
      console.error(err);
      alert("Failed to load service logs.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serviceDate) {
      alert("Please specify service date.");
      return;
    }
    setSubmitting(true);

    const cost = serviceCost ? parseFloat(serviceCost) : 0;
    const payload = {
      car_id: carId,
      service_date: serviceDate,
      comment: serviceComment.trim(),
      service_cost: cost
    };

    try {
      if (isAdmin) {
        // Admin inserts to car_service_history directly, and generates expense ticket
        const insertData = { ...payload };
        delete insertData.service_cost; // remove cost from history table schema if it's stored in expense

        const { error } = await supabase.from("car_service_history").insert([insertData]);
        if (error) throw error;

        // Auto raise expense ticket
        await supabase.from("expense_reports").insert([{
          amount: cost,
          category: "Vehicle Maintenance",
          comment: `[${car.registration_name}] Service Maintenance: ${payload.comment || "Repair/Service"}`,
          status: "pending",
          requested_by: "admin"
        }]);

        alert("Service log recorded successfully and expense ticket created.");
      } else {
        const { error } = await supabase.from("fleet_requests").insert([{
          request_type: "log_service",
          payload,
          requested_by: "staff",
          status: "pending"
        }]);
        if (error) throw error;
        alert("Service log request submitted to Admin for approval.");
      }
      router.push(`/${role}/cars/${carId}`);
    } catch (err) {
      alert(err.message || "Failed to log service details");
    }
    setSubmitting(false);
  };

  if (loading && !car) {
    return <div className="page-content">Loading service logs...</div>;
  }

  return (
    <div className="page-content" style={{ maxWidth: 800, paddingBottom: "3rem" }}>
      <div style={{ paddingTop: "1rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <Link href={`/${role}/cars/${carId}`} style={{ textDecoration: "none", color: "#111827", fontWeight: 600, fontSize: "0.9rem" }}>
            ← Back to Profile
          </Link>
        </div>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "#111827" }}>
            {car?.name} ({car?.registration_name})
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
            {isAdmin ? "Log Service Directly" : "Request Service Log"}
          </p>
        </div>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {/* Log Form */}
      <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "#111827" }}>New Service Maintenance</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Service Date *</label>
            <input type="date" className="form-input" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Total Cost (₹)</label>
            <input type="number" className="form-input" placeholder="e.g. 8500" value={serviceCost} onChange={(e) => setServiceCost(e.target.value)} />
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Remarks / Service details</label>
            <input type="text" className="form-input" placeholder="e.g. Engine oil change, brake pads replacement" value={serviceComment} onChange={(e) => setServiceComment(e.target.value)} />
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
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "#111827" }}>Service Maintenance History</h2>
        {serviceLogs.length === 0 ? (
          <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>No service logs recorded.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {serviceLogs.map((log) => (
              <div key={log.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.6rem" }}>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
                    Service on {new Date(log.service_date).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.15rem" }}>
                    {log.comment || "No comments"}
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
