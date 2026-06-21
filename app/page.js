"use client";
import React from "react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      backgroundColor: "#0b0c0e",
      color: "#ffffff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    }}>
      <div style={{
        padding: "2.5rem 3.5rem",
        border: "1px solid #22252e",
        borderRadius: "12px",
        backgroundColor: "#14161b",
        textAlign: "center",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          background: "#ffffff",
          color: "#0b0c0e",
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
        <p style={{ fontSize: "0.875rem", color: "#8e939f", margin: "0 0 1.75rem", maxWidth: "260px", lineHeight: 1.5 }}>
          Staff invoicing and billing management system entrance.
        </p>
        <Link 
          href="/staff" 
          style={{
            display: "inline-block",
            width: "100%",
            padding: "0.75rem 2rem",
            borderRadius: "8px",
            backgroundColor: "#ffffff",
            color: "#0b0c0e",
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
