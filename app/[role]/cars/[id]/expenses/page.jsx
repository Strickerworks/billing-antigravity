"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function CarExpensesPage() {
  const { role, id } = useParams();
  const carId = parseInt(id);
  const router = useRouter();

  const [car, setCar] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    if (carId) {
      loadCarAndExpenses();
    }
  }, [carId]);

  const loadCarAndExpenses = async () => {
    setLoading(true);
    try {
      // 1. Get Car details
      const { data: carData, error: carErr } = await supabase
        .from("cars")
        .select("*")
        .eq("id", carId)
        .single();

      if (carErr) throw carErr;
      setCar(carData);

      // 2. Fetch all expenses containing [registration_name] in comments
      const { data: expList, error: expErr } = await supabase
        .from("expense_reports")
        .select("*")
        .ilike("comment", `%[${carData.registration_name}]%`)
        .order("created_at", { ascending: false });

      if (expErr) throw expErr;

      setExpenses(expList || []);

      // Calculate total approved cost
      const approvedOnly = (expList || []).filter(e => e.status === "approved");
      const sum = approvedOnly.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);
      setTotalCost(sum);

    } catch (err) {
      console.error("Error loading vehicle expenses:", err);
      alert("Failed to load vehicle expense history.");
    }
    setLoading(false);
  };

  if (loading && !car) {
    return <div className="page-content">Loading vehicle expense logs...</div>;
  }

  if (!car) {
    return <div className="page-content">Vehicle not found. <Link href={`/${role}/cars`}>Back to Registry</Link></div>;
  }

  return (
    <div className="page-content" style={{ maxWidth: 900, paddingBottom: "3rem" }}>
      {/* Breadcrumbs */}
      <div style={{ padding: "1.5rem 0 1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
          <Link href={`/${role}`} style={{ color: "var(--text-secondary)" }}>Home</Link> / 
          <Link href={`/${role}/cars`} style={{ color: "var(--text-secondary)" }}>Cars</Link> /
          <Link href={`/${role}/cars/${car.id}`} style={{ color: "var(--text-secondary)" }}>{car.name}</Link> /
          <span>Expenses</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 850, margin: 0, color: "var(--text-primary)" }}>
              Expense History: {car.name}
            </h1>
            <span style={{
              fontSize: "0.75rem",
              color: "var(--badge-blue-text)",
              background: "var(--badge-blue-bg)",
              border: "1px solid var(--badge-blue-border)",
              borderRadius: "4px",
              padding: "0.125rem 0.5rem",
              display: "inline-block",
              fontWeight: 700,
              marginTop: "0.25rem"
            }}>
              {car.registration_name}
            </span>
          </div>
          <Link href={`/${role}/cars/${car.id}`} className="btn btn-secondary" style={{ fontSize: "0.8rem" }}>
            ➔ Back to Profile
          </Link>
        </div>
      </div>

      <hr className="divider" style={{ margin: "0.5rem 0 1.5rem" }} />

      {/* Summary card */}
      <div className="card" style={{
        padding: "1.5rem",
        background: "linear-gradient(135deg, #1f2937 0%, var(--text-primary) 100%)",
        color: "var(--bg-card)",
        border: "none",
        borderRadius: "10px",
        marginBottom: "2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Total Approved Fleet Cost</span>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.25rem 0 0" }}>₹{totalCost.toLocaleString()}</h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Total Tickets Raised</span>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.25rem 0 0" }}>{expenses.length}</h2>
        </div>
      </div>

      {/* Detailed Expense Table */}
      <div className="card" style={{ padding: "1.5rem", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)" }}>Expense Tickets breakdown</h3>

        {expenses.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textAlign: "center", padding: "2rem 0" }}>No expense tickets raised for this vehicle yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--bg-elevated)" }}>
                  <th style={{ padding: "0.75rem 0.5rem", color: "#4b5563", fontWeight: 700 }}>Date</th>
                  <th style={{ padding: "0.75rem 0.5rem", color: "#4b5563", fontWeight: 700 }}>Category</th>
                  <th style={{ padding: "0.75rem 0.5rem", color: "#4b5563", fontWeight: 700 }}>Description</th>
                  <th style={{ padding: "0.75rem 0.5rem", color: "#4b5563", fontWeight: 700 }}>Requested By</th>
                  <th style={{ padding: "0.75rem 0.5rem", color: "#4b5563", fontWeight: 700, textAlign: "right" }}>Amount</th>
                  <th style={{ padding: "0.75rem 0.5rem", color: "#4b5563", fontWeight: 700, textAlign: "right" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id} style={{ borderBottom: "1px solid var(--bg-elevated)", transition: "background 0.15s" }}>
                    <td style={{ padding: "0.85rem 0.5rem", color: "var(--text-primary)" }}>{new Date(exp.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: "0.85rem 0.5rem", color: "var(--text-primary)", fontWeight: 600 }}>{exp.category}</td>
                    <td style={{ padding: "0.85rem 0.5rem", color: "var(--text-secondary)" }}>{exp.comment}</td>
                    <td style={{ padding: "0.85rem 0.5rem", color: "#4b5563" }}>{exp.requested_by}</td>
                    <td style={{ padding: "0.85rem 0.5rem", color: "var(--text-primary)", fontWeight: 700, textAlign: "right" }}>₹{parseFloat(exp.amount || 0).toLocaleString()}</td>
                    <td style={{ padding: "0.85rem 0.5rem", textAlign: "right" }}>
                      <span style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "0.2rem 0.4rem",
                        borderRadius: "4px",
                        background: exp.status === "approved" ? "#e8f5e9" : exp.status === "pending" ? "#fff8e1" : "#ffebee",
                        color: exp.status === "approved" ? "#2e7d32" : exp.status === "pending" ? "#f57f17" : "#c62828"
                      }}>
                        {exp.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
