import React, { useState } from "react";
import { submitCheckin } from "../services/api";

const EXAM_STAGES = [
  {
    id: "quadrant-upper-outer",
    name: "1. Upper-Outer Quadrant & Tail",
    motion: "circular-outer",
    description: "Start near the collarbone and axilla (armpit). Move your finger pads in small, dime-sized circles along the upper-outer perimeter inward.",
    pathType: "spiral-outer",
    prompt: "Take your time feeling this section. What does the tissue feel like?",
    options: [
      { text: "Soft, uniform, feels normal", score: 0, tag: "normal" },
      { text: "Generalized tenderness or cyclical fullness", score: 1, tag: "cyclical" },
      { text: "Distinct firm lump or localized thickening", score: 3, tag: "lump" },
    ],
  },
  {
    id: "quadrant-upper-inner",
    name: "2. Upper-Inner Quadrant",
    motion: "circular-inner",
    description: "Move across toward the breastbone (sternum). Trace small overlapping circular motions across the upper-inner area.",
    pathType: "spiral-inner",
    prompt: "Feeling along the upper-inner area near the sternum, any changes noted?",
    options: [
      { text: "Smooth and uniform baseline tissue", score: 0, tag: "normal" },
      { text: "Mild tenderness or slight glandular texture", score: 1, tag: "cyclical" },
      { text: "Hard knot or area that feels different from the rest", score: 3, tag: "lump" },
    ],
  },
  {
    id: "quadrant-lower-inner",
    name: "3. Lower-Inner Quadrant",
    motion: "vertical-inner",
    description: "Move fingers in vertical up-and-down strips between the breastbone and the areola, applying light then firm pressure.",
    pathType: "vertical-inner",
    prompt: "Feeling the lower-inner quadrant against the rib cage, what do you notice?",
    options: [
      { text: "Soft, pliable, no persistent knots", score: 0, tag: "normal" },
      { text: "Mild cyclical sensitivity or glandular fullness", score: 1, tag: "cyclical" },
      { text: "Firm, isolated lump or distinct thickening", score: 3, tag: "lump" },
    ],
  },
  {
    id: "quadrant-lower-outer",
    name: "4. Lower-Outer Quadrant",
    motion: "vertical-outer",
    description: "Sweep up and down along the lower bra-line ridge toward the outside rib margin, covering all lower glandular tissue.",
    pathType: "vertical-outer",
    prompt: "Feel along the lower bra-line ridge and outer contour. Any unusual textures?",
    options: [
      { text: "Smooth, normal texture", score: 0, tag: "normal" },
      { text: "Mild granular density (typical cyclical texture)", score: 1, tag: "cyclical" },
      { text: "Fixed, unyielding knot or puckering felt", score: 3, tag: "lump" },
    ],
  },
  {
    id: "areola-nipple",
    name: "5. Areola & Nipple Inspection",
    motion: "radial",
    description: "Gently examine the central tissue beneath the areola, then visually inspect the nipple for retraction, scaling, or discharge.",
    pathType: "radial",
    prompt: "Gently check the central areola and nipple. Have you noticed any inversion or discharge?",
    options: [
      { text: "No inversion, no discharge, looks normal", score: 0, tag: "normal" },
      { text: "Slight non-spontaneous clear fluid only with firm squeeze", score: 1, tag: "cyclical" },
      { text: "Spontaneous discharge, bloody fluid, or sudden inversion", score: 3, tag: "alert" },
    ],
  },
  {
    id: "underarm-axilla",
    name: "6. Underarm (Axillary) Lymph Check",
    motion: "underarm",
    description: "Relax your arm at your side. Reach into the hollow of your armpit with your opposite hand, feeling for any swollen lymph nodes.",
    pathType: "underarm",
    prompt: "Feel gently under your armpit hollow. Any swollen nodes or tenderness?",
    options: [
      { text: "Soft hollow, no lumps or swelling felt", score: 0, tag: "normal" },
      { text: "Minor tenderness after shaving or antiperspirant", score: 1, tag: "benign" },
      { text: "Firm, enlarged nodule that persists", score: 3, tag: "alert" },
    ],
  },
];

