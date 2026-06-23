"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function EditDriverPage() {
  const { role, id } = useParams();
  const driverId = parseInt(id);
  const router = useRouter();
  const isAdmin = role === "admin";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [address, setAddress] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");
  const [salary, setSalary] = useState("0");

  useEffect(() => {
    if (driverId) {
      fetchDriverDetails();
    }
  }, [driverId]);

  const fetchDriverDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", driverId)
        .single();

      if (error) throw error;
      if (data) {
        setName(data.name || "");
        setPhone(data.phone || "");
        setDob(data.dob || "");
        setAadharNumber(data.aadhar_number || "");
        setAddress(data.address || "");
        setLicenseNumber(data.license_number || "");
        setDateOfJoining(data.date_of_joining || "");
        setSalary(data.salary?.toString() || "0");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load driver details.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert("Name and phone are required.");
      return;
    }
    setSubmitting(true);
    const payload = {
      driver_id: driverId,
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
        const { error } = await supabase
          .from("drivers")
          .update({
            name: payload.name,
            phone: payload.phone,
            dob: payload.dob,
            aadhar_number: payload.aadhar_number,
            address: payload.address,
            license_number: payload.license_number,
            date_of_joining: payload.date_of_joining,
            salary: payload.salary
          })
          .eq("id", driverId);

        if (error) throw error;
        alert("Driver profile updated successfully.");
        router.push(`/${role}/drivers/${driverId}`);
      } else {
        const { error } = await supabase.from("fleet_requests").insert([{
          request_type: "edit_driver",
          payload,
          requested_by: "staff",
          status: "pending"
        }]);
        if (error) throw error;
        alert("Driver update request submitted to Admin for approval.");
        router.push(`/${role}/drivers/${driverId}`);
      }
    } catch (err) {
      alert(err.message || "Failed to update driver");
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="page-content">Loading profile details...</div>;
  }

  return (
    <div className="page-content" style={{ maxWidth: 800, paddingBottom: "3rem" }}>
      {/* Breadcrumb & Header */}
      <div style={{ padding: "1.5rem 0 1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.5rem" }}>
          <Link href={`/${role}`} style={{ color: "#6b7280" }}>Home</Link> / 
          <Link href={`/${role}/drivers`} style={{ color: "#6b7280" }}>Drivers</Link> /
          <Link href={`/${role}/drivers/${driverId}`} style={{ color: "#6b7280" }}>Profile</Link> /
          <span>Edit</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#1a1d23" }}>
              {isAdmin ? "Modify Driver Profile" : "Request Driver Modification"}
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
              Updating details for driver #{driverId}
            </p>
          </div>
          <Link href={`/${role}/drivers/${driverId}`} className="btn btn-secondary" style={{ fontSize: "0.8rem" }}>
            ← Back to Profile
          </Link>
        </div>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      <div className="card" style={{ padding: "2rem", background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Full Name *</label>
            <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Phone Number *</label>
            <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Date of Birth</label>
            <input type="date" className="form-input" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Aadhar Card</label>
            <input type="text" className="form-input" value={aadharNumber} onChange={(e) => setAadharNumber(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>License Number</label>
            <input type="text" className="form-input" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Date of Joining</label>
            <input type="date" className="form-input" value={dateOfJoining} onChange={(e) => setDateOfJoining(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Base Salary (₹)</label>
            <input type="number" className="form-input" value={salary} onChange={(e) => setSalary(e.target.value)} />
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Home Address</label>
            <textarea className="form-input" rows="3" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
            <Link href={`/${role}/drivers/${driverId}`} className="btn btn-secondary" style={{ padding: "0.625rem 1.5rem" }}>
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ padding: "0.625rem 2rem", fontSize: "0.875rem", fontWeight: 600 }}
            >
              {submitting ? "Processing..." : isAdmin ? "Save Changes" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
