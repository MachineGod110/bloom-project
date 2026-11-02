import React from "react";

export function Hero({ user, onOpenAuth, onNavigate, checkinCount, reminderDays }) {
  return (
    <section className="hero" id="home">
      <div>
        <div className="hero-tag mono">
          ✦ Breast health awareness
        </div>

        <h1>
          Know your body.<br />
          <em>Bloom.</em>
        </h1>

        <p className="hero-description">
          A gentle space to learn about breast health, understand
          self-examination, build a monthly habit, and become more
          aware of changes worth discussing with a healthcare professional.
        </p>

        <div className="hero-buttons">
          <button
            className="btn btn-primary"
            onClick={() => onNavigate("checkin")}
          >
            Start a check-in
          </button>

          <button
            className="btn btn-soft"
            onClick={() => onNavigate("guide")}
          >
            Learn the self-exam
          </button>
        </div>
      </div>

      <div className="hero-visual">
        <div className="floating-card one">
          <span className="mono">Monthly habit</span>
          <div className="floating-number serif">
            {checkinCount ? String(checkinCount).padStart(2, "0") : "01"}
          </div>
          <small>check-in</small>
        </div>

        <div className="organic-card">
          <div className="flower-art">
            <div className="flower-petal" />
            <div className="flower-petal" />
            <div className="flower-petal" />
            <div className="flower-petal" />
            <div className="flower-petal" />
            <div className="flower-center" />
          </div>
        </div>

        <div className="floating-card two">
          <span className="mono">Your next check-in</span>
          <div className="floating-number serif" id="heroReminder">
            {reminderDays !== null && reminderDays !== undefined ? reminderDays : "—"}
          </div>
          <small>days</small>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: "💬",
    title: "Check in",
    body: "Have a simple conversation about changes you may have noticed instead of navigating a complicated form.",
  },
  {
    icon: "◉",
    title: "Learn",
    body: "Understand the basics of breast self-awareness through simple explanations and interactive educational material.",
  },
  {
    icon: "↻",
    title: "Build the habit",
    body: "Keep track of your check-ins and receive a reminder when it is time to revisit your routine.",
  },
  {
    icon: "✦",
    title: "Stay informed",
    body: "Explore bite-sized facts and longer educational articles whenever you want to learn more.",
  },
];

export function Features() {
  return (
    <section className="features">
      <div className="section-header">
        <span className="mono">What Bloom does</span>
        <h2>
          Awareness without<br />
          the clinical feeling.
        </h2>
        <p>
          Bloom turns breast-health awareness into something
          approachable, understandable and easier to revisit.
        </p>
      </div>

      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div className="feature-card" key={f.title}>
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
