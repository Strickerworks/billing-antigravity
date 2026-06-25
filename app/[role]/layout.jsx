"use client";
import React, { useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import { useParams, notFound, usePathname } from "next/navigation";

export default function RoleLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const role = params.role;

  const glowRef = useRef(null);

  if (role !== "admin" && role !== "staff") {
    notFound();
  }

  // 1. Cursor Follower with Inertia/Lag
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

  // 2. Programmatic Scroll Reveal (IntersectionObserver)
  useEffect(() => {
    // Dynamically find all cards, tables, headers, forms and flag them for reveal
    const targets = document.querySelectorAll(
      ".card, .action-card, .data-table-wrapper, .page-header, .registry-header, .form-group"
    );
    
    targets.forEach((el) => {
      if (!el.classList.contains("reveal-on-scroll")) {
        el.classList.add("reveal-on-scroll");
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target); // Reveal once
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const revealables = document.querySelectorAll(".reveal-on-scroll");
    revealables.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return (
    <>
      <Navbar />
      
      {/* Dynamic Cursor Glow Element */}
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

      <div className="page-wrapper">
        {children}
      </div>
    </>
  );
}

