"use client";
import React, { useState } from "react";
import { supabase } from "@/utils/supabase/client";
import Information from "@/app/components/Information";

export default function DuplicateInvoice() {
  const [existingInvoiceNo, setExistingInvoiceNo] = useState("");
  const [newInvoiceNo, setNewInvoiceNo] = useState("");
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetchAndDuplicate = async () => {
    if (!existingInvoiceNo) {
      alert("Please enter existing Invoice No.");
      return;
    }
    if (!newInvoiceNo) {
      alert("Please enter New Invoice No.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("billdata")
      .select("*")
      .eq("invoice_no", existingInvoiceNo)
      .single();

    setLoading(false);

    if (error) {
      alert("Invoice not found.");
      console.error(error);
      return;
    }

    const duplicateData = { ...data, invoice_no: newInvoiceNo };
    setInvoiceData(duplicateData);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Duplicate Invoice</h1>
        <p className="page-subtitle">Copy an existing invoice and assign it a new invoice number.</p>
      </div>

      {!invoiceData && (
        <div className="card fade-in" style={{ maxWidth: 480 }}>
          <p className="card-title">Duplicate Setup</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div>
              <label className="form-label">Source Invoice No.</label>
              <input
                type="number"
                value={existingInvoiceNo}
                onChange={(e) => setExistingInvoiceNo(e.target.value)}
                placeholder="Existing invoice number to copy from"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">New Invoice No.</label>
              <input
                type="number"
                value={newInvoiceNo}
                onChange={(e) => setNewInvoiceNo(e.target.value)}
                placeholder="New invoice number to assign"
                className="form-input"
              />
            </div>
            <button
              onClick={handleFetchAndDuplicate}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "Fetching..." : "Fetch & Duplicate →"}
            </button>
          </div>
        </div>
      )}

      {invoiceData && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>
              Duplicating as Invoice <strong style={{ color: "var(--text-primary)" }}>#{invoiceData.invoice_no}</strong>
            </p>
            <button
              onClick={() => setInvoiceData(null)}
              className="btn btn-outline btn-sm"
            >
              ← Start over
            </button>
          </div>
          <Information initialData={invoiceData} mode="duplicate" />
        </>
      )}
    </div>
  );
}
