"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { logAudit } from "@/utils/supabase/audit";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalApprovedAmount, setTotalApprovedAmount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  
  // Tab for Admin: 'queue' or 'self'
  const [adminTab, setAdminTab] = useState("queue");

  const router = useRouter();
  const { role } = useParams();
  const isAdmin = role === "admin";

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    let query = supabase.from("expense_reports").select("*").order("created_at", { ascending: false });
    
    // Staff should only see requests submitted by staff
    if (!isAdmin) {
      query = query.eq("requested_by", "staff");
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching expenses:", error);
      alert("Failed to load expenses.");
    } else {
      const allExpenses = data || [];
      setExpenses(allExpenses);

      // Calculate stats based on fetched list (filtered by role already)
      const approved = allExpenses.filter(e => e.status === "approved");
      const totalAmt = approved.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      setTotalApprovedAmount(totalAmt);

      const pending = allExpenses.filter(e => e.status === "pending");
      setPendingCount(pending.length);
    }
    setLoading(false);
  };

  const handleApprove = async (exp) => {
    if (!confirm(`Are you sure you want to approve this expense of ₹${exp.amount}?`)) {
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("expense_reports")
      .update({
        status: "approved",
        approved_by: "admin",
        approved_at: new Date().toISOString(),
      })
      .eq("id", exp.id);

    if (error) {
      console.error("Error approving expense:", error);
      alert("Failed to approve expense.");
    } else {
      await logAudit({
        requestId: exp.id,
        requestType: "expense_report",
        submittedBy: exp.requested_by || "staff",
        submittedAt: exp.created_at,
        status: "Approved",
        actionBy: "admin",
        actionAt: new Date().toISOString(),
        payload: { amount: exp.amount, category: exp.category, comment: exp.comment },
      });
      fetchExpenses();
    }
    setLoading(false);
  };

  const handleReject = async (exp) => {
    if (!confirm(`Are you sure you want to reject this expense of ₹${exp.amount}?`)) {
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("expense_reports")
      .update({ status: "rejected" })
      .eq("id", exp.id);

    if (error) {
      console.error("Error rejecting expense:", error);
      alert("Failed to reject expense.");
    } else {
      await logAudit({
        requestId: exp.id,
        requestType: "expense_report",
        submittedBy: exp.requested_by || "staff",
        submittedAt: exp.created_at,
        status: "Rejected",
        actionBy: "admin",
        actionAt: new Date().toISOString(),
        payload: { amount: exp.amount, category: exp.category, comment: exp.comment },
      });
      fetchExpenses();
    }
    setLoading(false);
  };

  const handleRevert = async (exp) => {
    if (!confirm(`Are you sure you want to REVERT the status of this expense to pending?`)) {
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("expense_reports")
      .update({
        status: "pending",
        approved_by: null,
        approved_at: null,
      })
      .eq("id", exp.id);

    if (error) {
      console.error("Error reverting expense:", error);
      alert("Failed to revert expense.");
    } else {
      await logAudit({
        requestId: exp.id,
        requestType: "expense_report",
        submittedBy: exp.requested_by || "staff",
        submittedAt: exp.created_at,
        status: "Reverted",
        actionBy: "admin",
        actionAt: new Date().toISOString(),
        payload: { amount: exp.amount, category: exp.category, comment: exp.comment },
      });
      fetchExpenses();
    }
    setLoading(false);
  };

  const handleDelete = async (exp) => {
    if (!confirm("Are you sure you want to delete this expense report?")) {
      return;
    }
    setLoading(true);
    await logAudit({
      requestId: exp.id,
      requestType: "expense_report",
      submittedBy: exp.requested_by || "staff",
      submittedAt: exp.created_at,
      status: "Deleted",
      actionBy: role,
      actionAt: new Date().toISOString(),
      payload: { amount: exp.amount, category: exp.category, comment: exp.comment },
    });

    const { error } = await supabase.from("expense_reports").delete().eq("id", exp.id);

    if (error) {
      console.error("Error deleting expense:", error);
      alert("Failed to delete expense.");
    } else {
      fetchExpenses();
    }
    setLoading(false);
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return "—";
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const fmt = (num) =>
    `₹${parseFloat(num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const getStatusStyle = (status) => {
    switch (status) {
      case "approved":
        return { backgroundColor: "#111111", color: "#ffffff", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600 };
      case "rejected":
        return { backgroundColor: "#e5e7eb", color: "#6b7280", textDecoration: "line-through", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600 };
      default:
        return { backgroundColor: "#e5e7eb", color: "#111111", border: "1px solid #d1d5db", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600 };
    }
  };

  // Self submitted expenses for admin
  const selfExpenses = expenses.filter(e => e.requested_by === "admin");

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="page-title">Expense Requests</h1>
            <p className="page-subtitle">
              {isAdmin
                ? "Review team expenses or track your own corporate expenses."
                : "Track your submitted expense requests and their approval status."}
            </p>
          </div>
          <button onClick={() => router.push(`/${role}`)} className="btn btn-secondary">
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1rem",
        marginBottom: "1.5rem"
      }}>
        {/* Total Expense */}
        <div className="card fade-in" style={{
          background: "linear-gradient(135deg, #fff5f5 0%, #ffe4e6 100%)",
          border: "1px solid #fecdd3",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          padding: "1rem 1.25rem"
        }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#9f1239", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Total Approved Expense
          </span>
          <span style={{ fontSize: "1.375rem", fontWeight: 800, color: "#881337" }}>
            {fmt(totalApprovedAmount)}
          </span>
        </div>

        {/* Pending Reviews */}
        <div className="card fade-in" style={{
          background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
          border: "1px solid #fde68a",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          padding: "1rem 1.25rem"
        }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Pending to be Reviewed
          </span>
          <span style={{ fontSize: "1.375rem", fontWeight: 800, color: "#78350f" }}>
            {pendingCount} request{pendingCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Admin Tab Selectors */}
      {isAdmin && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <button
            onClick={() => setAdminTab("queue")}
            className={`btn ${adminTab === "queue" ? "btn-primary" : "btn-outline"}`}
          >
            📋 Team Expense Queue ({expenses.length - selfExpenses.length})
          </button>
          <button
            onClick={() => setAdminTab("self")}
            className={`btn ${adminTab === "self" ? "btn-primary" : "btn-outline"}`}
          >
            💸 My Expense Submissions ({selfExpenses.length})
          </button>
        </div>
      )}

      {/* Render list depending on role and tabs */}
      {(!isAdmin || adminTab === "self") ? (
        /* Staff History or Admin Self submissions list */
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem 0" }}>
            <p className="card-title">Expense History</p>
          </div>
          {loading ? (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <div className="empty-state-text">Loading expenses...</div>
            </div>
          ) : (isAdmin ? selfExpenses : expenses).length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💸</div>
              <div className="empty-state-text">No expenses found</div>
              <div className="empty-state-sub">No expense reports have been submitted yet. Add one from the dashboard!</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Comment</th>
                    <th>Submitted At</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(isAdmin ? selfExpenses : expenses).map((exp) => (
                    <tr key={exp.id} className="fade-in">
                      <td><span style={{ fontWeight: 600, color: "#1a1d23" }}>#{exp.id}</span></td>
                      <td style={{ fontWeight: 600 }}>{exp.category}</td>
                      <td style={{ fontWeight: 600, color: "#1a1d23" }}>{fmt(exp.amount)}</td>
                      <td><span style={getStatusStyle(exp.status)}>{exp.status}</span></td>
                      <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.comment || "—"}</td>
                      <td style={{ color: "#6b7280", fontSize: "0.8rem" }}>{formatDate(exp.created_at)}</td>
                      <td style={{ textAlign: "center" }}>
                        {exp.status === "pending" ? (
                          <button
                            onClick={() => handleDelete(exp)}
                            className="btn btn-sm btn-outline"
                            style={{ color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.25)", padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                          >
                            Cancel
                          </button>
                        ) : (
                          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", alignItems: "center" }}>
                            <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>{exp.status}</span>
                            <button
                              onClick={() => handleRevert(exp)}
                              className="btn btn-sm btn-outline"
                              style={{ padding: "0.15rem 0.4rem", fontSize: "0.7rem" }}
                            >
                              Revert
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Admin Queue View tab */
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem 0" }}>
            <p className="card-title">All Team Expense Submissions</p>
          </div>
          {loading ? (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <div className="empty-state-text">Loading expenses...</div>
            </div>
          ) : expenses.filter(e => e.requested_by !== "admin").length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💸</div>
              <div className="empty-state-text">No team expenses found</div>
              <div className="empty-state-sub">No team member expense submissions exist.</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Submitted By</th>
                    <th>Comment</th>
                    <th>Submitted At</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.filter(e => e.requested_by !== "admin").map((exp) => (
                    <tr key={exp.id} className="fade-in">
                      <td><span style={{ fontWeight: 600, color: "#1a1d23" }}>#{exp.id}</span></td>
                      <td style={{ fontWeight: 600 }}>{exp.category}</td>
                      <td style={{ fontWeight: 600, color: "#1a1d23" }}>{fmt(exp.amount)}</td>
                      <td><span style={getStatusStyle(exp.status)}>{exp.status}</span></td>
                      <td style={{ textTransform: "capitalize", fontWeight: 500 }}>{exp.requested_by}</td>
                      <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.comment || "—"}</td>
                      <td style={{ color: "#6b7280", fontSize: "0.8rem" }}>{formatDate(exp.created_at)}</td>
                      <td style={{ textAlign: "center" }}>
                        {exp.status === "pending" ? (
                          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center" }}>
                            <button onClick={() => handleApprove(exp)} className="btn btn-sm btn-primary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(exp)}
                              className="btn btn-sm btn-outline"
                              style={{ color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.25)", padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", alignItems: "center" }}>
                            <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>{exp.status}</span>
                            <button
                              onClick={() => handleRevert(exp)}
                              className="btn btn-sm btn-outline"
                              style={{ padding: "0.15rem 0.4rem", fontSize: "0.7rem" }}
                            >
                              Revert
                            </button>
                            <button
                              onClick={() => handleDelete(exp)}
                              className="btn btn-sm btn-outline"
                              style={{ color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.1)", padding: "0.15rem 0.4rem", fontSize: "0.7rem" }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
