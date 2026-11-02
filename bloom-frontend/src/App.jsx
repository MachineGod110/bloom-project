import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import AuthModal from "./components/AuthModal.jsx";
import Home from "./pages/Home.jsx";
import CheckinPage from "./pages/CheckinPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import SelfExamPage from "./pages/SelfExamPage.jsx";
import BlogDetailPage from "./pages/BlogDetailPage.jsx";
import { getSession, logout, getDashboard } from "./services/api";

export default function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState(null); // null | "login" | "signup"
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [checkinCount, setCheckinCount] = useState(0);
  const [reminderDays, setReminderDays] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Ensure scroll is at the top when visiting or refreshing pages
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    if (!location.state?.scrollTo) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [location.pathname]);

  useEffect(() => {
    setUser(getSession());
  }, []);

  useEffect(() => {
    getDashboard()
      .then((d) => {
        if (d) {
          setCheckinCount(d.checkinCount || 0);
          if (d.nextReminder) {
            const diff = new Date(d.nextReminder) - new Date();
            setReminderDays(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
          } else {
            setReminderDays(null);
          }
        }
      })
      .catch(() => {
        const storedCount = Number(localStorage.getItem("bloomCheckins") || 0);
        setCheckinCount(storedCount);
        const storedDate = localStorage.getItem("bloomNextReminder");
        if (storedDate) {
          const diff = new Date(storedDate) - new Date();
          setReminderDays(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
        } else {
          setReminderDays(null);
        }
      });
  }, [user, refreshKey]);

  function showToast(text) {
    setToast(text);
    setTimeout(() => setToast(null), 3200);
  }

  function handleAuthed(result) {
    setUser({ name: result.name, email: result.email });
    setAuthMode(null);
    showToast(`Welcome to Bloom, ${result.name.split(" ")[0]} 🌱`);
    setRefreshKey((k) => k + 1);
  }

  function handleLogout() {
    logout();
    setUser(null);
    showToast("Logged out.");
    setRefreshKey((k) => k + 1);
  }

  function scrollTo(id) {
    navigate("/", { state: { scrollTo: id } });
  }

  return (
    <>
      <Navbar user={user} onOpenAuth={setAuthMode} onLogout={handleLogout} />

      <Routes>
        <Route
          path="/"
          element={
            <Home
              user={user}
              onOpenAuth={setAuthMode}
              checkinCount={checkinCount}
              reminderDays={reminderDays}
              onCheckinComplete={() => setRefreshKey((k) => k + 1)}
            />
          }
        />
        <Route
          path="/checkin"
          element={
            <CheckinPage
              user={user}
              onOpenAuth={setAuthMode}
              onCheckinComplete={() => setRefreshKey((k) => k + 1)}
            />
          }
        />
        <Route
          path="/self-exam"
          element={
            <SelfExamPage
              user={user}
              onOpenAuth={setAuthMode}
              onCheckinComplete={() => setRefreshKey((k) => k + 1)}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <DashboardPage
              user={user}
              refreshKey={refreshKey}
              onOpenAuth={setAuthMode}
              onCheckinComplete={() => setRefreshKey((k) => k + 1)}
              showToast={showToast}
            />
          }
        />
        <Route
          path="/blog/:id"
          element={<BlogDetailPage />}
        />
      </Routes>

      {location.pathname !== "/checkin" && (
        <footer>
          <div className="footer-inner">
            <div>
              <div className="logo">
                <span className="logo-flower" />
                Bloom
              </div>
              <p className="footer-description">
                A student-built breast-health awareness project focused on
                education, habit-building and responsible use of data science.
              </p>
            </div>

            <div className="footer-links">
              <a href="/checkin" onClick={(e) => { e.preventDefault(); navigate("/checkin"); }}>
                Check-in
              </a>
              <a href="#guide" onClick={(e) => { e.preventDefault(); scrollTo("guide"); }}>
                Guide
              </a>
              <a href="/self-exam" onClick={(e) => { e.preventDefault(); navigate("/self-exam"); }}>
                Self-exam
              </a>
              <a href="#learn" onClick={(e) => { e.preventDefault(); scrollTo("learn"); }}>
                Learn
              </a>
              <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>
                Dashboard
              </a>
            </div>
          </div>
        </footer>
      )}

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSwitchMode={setAuthMode}
          onAuthed={handleAuthed}
        />
      )}

      {toast && <div className="toast show">{toast}</div>}
    </>
  );
}
