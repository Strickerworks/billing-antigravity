"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all"); // all, new, contacted, done, reject
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  
  // Notes State for Detail Panel
  const [editingNotes, setEditingNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const router = useRouter();
  const { role } = useParams();
  const isAdmin = role === "admin";

  useEffect(() => {
    fetchEnquiries();
  }, [filterStatus, currentPage, searchQuery]);

  const fetchEnquiries = async () => {
    setLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    try {
      let query = supabase
        .from("enquiries")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      if (searchQuery.trim() !== "") {
        const cleanQuery = searchQuery.trim();
        query = query.or(`full_name.ilike.%${cleanQuery}%,phone_number.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%,service_interested.ilike.%${cleanQuery}%`);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) {
        console.error("Error fetching enquiries:", error);
      } else {
        setEnquiries(data || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error("Exception fetching enquiries:", err);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from("enquiries")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) {
        console.error("Error updating status:", error);
        alert("Failed to update status: " + error.message);
      } else {
        // Update local state
        setEnquiries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
        if (selectedEnquiry && selectedEnquiry.id === id) {
          setSelectedEnquiry((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error(err);
    }
    setUpdatingId(null);
  };

  const handleSaveNotes = async () => {
    if (!selectedEnquiry) return;
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from("enquiries")
        .update({ notes: editingNotes })
        .eq("id", selectedEnquiry.id);

      if (error) {
        console.error("Error updating notes:", error);
        alert("Failed to save notes: " + error.message);
      } else {
        // Update local list
        setEnquiries((prev) =>
          prev.map((item) =>
            item.id === selectedEnquiry.id ? { ...item, notes: editingNotes } : item
          )
        );
        setSelectedEnquiry((prev) => ({ ...prev, notes: editingNotes }));
        alert("Notes updated successfully!");
      }
    } catch (err) {
      console.error(err);
    }
    setSavingNotes(false);
  };

  const handleSelectEnquiry = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setEditingNotes(enquiry.notes || "");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return "—";
    const date = new Date(isoStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "new":
        return "badge-blue";
      case "contacted":
        return "badge-orange"; // Wait, we can use orange/yellow accent styles
      case "done":
        return "badge-green";
      case "reject":
        return "badge-red";
      default:
        return "";
    }
  };

  const getStatusSelectStyle = (status) => {
    const base = {
      padding: "0.25rem 0.5rem",
      borderRadius: "4px",
      fontSize: "0.8rem",
      fontWeight: "600",
      border: "1px solid var(--border)",
      background: "var(--bg-elevated)",
      color: "var(--text-primary)",
      cursor: "pointer",
    };
    if (status === "done") {
      base.color = "#10b981";
      base.borderColor = "rgba(16, 185, 129, 0.3)";
    } else if (status === "reject") {
      base.color = "#ef4444";
      base.borderColor = "rgba(239, 68, 68, 0.3)";
    } else if (status === "contacted") {
      base.color = "#f59e0b";
      base.borderColor = "rgba(245, 158, 11, 0.3)";
    } else {
      base.color = "#3b82f6";
      base.borderColor = "rgba(59, 130, 246, 0.3)";
    }
    return base;
  };

  return (
    <div className="page-content" style={{ position: "relative" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .enquiries-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          align-items: start;
        }
        @media (min-width: 992px) {
          .enquiries-layout.has-sidebar {
            grid-template-columns: 1fr 380px;
          }
        }
        
        .contact-link {
          color: var(--accent);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          transition: opacity 0.2s;
        }
        .contact-link:hover {
          opacity: 0.85;
          text-decoration: underline;
        }
      `,
      }} />

      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="page-title">Booking Enquiries</h1>
            <p className="page-subtitle">
              Manage inbound leads, review ride requests, and update contact status.
            </p>
          </div>
          <button onClick={() => router.push(`/${role}`)} className="btn btn-secondary">
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        marginBottom: "1.5rem"
      }}>
        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "0.35rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
          {["all", "new", "contacted", "done", "reject"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                setCurrentPage(1);
              }}
              className={`btn btn-sm ${filterStatus === status ? "btn-primary" : "btn-outline"}`}
              style={{ textTransform: "capitalize" }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ width: "100%", maxWidth: "300px" }}>
          <input
            type="text"
            placeholder="Search name, phone, service..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="form-input"
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
          />
        </div>
      </div>

      <div>
        {/* Main enquiries table */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {loading ? (
              <div className="empty-state">
                <div className="empty-state-icon">⏳</div>
                <div className="empty-state-text">Loading enquiries...</div>
              </div>
            ) : enquiries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📞</div>
                <div className="empty-state-text">No enquiries found</div>
                <div className="empty-state-sub">No matching booking inquiries exist in the database.</div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Received</th>
                      <th>Customer</th>
                      <th>Contact info</th>
                      <th>Service Details</th>
                      <th>Travel Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.map((eq) => (
                      <tr
                        key={eq.id}
                        className="fade-in"
                        style={selectedEnquiry?.id === eq.id ? { backgroundColor: "var(--bg-elevated)" } : {}}
                      >
                        <td style={{ color: "var(--text-secondary)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                          {formatDateTime(eq.created_at)}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{eq.full_name}</span>
                        </td>
                        <td style={{ fontSize: "0.85rem" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                            <a href={`tel:${eq.phone_number}`} className="contact-link">
                              📞 {eq.phone_number}
                            </a>
                            {eq.email ? (
                              <a href={`mailto:${eq.email}`} className="contact-link" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                ✉ {eq.email}
                              </a>
                            ) : (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>No Email</span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontWeight: 500, fontSize: "0.85rem" }}>
                          <div>{eq.service_interested}</div>
                          {eq.preferred_vehicle_type && (
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                              Car: {eq.preferred_vehicle_type}
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: "0.85rem" }}>
                          <div>{formatDate(eq.travel_date)}</div>
                          {eq.number_of_days && (
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                              {eq.number_of_days} Day(s)
                            </span>
                          )}
                        </td>
                        <td>
                          {updatingId === eq.id ? (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Saving...</span>
                          ) : (
                            <select
                              value={eq.status}
                              onChange={(e) => handleStatusChange(eq.id, e.target.value)}
                              style={getStatusSelectStyle(eq.status)}
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="done">Done</option>
                              <option value="reject">Reject</option>
                            </select>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            onClick={() => handleSelectEnquiry(eq)}
                            className="btn btn-sm btn-secondary"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                          >
                            Details
                          </button>
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
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="btn btn-secondary"
                style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
              >
                ◀ Previous
              </button>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                Page {currentPage} of {Math.max(Math.ceil(totalCount / itemsPerPage), 1)}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => (prev * itemsPerPage < totalCount ? prev + 1 : prev))}
                disabled={currentPage * itemsPerPage >= totalCount || loading}
                className="btn btn-secondary"
                style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
              >
                Next ▶
              </button>
            </div>
          )}
        </div>

        {/* Modal details panel */}
        {selectedEnquiry && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
            backdropFilter: "blur(4px)",
            padding: "1rem"
          }} onClick={() => setSelectedEnquiry(null)}>
            <div 
              className="card fade-in" 
              style={{ 
                width: "95%", 
                maxWidth: "550px", 
                maxHeight: "90vh",
                overflowY: "auto",
                border: "1px solid var(--border)", 
                padding: "1.5rem", 
                background: "var(--bg-card)",
                position: "relative"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
                <div>
                  <h4 style={{ fontWeight: 700, margin: 0, fontSize: "1.1rem", color: "var(--text-primary)" }}>
                    Enquiry Details
                  </h4>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    ID: #{selectedEnquiry.id} · Received {formatDateTime(selectedEnquiry.created_at)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedEnquiry(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "var(--text-muted)", padding: 0 }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.85rem" }}>
                {/* Client Profile */}
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Customer Name</span>
                  <strong style={{ color: "var(--text-primary)", fontSize: "0.95rem" }}>{selectedEnquiry.full_name}</strong>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Contact Info</span>
                  <div>
                    <a href={`tel:${selectedEnquiry.phone_number}`} className="contact-link" style={{ fontSize: "0.85rem", display: "block", marginBottom: "0.15rem" }}>
                      📞 {selectedEnquiry.phone_number}
                    </a>
                    {selectedEnquiry.email ? (
                      <a href={`mailto:${selectedEnquiry.email}`} className="contact-link" style={{ fontSize: "0.85rem", display: "block" }}>
                        ✉ {selectedEnquiry.email}
                      </a>
                    ) : (
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic", display: "block" }}>No Email Provided</span>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Service</span>
                    <span style={{ fontWeight: 600 }}>{selectedEnquiry.service_interested}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Vehicles Preferred</span>
                    <span style={{ fontWeight: 600 }}>{selectedEnquiry.preferred_vehicle_type || "No preference"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Travel Date</span>
                    <span>{formatDate(selectedEnquiry.travel_date)}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Duration</span>
                    <span>{selectedEnquiry.number_of_days ? `${selectedEnquiry.number_of_days} Day(s)` : "—"}</span>
                  </div>
                </div>

                {/* Message */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Customer Message</span>
                  <div style={{
                    padding: "0.75rem",
                    background: "var(--bg-elevated)",
                    borderRadius: "6px",
                    fontSize: "0.825rem",
                    lineHeight: 1.5,
                    color: "var(--text-secondary)",
                    maxHeight: "150px",
                    overflowY: "auto",
                    border: "1px solid var(--border)"
                  }}>
                    {selectedEnquiry.message || <span style={{ fontStyle: "italic", color: "var(--text-muted)" }}>No message provided.</span>}
                  </div>
                </div>

                {/* Admin Notes */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Internal Follow-up Notes</span>
                  <textarea
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    placeholder="Add notes about calls, client preferences, or pricing negotiation..."
                    className="form-input"
                    style={{
                      width: "100%",
                      height: "80px",
                      resize: "none",
                      fontSize: "0.8rem",
                      padding: "0.5rem",
                      marginBottom: "0.5rem"
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="btn btn-primary btn-sm"
                    style={{ width: "100%" }}
                  >
                    {savingNotes ? "Saving Notes..." : "Save Notes"}
                  </button>
                </div>

                {/* Inline Status Dropdown for Detail panel */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Update Status:</span>
                  <select
                    value={selectedEnquiry.status}
                    onChange={(e) => handleStatusChange(selectedEnquiry.id, e.target.value)}
                    style={getStatusSelectStyle(selectedEnquiry.status)}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="done">Done</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
