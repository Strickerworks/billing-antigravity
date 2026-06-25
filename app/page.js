"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Car, Calendar, Shield, Clock, Briefcase, Award, 
  CheckCircle, Star, Phone, MessageSquare, Mail, 
  MapPin, Menu, X, ArrowRight, Send, HelpCircle,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

export default function Homepage() {
  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Cursor glow state
  const glowRef = useRef(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    serviceInterested: "",
    travelDate: "",
    numberOfDays: "",
    preferredVehicleType: "",
    message: "",
    termsAccepted: false
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  
  // Carousel State & Functions
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const galleryPhotos = [
    { src: "/photos/merc/1.jpg", caption: "Mercedes-Benz Luxury Cabin (Comfort & Class)" },
    { src: "/photos/merc/2.jpg", caption: "Mercedes-Benz Luxury Saloon" },
    { src: "/photos/superb/1.jpg", caption: "Skoda Superb Premium Rear Seat Cabin" },
    { src: "/photos/superb/2.jpg", caption: "Skoda Superb Executive Saloon" },
    { src: "/photos/kodaiq/1.jpg", caption: "Skoda Kodiaq 4x4 Luxury Cockpit View" },
    { src: "/photos/kodaiq/2.jpg", caption: "Skoda Kodiaq Premium 7-Seater SUV" },
    { src: "/photos/innova/black.jpg", caption: "Toyota Innova Crysta (Sleek Black Edition)" },
    { src: "/photos/innova/new_innova.jpg", caption: "Toyota Innova Crysta Airport Transfer Setup" },
    { src: "/photos/seltos/1.jpg", caption: "Kia Seltos Sporty Urban Cabin Experience" },
    { src: "/photos/ciaz/1.jpg", caption: "Maruti Suzuki Ciaz Luxury Interior Layout" }
  ];

  const handleNextPhoto = () => {
    setActivePhotoIdx((prev) => (prev + 1) % galleryPhotos.length);
  };

  const handlePrevPhoto = () => {
    setActivePhotoIdx((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length);
  };

  // 1. Cursor Follower with Easing
  useEffect(() => {
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let frameId;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const updateGlow = () => {
      currentX += (mouseX - currentX) * 0.08;
      currentY += (mouseY - currentY) * 0.08;

      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      }

      frameId = requestAnimationFrame(updateGlow);
    };

    window.addEventListener("mousemove", handleMouseMove);
    frameId = requestAnimationFrame(updateGlow);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, []);

  // 2. IntersectionObserver for Reveal Animations
  useEffect(() => {
    const targets = document.querySelectorAll(".reveal-section, .service-card, .fleet-card, .testimonial-card, .why-item");
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -30px 0px" }
    );

    targets.forEach((el) => {
      el.classList.add("reveal-on-scroll");
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Smooth scroll handler
  const scrollToSection = (e, id) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // 3. Client-Side Field Validation
  const validateField = (name, value) => {
    let newErrors = { ...errors };

    if (name === "fullName") {
      if (!value || value.trim().length < 3) {
        newErrors.fullName = "Full Name must be at least 3 characters.";
      } else {
        delete newErrors.fullName;
      }
    }

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value || !emailRegex.test(value)) {
        newErrors.email = "Please enter a valid email address.";
      } else {
        delete newErrors.email;
      }
    }

    if (name === "phoneNumber") {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!value || !phoneRegex.test(value)) {
        newErrors.phoneNumber = "Please enter a valid 10-digit Indian phone number.";
      } else {
        delete newErrors.phoneNumber;
      }
    }

    if (name === "serviceInterested") {
      if (!value || value === "") {
        newErrors.serviceInterested = "Please select a service.";
      } else {
        delete newErrors.serviceInterested;
      }
    }

    if (name === "termsAccepted") {
      if (!value) {
        newErrors.termsAccepted = "You must agree to the conditions.";
      } else {
        delete newErrors.termsAccepted;
      }
    }

    setErrors(newErrors);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === "checkbox" ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));

    validateField(name, finalValue);
  };

  // Form Submit Handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const formErrors = {};
    if (!formData.fullName || formData.fullName.trim().length < 3) {
      formErrors.fullName = "Full Name must be at least 3 characters.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      formErrors.email = "Please enter a valid email address.";
    }
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!formData.phoneNumber || !phoneRegex.test(formData.phoneNumber)) {
      formErrors.phoneNumber = "Please enter a valid 10-digit phone number.";
    }
    if (!formData.serviceInterested || formData.serviceInterested === "") {
      formErrors.serviceInterested = "Please select a service.";
    }
    if (!formData.termsAccepted) {
      formErrors.termsAccepted = "Required checkbox.";
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      // Focus on first error element
      const firstErrorKey = Object.keys(formErrors)[0];
      const errorEl = document.getElementsByName(firstErrorKey)[0];
      if (errorEl) errorEl.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong.");
      }

      setSubmitSuccess(true);
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        serviceInterested: "",
        travelDate: "",
        numberOfDays: "",
        preferredVehicleType: "",
        message: "",
        termsAccepted: false
      });
      setErrors({});
    } catch (err) {
      setSubmitError(err.message || "Failed to submit inquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  // Testimonials list
  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "Corporate Client",
      rating: 5,
      text: "The Heritage Travels is our go-to choice for airport transfers and corporate travel in Bhopal. Clean cars, extremely polite drivers, and outstanding reliability every single time."
    },
    {
      name: "Ananya Sharma",
      role: "Family Vacationer",
      rating: 5,
      text: "Booked an SUV for a weekend trip to Sanchi. The vehicle was spotless, well-maintained, and the booking process was completely hassle-free. Exceptional service!"
    },
    {
      name: "Vikram Singh",
      role: "Business Traveler",
      rating: 5,
      text: "Excellent service with competitive and transparent pricing. No hidden costs or surprises. I highly recommend their premium sedan rentals for anyone visiting Madhya Pradesh."
    }
  ];

  return (
    <>
      {/* Interactive Cursor Follower Glow */}
      <div 
        ref={glowRef} 
        className="cursor-glow-element" 
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          transform: "translate3d(-100px, -100px, 0) translate(-50%, -50%)",
        }}
      />

      {/* Navigation Header */}
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <div className="navbar-brand-icon">H</div>
          <span className="navbar-brand-text">The Heritage Travels</span>
        </Link>

        {/* Desktop Links */}
        <div className="desktop-nav">
          <a href="#services" onClick={(e) => scrollToSection(e, "services")} className="nav-link underline-hover">Services</a>
          <a href="#why-choose-us" onClick={(e) => scrollToSection(e, "why-choose-us")} className="nav-link underline-hover">Why Us</a>
          <a href="#fleet" onClick={(e) => scrollToSection(e, "fleet")} className="nav-link underline-hover">Our Fleet</a>
          <a href="#about" onClick={(e) => scrollToSection(e, "about")} className="nav-link underline-hover">About</a>
          <a href="#testimonials" onClick={(e) => scrollToSection(e, "testimonials")} className="nav-link underline-hover">Reviews</a>
          <a href="#enquiry" onClick={(e) => scrollToSection(e, "enquiry")} className="nav-link underline-hover">Inquire</a>
          <a href="#contact" onClick={(e) => scrollToSection(e, "contact")} className="nav-link underline-hover">Contact</a>
        </div>

        {/* Portal Shortcuts */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link href="/staff" className="btn btn-secondary btn-sm" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}>
            Staff Panel
          </Link>
          <Link href="/admin" className="btn btn-gold btn-sm" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}>
            Admin
          </Link>
          <button className="hamburger" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation menu">
            <Menu size={18} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      <div className={`drawer-backdrop ${mobileMenuOpen ? "drawer-backdrop--open" : ""}`} onClick={() => setMobileMenuOpen(false)} />
      <div className={`drawer ${mobileMenuOpen ? "drawer--open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-brand">
            <div className="navbar-brand-icon" style={{ width: 28, height: 28, fontSize: 12 }}>H</div>
            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>The Heritage Travels</span>
          </div>
          <button className="drawer-close" onClick={() => setMobileMenuOpen(false)}>
            <X size={16} />
          </button>
        </div>
        <nav style={{ padding: "1.5rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <a href="#services" onClick={(e) => scrollToSection(e, "services")} className="drawer-link">Services</a>
          <a href="#why-choose-us" onClick={(e) => scrollToSection(e, "why-choose-us")} className="drawer-link">Why Us</a>
          <a href="#fleet" onClick={(e) => scrollToSection(e, "fleet")} className="drawer-link">Our Fleet</a>
          <a href="#about" onClick={(e) => scrollToSection(e, "about")} className="drawer-link">About Us</a>
          <a href="#testimonials" onClick={(e) => scrollToSection(e, "testimonials")} className="drawer-link">Reviews</a>
          <a href="#enquiry" onClick={(e) => scrollToSection(e, "enquiry")} className="drawer-link">Inquiry Form</a>
          <a href="#contact" onClick={(e) => scrollToSection(e, "contact")} className="drawer-link">Contact</a>
        </nav>
        <div className="drawer-footer">
          © 2026 The Heritage Travels
        </div>
      </div>

      <div className="page-wrapper">
        
        {/* ================= HERO SECTION ================= */}
        <section className="reveal-section" style={{ padding: "6rem 1.5rem 5rem", textAlign: "center", position: "relative" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <span style={{ 
              fontSize: "0.75rem", 
              fontWeight: 700, 
              textTransform: "uppercase", 
              letterSpacing: "0.2em", 
              color: "var(--accent)",
              background: "rgba(184, 134, 11, 0.1)",
              border: "1px solid rgba(184, 134, 11, 0.2)",
              borderRadius: "4px",
              padding: "0.35rem 0.75rem",
              display: "inline-block",
              marginBottom: "1.5rem"
            }}>
              BHOPAL'S PREMIER CAR RENTAL
            </span>
            <h1 style={{ 
              fontSize: "clamp(2rem, 5vw, 3.5rem)", 
              fontWeight: 800, 
              lineHeight: 1.1,
              marginBottom: "1.5rem"
            }}>
              Bhopal's Most Trusted Car Rental Service
            </h1>
            <p style={{ 
              fontSize: "clamp(0.95rem, 2vw, 1.25rem)", 
              color: "var(--text-secondary)", 
              maxWidth: "600px", 
              margin: "0 auto 2.5rem",
              lineHeight: 1.5
            }}>
              Premium vehicles for every journey. Drive comfort, experience corporate-grade excellence with professional drivers.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem", marginBottom: "3rem" }}>
              <a href="#enquiry" onClick={(e) => scrollToSection(e, "enquiry")} className="btn btn-gold btn-lg">
                Book Your Ride <ArrowRight size={16} />
              </a>
              <a href="#fleet" onClick={(e) => scrollToSection(e, "fleet")} className="btn btn-secondary btn-lg">
                Explore Our Fleet
              </a>
            </div>

            {/* Quick contact banner */}
            <div style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              justifyContent: "center", 
              gap: "2rem", 
              fontSize: "0.9rem", 
              color: "var(--text-muted)",
              borderTop: "1px solid var(--border)",
              paddingTop: "2rem",
              maxWidth: 600,
              margin: "0 auto"
            }}>
              <a href="tel:+919755373084" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", textDecoration: "none" }}>
                <Phone size={14} style={{ color: "var(--accent)" }} /> Call +91 9755373084
              </a>
              <a href="https://wa.me/919755373084?text=Hi!%20I%20would%20like%20to%20inquire%20about%20a%20car%20rental." target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", textDecoration: "none" }}>
                <FaWhatsapp size={16} style={{ color: "#25D366" }} /> WhatsApp Booking
              </a>
            </div>
          </div>
        </section>

        {/* ================= SERVICES OVERVIEW ================= */}
        <section id="services" className="reveal-section" style={{ padding: "4rem 1.5rem" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <h2 className="section-title">Our Services</h2>
              <h3 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0.25rem 0 0.5rem" }}>Premium Solutions for Every Need</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Comfortable, safe, and dependable travel options throughout Bhopal.</p>
            </div>

            <div className="grid-3" style={{ gap: "1.25rem" }}>
              {/* Card 1 */}
              <div className="card service-card">
                <div className="action-card-icon" style={{ marginBottom: "1rem" }}><Car size={18} /></div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Daily Car Rentals</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1rem" }}>
                  Affordable and flexible daily rental plans for local commuting, errands, and shopping in Bhopal.
                </p>
                <a href="#enquiry" onClick={(e) => scrollToSection(e, "enquiry")} style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                  Inquire Now &rarr;
                </a>
              </div>

              {/* Card 2 */}
              <div className="card service-card">
                <div className="action-card-icon" style={{ marginBottom: "1rem" }}><Award size={18} /></div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Luxury Car Rentals</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1rem" }}>
                  Experience premium, high-end sedans and SUVs for VIP business visits, weddings, and special events.
                </p>
                <a href="#enquiry" onClick={(e) => scrollToSection(e, "enquiry")} style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                  Book Luxury &rarr;
                </a>
              </div>

              {/* Card 3 */}
              <div className="card service-card">
                <div className="action-card-icon" style={{ marginBottom: "1rem" }}><Clock size={18} /></div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Airport Transfers</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1rem" }}>
                  Timely and convenient pickup/drop services to Raja Bhoj Airport (BHO) with professional drivers.
                </p>
                <a href="#enquiry" onClick={(e) => scrollToSection(e, "enquiry")} style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                  Schedule Transfer &rarr;
                </a>
              </div>

              {/* Card 4 */}
              <div className="card service-card">
                <div className="action-card-icon" style={{ marginBottom: "1rem" }}><Calendar size={18} /></div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Long-Term Leasing</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1rem" }}>
                  Save on cost with flexible leasing solutions for weeks or months, ideal for project visits or temporary stays.
                </p>
                <a href="#enquiry" onClick={(e) => scrollToSection(e, "enquiry")} style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                  Get Lease Quote &rarr;
                </a>
              </div>

              {/* Card 5 */}
              <div className="card service-card">
                <div className="action-card-icon" style={{ marginBottom: "1rem" }}><Briefcase size={18} /></div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Corporate Fleet Solutions</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1rem" }}>
                  Tailored employee transport and executive travel services with unified billing for corporate clients.
                </p>
                <a href="#enquiry" onClick={(e) => scrollToSection(e, "enquiry")} style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                  Corporate Solutions &rarr;
                </a>
              </div>

              {/* Card 6 */}
              <div className="card service-card">
                <div className="action-card-icon" style={{ marginBottom: "1rem" }}><Shield size={18} /></div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Event Transportation</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1rem" }}>
                  Coordinate complete fleet logistics for large conferences, exhibitions, family gatherings, and marriages.
                </p>
                <a href="#enquiry" onClick={(e) => scrollToSection(e, "enquiry")} style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                  Organize Event &rarr;
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ================= WHY CHOOSE US SECTION ================= */}
        <section id="why-choose-us" className="reveal-section" style={{ padding: "4rem 1.5rem", background: "rgba(10,10,10,0.5)" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "3rem", alignItems: "center" }}>
              <div>
                <h2 className="section-title" style={{ textAlign: "left" }}>Why Choose Us</h2>
                <h3 style={{ fontSize: "2rem", fontWeight: 700, margin: "0.25rem 0 1rem", lineHeight: 1.2 }}>
                  Bhopal's Travel Standard Reimagined
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                  We don't just rent cars; we curate a premium traveling experience based on reliability, professional conduct, and transparency.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
                  <div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)", fontFamily: "'Montserrat', sans-serif" }}>1000+</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Satisfied Customers</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)", fontFamily: "'Montserrat', sans-serif" }}>24/7</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Inquiry Support</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Item 1 */}
                <div className="card why-item" style={{ padding: "1.25rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <CheckCircle size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>Well-Maintained Fleet</h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Every vehicle goes through intensive safety checks, cleaning, and periodic mechanic reviews.</p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="card why-item" style={{ padding: "1.25rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <CheckCircle size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>Professional Drivers</h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Trained, background-verified, and polite drivers who know city and intercity routes inside-out.</p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="card why-item" style={{ padding: "1.25rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <CheckCircle size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>Competitive Pricing</h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Flat transparent rates, detailed digital invoices, and zero surprise surcharges or hidden costs.</p>
                  </div>
                </div>

                {/* Item 4 */}
                <div className="card why-item" style={{ padding: "1.25rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <CheckCircle size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>Easy Booking Flow</h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Submit details online, receive quick pricing confirmations, and track status instantly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= OUR FLEET SECTION ================= */}
        <section id="fleet" className="reveal-section" style={{ padding: "4rem 1.5rem" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <h2 className="section-title">Our Premium Fleet</h2>
              <h3 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0.25rem 0 0.5rem" }}>Explore Our Fleet Options</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>A curated range of cars optimized for safety, efficiency, and luxury.</p>
            </div>

            <div className="grid-3" style={{ gap: "1.5rem", marginBottom: "4rem" }}>
              {/* Fleet Card 1: Merc */}
              <div className="card fleet-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ width: "100%", height: "200px", position: "relative", overflow: "hidden", background: "#111" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/photos/merc/1.jpg" 
                    alt="Mercedes-Benz Luxury Saloon" 
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }} 
                    onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                  />
                  <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                    <span className="badge badge-blue">LUXURY SALOON</span>
                  </div>
                </div>
                <div style={{ padding: "1.5rem" }}>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>Mercedes-Benz Class</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.5rem 0 1.25rem", lineHeight: 1.5 }}>
                    Top-tier premium German engineering, luxury cabin, automatic climate control, and unmatched prestige. Ideal for VIP receptions, weddings, and premium business travels.
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                    <div>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Starting From</span>
                      <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)" }}>₹45 / km</span>
                    </div>
                    <a href="#enquiry" onClick={(e) => scrollToSection(e, "enquiry")} className="btn btn-secondary btn-sm" style={{ padding: "0.4rem 0.85rem" }}>
                      Book Luxury
                    </a>
                  </div>
                </div>
              </div>

              {/* Fleet Card 2: Skoda Kodiaq */}
              <div className="card fleet-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ width: "100%", height: "200px", position: "relative", overflow: "hidden", background: "#111" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/photos/kodaiq/1.jpg" 
                    alt="Skoda Kodiaq Premium SUV" 
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }} 
                    onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                  />
                  <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                    <span className="badge badge-blue">PREMIUM SUV</span>
                  </div>
                </div>
                <div style={{ padding: "1.5rem" }}>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>Skoda Kodiaq 4x4</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.5rem 0 1.25rem", lineHeight: 1.5 }}>
                    Active 4x4 drive, luxurious panoramic sunroof, and generous 7-seat capability. Perfect for premium family travels, outstation road trips, and rugged terrains.
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                    <div>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Starting From</span>
                      <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)" }}>₹28 / km</span>
                    </div>
                    <a href="#enquiry" onClick={(e) => scrollToSection(e, "enquiry")} className="btn btn-secondary btn-sm" style={{ padding: "0.4rem 0.85rem" }}>
                      Book SUV
                    </a>
                  </div>
                </div>
              </div>

              {/* Fleet Card 3: Skoda Superb */}
              <div className="card fleet-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ width: "100%", height: "200px", position: "relative", overflow: "hidden", background: "#111" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/photos/superb/1.jpg" 
                    alt="Skoda Superb Executive Sedan" 
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }} 
                    onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                  />
                  <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                    <span className="badge badge-blue">PREMIUM SEDAN</span>
                  </div>
                </div>
                <div style={{ padding: "1.5rem" }}>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>Skoda Superb</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.5rem 0 1.25rem", lineHeight: 1.5 }}>
                    Executive comfort levels, state-of-the-art safety features, and expansive legroom. An excellent option for executive pick-ups, business transits, and airport runs.
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                    <div>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Starting From</span>
                      <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)" }}>₹24 / km</span>
                    </div>
                    <a href="#enquiry" onClick={(e) => scrollToSection(e, "enquiry")} className="btn btn-secondary btn-sm" style={{ padding: "0.4rem 0.85rem" }}>
                      Book Sedan
                    </a>
                  </div>
                </div>
              </div>

              {/* Fleet Card 4: Innova Crysta */}
              <div className="card fleet-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ width: "100%", height: "200px", position: "relative", overflow: "hidden", background: "#111" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/photos/innova/black.jpg" 
                    alt="Toyota Innova Crysta" 
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }} 
                    onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                  />
                  <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                    <span className="badge badge-blue">EXECUTIVE SUV</span>
                  </div>
                </div>
                <div style={{ padding: "1.5rem" }}>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>Toyota Innova Crysta</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.5rem 0 1.25rem", lineHeight: 1.5 }}>
                    The undisputed king of comfort. Powerful AC, spacious seating configuration, and smooth suspension. Bhopal's top choice for long-range family journeys.
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                    <div>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Starting From</span>
                      <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)" }}>₹20 / km</span>
                    </div>
                    <a href="#enquiry" onClick={(e) => scrollToSection(e, "enquiry")} className="btn btn-secondary btn-sm" style={{ padding: "0.4rem 0.85rem" }}>
                      Book Crysta
                    </a>
                  </div>
                </div>
              </div>

              {/* Fleet Card 5: Kia Seltos */}
              <div className="card fleet-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ width: "100%", height: "200px", position: "relative", overflow: "hidden", background: "#111" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/photos/seltos/1.jpg" 
                    alt="Kia Seltos SUV" 
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }} 
                    onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                  />
                  <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                    <span className="badge badge-blue">COMPACT SUV</span>
                  </div>
                </div>
                <div style={{ padding: "1.5rem" }}>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>Kia Seltos</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.5rem 0 1.25rem", lineHeight: 1.5 }}>
                    Modern sporty design, high ground clearance, and sleek digital cockpit. Ideal for urban commutes and family holiday outings in style.
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                    <div>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Starting From</span>
                      <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)" }}>₹16 / km</span>
                    </div>
                    <a href="#enquiry" onClick={(e) => scrollToSection(e, "enquiry")} className="btn btn-secondary btn-sm" style={{ padding: "0.4rem 0.85rem" }}>
                      Book Seltos
                    </a>
                  </div>
                </div>
              </div>

              {/* Fleet Card 6: Ciaz */}
              <div className="card fleet-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ width: "100%", height: "200px", position: "relative", overflow: "hidden", background: "#111" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/photos/ciaz/1.jpg" 
                    alt="Maruti Suzuki Ciaz" 
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }} 
                    onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                  />
                  <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                    <span className="badge badge-blue">EXECUTIVE SEDAN</span>
                  </div>
                </div>
                <div style={{ padding: "1.5rem" }}>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>Maruti Suzuki Ciaz</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.5rem 0 1.25rem", lineHeight: 1.5 }}>
                    Highly fuel-efficient, spacious boot capacity, and comfortable leather seating. An excellent budget sedan for local and inter-city commutes.
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                    <div>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Starting From</span>
                      <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)" }}>₹14 / km</span>
                    </div>
                    <a href="#enquiry" onClick={(e) => scrollToSection(e, "enquiry")} className="btn btn-secondary btn-sm" style={{ padding: "0.4rem 0.85rem" }}>
                      Book Ciaz
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* SHOWROOM GALLERY CAROUSEL */}
            <div className="card reveal-section" style={{ padding: "2rem", border: "1px solid var(--border)", background: "var(--bg-card)" }}>
              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <span className="badge badge-blue" style={{ marginBottom: "0.5rem" }}>FLEET SHOWROOM</span>
                <h4 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>Our Actual Vehicle Gallery</h4>
              </div>

              {/* Slider View */}
              <div style={{ position: "relative", width: "100%", height: "clamp(250px, 45vw, 480px)", borderRadius: "8px", overflow: "hidden", background: "#050505", border: "1px solid var(--border)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={galleryPhotos[activePhotoIdx].src} 
                  alt={galleryPhotos[activePhotoIdx].caption} 
                  style={{ width: "100%", height: "100%", objectFit: "contain", transition: "opacity 0.3s ease-in-out" }}
                />
                
                {/* Text Overlay */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1.25rem", background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    {galleryPhotos[activePhotoIdx].caption}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>
                    {activePhotoIdx + 1} / {galleryPhotos.length}
                  </span>
                </div>

                {/* Left/Right Buttons */}
                <button 
                  onClick={handlePrevPhoto} 
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "36px", height: "36px", borderRadius: "50%", background: "rgba(20,20,20,0.8)", border: "1px solid var(--border)", color: "#fff", display: "flex", alignItems: "center", justify: "center", cursor: "pointer", zIndex: 5, transition: "background 0.2s" }}
                  onMouseOver={(e) => e.currentTarget.style.background = "rgba(184, 134, 11, 0.4)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "rgba(20,20,20,0.8)"}
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={handleNextPhoto} 
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", width: "36px", height: "36px", borderRadius: "50%", background: "rgba(20,20,20,0.8)", border: "1px solid var(--border)", color: "#fff", display: "flex", alignItems: "center", justify: "center", cursor: "pointer", zIndex: 5, transition: "background 0.2s" }}
                  onMouseOver={(e) => e.currentTarget.style.background = "rgba(184, 134, 11, 0.4)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "rgba(20,20,20,0.8)"}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Thumbnails indicator bar */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.5rem", marginTop: "1.25rem" }}>
                {galleryPhotos.map((photo, index) => (
                  <button 
                    key={index} 
                    onClick={() => setActivePhotoIdx(index)}
                    style={{ 
                      width: "6px", 
                      height: "6px", 
                      borderRadius: "50%", 
                      padding: 0,
                      border: "none", 
                      background: activePhotoIdx === index ? "var(--accent)" : "var(--border)", 
                      cursor: "pointer",
                      transition: "background 0.2s"
                    }} 
                    aria-label={`Show photo ${index + 1}`}
                  />
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ================= ABOUT US SECTION ================= */}
        <section id="about" className="reveal-section" style={{ padding: "4rem 1.5rem", background: "rgba(10,10,10,0.5)" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div className="info-grid-2" style={{ alignItems: "center" }}>
              <div>
                <h2 className="section-title" style={{ textAlign: "left" }}>About The Heritage Travels</h2>
                <h3 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0.25rem 0 1.25rem", color: "var(--text-primary)" }}>
                  Crafting Reliable Passenger Journeys Since 2017
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "1rem" }}>
                  The Heritage Travels is Bhopal's trusted car rental partner, dedicated to providing premium vehicles and exceptional service. We believe every journey deserves absolute comfort and uncompromised safety.
                </p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                  Whether you are traveling for local business meetings, holiday excursions around Madhya Pradesh, airport transits, or wedding events, our well-supervised fleet and disciplined drivers ensure your travel itineraries execute flawlessly.
                </p>
                
                <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem" }}>
                  <div style={{ borderLeft: "2px solid var(--accent)", paddingLeft: "1rem" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase" }}>Our Core Mission</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Provide reliable, clean vehicles at highly reasonable pricing packages.</div>
                  </div>
                </div>
              </div>

              {/* Graphical Box indicating experience stats */}
              <div className="card" style={{ 
                padding: "2.5rem 2rem", 
                background: "linear-gradient(135deg, rgba(20,20,20,0.8) 0%, rgba(10,10,10,0.8) 100%)",
                border: "1px solid var(--border)",
                textAlign: "center"
              }}>
                <span className="badge badge-blue" style={{ marginBottom: "1rem" }}>FLEET &amp; TEAM METRICS</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>20+</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem", textTransform: "uppercase" }}>Active Fleet Cars</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>15+</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem", textTransform: "uppercase" }}>Trained Drivers</div>
                  </div>
                  <div style={{ gridColumn: "1 / -1", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
                    <div style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--accent)" }}>12+ Years</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem", textTransform: "uppercase" }}>Combined Service Experience</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= TESTIMONIALS SECTION ================= */}
        <section id="testimonials" className="reveal-section" style={{ padding: "4rem 1.5rem" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <h2 className="section-title">What Our Customers Say</h2>
              <h3 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0.25rem 0 0.5rem" }}>Authentic Client Experiences</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Reviews left by our daily, corporate, and tourism travelers.</p>
            </div>

            <div className="grid-3" style={{ gap: "1.25rem" }}>
              {testimonials.map((test, index) => (
                <div key={index} className="card testimonial-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    {/* Stars */}
                    <div style={{ display: "flex", gap: "0.15rem", marginBottom: "1rem" }}>
                      {[...Array(test.rating)].map((_, i) => (
                        <Star key={i} size={14} style={{ fill: "var(--accent)", color: "var(--accent)" }} />
                      ))}
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.6 }}>
                      "{test.text}"
                    </p>
                  </div>
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.85rem", marginTop: "1.25rem" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{test.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{test.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= ENQUIRY FORM SECTION ================= */}
        <section id="enquiry" className="reveal-section" style={{ padding: "4rem 1.5rem", background: "rgba(10,10,10,0.5)" }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <h2 className="section-title">Book Your Journey</h2>
              <h3 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0.25rem 0 0.5rem" }}>Send a Quick Inquiry</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Fill the form below and we will contact you with a customized quote.</p>
            </div>

            <div className="card" style={{ position: "relative", border: "1px solid var(--border)" }}>
              {/* Form Success Overlay */}
              {submitSuccess && (
                <div style={{ 
                  position: "absolute", 
                  inset: 0, 
                  background: "var(--bg-card-solid)", 
                  borderRadius: "12px", 
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "2rem",
                  textAlign: "center",
                  animation: "fadeIn 0.3s forwards"
                }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
                  <h4 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)", marginBottom: "0.5rem" }}>Inquiry Submitted!</h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "400px", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                    Thank you for writing to us. We have received your request and logged it successfully. Our booking operator will reach out to you within the next 24 hours.
                  </p>
                  <button 
                    onClick={() => setSubmitSuccess(false)} 
                    className="btn btn-gold"
                    style={{ fontSize: "0.8rem", padding: "0.5rem 1.5rem" }}
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              )}

              <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                
                {submitError && (
                  <div style={{ 
                    padding: "0.75rem 1rem", 
                    background: "rgba(239, 68, 68, 0.1)", 
                    border: "1px solid rgba(239, 68, 68, 0.2)", 
                    borderRadius: "6px", 
                    color: "#EF4444", 
                    fontSize: "0.85rem" 
                  }}>
                    ⚠️ {submitError}
                  </div>
                )}

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input 
                      type="text" 
                      name="fullName"
                      placeholder="e.g. Rahul Sharma"
                      className="form-input"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      style={{ borderColor: errors.fullName ? "rgba(239, 68, 68, 0.4)" : "var(--border)" }}
                    />
                    {errors.fullName && <span style={{ color: "#EF4444", fontSize: "0.7rem", marginTop: "0.25rem", display: "block" }}>{errors.fullName}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input 
                      type="email" 
                      name="email"
                      placeholder="e.g. rahul@gmail.com"
                      className="form-input"
                      value={formData.email}
                      onChange={handleInputChange}
                      style={{ borderColor: errors.email ? "rgba(239, 68, 68, 0.4)" : "var(--border)" }}
                    />
                    {errors.email && <span style={{ color: "#EF4444", fontSize: "0.7rem", marginTop: "0.25rem", display: "block" }}>{errors.email}</span>}
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input 
                      type="tel" 
                      name="phoneNumber"
                      placeholder="10-digit mobile number"
                      className="form-input"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      style={{ borderColor: errors.phoneNumber ? "rgba(239, 68, 68, 0.4)" : "var(--border)" }}
                    />
                    {errors.phoneNumber && <span style={{ color: "#EF4444", fontSize: "0.7rem", marginTop: "0.25rem", display: "block" }}>{errors.phoneNumber}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Service Interested In *</label>
                    <select 
                      name="serviceInterested"
                      className="form-select"
                      value={formData.serviceInterested}
                      onChange={handleInputChange}
                      style={{ borderColor: errors.serviceInterested ? "rgba(239, 68, 68, 0.4)" : "var(--border)" }}
                    >
                      <option value="">-- Select Service --</option>
                      <option value="Daily Car Rental">Daily Car Rental</option>
                      <option value="Luxury Car Rental">Luxury Car Rental</option>
                      <option value="Airport Transfer">Airport Transfer</option>
                      <option value="Long-term Lease">Long-term Lease</option>
                      <option value="Corporate Fleet">Corporate Fleet</option>
                      <option value="Event Transportation">Event Transportation</option>
                      <option value="Other">Other Query</option>
                    </select>
                    {errors.serviceInterested && <span style={{ color: "#EF4444", fontSize: "0.7rem", marginTop: "0.25rem", display: "block" }}>{errors.serviceInterested}</span>}
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Travel Date (Optional)</label>
                    <input 
                      type="date" 
                      name="travelDate"
                      className="form-input"
                      value={formData.travelDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Number of Days (Optional)</label>
                    <input 
                      type="number" 
                      name="numberOfDays"
                      min="1"
                      placeholder="e.g. 3"
                      className="form-input"
                      value={formData.numberOfDays}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Preferred Vehicle Category</label>
                  <select
                    name="preferredVehicleType"
                    className="form-select"
                    value={formData.preferredVehicleType}
                    onChange={handleInputChange}
                  >
                    <option value="">-- Choose Category --</option>
                    <option value="Budget Hatchback">Economy Hatchback (e.g. Swift)</option>
                    <option value="Premium Sedan">Executive Sedan (e.g. Honda City)</option>
                    <option value="Family SUV">Family SUV (e.g. Innova)</option>
                    <option value="Luxury Sedan">Luxury Sedan (Audi/Mercedes)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Special Travel Notes (Optional)</label>
                  <textarea 
                    name="message"
                    rows="3"
                    placeholder="Tell us about destinations, travel times or driver preferences..."
                    className="form-textarea"
                    value={formData.message}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group" style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginTop: "0.5rem" }}>
                  <input 
                    type="checkbox" 
                    name="termsAccepted"
                    id="termsAccepted"
                    style={{ marginTop: "3px", cursor: "pointer" }}
                    checked={formData.termsAccepted}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="termsAccepted" style={{ fontSize: "0.78rem", color: "var(--text-secondary)", cursor: "pointer", select: "none" }}>
                    I agree to be contacted by The Heritage Travels team regarding this rental booking request. *
                  </label>
                </div>
                {errors.termsAccepted && <span style={{ color: "#EF4444", fontSize: "0.7rem", display: "block", marginTop: "-0.5rem" }}>{errors.termsAccepted}</span>}

                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="btn btn-gold btn-full"
                  style={{ marginTop: "1rem" }}
                >
                  {submitting ? "Submitting Inquiry..." : "Submit Inquiry Request"}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ================= CONTACT SECTION ================= */}
        <section id="contact" className="reveal-section" style={{ padding: "4rem 1.5rem" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <h2 className="section-title">Get in Touch</h2>
              <h3 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0.25rem 0 0.5rem" }}>We Are Available For You</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Contact us directly for custom quotes, contracts, and wedding bookings.</p>
            </div>

            <div className="grid-4" style={{ gap: "1.25rem" }}>
              {/* Box 1: Phone */}
              <div className="card" style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
                <div className="action-card-icon" style={{ margin: "0 auto 1.25rem" }}><Phone size={16} /></div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Call Us</h4>
                <div style={{ fontSize: "0.85rem", color: "var(--accent)", fontWeight: 700, margin: "0.5rem 0 1rem" }}>+91 9755373084</div>
                <a href="tel:+919755373084" className="btn btn-secondary btn-sm btn-full" style={{ fontSize: "0.75rem" }}>
                  Call Now
                </a>
              </div>

              {/* Box 2: WhatsApp */}
              <div className="card" style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
                <div className="action-card-icon" style={{ margin: "0 auto 1.25rem", color: "#25D366", borderColor: "rgba(37, 211, 102, 0.25)" }}><FaWhatsapp size={18} style={{ color: "#25D366" }} /></div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>WhatsApp Us</h4>
                <div style={{ fontSize: "0.85rem", color: "#25D366", fontWeight: 700, margin: "0.5rem 0 1rem" }}>+91 9755373084</div>
                <a href="https://wa.me/919755373084?text=Hi!%20I%20would%20like%20to%20book%20a%20car." target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm btn-full" style={{ fontSize: "0.75rem" }}>
                  Chat Online
                </a>
              </div>

              {/* Box 3: Hours */}
              <div className="card" style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
                <div className="action-card-icon" style={{ margin: "0 auto 1.25rem" }}><Clock size={16} /></div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Business Hours</h4>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.75rem", lineHeight: 1.4 }}>
                  Monday - Sunday
                  <br />
                  <strong>6:00 AM - 11:00 PM</strong>
                </div>
              </div>

              {/* Box 4: Address */}
              <div className="card" style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
                <div className="action-card-icon" style={{ margin: "0 auto 1.25rem" }}><MapPin size={16} /></div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Location</h4>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.75rem", lineHeight: 1.4 }}>
                  Arera Colony, Bhopal
                  <br />
                  Madhya Pradesh, India
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ================= FOOTER ================= */}
      <footer className="footer" style={{ marginTop: 0 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "2.5rem", textAlign: "left", paddingBottom: "3rem" }}>
          
          {/* Col 1 */}
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>The Heritage Travels</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 220 }}>
              Premium car rental services in Bhopal. Elevating commutes, executive travels, and tourism logs since 2017.
            </p>
          </div>

          {/* Col 2: Contact Details Only */}
          <div>
            <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>Contact Details</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              <span>📞 +91 9755373084</span>
              <span>💬 +91 9755373084</span>
              <span>📍 Bhopal, MP, India</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem", textAlign: "center", maxWidth: 1000, margin: "0 auto", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          <span>© 2026 The Heritage Travels. All rights reserved.</span>
        </div>
      </footer>
    </>
  );
}
