"use client";
import React from "react";
import Navbar from "../components/Navbar";
import { useParams, notFound } from "next/navigation";

export default function RoleLayout({ children }) {
  const params = useParams();
  const role = params.role;

  if (role !== "admin" && role !== "staff") {
    notFound();
  }

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        {children}
      </div>
    </>
  );
}
