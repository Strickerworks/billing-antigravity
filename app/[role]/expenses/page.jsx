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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const router = useRouter();
  const { role } = useParams();
  const isAdmin = role === "admin";

  useEffect(() => {
    fetchExpenses();
  }, [adminTab, currentPage]);

  const fetchExpenses = async () => {
    setLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    try {
      let query = supabase.from("expense_reports").select("*", { count: "exact" }).order("created_at", { ascending: false });
      
      // Filter list query
      if (!isAdmin) {
        query = query.eq("requested_by", "staff");
      } else {
        if (adminTab === "self") {
          query = query.eq("requested_by", "admin");
        } else {
          query = query.neq("requested_by", "admin");
        }
      }

      const { data, error, count } = await query.range(from, to);
      if (error) {
        console.error("Error fetching expenses:", error);
        alert("Failed to load expenses.");
      } else {
        setExpenses(data || []);
        setTotalCount(count || 0);
      }

      // Fetch global metrics
      let approvedQuery = supabase.from("expense_reports").select("amount").eq("status", "approved");
      let pendingQuery = supabase.from("expense_reports").select("*", { count: "exact", head: true }).eq("status", "pending");

      if (!isAdmin) {
        approvedQuery = approvedQuery.eq("requested_by", "staff");
        pendingQuery = pendingQuery.eq("requested_by", "staff");
      }

      const [ { data: approvedData }, { count: pendingHeadCount } ] = await Promise.all([
        approvedQuery,
        pendingQuery
      ]);

      const totalAmt = (approvedData || []).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      setTotalApprovedAmount(totalAmt);
      setPendingCount(pendingHeadCount || 0);

    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleTabChange = (tab) => {
    setAdminTab(tab);
    setCurrentPage(1);
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
        return { backgroundColor: "var(--text-primary)", color: "var(--bg-card)", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600 };
      case "rejected":
        return { backgroundColor: "var(--border)", color: "var(--text-secondary)", textDecoration: "line-through", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600 };
      default:
        return { backgroundColor: "var(--border)", color: "var(--text-primary)", border: "1px solid #d1d5db", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600 };
    }
  };

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
          background: "linear-gradient(135deg, var(--badge-warning-bg) 0%, var(--badge-warning-bg) 100%)",
          border: "1px solid var(--badge-warning-border)",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          padding: "1rem 1.25rem"
        }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--badge-warning-text)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Pending to be Reviewed
          </span>
          <span style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--badge-warning-text)" }}>
            {pendingCount} request{pendingCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Admin Tab Selectors */}
      {isAdmin && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <button
            onClick={() => handleTabChange("queue")}
            className={`btn ${adminTab === "queue" ? "btn-primary" : "btn-outline"}`}
          >
            📋 Team Expense Queue
          </button>
          <button
            onClick={() => handleTabChange("self")}
            className={`btn ${adminTab === "self" ? "btn-primary" : "btn-outline"}`}
          >
            💸 My Expense Submissions
          </button>
        </div>
      )}

      {/* Render list depending on role and tabs */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem 0" }}>
            <p className="card-title">{(!isAdmin || adminTab === "self") ? "Expense History" : "All Team Expense Submissions"}</p>
          </div>
          {loading ? (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <div className="empty-state-text">Loading expenses...</div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💸</div>
              <div className="empty-state-text">No expenses found</div>
              <div className="empty-state-sub">No expense reports are logged under this view.</div>
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
                    {isAdmin && adminTab === "queue" && <th>Submitted By</th>}
                    <th>Comment</th>
                    <th>Submitted At</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="fade-in">
                      <td><span style={{ fontWeight: 600, color: "var(--text-primary)" }}>#{exp.id}</span></td>
                      <td style={{ fontWeight: 600 }}>{exp.category}</td>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{fmt(exp.amount)}</td>
                      <td><span style={getStatusStyle(exp.status)}>{exp.status}</span></td>
                      {isAdmin && adminTab === "queue" && <td style={{ textTransform: "capitalize", fontWeight: 500 }}>{exp.requested_by}</td>}
                      <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.comment || "—"}</td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{formatDate(exp.created_at)}</td>
                      <td style={{ textAlign: "center" }}>
                        {exp.status === "pending" ? (
                          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center" }}>
                            {isAdmin && adminTab === "queue" && (
                              <>
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
                              </>
                            )}
                            {(!isAdmin || adminTab === "self") && (
                              <button
                                onClick={() => handleDelete(exp)}
                                className="btn btn-sm btn-outline"
                                style={{ color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.25)", padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", alignItems: "center" }}>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{exp.status}</span>
                            {isAdmin && (
                              <>
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
                              </>
                            )}
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

        {/* Pagination Controls */}
        {!loading && totalCount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0.5rem" }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="btn btn-secondary"
              style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
            >
              ◀ Previous
            </button>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4b5563" }}>
              Page {currentPage} of {Math.max(Math.ceil(totalCount / itemsPerPage), 1)}
            </span>
            <button
              onClick={() => setCurrentPage(prev => (prev * itemsPerPage < totalCount ? prev + 1 : prev))}
              disabled={currentPage * itemsPerPage >= totalCount || loading}
              className="btn btn-secondary"
              style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
            >
              Next ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
