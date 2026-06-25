"use client";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const params = useParams();
  const role = params.role || (pathname.startsWith("/admin") ? "admin" : "staff");
  const isStaff = role === "staff";
  const isAdmin = role === "admin";
  const prefix = `/${role}`;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'invoice', 'requests', 'track'
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close drawer/dropdowns on route change
  useEffect(() => {
    setDrawerOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  // Dropdown Items Definition
  const invoiceItems = [
    { href: `${prefix}/add-invoice`, label: "New Invoice" },
    { href: `${prefix}/fetch`, label: "All Invoices" },
    { href: `${prefix}/edit`, label: "Edit Invoice" },
    { href: `${prefix}/duplicate`, label: "Duplicate Invoice" },
    { href: `${prefix}/view`, label: "View Invoice" },
    { href: `${prefix}/print`, label: "Download PDF" },
  ];
  if (isAdmin) {
    invoiceItems.push({ href: `${prefix}/recycle-bin`, label: "Recycle Bin" });
  }

  const requestItems = [
    { href: `${prefix}/expenses/add`, label: "Add Expense" },
    { href: `${prefix}/payment-request/add`, label: "Add Payment Request" },
  ];

  const trackItems = [
    { href: `${prefix}/requests`, label: "Invoice Requests" },
    { href: `${prefix}/expenses`, label: "Expense Requests" },
    { href: `${prefix}/payment-request`, label: "Payment Requests" },
    { href: `${prefix}/fleet-requests`, label: "Fleet Requests" },
    { href: `${prefix}/audit-log`, label: "Audit Log" },
  ];

  const vehicleItems = [
    { href: `${prefix}/cars`, label: "Cars Profile" },
    { href: `${prefix}/drivers`, label: "Drivers" },
  ];

  const toggleDropdown = (name) => {
    if (activeDropdown === name) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(name);
    }
  };

  return (
    <>
      <nav className="navbar" ref={dropdownRef}>
        <Link href={prefix} className="navbar-brand">
          <div className="navbar-brand-icon">H</div>
          <span className="navbar-brand-text">Heritage Invoice</span>
        </Link>

        {/* Desktop links with Dropdowns */}
        <div className="navbar-links desktop-nav" style={{ gap: "1rem", alignItems: "center" }}>
          <Link href={prefix} className={`nav-link ${pathname === prefix ? "active" : ""}`}>
            Home
          </Link>

          {/* 1. Invoice Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => toggleDropdown("invoice")}
              className={`nav-link ${activeDropdown === "invoice" ? "active" : ""}`}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              Invoice ▾
            </button>
            {activeDropdown === "invoice" && (
              <div className="dropdown-menu">
                {invoiceItems.map((item) => (
                  <Link key={item.href} href={item.href} className="dropdown-item">
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 2. Requests Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => toggleDropdown("requests")}
              className={`nav-link ${activeDropdown === "requests" ? "active" : ""}`}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              Requests ▾
            </button>
            {activeDropdown === "requests" && (
              <div className="dropdown-menu">
                {requestItems.map((item) => (
                  <Link key={item.href} href={item.href} className="dropdown-item">
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 3. Track Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => toggleDropdown("track")}
              className={`nav-link ${activeDropdown === "track" ? "active" : ""}`}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              Track ▾
            </button>
            {activeDropdown === "track" && (
              <div className="dropdown-menu">
                {trackItems.map((item) => (
                  <Link key={item.href} href={item.href} className="dropdown-item">
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 4. Vehicles Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => toggleDropdown("vehicles")}
              className={`nav-link ${activeDropdown === "vehicles" ? "active" : ""}`}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              Vehicles ▾
            </button>
            {activeDropdown === "vehicles" && (
              <div className="dropdown-menu" style={{ right: 0, left: "auto" }}>
                {vehicleItems.map((item) => (
                  <Link key={item.href} href={item.href} className="dropdown-item">
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hamburger button — mobile only */}
        <button
          className="hamburger"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Backdrop */}
      <div
        className={`drawer-backdrop ${drawerOpen ? "drawer-backdrop--open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Side Drawer (Mobile Menu) */}
      <div className={`drawer ${drawerOpen ? "drawer--open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-brand">
            <div className="navbar-brand-icon" style={{ width: 28, height: 28, fontSize: 12 }}>H</div>
            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>Heritage Invoice</span>
          </div>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
            ✕
          </button>
        </div>

        <nav className="drawer-nav" style={{ overflowY: "auto", maxHeight: "calc(100vh - 120px)", padding: "1rem" }}>
          <Link href={prefix} className="drawer-link" style={{ fontWeight: 600 }}>
            Home
          </Link>

          {/* Collapsible Mobile Invoice */}
          <div style={{ margin: "0.5rem 0" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", padding: "0.5rem 0.75rem 0.25rem" }}>
              Invoice Operations
            </div>
            {invoiceItems.map((item) => (
              <Link key={item.href} href={item.href} className="drawer-link" style={{ paddingLeft: "1.5rem", fontSize: "0.85rem" }}>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Collapsible Mobile Requests */}
          <div style={{ margin: "0.5rem 0" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", padding: "0.5rem 0.75rem 0.25rem" }}>
              Submit New Request
            </div>
            {requestItems.map((item) => (
              <Link key={item.href} href={item.href} className="drawer-link" style={{ paddingLeft: "1.5rem", fontSize: "0.85rem" }}>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Collapsible Mobile Track */}
          <div style={{ margin: "0.5rem 0" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", padding: "0.5rem 0.75rem 0.25rem" }}>
              Track &amp; Review Logs
            </div>
            {trackItems.map((item) => (
              <Link key={item.href} href={item.href} className="drawer-link" style={{ paddingLeft: "1.5rem", fontSize: "0.85rem" }}>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Collapsible Mobile Vehicles */}
          <div style={{ margin: "0.5rem 0" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", padding: "0.5rem 0.75rem 0.25rem" }}>
              Cars &amp; Drivers
            </div>
            {vehicleItems.map((item) => (
              <Link key={item.href} href={item.href} className="drawer-link" style={{ paddingLeft: "1.5rem", fontSize: "0.85rem" }}>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="drawer-footer">
          © 2026 The Heritage Group
        </div>
      </div>

      {/* Styled dropdown rules */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          background: var(--bg-card);
          border: 1px solid var(--border);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border-radius: 8px;
          min-width: 180px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          padding: 0.5rem 0;
          margin-top: 0.25rem;
          animation: navFadeIn 0.15s ease-out;
        }
        .dropdown-item {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          color: var(--text-primary);
          text-decoration: none;
          transition: background 0.1s, color 0.1s;
        }
        .dropdown-item:hover {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }
        @keyframes navFadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </>
  );
}
