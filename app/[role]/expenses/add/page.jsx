"use client";
import React, { useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { logAudit } from "@/utils/supabase/audit";

export default function AddExpensePage() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Fuel");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const { role } = useParams();

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }
    setSubmitting(true);

    const expenseData = {
      amount: parseFloat(amount),
      category,
      comment,
      status: "pending",
      requested_by: role,
    };

    const { data, error } = await supabase
      .from("expense_reports")
      .insert([expenseData])
      .select();

    if (error) {
      console.error("Error saving expense:", error);
      alert("Failed to submit expense report: " + error.message);
    } else {
      if (data && data[0]) {
        await logAudit({
          requestId: data[0].id,
          requestType: "expense_report",
          submittedBy: role,
          status: "Pending",
          payload: {
            amount: parseFloat(amount),
            category,
            comment,
          },
        });
      }

      alert("Expense report submitted successfully! Pending approval.");
      router.push(`/${role}/expenses`);
    }
    setSubmitting(false);
  };

  return (
    <div className="page-content" style={{ maxWidth: "550px" }}>
      <div className="page-header">
        <h1 className="page-title">Submit Expense</h1>
        <p className="page-subtitle">Add a new corporate or trip expense for administrator approval.</p>
      </div>

      <div className="card fade-in">
        <p className="card-title">New Expense Details</p>
        <form onSubmit={handleSubmitExpense}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="form-label">Expense Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1200"
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select"
                required
              >
                <option value="Fuel">Fuel</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Driver Payment">Driver Payment</option>
                <option value="Accident">Accident</option>
                <option value="Insurance">Insurance</option>
                <option value="Misc">Misc</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">Comment / Notes (Optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="form-textarea"
                placeholder="Describe the expense details (e.g. Vehicle number, purpose...)"
                rows={4}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => router.push(`/${role}`)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Expense"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
