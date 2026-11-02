import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Navbar({ user, onOpenAuth, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  function goToSection(id) {
    setMobileOpen(false);
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  }

  function handleGoCheckin() {
    setMobileOpen(false);
    navigate("/checkin");
  }

  function handleGoSelfExam() {
    setMobileOpen(false);
    navigate("/self-exam");
  }

  function handleGoDashboard() {
    setMobileOpen(false);
    navigate("/dashboard");
  }

  return (
    <nav className="navbar">
      <Link
        to="/"
        className="logo"
        onClick={() => setMobileOpen(false)}
      >
        <span className="logo-flower" />
        Bloom
      </Link>

      <div className={`nav-links ${mobileOpen ? "mobile-open" : ""}`}>
        <button
          onClick={handleGoCheckin}
          className={`nav-page-link ${location.pathname === "/checkin" ? "active" : ""}`}
        >
          Check-in
        </button>
        <button onClick={() => goToSection("guide")}>Guide</button>
        <button
          onClick={handleGoSelfExam}
          className={`nav-page-link ${location.pathname === "/self-exam" ? "active" : ""}`}
        >
          Self-exam
        </button>
        <button onClick={() => goToSection("learn")}>Learn</button>
        <button
          onClick={handleGoDashboard}
          className={`nav-dashboard-link ${location.pathname === "/dashboard" ? "active" : ""}`}
        >
          Dashboard
        </button>
        <button onClick={() => goToSection("blog")}>
          Blogs
        </button>
      </div>

      <div className="nav-actions">
        {user ? (
          <>
            <span className="user-chip">🌱 {user.name.split(" ")[0]}</span>
            <button className="btn btn-outline" onClick={onLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-outline" onClick={() => onOpenAuth("login")}>
              Log in
            </button>
            <button className="btn btn-primary" onClick={() => onOpenAuth("signup")}>
              Get started
            </button>
          </>
        )}
      </div>

      <button
        className="mobile-menu"
        aria-label="Toggle navigation menu"
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        ☰
      </button>
    </nav>
  );
}
