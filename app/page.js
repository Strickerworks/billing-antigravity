"use client";
import React from "react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="landing-container">
      <div className="landing-card">
        <div style={{
          width: "40px",
          height: "40px",
          background: "var(--bg-card)",
          color: "var(--bg-primary)",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: "18px",
          margin: "0 auto 1.25rem"
        }}>
          H
        </div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.5rem", letterSpacing: "-0.01em" }}>
          The Heritage Group
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: "0 0 1.75rem", maxWidth: "260px", lineHeight: 1.5 }}>
          Staff invoicing and billing management system entrance.
        </p>
        <Link 
          href="/staff" 
          style={{
            display: "inline-block",
            width: "100%",
            padding: "0.75rem 2rem",
            borderRadius: "8px",
            backgroundColor: "var(--bg-card)",
            color: "var(--bg-primary)",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
            transition: "opacity 0.2s ease"
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
          onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
        >
          Login to Staff &rarr;
        </Link>
      </div>
    </div>
  );
}
