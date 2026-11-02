import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Hero, Features } from "../components/Hero.jsx";
import SelfExamGuide from "../components/SelfExamGuide.jsx";
import Flashcards from "../components/Flashcards.jsx";
import Blog from "../components/Blog.jsx";
import MLSection from "../components/MLSection.jsx";

export default function Home({
  user,
  onOpenAuth,
  checkinCount,
  reminderDays,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If a hash exists on initial visit, strip it to prevent auto-scrolling down
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    const targetId = location.state?.scrollTo;
    if (targetId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const executeScroll = () => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      };
      // Allow DOM mount and layout reflow before smooth scrolling
      requestAnimationFrame(() => {
        executeScroll();
        setTimeout(executeScroll, 80);
      });
    } else {
      // Force scroll to top at Hero section on first visit or page refresh
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [location.state, location.pathname]);

  function navigateTo(id) {
    if (id === "checkin") {
      navigate("/checkin");
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main>
      <Hero
        user={user}
        onOpenAuth={onOpenAuth}
        onNavigate={navigateTo}
        checkinCount={checkinCount}
        reminderDays={reminderDays}
      />

      <Features />

      {/* Self-Awareness Guide ("Get the technique down mentally" with precision popups) */}
      <SelfExamGuide />

      {/* 10-Card Stacked Flipcards Deck */}
      <Flashcards />

      {/* Bloom Journal with dedicated editorial pages */}
      <Blog />

      {/* ML Pipeline & Awareness Layer */}
      <MLSection />
    </main>
  );
}
