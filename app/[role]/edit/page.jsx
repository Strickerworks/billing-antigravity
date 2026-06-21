"use client";
import React, { useState } from "react";
import { supabase } from "@/utils/supabase/client";
import Information from "@/app/components/Information";

export default function EditInvoice() {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetchInvoice = async () => {
    if (!invoiceNo) {
      alert("Please enter Invoice No.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("billdata")
      .select("*")
      .eq("invoice_no", invoiceNo)
      .single();

    setLoading(false);

    if (error) {
      alert("Invoice not found.");
      console.error(error);
      return;
    }
    setInvoiceData(data);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Edit Invoice</h1>
        <p className="page-subtitle">Retrieve an existing invoice and update its details.</p>
      </div>

      {!invoiceData && (
        <div className="card fade-in" style={{ maxWidth: 460 }}>
          <p className="card-title">Find Invoice</p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <input
              type="number"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetchInvoice()}
              placeholder="Enter invoice number"
              className="form-input"
            />
            <button
              onClick={handleFetchInvoice}
              disabled={loading}
              className="btn btn-primary"
              style={{ whiteSpace: "nowrap" }}
            >
              {loading ? "..." : "Fetch"}
            </button>
          </div>
        </div>
      )}

      {invoiceData && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
              Editing Invoice <strong style={{ color: "#1a1d23" }}>#{invoiceData.invoice_no}</strong>
            </p>
            <button
              onClick={() => setInvoiceData(null)}
              className="btn btn-outline btn-sm"
            >
              ← Search again
            </button>
          </div>
          <Information initialData={invoiceData} />
        </>
      )}
    </div>
  );
}
