"use client";
import React, { useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function AddCarPage() {
  const { role } = useParams();
  const router = useRouter();
  const isAdmin = role === "admin";

  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [registrationName, setRegistrationName] = useState("");

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

    try {
      if (isAdmin) {
        const { error } = await supabase.from("cars").insert([carPayload]);
        if (error) {
          alert("Failed to register car: " + error.message);
        } else {
          alert("Vehicle registered successfully.");
          router.push(`/${role}/cars`);
        }
      } else {
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
          router.push(`/${role}/cars`);
        }
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving.");
    }
    setSubmitting(false);
  };

  return (
    <div className="page-content" style={{ maxWidth: 800, paddingBottom: "3rem" }}>
      <div style={{ paddingTop: "1rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <Link href={`/${role}/cars`} style={{ textDecoration: "none", color: "#111827", fontWeight: 600, fontSize: "0.9rem" }}>
            ← Back to Fleet Registry
          </Link>
        </div>

        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#1a1d23" }}>
            {isAdmin ? "Register New Vehicle" : "Request Vehicle Registration"}
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
            Provide registration details to add a new car to the fleet.
          </p>
        </div>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      <div className="card" style={{ padding: "2rem", background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Car Model / Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Tata Prima 4925"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Registration Number *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. KA-01-AB-1234"
              value={registrationName}
              onChange={(e) => setRegistrationName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
            <Link href={`/${role}/cars`} className="btn btn-secondary" style={{ padding: "0.625rem 1.5rem" }}>
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ padding: "0.625rem 2rem", fontSize: "0.875rem", fontWeight: 600 }}
            >
              {submitting ? "Processing..." : isAdmin ? "Register Vehicle" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
