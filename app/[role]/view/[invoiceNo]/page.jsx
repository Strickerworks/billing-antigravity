"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
// import html2pdf from "html2pdf.js";
import { useParams } from "next/navigation";

export default function ViewInvoice() {
  const params = useParams();
  const invoiceParam = params.invoiceNo;
  const [invoiceNo, setInvoiceNo] = useState(invoiceParam || "");
  const [fetchedData, setFetchedData] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (invoiceParam) {
      handleFetch(invoiceParam);
    }
  }, [invoiceParam]);

  const handleFetch = async (invNo) => {
    const invNumber = invNo || invoiceNo;
    if (!invNumber) {
      alert("Please enter an Invoice Number");
      return;
    }

    setLoading(true);
    setFetchedData(null);

    const { data, error } = await supabase
      .from("billdata")
      .select("*")
      .eq("invoice_no", invNumber)
      .single();

    if (error) {
      console.error("Error fetching invoice:", error);
      alert("Invoice not found.");
    } else {
      setFetchedData(data);
    }

    setLoading(false);
  };

  const inWords = (num) => {
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
      "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
      "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const twoDigits = (n) => {
      if (n < 20) return a[n];
      return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    };
    if (num === 0) return "Zero Rupees Only";
    if (num > 99999999) return "Overflow";
    let str = "";
    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = Math.floor(num / 100);
    num %= 100;
    if (crore) str += twoDigits(crore) + " Crore ";
    if (lakh) str += twoDigits(lakh) + " Lakh ";
    if (thousand) str += twoDigits(thousand) + " Thousand ";
    if (hundred) str += a[hundred] + " Hundred ";
    if (num) {
      str += (str !== "" ? "and " : "") + twoDigits(num) + " ";
    }
    return str.trim() + " Rupees Only";
  };

  const generateAndShowPDF = () => {
    if (!fetchedData) return;

    const {
      bill_date, invoice_no, customer_name, customer_gst,
      cgst_percentage, sgst_percentage, igst_percentage, payment_account,
      table_total, cgst_total, sgst_total, igst_total, final_total,
      additional_total, grand_total, content, additional_charges
    } = fetchedData;
    const html2pdf = require("html2pdf.js");
    let brandTitle = "";
    let bankDetails = "";
    let brandEmail = "";

    if (payment_account === "Bank of India - THE HERITAGE TRAVEL") {
      brandTitle = "THE HERITAGE TRAVEL";
      bankDetails = "BANK:-BANK OF INDIA / ACCOUNT NO:- 900920110000444 / IFSC:- BKID0009009 / BRANCH:- GULMOHAR BRANCH, BHOPAL";
      brandEmail = "THEHERITAGETRAVEL@GMAIL.COM"
    } else if (payment_account === "ICICI Bank - THE HERITAGE GROUP") {
      brandTitle = "THE HERITAGE GROUP";
      bankDetails = "BANK:-ICICI BANK / ACCOUNT NO:- 234105000312 / IFSC:- ICIC0002341 / BRANCH:- GULMOHAR BRANCH, BHOPAL";
      brandEmail = "THEHERITAGEGROUPS@GMAIL.COM"
    }

    const contentRows = content.map(item => `
      <tr>
        <td style="border:1px solid black; padding:5px;">${item.sno}</td>
        <td style="border:1px solid black; padding:5px;">${item.description.replace(/\n/g, "<br>")}</td>
        <td style="border:1px solid black; padding:5px;">${item.unit}</td>
        <td style="border:1px solid black; padding:5px;">${item.rate}</td>
        <td style="border:1px solid black; padding:5px;">${item.amount}</td>
      </tr>
    `).join("");

    const additionalRows = additional_charges.map(item => `
      <tr>
        <td style="text-align:right; padding:4px;">${item.description}</td>
        <td style="text-align:right; padding:4px;">₹${item.amount}</td>
      </tr>
    `).join("");

    const template = `
      <div style="position:relative; min-height:290mm; padding:20px; font-family:'Times New Roman', serif; font-size:15px;">
        <div style="text-align:center; font-size:55px;">${brandTitle}</div>
        <div style="text-align:center; font-size:10px;">E-8/29 B, N.D.S. COLONY, GULMOHAR, BHOPAL, M.P., 462039</div>
        <div style="text-align:center; font-size:10px;">GSTIN: 23AQBPG0959P1ZO | PAN: AQBPG0959P</div>
        <div style="text-align:center; font-size:10px;">EMAIL: ${brandEmail} | PHONE: 9755373084 / 9301513400</div>
        <div style="text-align:center; margin:24px 0; font-size:16px; font-weight:bold;">TAX INVOICE</div>

        <div style="display:flex; justify-content:space-between; margin-top:10px;">
          <div style="width:65%;"><strong>Name:</strong> ${customer_name}<br><strong>GST No:</strong> ${customer_gst}</div>
          <div><strong>Invoice No:</strong> ${invoice_no}<br><strong>Date:</strong> ${bill_date}</div>
        </div>

        <div style="margin-top:10px; border:1px solid black;">
          <table style="border-collapse:collapse; width:100%; font-size:13px;">
            <thead>
              <tr>
                <th style="border:1px solid black; padding:5px;">S.No</th>
                <th style="border:1px solid black; padding:5px;">Description</th>
                <th style="border:1px solid black; padding:5px;">Unit</th>
                <th style="border:1px solid black; padding:5px;">Rate</th>
                <th style="border:1px solid black; padding:5px;">Amount</th>
              </tr>
            </thead>
            <tbody>${contentRows}</tbody>
          </table>
        </div>

        <div style="margin-top:10px;"><strong>SAC Code:</strong> 998599</div>

        <table style="width:100%; margin-top:10px; font-size:13px;">
          <tr><td style="text-align:right;"><strong>Amount:</strong></td><td style="text-align:right;">₹${table_total}</td></tr>
          ${igst_percentage > 0
        ? `<tr><td style="text-align:right;">IGST (${igst_percentage}%):</td><td style="text-align:right;">₹${igst_total}</td></tr>`
        : `<tr><td style="text-align:right;">CGST (${cgst_percentage}%):</td><td style="text-align:right;">₹${cgst_total}</td></tr>
             <tr><td style="text-align:right;">SGST (${sgst_percentage}%):</td><td style="text-align:right;">₹${sgst_total}</td></tr>`}
          ${additionalRows}
          <tr><td style="text-align:right;"><strong>Net Payable:</strong></td><td style="text-align:right;">₹${grand_total}</td></tr>
        </table>

        <div style="margin-top:10px;"><strong>In Words:</strong> ${inWords(Math.round(grand_total)).toUpperCase()} ONLY.</div>
        <div style="text-align:right; margin:30px 0px; font-size:14px;"><strong>${brandTitle}</strong></div>

        <div style="position:absolute; bottom:20px; left:20px; right:20px; font-size:12px;">
          <div>PLEASE ISSUE CHEQUE/DD ON THE NAME “${brandTitle}”</div>
          <div>${bankDetails}</div>
        </div>
      </div>
    `;

    const container = document.createElement("div");
    container.innerHTML = template;

    html2pdf()
      .from(container)
      .set({
        margin: 5,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .outputPdf("blob")
      .then((pdfBlob) => {
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
      });
  };

  useEffect(() => {
    if (fetchedData) generateAndShowPDF();
  }, [fetchedData]);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">View Invoice</h1>
        <p className="page-subtitle">
          {invoiceParam ? `Previewing Invoice #${invoiceParam}` : "Enter an invoice number to preview the PDF."}
        </p>
      </div>

      {!invoiceParam && (
        <div className="card fade-in" style={{ maxWidth: 460, marginBottom: "1.5rem" }}>
          <p className="card-title">Find Invoice</p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <input
              type="number"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              placeholder="Enter invoice number"
              className="form-input"
            />
            <button
              onClick={() => handleFetch()}
              disabled={loading}
              className="btn btn-primary"
              style={{ whiteSpace: "nowrap" }}
            >
              {loading ? "Loading..." : "Preview"}
            </button>
          </div>
          {errorMsg && (
            <p style={{ fontSize: "0.8rem", color: "#dc2626", marginTop: "0.6rem", marginBottom: 0 }}>{errorMsg}</p>
          )}
        </div>
      )}

      {loading && (
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">Generating preview...</div>
        </div>
      )}

      {pdfUrl && (
        <div className="card fade-in" style={{ padding: 0, overflow: "hidden" }}>
          <iframe src={pdfUrl} className="invoice-iframe" title="Invoice Preview" />
        </div>
      )}
    </div>
  );
}
