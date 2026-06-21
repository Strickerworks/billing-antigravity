"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

export default function Information({ initialData = null, mode = "default" }) {
  const router = useRouter();
  const pathname = usePathname();
  const isStaff = pathname.startsWith("/staff");
  const prefix = isStaff ? "/staff" : "/admin";

  const [billDate, setBillDate] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerGST, setCustomerGST] = useState("");

  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);
  const [igst, setIgst] = useState(0);

  const [contentRows, setContentRows] = useState([]);
  const [additionalRows, setAdditionalRows] = useState([]);

  const [tableTotal, setTableTotal] = useState(0);
  const [additionalTotal, setAdditionalTotal] = useState(0);
  const [saving, setSaving] = useState(false);

  const [paymentAccount, setPaymentAccount] = useState("");

  useEffect(() => {
    if (initialData) {
      setBillDate(initialData.bill_date);
      setInvoiceNo(initialData.invoice_no);
      setCustomerName(initialData.customer_name);
      setCustomerGST(initialData.customer_gst);
      setCgst(initialData.cgst_percentage);
      setSgst(initialData.sgst_percentage);
      setIgst(initialData.igst_percentage);
      setPaymentAccount(initialData.payment_account);
      setContentRows(initialData.content);
      setAdditionalRows(initialData.additional_charges);
    }
  }, [initialData]);

  const addContentRow = () => {
    setContentRows([
      ...contentRows,
      { sno: contentRows.length + 1, description: "", unit: 1, rate: 100, amount: 100 },
    ]);
  };

  const deleteContentRow = (index) => {
    const updated = [...contentRows];
    updated.splice(index, 1);
    updated.forEach((row, idx) => (row.sno = idx + 1));
    setContentRows(updated);
  };

  const addAdditionalRow = () => {
    setAdditionalRows([
      ...additionalRows,
      { sno: additionalRows.length + 1, description: "", amount: 0 },
    ]);
  };

  const deleteAdditionalRow = (index) => {
    const updated = [...additionalRows];
    updated.splice(index, 1);
    updated.forEach((row, idx) => (row.sno = idx + 1));
    setAdditionalRows(updated);
  };

  const updateContentRow = (index, field, value) => {
    const updated = [...contentRows];
    updated[index][field] = value;
    if (field === "unit" || field === "rate") {
      const unit = parseFloat(updated[index].unit) || 0;
      const rate = parseFloat(updated[index].rate) || 0;
      updated[index].amount = unit * rate;
    }
    setContentRows(updated);
  };

  const updateAdditionalRow = (index, field, value) => {
    const updated = [...additionalRows];
    updated[index][field] = value;
    setAdditionalRows(updated);
  };

  useEffect(() => {
    const total = contentRows.reduce((sum, row) => sum + parseFloat(row.amount || 0), 0);
    setTableTotal(total);
    const addTotal = additionalRows.reduce((sum, row) => sum + parseFloat(row.amount || 0), 0);
    setAdditionalTotal(addTotal);
  }, [contentRows, additionalRows]);

  const cgstTotal = (tableTotal * parseFloat(cgst || 0)) / 100;
  const sgstTotal = (tableTotal * parseFloat(sgst || 0)) / 100;
  const igstTotal = (tableTotal * parseFloat(igst || 0)) / 100;
  const finalTotal = tableTotal + cgstTotal + sgstTotal + igstTotal;
  const grandTotal = finalTotal + additionalTotal;

  const handleSaveInvoice = async () => {
    if (!billDate || !invoiceNo || !customerName || !customerGST) {
      alert("Please fill in Date, Invoice No, Customer Name and Customer GST No.");
      return;
    }

    setSaving(true);

    const bill = {
      bill_date: billDate,
      invoice_no: parseInt(invoiceNo, 10),
      customer_name: customerName,
      customer_gst: customerGST,
      cgst_percentage: parseFloat(cgst),
      sgst_percentage: parseFloat(sgst),
      igst_percentage: parseFloat(igst),
      payment_account: paymentAccount,
      content: contentRows.map((row) => ({
        sno: row.sno,
        description: row.description,
        unit: parseFloat(row.unit),
        rate: parseFloat(row.rate),
        amount: parseFloat(row.amount),
      })),
      additional_charges: additionalRows.map((row) => ({
        sno: row.sno,
        description: row.description,
        amount: parseFloat(row.amount),
      })),
      table_total: parseFloat(tableTotal.toFixed(2)),
      cgst_total: parseFloat(cgstTotal.toFixed(2)),
      sgst_total: parseFloat(sgstTotal.toFixed(2)),
      igst_total: parseFloat(igstTotal.toFixed(2)),
      final_total: parseFloat(finalTotal.toFixed(2)),
      additional_total: parseFloat(additionalTotal.toFixed(2)),
      grand_total: parseFloat(grandTotal.toFixed(2)),
    };

    let result;
    if (isStaff) {
      const reqType = mode === "duplicate" ? "duplicate" : initialData ? "update" : "create";
      result = await supabase.from("billing_requests").insert([{
        invoice_no: parseInt(invoiceNo, 10),
        request_type: reqType,
        status: "pending",
        requested_by: "staff",
        data: bill
      }]);
    } else {
      if (mode === "duplicate") {
        result = await supabase.from("billdata").insert([bill]);
      } else if (initialData) {
        result = await supabase.from("billdata").update(bill).eq("invoice_no", parseInt(invoiceNo, 10));
      } else {
        result = await supabase.from("billdata").insert([bill]);
      }
    }

    setSaving(false);
    const { error } = result;
    if (error) {
      alert("Error saving invoice: " + error.message);
      console.error(error);
    } else {
      if (isStaff) {
        alert("Change request submitted successfully! It is pending administrator approval.");
      } else {
        alert("Invoice saved successfully!");
      }
      router.push(prefix);
    }
  };

  const fmt = (num) => `₹${parseFloat(num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Basic Details */}
      <div className="card">
        <p className="card-title">Invoice Details</p>
        <div className="grid-3" style={{ marginBottom: "1rem" }}>
          <div>
            <label className="form-label">Invoice No.</label>
            <input
              type="number"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              placeholder="e.g. 1016"
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Date</label>
            <input
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Payment Account</label>
            <select
              value={paymentAccount}
              onChange={(e) => setPaymentAccount(e.target.value)}
              className="form-select"
            >
              <option value="">Select Account</option>
              <option value="Bank of India - THE HERITAGE TRAVEL">Bank of India — Heritage Travel</option>
              <option value="ICICI Bank - THE HERITAGE GROUP">ICICI Bank — Heritage Group</option>
            </select>
          </div>
        </div>
        <div className="grid-2">
          <div>
            <label className="form-label">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Full customer or company name"
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Customer GST No.</label>
            <input
              type="text"
              value={customerGST}
              onChange={(e) => setCustomerGST(e.target.value)}
              placeholder="e.g. 23XXXXX1234X1ZX"
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* GST */}
      <div className="card">
        <p className="card-title">Tax Rates</p>
        <div className="grid-3">
          <div>
            <label className="form-label">CGST (%)</label>
            <input
              type="number"
              step="0.01"
              value={cgst}
              onChange={(e) => setCgst(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">SGST (%)</label>
            <input
              type="number"
              step="0.01"
              value={sgst}
              onChange={(e) => setSgst(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">IGST (%)</label>
            <input
              type="number"
              step="0.01"
              value={igst}
              onChange={(e) => setIgst(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem 0" }}>
          <p className="card-title" style={{ marginBottom: 0 }}>Invoice Items</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="edit-table" style={{ marginTop: "1rem" }}>
            <thead>
              <tr>
                <th style={{ width: 44 }}>#</th>
                <th>Description</th>
                <th style={{ width: 90 }}>Unit</th>
                <th style={{ width: 110 }}>Rate (₹)</th>
                <th style={{ width: 120, textAlign: "right" }}>Amount (₹)</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {contentRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#9ca3af", fontSize: "0.82rem" }}>
                    No items added yet. Click &quot;Add Item&quot; below.
                  </td>
                </tr>
              ) : (
                contentRows.map((row, index) => (
                  <tr key={row.sno}>
                    <td style={{ color: "#9ca3af", fontSize: "0.8rem", paddingLeft: "1rem" }}>{index + 1}</td>
                    <td>
                      <textarea
                        className="cell-input form-textarea"
                        value={row.description}
                        onChange={(e) => updateContentRow(index, "description", e.target.value)}
                        style={{ minHeight: 56, fontSize: "0.82rem" }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="cell-input form-input"
                        value={row.unit}
                        onChange={(e) => updateContentRow(index, "unit", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="cell-input form-input"
                        value={row.rate}
                        onChange={(e) => updateContentRow(index, "rate", e.target.value)}
                      />
                    </td>
                    <td style={{ textAlign: "right", fontSize: "0.875rem", fontWeight: 500, color: "#374151", paddingRight: "0.75rem" }}>
                      {parseFloat(row.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => deleteContentRow(index)}
                        className="btn btn-sm btn-danger"
                        style={{ padding: "0.3rem 0.5rem", fontSize: "0.75rem" }}
                        title="Remove row"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "1rem 1.5rem 1.25rem" }}>
          <button onClick={addContentRow} className="btn btn-secondary btn-sm">
            + Add Item
          </button>
        </div>
      </div>

      {/* Additional Charges */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem 0" }}>
          <p className="card-title" style={{ marginBottom: 0 }}>Additional Charges <span style={{ color: "#c4c9d4", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(No GST)</span></p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="edit-table" style={{ marginTop: "1rem" }}>
            <thead>
              <tr>
                <th style={{ width: 44 }}>#</th>
                <th>Description</th>
                <th style={{ width: 140, textAlign: "right" }}>Amount (₹)</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {additionalRows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "#9ca3af", fontSize: "0.82rem" }}>
                    No additional charges.
                  </td>
                </tr>
              ) : (
                additionalRows.map((row, index) => (
                  <tr key={row.sno}>
                    <td style={{ color: "#9ca3af", fontSize: "0.8rem", paddingLeft: "1rem" }}>{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        className="cell-input form-input"
                        value={row.description}
                        onChange={(e) => updateAdditionalRow(index, "description", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="cell-input form-input"
                        value={row.amount}
                        onChange={(e) => updateAdditionalRow(index, "amount", e.target.value)}
                        style={{ textAlign: "right" }}
                      />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => deleteAdditionalRow(index)}
                        className="btn btn-sm btn-danger"
                        style={{ padding: "0.3rem 0.5rem", fontSize: "0.75rem" }}
                        title="Remove row"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "1rem 1.5rem 1.25rem" }}>
          <button onClick={addAdditionalRow} className="btn btn-secondary btn-sm">
            + Add Charge
          </button>
        </div>
      </div>

      {/* Totals */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-start" }}>
        <div className="card" style={{ flex: 1, minWidth: 260 }}>
          <p className="card-title">Summary</p>
          <div className="totals-row">
            <span>Subtotal</span>
            <span className="totals-value">{fmt(tableTotal)}</span>
          </div>
          {parseFloat(cgst || 0) > 0 && (
            <div className="totals-row">
              <span>CGST ({cgst}%)</span>
              <span className="totals-value">{fmt(cgstTotal)}</span>
            </div>
          )}
          {parseFloat(sgst || 0) > 0 && (
            <div className="totals-row">
              <span>SGST ({sgst}%)</span>
              <span className="totals-value">{fmt(sgstTotal)}</span>
            </div>
          )}
          {parseFloat(igst || 0) > 0 && (
            <div className="totals-row">
              <span>IGST ({igst}%)</span>
              <span className="totals-value">{fmt(igstTotal)}</span>
            </div>
          )}
          <div className="totals-row">
            <span>Taxable Total</span>
            <span className="totals-value">{fmt(finalTotal)}</span>
          </div>
          {additionalTotal > 0 && (
            <div className="totals-row">
              <span>Additional Charges</span>
              <span className="totals-value">{fmt(additionalTotal)}</span>
            </div>
          )}
          <div className="totals-row">
            <span>Grand Total</span>
            <span>{fmt(grandTotal)}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", minWidth: 200 }}>
          <button
            onClick={handleSaveInvoice}
            disabled={saving}
            className="btn btn-primary btn-lg"
          >
            {saving ? "Saving..." : (initialData && mode !== "duplicate") ? "Update Invoice" : "Save Invoice"}
          </button>
          <button
            onClick={() => router.push(prefix)}
            className="btn btn-outline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
