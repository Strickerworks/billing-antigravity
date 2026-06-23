"use client";
import React, { useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function AddDriverPage() {
  const { role } = useParams();
  const router = useRouter();
  const isAdmin = role === "admin";

  const [submitting, setSubmitting] = useState(false);

  // Detailed Form Fields (Registration)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [address, setAddress] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");
  const [salary, setSalary] = useState("0");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert("Please fill name and phone.");
      return;
    }

    setSubmitting(true);
    const driverPayload = {
      name: name.trim(),
      phone: phone.trim(),
      dob: dob || null,
      aadhar_number: aadharNumber.trim() || null,
      address: address.trim() || null,
      license_number: licenseNumber.trim() || null,
      date_of_joining: dateOfJoining || null,
      salary: parseFloat(salary) || 0
    };

    try {
      if (isAdmin) {
        const { error } = await supabase.from("drivers").insert([driverPayload]);
        if (error) {
          alert("Failed to add driver: " + error.message);
        } else {
          alert("Driver added successfully.");
          router.push(`/${role}/drivers`);
        }
      } else {
        const { error } = await supabase.from("fleet_requests").insert([{
          request_type: "add_driver",
          payload: driverPayload,
          requested_by: "staff",
          status: "pending"
        }]);
        if (error) {
          alert("Failed to submit request: " + error.message);
        } else {
          alert("Driver registration request submitted to Admin for approval.");
          router.push(`/${role}/drivers`);
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
      {/* Breadcrumb & Header */}
      <div style={{ padding: "1.5rem 0 1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.5rem" }}>
          <Link href={`/${role}`} style={{ color: "#6b7280" }}>Home</Link> / 
          <Link href={`/${role}/drivers`} style={{ color: "#6b7280" }}>Drivers</Link> /
          <span>Add</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#1a1d23" }}>
              {isAdmin ? "Register New Driver" : "Request Driver Registration"}
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
              Provide driver details to add them to the active fleet.
            </p>
          </div>
          <Link href={`/${role}/drivers`} className="btn btn-secondary" style={{ fontSize: "0.8rem" }}>
            ← Back to Registry
          </Link>
        </div>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {/* Driver Registration Form */}
      <div className="card" style={{ padding: "2rem", background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Full Name *</label>
            <input type="text" className="form-input" placeholder="Driver Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Phone Number *</label>
            <input type="text" className="form-input" placeholder="Phone contact" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Date of Birth</label>
            <input type="date" className="form-input" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Aadhar Card Number</label>
            <input type="text" className="form-input" placeholder="Aadhar number" value={aadharNumber} onChange={(e) => setAadharNumber(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>License Number</label>
            <input type="text" className="form-input" placeholder="DL registration number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Date of Joining</label>
            <input type="date" className="form-input" value={dateOfJoining} onChange={(e) => setDateOfJoining(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Monthly Base Salary (₹)</label>
            <input type="number" className="form-input" placeholder="e.g. 25000" value={salary} onChange={(e) => setSalary(e.target.value)} />
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Home Address</label>
            <textarea className="form-input" rows="3" placeholder="Residential permanent address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
            <Link href={`/${role}/drivers`} className="btn btn-secondary" style={{ padding: "0.625rem 1.5rem" }}>
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ padding: "0.625rem 2rem", fontSize: "0.875rem", fontWeight: 600 }}
            >
              {submitting ? "Processing..." : isAdmin ? "Add Driver Profile" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
