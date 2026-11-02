import React, { useEffect } from "react";
import AnimatedExamGuide from "../components/AnimatedExamGuide.jsx";

export default function SelfExamPage({ user, onOpenAuth, onCheckinComplete }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div style={{ paddingTop: 90, paddingBottom: 60, minHeight: "90vh", background: "var(--cream)" }}>
      <AnimatedExamGuide
        user={user}
        onOpenAuth={onOpenAuth}
        onExamComplete={onCheckinComplete}
      />
    </div>
  );
}
