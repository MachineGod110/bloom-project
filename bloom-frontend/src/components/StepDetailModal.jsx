import React from "react";

export default function StepDetailModal({ step, onClose }) {
  if (!step) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="auth-modal step-detail-modal">
        <button className="close-modal" onClick={onClose} aria-label="Close">
          ×
        </button>

        <span className="mono" style={{ color: "var(--rose)", fontWeight: 600 }}>
          Step {step.num} Detailed Guide
        </span>

        <h2 className="serif" style={{ fontSize: "2rem", marginTop: 4, marginBottom: 12 }}>
          {step.title}
        </h2>

        <p className="step-modal-overview" style={{ color: "var(--muted)", marginBottom: 18, fontSize: "0.95rem" }}>
          {step.detailedIntro || step.body}
        </p>

        <div className="step-modal-card" style={{ background: "var(--sage-light)", padding: "16px 20px", borderRadius: 16, marginBottom: 16 }}>
          <h4 className="serif" style={{ color: "var(--plum)", marginBottom: 6, fontSize: "1.1rem" }}>
            How to do it precisely
          </h4>
          <ul style={{ paddingLeft: 20, color: "var(--ink)", fontSize: "0.88rem", lineHeight: 1.6 }}>
            {step.techniques.map((item, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="step-modal-card" style={{ background: "var(--rose-light)", padding: "16px 20px", borderRadius: 16, marginBottom: 20 }}>
          <h4 className="serif" style={{ color: "var(--plum)", marginBottom: 6, fontSize: "1.1rem" }}>
            What to pay attention to
          </h4>
          <p style={{ color: "var(--plum-dark)", fontSize: "0.85rem", lineHeight: 1.5 }}>
            {step.precautions}
          </p>
        </div>

        <button className="btn btn-primary" style={{ width: "100%" }} onClick={onClose}>
          Got it, continue guide
        </button>
      </div>
    </div>
  );
}
