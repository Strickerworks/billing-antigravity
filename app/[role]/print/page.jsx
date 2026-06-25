"use client";
import React, { useState } from "react";
import { supabase } from "@/utils/supabase/client";

export default function PrintInvoice() {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFetchAndDownload = async () => {
    if (!invoiceNo) {
      alert("Please enter an Invoice Number");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from("billdata")
      .select("*")
      .eq("invoice_no", invoiceNo)
      .single();

    if (error || !data) {
      alert("Invoice not found.");
      setLoading(false);
      return;
    }

    generatePDF(data);
    setLoading(false);
  };

  const inWords = (num) => {
    const a = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
      "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
      "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    if (num === 0) return "Zero Rupees";
    if (num > 99999999) return "Overflow";
    let str = "";
    const crore = Math.floor(num / 10000000); num %= 10000000;
    const lakh = Math.floor(num / 100000); num %= 100000;
    const thousand = Math.floor(num / 1000); num %= 1000;
    const hundred = Math.floor(num / 100); num %= 100;
    if (crore) str += `${a[crore]} Crore `;
    if (lakh) str += `${a[lakh]} Lakh `;
    if (thousand) str += `${a[thousand]} Thousand `;
    if (hundred) str += `${a[hundred]} Hundred `;
    if (num) str += (str !== "" ? "and " : "") + (a[num] || (b[Math.floor(num / 10)] + " " + a[num % 10])) + " ";
    return str + "Rupees";
  };

  const generatePDF = (fetchedData) => {
    const {
      bill_date, invoice_no, customer_name, customer_gst,
      cgst_percentage, sgst_percentage, igst_percentage, payment_account,
      table_total, cgst_total, sgst_total, igst_total,
      additional_total, grand_total, content, additional_charges,
    } = fetchedData;

    const html2pdf = require("html2pdf.js");

    let brandTitle = "", bankDetails = "", brandEmail = "";
    if (payment_account === "Bank of India - THE HERITAGE TRAVEL") {
      brandTitle = "THE HERITAGE TRAVEL";
      bankDetails = "BANK:-BANK OF INDIA / ACCOUNT NO:- 900920110000444 / IFSC:- BKID0009009 / BRANCH:- GULMOHAR BRANCH, BHOPAL";
      brandEmail = "THEHERITAGETRAVEL@GMAIL.COM";
    } else if (payment_account === "ICICI Bank - THE HERITAGE GROUP") {
      brandTitle = "THE HERITAGE GROUP";
      bankDetails = "BANK:-ICICI BANK / ACCOUNT NO:- 234105000312 / IFSC:- ICIC0002341 / BRANCH:- GULMOHAR BRANCH, BHOPAL";
      brandEmail = "THEHERITAGEGROUPS@GMAIL.COM";
    }

    const contentRows = content.map((item) => `
      <tr>
        <td style="border:1px solid #ccc; padding:6px; text-align:center;">${item.sno}</td>
        <td style="border:1px solid #ccc; padding:6px;">${item.description.replace(/\n/g, "<br>")}</td>
        <td style="border:1px solid #ccc; padding:6px; text-align:center;">${item.unit}</td>
        <td style="border:1px solid #ccc; padding:6px; text-align:right;">₹${item.rate.toLocaleString("en-IN")}</td>
        <td style="border:1px solid #ccc; padding:6px; text-align:right;">₹${item.amount.toLocaleString("en-IN")}</td>
      </tr>`).join("");

    const additionalRows = additional_charges.map((item) => `
      <tr>
        <td style="text-align:right; padding:4px; color:#555;">${item.description}</td>
        <td style="text-align:right; padding:4px;">₹${item.amount.toLocaleString("en-IN")}</td>
      </tr>`).join("");

    const template = `
      <div style="position:relative; min-height:290mm; padding:24px 28px; font-family:'Times New Roman', serif; font-size:14px; color:#111;">
        <div style="text-align:center; font-size:48px; font-weight:bold; letter-spacing:2px;">${brandTitle}</div>
        <div style="text-align:center; font-size:10px; color:#555; margin-top:4px;">E-8/29 B, N.D.S. COLONY, GULMOHAR, BHOPAL, M.P., 462039</div>
        <div style="text-align:center; font-size:10px; color:#555;">GSTIN: 23AQBPG0959P1ZO | PAN: AQBPG0959P</div>
        <div style="text-align:center; font-size:10px; color:#555;">EMAIL: ${brandEmail} | PHONE: 9755373084 / 9301513400</div>
        <div style="text-align:center; margin:18px 0 12px; font-size:15px; font-weight:bold; letter-spacing:2px; border-top:2px solid #111; border-bottom:2px solid #111; padding:6px 0;">TAX INVOICE</div>
        <div style="display:flex; justify-content:space-between; margin:10px 0 14px;">
          <div><strong>To:</strong> ${customer_name}<br><strong>GSTIN:</strong> ${customer_gst}</div>
          <div style="text-align:right;"><strong>Invoice No:</strong> ${invoice_no}<br><strong>Date:</strong> ${bill_date}</div>
        </div>
        <table style="border-collapse:collapse; width:100%; font-size:13px;">
          <thead>
            <tr style="background:var(--bg-elevated);">
              <th style="border:1px solid #ccc; padding:7px; text-align:center; width:40px;">S.No</th>
              <th style="border:1px solid #ccc; padding:7px; text-align:left;">Description</th>
              <th style="border:1px solid #ccc; padding:7px; text-align:center; width:50px;">Unit</th>
              <th style="border:1px solid #ccc; padding:7px; text-align:right; width:90px;">Rate</th>
              <th style="border:1px solid #ccc; padding:7px; text-align:right; width:100px;">Amount</th>
            </tr>
          </thead>
          <tbody>${contentRows}</tbody>
        </table>
        <div style="margin-top:8px; font-size:12px; color:#555;"><strong>SAC Code:</strong> 998599</div>
        <table style="width:100%; margin-top:10px; font-size:13px;">
          <tr><td style="text-align:right; padding:3px;"><strong>Amount:</strong></td><td style="text-align:right; width:120px; padding:3px;">₹${table_total?.toLocaleString("en-IN")}</td></tr>
          ${igst_percentage > 0
            ? `<tr><td style="text-align:right; padding:3px;">IGST (${igst_percentage}%):</td><td style="text-align:right; padding:3px;">₹${igst_total?.toLocaleString("en-IN")}</td></tr>`
            : `<tr><td style="text-align:right; padding:3px;">CGST (${cgst_percentage}%):</td><td style="text-align:right; padding:3px;">₹${cgst_total?.toLocaleString("en-IN")}</td></tr>
               <tr><td style="text-align:right; padding:3px;">SGST (${sgst_percentage}%):</td><td style="text-align:right; padding:3px;">₹${sgst_total?.toLocaleString("en-IN")}</td></tr>`
          }
          ${additionalRows}
          <tr style="border-top:2px solid #111;"><td style="text-align:right; padding:5px;"><strong>Net Payable:</strong></td><td style="text-align:right; padding:5px; font-weight:bold;">₹${grand_total?.toLocaleString("en-IN")}</td></tr>
        </table>
        <div style="margin-top:10px; font-size:12px;"><strong>In Words:</strong> ${inWords(Math.round(grand_total)).toUpperCase()} ONLY.</div>
        <div style="text-align:right; margin:28px 0 10px; font-size:13px;"><strong>${brandTitle}</strong></div>
        <div style="position:absolute; bottom:20px; left:28px; right:28px; font-size:11px; color:#555; border-top:1px solid #ddd; padding-top:8px;">
          <div>PLEASE ISSUE CHEQUE/DD IN THE NAME OF "${brandTitle}"</div>
          <div style="margin-top:2px;">${bankDetails}</div>
        </div>
      </div>`;

    const invoiceDiv = document.createElement("div");
    invoiceDiv.innerHTML = template;
    document.body.appendChild(invoiceDiv);

    html2pdf().from(invoiceDiv).set({
      margin: 5,
      filename: `Invoice_${invoice_no}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }).save().then(() => {
      document.body.removeChild(invoiceDiv);
    });
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Download Invoice</h1>
        <p className="page-subtitle">Enter an invoice number to generate and download the PDF.</p>
      </div>

      <div className="card fade-in" style={{ maxWidth: 460 }}>
        <p className="card-title">Generate PDF</p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input
            type="number"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetchAndDownload()}
            placeholder="Enter invoice number"
            className="form-input"
          />
          <button
            onClick={handleFetchAndDownload}
            disabled={loading}
            className="btn btn-primary"
            style={{ whiteSpace: "nowrap" }}
          >
            {loading ? "Generating..." : "↓ Download"}
          </button>
        </div>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.75rem", marginBottom: 0 }}>
          The PDF will be downloaded automatically to your device.
        </p>
      </div>
    </div>
  );
}
