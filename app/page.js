"use client";
import React from "react";

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
        padding: "2rem 4rem",
        border: "1px solid #22252e",
        borderRadius: "8px",
        backgroundColor: "#14161b",
        fontSize: "1.5rem",
        fontWeight: 600,
        letterSpacing: "0.05em"
      }}>
        Hi
      </div>
    </div>
  );
}
