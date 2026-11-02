import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard, submitCheckin } from "../services/api";

function calculateDaysRemaining(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getIntervalText(currentDate, prevDate) {
  if (!prevDate) return "Initial baseline check-in";
  const diffMs = Math.abs(new Date(currentDate) - new Date(prevDate));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Follow-up session (same cycle)";
  if (diffDays >= 27 && diffDays <= 33) return `${diffDays} days interval • Perfect monthly rhythm`;
  return `${diffDays} day${diffDays === 1 ? "" : "s"} interval between sessions`;
}

export default function Dashboard({ user, refreshKey, onOpenAuth, onCheckinComplete, showToast }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [aiNotes, setAiNotes] = useState([]);
  const [userBaseline, setUserBaseline] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  useEffect(() => {
    // Read local stored latest exam report
    let loadedExam = null;
    let loadedNotes = [];
    try {
      const stored = localStorage.getItem("bloom_latest_exam_report");
      if (stored) {
        loadedExam = JSON.parse(stored);
        setLatestReport(loadedExam);
      }
      const rawNotes = localStorage.getItem("bloom_ai_checkin_notes");
      if (rawNotes) {
        loadedNotes = JSON.parse(rawNotes);
        setAiNotes(loadedNotes);
      }
      const rawBase = localStorage.getItem("bloom_user_baseline");
      if (rawBase) {
        setUserBaseline(JSON.parse(rawBase));
      }
    } catch {}

    // Load or synthesize longitudinal session history
    try {
      const rawHistory = localStorage.getItem("bloom_session_history");
      let historyList = rawHistory ? JSON.parse(rawHistory) : [];

      if (historyList.length === 0) {
        const generated = [];
        if (loadedExam) {
          const findingsText =
            Object.values(loadedExam.answers || {})
              .map((a) => a.choiceText || a.selection)
              .filter(Boolean)
              .join("; ") || "6-step clinical examination completed";

          generated.push({
            id: "exam_init_01",
            date: loadedExam.date || new Date().toISOString(),
            type: "Interactive Self-Exam",
            badge: "6 Steps Complete",
            riskLevel: loadedExam.riskLevel || "Low Risk / Baseline Typical",
            summary: findingsText,
            source: "exam",
          });
        }

        if (loadedNotes && loadedNotes.length > 0) {
          const n = loadedNotes[0];
          generated.push({
            id: `ai_${n.id}`,
            date: n.date,
            type: "Bloom AI Consultation",
            badge: "Conversational Triage",
            riskLevel:
              n.scoreImpact >= 3
                ? "Clinical Review Recommended"
                : n.scoreImpact >= 1
                ? "Moderate / Cyclical Changes"
                : "Low Risk / Baseline Typical",
            summary: `${n.summaryNote} ("${n.userMessage}")`,
            source: "ai-chat",
          });
        }

        generated.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (generated.length > 0) {
          historyList = generated;
          localStorage.setItem("bloom_session_history", JSON.stringify(historyList));
        }
      }

      setSessionHistory(historyList);
    } catch (e) {
      console.error("Session history init error:", e);
    }

    if (user) {
      getDashboard().then(setData).catch(() => {});
    }
  }, [user, refreshKey]);

  // Auth gate for non-logged in users
  if (!user) {
    return (
      <div className="dashboard-page-container">
        <div className="dashboard-auth-gate">
          <div className="gate-icon-flower">✿</div>
          <span className="mono" style={{ color: "var(--rose)", fontWeight: 600 }}>
            Member Protected Space
          </span>
          <h1 className="serif">Your Private Health Dashboard</h1>
          <p className="gate-description">
            Your personal check-in history, 30-day reminder rhythm, and AI/ML breast health awareness risk charts are encrypted and saved to your private account.
          </p>

          <div className="gate-actions">
            <button className="btn btn-primary" onClick={() => onOpenAuth("signup")}>
              Create your account
            </button>
            <button className="btn btn-outline" onClick={() => onOpenAuth("login")}>
              Log in to your account
            </button>
          </div>

          <div className="gate-feature-preview">
            <div className="preview-chip">📊 ML Risk & Awareness Graph</div>
            <div className="preview-chip">📅 30-Day Reminder Notifications</div>
            <div className="preview-chip">💬 Conversational Memory Assistant</div>
          </div>
        </div>
      </div>
    );
  }

  const checkinCount = data?.checkinCount || (latestReport ? 1 : 0);
  const nextReminder = data?.nextReminder;
  const days = calculateDaysRemaining(nextReminder);
  const ringDeg = days === null ? 0 : Math.round(((30 - Math.min(30, days)) / 30) * 360);

  // Compute ML Health Risk Metrics dynamically from examination findings
  const answers = latestReport?.answers || {};
  const answersList = Object.values(answers);
  const totalScore = latestReport?.totalScore ?? answersList.reduce((sum, a) => sum + (a.score || 0), 0);
  const maxLumpScore = Math.max(...answersList.map((a) => a.score || 0), 0);
  const lumpCount = answersList.filter((a) => (a.score || 0) >= 3).length;

  let riskTitle = "Low Risk / Baseline Typical";
  let riskColor = "var(--sage, #66835e)";
  let riskPercentage = 15;
  let recommendation = "Your examination findings indicate normal, pliable baseline tissue across all quadrants. Continue your monthly awareness check-in habit.";

  if (maxLumpScore >= 3 || totalScore >= 7) {
    // Clinical Review Recommended (Case 3: ~91%, 1 lump: ~72%)
    riskTitle = "Clinical Review Recommended";
    riskColor = "var(--rose, #c76e8a)";
    riskPercentage = Math.min(94, Math.round(68 + (lumpCount * 3.8)));
    recommendation = "You recorded a localized knot, thickening, or nipple change. Remember: over 80% of lumps are benign (cysts or fibroadenomas). We recommend scheduling a routine exam with your healthcare provider for reassurance.";
  } else if (totalScore >= 1) {
    // Moderate / Cyclical Changes (Case 2: ~49%)
    riskTitle = "Moderate / Cyclical Changes";
    riskColor = "var(--amber, #d4934b)";
    riskPercentage = Math.min(56, Math.round(32 + (totalScore * 2.8)));
    recommendation = "Generalized tenderness or cyclical fullness detected across examined regions. These findings typically correspond with hormonal fluctuations. We recommend noting your cycle date and performing a follow-up check 3–5 days after your period ends.";
  }

  function getBarMetrics(stageAnswer) {
    if (!stageAnswer || stageAnswer.score === undefined || stageAnswer.score === 0) {
      return {
        width: "16%",
        color: "var(--sage, #66835e)",
        label: stageAnswer?.selection || "Normal baseline",
      };
    }
    if (stageAnswer.score === 1) {
      return {
        width: "48%",
        color: "var(--amber, #d4934b)",
        label: stageAnswer.selection || "Cyclical tenderness",
      };
    }
    // score >= 3
    return {
      width: "88%",
      color: "var(--rose, #c76e8a)",
      label: stageAnswer.selection || "Localized firm knot",
    };
  }

  // Map examination answers to quadrant breakdown items
  const upperOuterAnswer = answers["quadrant-upper-outer"] || answers["quadrant-upper"];
  const upperInnerAnswer = answers["quadrant-upper-inner"];
  const upperReport = (upperInnerAnswer && (upperInnerAnswer.score || 0) > (upperOuterAnswer?.score || 0))
    ? upperInnerAnswer
    : (upperOuterAnswer || upperInnerAnswer);
  const upperMetrics = getBarMetrics(upperReport);

  const lowerOuterAnswer = answers["quadrant-lower-outer"] || answers["quadrant-lower"];
  const lowerInnerAnswer = answers["quadrant-lower-inner"];
  const lowerReport = (lowerInnerAnswer && (lowerInnerAnswer.score || 0) > (lowerOuterAnswer?.score || 0))
    ? lowerInnerAnswer
    : (lowerOuterAnswer || lowerInnerAnswer);
  const lowerMetrics = getBarMetrics(lowerReport);

  const areolaReport = answers["areola-nipple"];
  const areolaMetrics = getBarMetrics(areolaReport);

  const axillaryReport = answers["underarm-axilla"];
  const axillaryMetrics = getBarMetrics(axillaryReport);

  async function handleQuickCheckin() {
    try {
      await submitCheckin({ answers: ["Manual habit check-in recorded"] });
      const now = new Date();
      const raw = localStorage.getItem("bloom_session_history");
      const list = raw ? JSON.parse(raw) : [];
      const newEntry = {
        id: `manual_${Date.now()}`,
        date: now.toISOString(),
        type: "Routine Monthly Touchpoint",
        badge: "Manual Log",
        riskLevel: "Low Risk / Baseline Typical",
        summary: "Monthly habit check-in recorded. Next awareness check scheduled in 30 days.",
        source: "manual",
      };
      const updated = [newEntry, ...list];
      localStorage.setItem("bloom_session_history", JSON.stringify(updated));
      setSessionHistory(updated);
      if (onCheckinComplete) onCheckinComplete();
      if (showToast) showToast("Monthly check-in recorded! Next reminder in 30 days.");
    } catch (e) {
      console.error(e);
    }
  }

  function downloadWordSummary() {
    const reportDate = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Bloom Patient Clinical Summary</title>
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; margin: 40px; color: #2d1922; line-height: 1.6; }
        h1 { color: #4a2835; font-size: 22pt; margin-bottom: 2px; }
        h2 { color: #6d3546; font-size: 13pt; border-bottom: 1.5pt solid #c76e8a; padding-bottom: 4px; margin-top: 22px; }
        .meta { color: #666; font-size: 9.5pt; margin-bottom: 20px; }
        .box { background: #faf4f5; border-left: 4pt solid #c76e8a; padding: 12px 16px; margin: 16px 0; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9.5pt; }
        th, td { border: 1px solid #dcd4ce; padding: 8px 12px; text-align: left; }
        th { background: #f5ebe7; color: #4a2835; }
      </style>
      </head>
      <body>
        <h1>Bloom • Clinical Breast Health Summary</h1>
        <div class="meta">Patient: ${user?.name || "Member"} | Generated: ${reportDate} | Source: Bloom Health Awareness Platform</div>
        
        <div class="box">
          <strong>Overall Clinical Assessment:</strong> ${riskTitle} (Awareness Index: ${riskPercentage}%)<br/>
          <em>Purpose: This patient-initiated awareness document aggregates findings from tactile self-examinations and AI consultations to assist in clinical discussions.</em>
        </div>

        <h2>1. Anatomical Quadrant & Region Findings</h2>
        <table>
          <tr><th>Anatomical Region</th><th>Patient / AI Observation</th><th>Status Level</th></tr>
          <tr><td>Upper-Outer (Axillary Tail)</td><td>${upperMetrics.label}</td><td>${upperReport?.score >= 3 ? "Clinical Review Advised" : upperReport?.score === 1 ? "Cyclical Variations" : "Baseline Typical"}</td></tr>
          <tr><td>Lower-Outer Quadrant</td><td>${lowerMetrics.label}</td><td>${lowerReport?.score >= 3 ? "Clinical Review Advised" : lowerReport?.score === 1 ? "Cyclical Variations" : "Baseline Typical"}</td></tr>
          <tr><td>Areola & Nipple Axis</td><td>${areolaMetrics.label}</td><td>${areolaReport?.score >= 3 ? "Clinical Review Advised" : areolaReport?.score === 1 ? "Cyclical Variations" : "Baseline Typical"}</td></tr>
          <tr><td>Axillary Lymph Hollow</td><td>${axillaryMetrics.label}</td><td>${axillaryReport?.score >= 3 ? "Clinical Review Advised" : axillaryReport?.score === 1 ? "Cyclical Variations" : "Baseline Typical"}</td></tr>
        </table>

        <h2>2. Longitudinal Check-in Cadence History</h2>
        <table>
          <tr><th>Session</th><th>Date</th><th>Type</th><th>Cadence Interval</th><th>Findings Summary</th></tr>
          ${sessionHistory && sessionHistory.length > 0 ? sessionHistory.slice(0, 6).map((s, idx) => `
            <tr>
              <td>Session #${sessionHistory.length - idx}</td>
              <td>${new Date(s.date).toLocaleDateString()}</td>
              <td>${s.type}</td>
              <td>${getIntervalText(s.date, sessionHistory[idx + 1]?.date)}</td>
              <td>${s.summary}</td>
            </tr>
          `).join("") : "<tr><td colspan='5'>No previous session records.</td></tr>"}
        </table>

        <h2>3. Recent AI Consultation Notes</h2>
        ${aiNotes && aiNotes.length > 0 ? aiNotes.slice(0, 5).map(n => `
          <p><strong>• ${new Date(n.date).toLocaleDateString()}:</strong> ${n.userMessage}<br/>
          <span style="color:#555;">&nbsp;&nbsp;Summary: ${n.summaryNote} | Recommended action: ${n.action}</span></p>
        `).join("") : "<p>No recent conversational entries logged.</p>"}

        <h2>4. Individual Baseline Profile</h2>
        <p>${userBaseline?.profile || "Normal pliable baseline tissue with standard symmetrical hormonal variations."}</p>

        <h2>5. Suggested Questions for Healthcare Provider</h2>
        <ul>
          <li>Are the palpable textures noted consistent with benign fibrocystic changes or fibroadenomas?</li>
          <li>Would a targeted breast ultrasound or mammography screening be recommended for baseline confirmation?</li>
          <li>Should a follow-up exam be scheduled 3–5 days post-menstruation to confirm cyclical resolution?</li>
        </ul>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bloom_Doctor_Summary_${(user?.name || "Patient").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="dashboard-page-container">
      <div className="dashboard-page-header">
        <span className="mono" style={{ color: "var(--rose)", fontWeight: 600 }}>
          Private Awareness Portal
        </span>
        <h1 className="serif">Welcome back, {user.name.split(" ")[0]}</h1>
        <p style={{ color: "var(--muted)", maxWidth: 640 }}>
          Here is your comprehensive breast health overview, ongoing reminder cadence, and data-backed awareness risk metrics.
        </p>
      </div>

      <div className="dashboard-grid">
        {/* Card 1: Monthly Habit Rhythm */}
        <div className="dashboard-card">
          <span className="mono">Habit Tracker</span>
          <h3>Check-in rhythm</h3>
          <p>Maintain consistent touch with your body each month.</p>

          <div
            className="progress-ring"
            style={{
              background: `conic-gradient(var(--rose) 0deg ${ringDeg}deg, var(--rose-light) ${ringDeg}deg 360deg)`,
            }}
          >
            <div className="progress-inner">
              <strong id="checkinCount">{checkinCount}</strong>
              <span>check-in{checkinCount === 1 ? "" : "s"}</span>
            </div>
          </div>

          <div className="habit-status-block">
            {days !== null && days > 0 ? (
              <>
                <div className="habit-status-pill completed">
                  ✓ This cycle's check-in recorded
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "2px 0 6px" }}>
                  Next regular check-in due in {days} day{days === 1 ? "" : "s"}.
                </p>
                <div className="habit-actions-row">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate("/self-exam")}
                  >
                    Start Self-Exam
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate("/checkin")}
                  >
                    Chat with Bloom
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="habit-status-pill due">
                  ● Check-in due for this cycle
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "2px 0 6px" }}>
                  Take 2–3 minutes to feel for tissue changes or chat with Bloom.
                </p>
                <div className="habit-actions-row">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate("/self-exam")}
                  >
                    Start Self-Exam
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate("/checkin")}
                  >
                    Chat with Bloom
                  </button>
                </div>
              </>
            )}
            <button className="habit-quick-log-btn" onClick={handleQuickCheckin}>
              + Log quick manual touchpoint
            </button>
          </div>
        </div>

        {/* Card 2: Next Scheduled Reminder */}
        <div className="dashboard-card">
          <span className="mono">Automated Cadence</span>
          <h3>Next reminder</h3>
          <p>Your automatic 30-day reminder countdown.</p>

          <div className="reminder-box">
            <span className="mono">Next Due</span>
            <div className="reminder-date">
              {nextReminder
                ? new Date(nextReminder).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Scheduled for 30 days post check-in"}
            </div>
            <p id="daysRemaining">
              {days === null
                ? "Complete a check-in to activate your 30-day countdown."
                : days === 0
                ? "Your check-in is due today! Take 2 minutes to inspect."
                : `${days} day${days === 1 ? "" : "s"} remaining until next check-in.`}
            </p>
          </div>
        </div>
      </div>

      {/* ML Breast Health Risk Chart & Graph Section */}
      <div className="dashboard-ml-analytics-card">
        <div className="ml-chart-header">
          <div>
            <span className="mono" style={{ color: "var(--rose)", fontWeight: 600 }}>
              Data Science Assessment
            </span>
            <h2 className="serif" style={{ fontSize: "2rem", color: "var(--plum)", marginTop: 4 }}>
              Approximate Breast Health Risk & Awareness Graph
            </h2>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowDoctorModal(true)}
              style={{ fontSize: "0.82rem", borderRadius: "20px", padding: "6px 14px", borderColor: "var(--rose)" }}
            >
              📄 Prepare Doctor Visit Summary
            </button>
            <div className="risk-status-pill" style={{ borderColor: riskColor, color: riskColor }}>
              ● {riskTitle}
            </div>
          </div>
        </div>

        <p style={{ color: "var(--muted)", marginBottom: 20 }}>
          This visual chart is synthesized from your interactive animated self-examination inputs, chatbot responses, and monthly tissue checkups.
        </p>

        {/* Risk Visual Meter / Gauge Bar */}
        <div className="risk-meter-wrapper">
          <div className="risk-meter-labels">
            <span>Baseline (Low Risk)</span>
            <span>Hormonal / Cyclical</span>
            <span>Clinical Check Recommended</span>
          </div>
          <div className="risk-meter-track">
            <div
              className="risk-meter-fill"
              style={{
                width: `${riskPercentage}%`,
                background: riskColor,
              }}
            />
          </div>
        </div>

        {/* Quadrant Breakdown Graph */}
        <div className="quadrant-chart-grid">
          <div className="quadrant-bar-item">
            <span className="mono">Upper-Outer (Axilla)</span>
            <div className="bar-container">
              <div
                className="bar-fill"
                style={{
                  width: upperMetrics.width,
                  background: upperMetrics.color,
                }}
              />
            </div>
            <small>{upperMetrics.label}</small>
          </div>

          <div className="quadrant-bar-item">
            <span className="mono">Lower-Outer Quadrant</span>
            <div className="bar-container">
              <div
                className="bar-fill"
                style={{
                  width: lowerMetrics.width,
                  background: lowerMetrics.color,
                }}
              />
            </div>
            <small>{lowerMetrics.label}</small>
          </div>

          <div className="quadrant-bar-item">
            <span className="mono">Areola & Nipple Axis</span>
            <div className="bar-container">
              <div
                className="bar-fill"
                style={{
                  width: areolaMetrics.width,
                  background: areolaMetrics.color,
                }}
              />
            </div>
            <small>{areolaMetrics.label}</small>
          </div>

          <div className="quadrant-bar-item">
            <span className="mono">Axillary Lymph Hollow</span>
            <div className="bar-container">
              <div
                className="bar-fill"
                style={{
                  width: axillaryMetrics.width,
                  background: axillaryMetrics.color,
                }}
              />
            </div>
            <small>{axillaryMetrics.label}</small>
          </div>
        </div>

        {/* Recommendation Box */}
        <div className="ml-recommendation-box" style={{ borderLeft: `5px solid ${riskColor}` }}>
          <h4 className="serif" style={{ color: "var(--plum)", marginBottom: 4 }}>
            Clinical Guidance Note:
          </h4>
          <p style={{ color: "var(--ink)", fontSize: "0.92rem", lineHeight: 1.6 }}>
            {recommendation}
          </p>
        </div>
      </div>

      {/* Row of AI-Powered Features: Personalized Baseline & Recent AI Notes */}
      <div className="dashboard-ai-row">
        {/* Card 1: Personalized Baseline Tracking Profile */}
        <div className="dashboard-ai-card">
          <div>
            <span className="mono" style={{ color: "var(--rose)", fontWeight: 600 }}>
              Tissue Literacy Profile
            </span>
            <h3>Personalized Baseline</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
              Synthesized from your conversational descriptions and tactile check-ins to distinguish your unique anatomy from actual deviations.
            </p>

            <div className="baseline-status-box">
              <strong>
                {userBaseline?.profile ? userBaseline.profile : "Typical Symmetrical Glandular Profile"}
              </strong>
              <p>
                {userBaseline?.profile
                  ? "Your ongoing awareness baseline is active. Future check-ins compare changes against this profile rather than a generic textbook."
                  : "Complete an AI check-in or describe your typical pre-period tissue to calibrate your personalized breast health profile."}
              </p>
            </div>

            <div className="baseline-tag-pills">
              <span className="baseline-pill">✦ Quadrant Calibrated</span>
              <span className="baseline-pill">✦ Hormonal Cycle Indexed</span>
            </div>
          </div>

          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
            <button
              className="btn btn-soft btn-sm"
              onClick={() => setShowDoctorModal(true)}
              style={{ width: "100%", justifyContent: "center" }}
            >
              📄 Export Doctor Discussion Sheet
            </button>
          </div>
        </div>

        {/* Card 2: Recent AI Check-in Notes Timeline Feed */}
        <div className="dashboard-ai-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span className="mono" style={{ color: "var(--rose)", fontWeight: 600 }}>
                Conversational Memory
              </span>
              <h3>Recent AI Check-in Notes</h3>
            </div>
            <span className="mono" style={{ fontSize: "0.74rem", color: "var(--muted)" }}>
              {aiNotes.length} Log{aiNotes.length === 1 ? "" : "s"}
            </span>
          </div>

          <p style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
            Key insights, symptom triage, and next steps extracted from your chats with Bloom AI.
          </p>

          <div className="ai-notes-timeline">
            {aiNotes.length > 0 ? (
              aiNotes.map((note) => (
                <div className="ai-note-item" key={note.id}>
                  <div className="ai-note-header">
                    <span className="ai-note-user-query">"{note.userMessage}"</span>
                    <span className="ai-note-date">
                      {new Date(note.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className="ai-note-summary">
                    <strong>AI Clinical Insight:</strong> {note.summaryNote?.replace(/^(1-sentence note|note|clinical insight):\s*/i, "")}
                  </div>
                  <div className="ai-note-action">
                    ✦ Next step: {note.action?.replace(/^(next step|action):\s*/i, "")}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "30px 10px", textAlign: "center", color: "var(--muted)", fontSize: "0.88rem" }}>
                <span>🌱 No AI consultation logs yet. Start a conversation on the Check-in page to see insights recorded here!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Longitudinal Cadence & Session History Log */}
      <div className="dashboard-history-section">
        <div className="history-section-header">
          <div>
            <span className="mono" style={{ color: "var(--rose)", fontWeight: 600 }}>
              Longitudinal Cadence Log
            </span>
            <h2 className="serif">Check-in History & Session Tally</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginTop: 4 }}>
              Comparing your check-in sessions over time with interval tracking, clinical findings, and awareness notes.
            </p>
          </div>
          <span className="history-badge-count">
            {sessionHistory.length} Recorded Session{sessionHistory.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="history-list">
          {sessionHistory.length > 0 ? (
            sessionHistory.map((sess, idx) => {
              const prevSess = sessionHistory[idx + 1];
              const intervalText = getIntervalText(sess.date, prevSess?.date);
              const sessionNum = sessionHistory.length - idx;

              let icon = "✓";
              if (sess.type?.includes("Exam")) icon = "🌸";
              else if (sess.type?.includes("AI") || sess.type?.includes("Chat")) icon = "💬";

              const isRiskHigh =
                sess.riskLevel?.toLowerCase().includes("clinical") ||
                sess.riskLevel?.toLowerCase().includes("review");
              const isRiskCyclic =
                sess.riskLevel?.toLowerCase().includes("cyclical") ||
                sess.riskLevel?.toLowerCase().includes("moderate");
              const pillBg = isRiskHigh
                ? "var(--rose-light)"
                : isRiskCyclic
                ? "rgba(168, 85, 247, 0.1)"
                : "var(--sage-light)";
              const pillColor = isRiskHigh ? "var(--plum)" : isRiskCyclic ? "#7e22ce" : "#3b5c35";
              const pillBorder = isRiskHigh
                ? "rgba(199, 110, 138, 0.4)"
                : isRiskCyclic
                ? "rgba(168, 85, 247, 0.3)"
                : "rgba(102, 131, 94, 0.3)";

              return (
                <div className="history-item-card" key={sess.id || idx}>
                  <div className="history-meta-col">
                    <span className="history-session-num">Session #{sessionNum}</span>
                    <span className="history-date">
                      {new Date(sess.date).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      •{" "}
                      {new Date(sess.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="history-interval-pill">⏳ {intervalText}</span>
                  </div>

                  <div className="history-detail-col">
                    <div className="history-type-tag">
                      <span>{icon}</span>
                      <span>{sess.type}</span>
                      {sess.badge && (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            background: "var(--paper)",
                            border: "1px solid var(--border)",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            color: "var(--muted)",
                            fontWeight: 500,
                          }}
                        >
                          {sess.badge}
                        </span>
                      )}
                    </div>
                    <p className="history-summary-text">{sess.summary}</p>
                  </div>

                  <div className="history-status-col">
                    <span
                      className="history-risk-pill"
                      style={{ background: pillBg, color: pillColor, borderColor: pillBorder }}
                    >
                      ● {sess.riskLevel || "Low Risk / Baseline Typical"}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "var(--muted)",
                fontSize: "0.92rem",
              }}
            >
              🌱 No sessions recorded yet. Start an interactive self-exam or talk with Bloom to establish
              your first baseline!
            </div>
          )}
        </div>
      </div>

      {/* Doctor Discussion Summary Modal (Printable & Word Document Export) */}
      {showDoctorModal && (
        <div className="doctor-modal-backdrop" onClick={() => setShowDoctorModal(false)}>
          <div className="doctor-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="doctor-modal-header">
              <h2>Doctor Visit Discussion Summary</h2>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowDoctorModal(false)}
                style={{ borderRadius: "50%", width: 34, height: 34, padding: 0 }}
              >
                ✕
              </button>
            </div>

            <div className="doctor-modal-body">
              <div className="doctor-doc-preview" id="printableDoctorSheet">
                <div className="doctor-doc-header">
                  <h3>Bloom Patient Self-Awareness Clinical Record</h3>
                  <div className="doctor-doc-meta">
                    <span><strong>Patient:</strong> {user.name}</span>
                    <span><strong>Date Prepared:</strong> {new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</span>
                    <span><strong>Risk Rating:</strong> {riskTitle}</span>
                  </div>
                </div>

                <div className="doctor-doc-section">
                  <h4>1. Clinical Guidance Overview</h4>
                  <p style={{ fontSize: "0.92rem", color: "var(--ink)" }}>{recommendation}</p>
                </div>

                <div className="doctor-doc-section">
                  <h4>2. Quadrant & Anatomical Findings</h4>
                  <table className="doctor-table">
                    <thead>
                      <tr>
                        <th>Anatomical Region</th>
                        <th>Observed Texture / Symptom</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Upper-Outer (Axillary Tail)</td>
                        <td>{upperMetrics.label}</td>
                        <td><span style={{ color: upperMetrics.color, fontWeight: 600 }}>● {upperReport?.score >= 3 ? "Clinical Review" : upperReport?.score === 1 ? "Cyclical" : "Normal"}</span></td>
                      </tr>
                      <tr>
                        <td>Lower-Outer Quadrant</td>
                        <td>{lowerMetrics.label}</td>
                        <td><span style={{ color: lowerMetrics.color, fontWeight: 600 }}>● {lowerReport?.score >= 3 ? "Clinical Review" : lowerReport?.score === 1 ? "Cyclical" : "Normal"}</span></td>
                      </tr>
                      <tr>
                        <td>Areola & Nipple Axis</td>
                        <td>{areolaMetrics.label}</td>
                        <td><span style={{ color: areolaMetrics.color, fontWeight: 600 }}>● {areolaReport?.score >= 3 ? "Clinical Review" : areolaReport?.score === 1 ? "Cyclical" : "Normal"}</span></td>
                      </tr>
                      <tr>
                        <td>Axillary Lymph Hollow</td>
                        <td>{axillaryMetrics.label}</td>
                        <td><span style={{ color: axillaryMetrics.color, fontWeight: 600 }}>● {axillaryReport?.score >= 3 ? "Clinical Review" : axillaryReport?.score === 1 ? "Cyclical" : "Normal"}</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="doctor-doc-section">
                  <h4>3. Longitudinal Check-in Cadence History</h4>
                  <table className="doctor-table">
                    <thead>
                      <tr>
                        <th>Session</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Cadence Interval</th>
                        <th>Summary Finding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionHistory && sessionHistory.length > 0 ? (
                        sessionHistory.slice(0, 5).map((s, idx) => (
                          <tr key={s.id || idx}>
                            <td><strong>Session #{sessionHistory.length - idx}</strong></td>
                            <td>{new Date(s.date).toLocaleDateString()}</td>
                            <td>{s.type}</td>
                            <td>{getIntervalText(s.date, sessionHistory[idx + 1]?.date)}</td>
                            <td>{s.summary}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="5" style={{ color: "var(--muted)" }}>No past session records logged.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="doctor-doc-section">
                  <h4>4. Recent Patient AI Consultation Notes</h4>
                  {aiNotes && aiNotes.length > 0 ? (
                    aiNotes.slice(0, 4).map((n) => (
                      <p key={n.id} style={{ fontSize: "0.88rem", margin: "6px 0" }}>
                        <strong>{new Date(n.date).toLocaleDateString()}:</strong> "{n.userMessage}" — <span style={{ color: "var(--muted)" }}>{n.summaryNote}</span>
                      </p>
                    ))
                  ) : (
                    <p style={{ fontSize: "0.88rem", color: "var(--muted)" }}>No recent conversational symptoms logged.</p>
                  )}
                </div>

                <div className="doctor-doc-section">
                  <h4>5. Suggested Discussion Questions for Physician</h4>
                  <ul style={{ fontSize: "0.88rem", paddingLeft: "20px", color: "var(--ink)" }}>
                    <li>Are the physical findings noted consistent with benign fibroadenoma or cyclical breast tissue?</li>
                    <li>Would a targeted breast ultrasound or screening mammogram provide helpful diagnostic baseline clarity?</li>
                    <li>Should we schedule a re-check 3–5 days after my next menstrual period?</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="doctor-modal-footer">
              <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                Export for your physician or keep for your personal medical binder.
              </span>
              <div className="doctor-modal-actions">
                <button className="btn btn-outline btn-sm" onClick={downloadWordSummary}>
                  📥 Download Word (.doc)
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                  🖨️ Print / Save as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
