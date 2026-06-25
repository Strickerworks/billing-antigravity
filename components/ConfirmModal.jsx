"use client";
import React from "react";

export default function ConfirmModal({ 
  isOpen, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm", 
  onConfirm, 
  onCancel, 
  type = "danger" // danger, warning, success, info
}) {
  if (!isOpen) return null;

  const getStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: "🗑️",
          iconBg: "rgba(220,38,38,0.12)",
          iconBorder: "rgba(220,38,38,0.25)",
          btnBg: "#dc2626",
          modalBorder: "rgba(220,38,38,0.3)",
          modalShadow: "0 0 30px rgba(220,38,38,0.08)"
        };
      case "warning":
        return {
          icon: "⚠️",
          iconBg: "rgba(245,158,11,0.12)",
          iconBorder: "rgba(245,158,11,0.25)",
          btnBg: "#f59e0b",
          modalBorder: "rgba(245,158,11,0.3)",
          modalShadow: "0 0 30px rgba(245,158,11,0.08)"
        };
      case "success":
        return {
          icon: "✅",
          iconBg: "rgba(16,185,129,0.12)",
          iconBorder: "rgba(16,185,129,0.25)",
          btnBg: "#10b981",
          modalBorder: "rgba(16,185,129,0.3)",
          modalShadow: "0 0 30px rgba(16,185,129,0.08)"
        };
      case "info":
      default:
        return {
          icon: "ℹ️",
          iconBg: "rgba(59,130,246,0.12)",
          iconBorder: "rgba(59,130,246,0.25)",
          btnBg: "#3b82f6",
          modalBorder: "rgba(59,130,246,0.3)",
          modalShadow: "0 0 30px rgba(59,130,246,0.08)"
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-in"
        style={{
          background: "var(--bg-card-solid)",
          border: `1px solid ${styles.modalBorder}`,
          borderRadius: "16px",
          padding: "2rem 2rem 1.75rem",
          maxWidth: "420px",
          width: "100%",
          boxShadow: `0 25px 60px rgba(0,0,0,0.7), ${styles.modalShadow}`,
        }}
      >
        {/* Icon */}
        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, borderRadius: "50%",
            background: styles.iconBg,
            border: `1px solid ${styles.iconBorder}`,
            fontSize: "1.5rem",
          }}>
            {styles.icon}
          </div>
        </div>

        {/* Title */}
        <h3 style={{ textAlign: "center", fontFamily: "Montserrat,sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
          {title}
        </h3>
        
        {/* Message */}
        <p style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1.75rem", lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: message }} />

        {/* Divider */}
        <div style={{ borderTop: "1px solid var(--border)", marginBottom: "1.25rem" }} />

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={onCancel}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            className="btn"
            style={{ flex: 1, background: styles.btnBg, color: "#fff", border: `1px solid ${styles.btnBg}`, fontWeight: 700 }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
