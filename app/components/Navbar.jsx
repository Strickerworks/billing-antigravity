"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/admin", label: "Home" },
  { href: "/admin/add-invoice", label: "New Invoice" },
  { href: "/admin/fetch", label: "All Invoices" },
  { href: "/admin/edit", label: "Edit" },
  { href: "/admin/duplicate", label: "Duplicate" },
  { href: "/admin/print", label: "Download" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
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

  return (
    <>
      <nav className="navbar">
        <Link href="/admin" className="navbar-brand">
          <div className="navbar-brand-icon">H</div>
          <span className="navbar-brand-text">Heritage Invoice</span>
        </Link>

        {/* Desktop links */}
        <div className="navbar-links desktop-nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${pathname === link.href ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
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

      {/* Side Drawer */}
      <div className={`drawer ${drawerOpen ? "drawer--open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-brand">
            <div className="navbar-brand-icon" style={{ width: 28, height: 28, fontSize: 12 }}>H</div>
            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111111" }}>Heritage Invoice</span>
          </div>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
            ✕
          </button>
        </div>

        <div className="drawer-section-label">Navigation</div>

        <nav className="drawer-nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`drawer-link ${pathname === link.href ? "drawer-link--active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="drawer-footer">
          © 2025 The Heritage Group
        </div>
      </div>
    </>
  );
}
