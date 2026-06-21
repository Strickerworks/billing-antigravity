"use client";
import React from "react";
import Navbar from "../components/Navbar";

export default function AdminLayout({ children }) {
  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        {children}
      </div>
    </>
  );
}