export default function AnimatedExamGuide({ user, onOpenAuth, onExamComplete }) {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [answers, setAnswers] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const stage = EXAM_STAGES[currentStageIdx];

  function handleSelectOption(option) {
    const updated = {
      ...answers,
      [stage.id]: {
        stageName: stage.name,
        selection: option.text,
        score: option.score,
        tag: option.tag,
      },
    };
    setAnswers(updated);
  }

  function handleNext() {
    if (currentStageIdx < EXAM_STAGES.length - 1) {
      setCurrentStageIdx((prev) => prev + 1);
    } else {
      finishExam(answers);
    }
  }

  function handlePrev() {
    if (currentStageIdx > 0) {
      setCurrentStageIdx((prev) => prev - 1);
    }
  }

  async function finishExam(finalAnswers) {
    setIsCompleted(true);
    const totalScore = Object.values(finalAnswers).reduce(
      (sum, item) => sum + (item.score || 0),
      0
    );

    let riskLevel = "Low Risk / Baseline Normal";
    if (totalScore >= 3) riskLevel = "Clinical Evaluation Recommended";
    else if (totalScore >= 1) riskLevel = "Moderate / Cyclical Changes";

    const report = {
      date: new Date().toISOString(),
      totalScore,
      riskLevel,
      answers: finalAnswers,
    };

    localStorage.setItem("bloom_latest_exam_report", JSON.stringify(report));

    // Save session into longitudinal history log
    let sessionEntry = null;
    try {
      const rawHistory = localStorage.getItem("bloom_session_history");
      const history = rawHistory ? JSON.parse(rawHistory) : [];
      const answersTexts = Object.values(finalAnswers)
        .map((a) => a.choiceText || a.selection)
        .filter(Boolean)
        .join("; ") || "6-step clinical examination completed";

      sessionEntry = {
        id: `exam_${Date.now()}`,
        date: new Date().toISOString(),
        type: "Interactive Self-Exam",
        badge: "6 Steps Complete",
        riskLevel,
        totalScore,
        summary: answersTexts,
        source: "exam",
      };

      history.unshift(sessionEntry);
      localStorage.setItem("bloom_session_history", JSON.stringify(history.slice(0, 30)));
    } catch (e) {
      console.error("Session history log error:", e);
    }

    if (user) {
      try {
        await submitCheckin({
          answers: finalAnswers,
          riskLevel,
          totalScore,
          report,
          session: sessionEntry,
        });
        setSavedSuccess(true);
        if (onExamComplete) onExamComplete(report);
      } catch (err) {
        console.error("Exam save error:", err);
      }
    }
  }

  function restartExam() {
    setAnswers({});
    setCurrentStageIdx(0);
    setIsCompleted(false);
    setSavedSuccess(false);
  }

  return (
    <div className="animated-guide-container">
      <div className="section-header" style={{ marginBottom: 35 }}>
        <span className="mono">Interactive Guided Walkthrough</span>
        <h1 className="serif" style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", color: "var(--plum)" }}>
          Animated self-check<br />
          technique.
        </h1>
        <p style={{ maxWidth: 660, color: "var(--muted)" }}>
          Follow the animated hand guide over the circular anatomical breast model. Take your time, inspect each region, and navigate freely between steps.
        </p>
      </div>

      <div className="animated-guide-layout">
        {/* Left: Circular Anatomical Breast Diagram Card */}
        <div className="anatomy-visual-card-wrapper">
          <div className="anatomy-visual-card">
            <div className="anatomy-header-bar">
              <span className="mono" style={{ color: "var(--plum)", fontWeight: 600 }}>
                {stage?.name || "Checkup Complete"}
              </span>
              <button
                className="btn-tiny"
                onClick={() => setIsPlaying(!isPlaying)}
                title="Toggle Guide Animation"
              >
                {isPlaying ? "Pause Motion ⏸" : "Play Motion ▶"}
              </button>
            </div>

            <div className="svg-breast-container">
              <svg
                viewBox="0 0 360 380"
                className="anatomical-breast-svg"
                aria-label="Circular anatomical breast model"
              >
                <defs>
                  <radialGradient id="breastCircleGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#faecef" />
                    <stop offset="65%" stopColor="#f4dce1" />
                    <stop offset="92%" stopColor="#e5c8cf" />
                    <stop offset="100%" stopColor="#c97888" />
                  </radialGradient>

                  <radialGradient id="areolaCircleGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#c97888" />
                    <stop offset="70%" stopColor="#b46475" />
                    <stop offset="100%" stopColor="#8c3f4f" />
                  </radialGradient>

                  <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#49283d" floodOpacity="0.12" />
                  </filter>
                </defs>

                {/* Chest Wall / Clavicle Guideline */}
                <path
                  d="M 35,45 Q 180,32 325,45"
                  fill="none"
                  stroke="#cbbdc5"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
                <text x="35" y="38" className="svg-label-text">Clavicle / Chest Wall</text>
                <text x="255" y="38" className="svg-label-text">Axilla (Armpit)</text>

                {/* Circular Human Breast Contour */}
                <circle
                  cx="180"
                  cy="195"
                  r="135"
                  fill="url(#breastCircleGradient)"
                  stroke="#c97888"
                  strokeWidth="3"
                  filter="url(#subtleShadow)"
                />

                {/* Subtle Quadrant Crosshairs */}
                <line x1="180" y1="60" x2="180" y2="330" stroke="rgba(73, 40, 61, 0.15)" strokeDasharray="3 3" />
                <line x1="45" y1="195" x2="315" y2="195" stroke="rgba(73, 40, 61, 0.15)" strokeDasharray="3 3" />

                {/* Quadrant Text Labels */}
                <text x="95" y="115" className="svg-quadrant-label">Upper-Outer</text>
                <text x="210" y="115" className="svg-quadrant-label">Upper-Inner</text>
                <text x="95" y="285" className="svg-quadrant-label">Lower-Outer</text>
                <text x="210" y="285" className="svg-quadrant-label">Lower-Inner</text>

                {/* Natural Areola Circle */}
                <circle
                  cx="180"
                  cy="195"
                  r="38"
                  fill="url(#areolaCircleGradient)"
                  stroke="#8c3f4f"
                  strokeWidth="1.5"
                />

                {/* Subtle Montgomery Tubercle Texture Dots */}
                <circle cx="165" cy="180" r="1.5" fill="#f4dce1" opacity="0.65" />
                <circle cx="195" cy="180" r="1.5" fill="#f4dce1" opacity="0.65" />
                <circle cx="164" cy="210" r="1.5" fill="#f4dce1" opacity="0.65" />
                <circle cx="196" cy="208" r="1.5" fill="#f4dce1" opacity="0.65" />

                {/* Central Nipple Dot */}
                <circle
                  cx="180"
                  cy="195"
                  r="10"
                  fill="#49283d"
                  stroke="#f4dce1"
                  strokeWidth="1.5"
                />

                {/* Animated Paths based on current step */}
                {stage?.pathType === "spiral-outer" && (
                  <path
                    d="M 85,110 Q 180,75 275,120 Q 305,200 250,265 Q 180,315 110,265 Q 80,195 125,145 Q 180,120 220,165"
                    fill="none"
                    stroke="var(--amber)"
                    strokeWidth="3.5"
                    strokeDasharray="6 6"
                    className={isPlaying ? "animated-stroke" : ""}
                  />
                )}

                {stage?.pathType === "spiral-inner" && (
                  <path
                    d="M 270,120 Q 210,80 180,125 Q 150,165 190,200 Q 240,210 225,160 Q 200,140 180,165"
                    fill="none"
                    stroke="var(--amber)"
                    strokeWidth="3.5"
                    strokeDasharray="5 5"
                    className={isPlaying ? "animated-stroke" : ""}
                  />
                )}

                {stage?.pathType === "vertical-inner" && (
                  <path
                    d="M 195,195 L 195,310 M 225,300 L 225,195 M 255,200 L 255,270"
                    fill="none"
                    stroke="var(--amber)"
                    strokeWidth="3.5"
                    strokeDasharray="5 5"
                    className={isPlaying ? "animated-stroke" : ""}
                  />
                )}

                {stage?.pathType === "vertical-outer" && (
                  <path
                    d="M 105,200 L 105,270 M 135,290 L 135,195 M 165,310 L 165,195"
                    fill="none"
                    stroke="var(--amber)"
                    strokeWidth="3.5"
                    strokeDasharray="5 5"
                    className={isPlaying ? "animated-stroke" : ""}
                  />
                )}

                {stage?.pathType === "radial" && (
                  <g stroke="var(--amber)" strokeWidth="2.5" strokeDasharray="4 4" className={isPlaying ? "animated-stroke" : ""}>
                    <line x1="180" y1="195" x2="180" y2="80" />
                    <line x1="180" y1="195" x2="260" y2="120" />
                    <line x1="180" y1="195" x2="275" y2="225" />
                    <line x1="180" y1="195" x2="180" y2="315" />
                    <line x1="180" y1="195" x2="85" y2="225" />
                    <line x1="180" y1="195" x2="100" y2="120" />
                  </g>
                )}

                {stage?.pathType === "underarm" && (
                  <path
                    d="M 260,55 Q 300,95 285,150 Q 250,175 235,130 Z"
                    fill="none"
                    stroke="var(--amber)"
                    strokeWidth="3"
                    strokeDasharray="4 4"
                    className={isPlaying ? "animated-stroke" : ""}
                  />
                )}

                {/* Animated Finger Pad / Hand Pointer */}
                {isPlaying && !isCompleted && (
                  <g className={`exam-motion-pointer stage-${stage?.pathType}`}>
                    <circle cx="0" cy="0" r="14" fill="rgba(214, 164, 94, 0.4)" className="pulse-ring" />
                    <circle cx="0" cy="0" r="7" fill="var(--amber)" stroke="#ffffff" strokeWidth="2" />
                    <text x="12" y="5" fontSize="18">🖐️</text>
                  </g>
                )}
              </svg>
            </div>

            <div className="motion-legend">
              <span className="dot amber" />
              <span className="mono">Animated Guide: Hand icon follows recommended circular pattern</span>
            </div>
          </div>

          {/* Previous and Next Navigation Bar directly below the diagram card (Image 2 match) */}
          <div className="visual-card-nav-row">
            <button
              className="btn btn-outline"
              onClick={handlePrev}
              disabled={currentStageIdx === 0}
            >
              ← Previous
            </button>

            <span className="mono" style={{ color: "var(--plum)", fontWeight: 600 }}>
              Step {currentStageIdx + 1} of {EXAM_STAGES.length}
            </span>

            <button
              className="btn btn-primary"
              onClick={handleNext}
            >
              {currentStageIdx === EXAM_STAGES.length - 1 ? "Complete Exam ✓" : "Next →"}
            </button>
          </div>
        </div>

        {/* Right: Interactive Instructions & Optional Live Feedback */}
        <div className="anatomy-interactive-card">
          {!isCompleted ? (
            <>
              <div className="stage-progress-indicator">
                <span className="mono" style={{ color: "var(--rose)", fontWeight: 600 }}>
                  Technique Step {currentStageIdx + 1} of {EXAM_STAGES.length}
                </span>
                <span className="mono" style={{ color: "var(--muted)" }}>
                  {Math.round((currentStageIdx / EXAM_STAGES.length) * 100)}% Complete
                </span>
              </div>

              <h3 className="serif stage-heading">{stage.name}</h3>
              <p className="stage-description">{stage.description}</p>

              <div className="live-feedback-box">
                <span className="mono" style={{ color: "var(--plum)", display: "block", marginBottom: 8 }}>
                  💬 Live Assessment Question (Optional):
                </span>
                <p className="live-prompt-text">{stage.prompt}</p>

                <div className="options-stack">
                  {stage.options.map((opt, i) => {
                    const isSelected = answers[stage.id]?.selection === opt.text;
                    return (
                      <button
                        key={i}
                        className={`exam-option-btn ${isSelected ? "selected" : ""}`}
                        onClick={() => handleSelectOption(opt)}
                      >
                        <span className="option-check-icon">{isSelected ? "✓" : "◉"}</span>
                        <span className="option-label">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="exam-hint-box" style={{ marginBottom: 24 }}>
                💡 <em>Tip:</em> You can proceed using the <strong>Next</strong> button at any time. Selecting an observation records your data into your health history.
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  className="btn btn-outline"
                  onClick={handlePrev}
                  disabled={currentStageIdx === 0}
                >
                  ← Previous Step
                </button>
                <button className="btn btn-primary" onClick={handleNext}>
                  {currentStageIdx === EXAM_STAGES.length - 1 ? "Finish & View Assessment ✓" : "Next Step →"}
                </button>
              </div>
            </>
          ) : (
            <div className="exam-summary-card">
              <div className="summary-badge">✓ Examination Complete</div>
              <h3 className="serif" style={{ fontSize: "1.8rem", color: "var(--plum)", marginTop: 10 }}>
                Breast Awareness Assessment Compiled
              </h3>

              <p style={{ color: "var(--muted)", margin: "12px 0 20px" }}>
                Your responses have been processed through Bloom's habit & symptom awareness matrix.
              </p>

              <div className="exam-findings-box">
                <h4 className="serif" style={{ color: "var(--plum)", marginBottom: 8 }}>
                  Recorded Observations ({Object.keys(answers).length} of {EXAM_STAGES.length} steps answered):
                </h4>
                {Object.keys(answers).length === 0 ? (
                  <p style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
                    No specific symptoms were flagged during this run.
                  </p>
                ) : (
                  <ul>
                    {Object.values(answers).map((ans, idx) => (
                      <li key={idx} style={{ marginBottom: 6, fontSize: "0.88rem" }}>
                        <strong>{ans.stageName}:</strong> {ans.selection}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {user ? (
                <div className="user-synced-box">
                  <span className="mono" style={{ color: "var(--plum)", fontWeight: 600 }}>
                    🌱 Synced to your Private Health Record
                  </span>
                  <p style={{ fontSize: "0.85rem", marginTop: 4 }}>
                    Your new assessment data has been recorded. You can view your updated risk graph and historical habit trends on your dedicated Dashboard.
                  </p>
                  <a href="/dashboard" className="btn btn-primary" style={{ marginTop: 14 }}>
                    View Dashboard & Health Risk Chart →
                  </a>
                </div>
              ) : (
                <div className="guest-gated-box">
                  <span className="mono" style={{ color: "var(--amber)", fontWeight: 600 }}>
                    🔒 Account Required to Save & View Risk Graph
                  </span>
                  <p style={{ fontSize: "0.85rem", marginTop: 6, color: "var(--plum-dark)" }}>
                    You completed the walkthrough in guest mode. To permanently save this checkup, generate your personalized breast health risk chart, and receive monthly habit reminders, please create your free account or log in.
                  </p>
                  <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                    <button className="btn btn-primary" onClick={() => onOpenAuth && onOpenAuth("signup")}>
                      Create Account
                    </button>
                    <button className="btn btn-outline" onClick={() => onOpenAuth && onOpenAuth("login")}>
                      Log in
                    </button>
                  </div>
                </div>
              )}

              <button
                className="btn btn-soft"
                style={{ marginTop: 18, alignSelf: "flex-start" }}
                onClick={restartExam}
              >
                ↺ Run Interactive Checkup Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
