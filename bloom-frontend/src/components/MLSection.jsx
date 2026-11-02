import React, { useState } from "react";

const QUIZ = [
  {
    id: "freq",
    text: "How often do you currently check in on your own?",
    options: ["Rarely or never", "A few times a year", "Roughly monthly"],
  },
  {
    id: "technique",
    text: "How confident do you feel in the self-exam technique?",
    options: ["Not very", "Somewhat", "Very"],
  },
  {
    id: "reminder",
    text: "Do you currently have any reminder system in place?",
    options: ["No", "Sort of (memory / calendar)", "Yes, a dedicated one"],
  },
];

function scoreLabel(score) {
  if (score <= 1)
    return "Just getting started — that's exactly what Bloom's reminders are for.";
  if (score <= 3)
    return "You've got the basics — a consistent monthly rhythm is the next step.";
  return "You've already built a strong habit — Bloom is here to help you keep it going.";
}

export default function MLSection() {
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  function selectAnswer(qId, optionIndex) {
    setAnswers((a) => ({ ...a, [qId]: optionIndex }));
  }

  function seeResult() {
    const score = Object.values(answers).reduce((sum, v) => sum + v, 0);
    setResult(scoreLabel(score));
  }

  const allAnswered = QUIZ.every((q) => answers[q.id] !== undefined);

  return (
    <section className="ml-section" id="ml">
      <div className="ml-container">
        <span className="mono">Data science layer</span>

        <h2>Awareness, supported by data.</h2>

        <p>
          Bloom is designed so that a machine-learning model can eventually
          provide an additional awareness layer based on an appropriate
          validated input dataset.
        </p>

        <div className="ml-card">
          <span className="mono">Planned ML pipeline</span>

          <br />
          <br />

          <div className="ml-pipeline-grid">
            <div className="ml-pipeline-step">
              <strong>User input</strong>
            </div>
            <div>→</div>
            <div className="ml-pipeline-step">
              <strong>Preprocessing</strong>
            </div>
            <div>→</div>
            <div className="ml-pipeline-step">
              <strong>ML model</strong>
            </div>
          </div>

          <div className="ml-disclaimer">
            ⚠ This model is intended as an awareness/support feature only. It must
            not be presented as a medical diagnosis or a replacement for
            professional medical advice.
          </div>

          <div className="ml-quiz-block">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
              <span className="mono">Interactive preview</span>
              <button
                className="btn btn-outline"
                style={{ color: "white", borderColor: "rgba(255,255,255,0.3)", padding: "6px 14px", fontSize: "0.76rem" }}
                onClick={() => setShowQuiz((prev) => !prev)}
              >
                {showQuiz ? "Hide preview quiz" : "Try awareness habit quiz"}
              </button>
            </div>

            {showQuiz && (
              <div>
                {!result ? (
                  <>
                    {QUIZ.map((q) => (
                      <div key={q.id} style={{ marginBottom: 18 }}>
                        <p style={{ marginBottom: 8, fontWeight: 500, fontSize: "0.95rem" }}>{q.text}</p>
                        {q.options.map((opt, i) => (
                          <button
                            key={i}
                            className={`ml-quiz-option ${answers[q.id] === i ? "selected" : ""}`}
                            onClick={() => selectAnswer(q.id, i)}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ))}
                    <button
                      className="btn btn-primary"
                      style={{ background: "var(--rose)", width: "100%", marginTop: 8 }}
                      disabled={!allAnswered}
                      onClick={seeResult}
                    >
                      Reflect on my routine
                    </button>
                  </>
                ) : (
                  <div className="ml-result">
                    <p style={{ fontWeight: 600, color: "var(--plum-dark)", marginBottom: 8 }}>
                      Habit reflection result:
                    </p>
                    <p style={{ color: "var(--plum-dark)" }}>{result}</p>
                    <button
                      className="btn btn-primary"
                      style={{ marginTop: 14, padding: "8px 16px", fontSize: "0.8rem" }}
                      onClick={() => {
                        setAnswers({});
                        setResult(null);
                      }}
                    >
                      Reset reflection
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
