// ---------------------------------------------------------------------------
// api.js
//
// Every function here is written to match a real Express route 1:1, so when
// the backend (see /backend in the project root) is running, you swap the
// body of each function for a `fetch("/api/...")` call and nothing in the
// components needs to change.
//
//   signup()        -> POST /api/auth/signup
//   login()         -> POST /api/auth/login
//   getMe()         -> GET  /api/auth/me            (reads JWT cookie/header)
//   getDashboard()  -> GET  /api/checkins/summary
//   submitCheckin() -> POST /api/checkins
//   getFlashcards() -> GET  /api/flashcards
//   getBlogPosts()  -> GET  /api/blog
//   scoreMlQuiz()   -> POST /api/ml/score            (once the model exists)
//
// For now, everything is backed by localStorage so the app is fully
// functional to click through without a server running.
// ---------------------------------------------------------------------------

const DB_KEY = "bloom_mock_db_v1";
const USE_REAL_API = true; // Connected to real Express + MongoDB backend
const API_BASE = import.meta.env.VITE_API_URL || "/api";

function getAuthHeaders() {
  const token = localStorage.getItem("bloom_jwt_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function readDb() {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) return JSON.parse(raw);
  const initial = { users: {}, session: null };
  localStorage.setItem(DB_KEY, JSON.stringify(initial));
  return initial;
}

function writeDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function delay(ms = 350) {
  return new Promise((res) => setTimeout(res, ms));
}

function fakeToken(email) {
  return btoa(`${email}.${Date.now()}`);
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function signup({ name, email, password }) {
  if (USE_REAL_API) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    }).catch(() => {
      throw new Error("Backend server is not running! Please make sure 'npm run dev' is active in bloom-backend.");
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Signup failed");
    if (data.token) localStorage.setItem("bloom_jwt_token", data.token);
    localStorage.setItem("bloom_current_user", JSON.stringify({ name: data.name, email: data.email }));
    return { name: data.name, email: data.email, token: data.token };
  }

  await delay();
  const db = readDb();
  if (db.users[email]) throw new Error("An account with that email already exists.");
  db.users[email] = {
    name,
    email,
    password,
    checkins: [],
    nextReminder: null,
  };
  db.session = { email, token: fakeToken(email) };
  writeDb(db);
  localStorage.setItem("bloom_current_user", JSON.stringify({ name, email }));
  return { name, email, token: db.session.token };
}

export async function login({ email, password }) {
  if (USE_REAL_API) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).catch(() => {
      throw new Error("Backend server is not running! Please make sure 'npm run dev' is active in bloom-backend.");
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    if (data.token) localStorage.setItem("bloom_jwt_token", data.token);
    localStorage.setItem("bloom_current_user", JSON.stringify({ name: data.name, email: data.email }));
    return { name: data.name, email: data.email, token: data.token };
  }

  await delay();
  const db = readDb();
  const user = db.users[email];
  if (!user || user.password !== password) {
    throw new Error("Incorrect email or password.");
  }
  db.session = { email, token: fakeToken(email) };
  writeDb(db);
  localStorage.setItem("bloom_current_user", JSON.stringify({ name: user.name, email: user.email }));
  return { name: user.name, email: user.email, token: db.session.token };
}

export function logout() {
  localStorage.removeItem("bloom_jwt_token");
  localStorage.removeItem("bloom_current_user");
  if (USE_REAL_API) {
    fetch(`${API_BASE}/auth/logout`, { method: "POST", headers: getAuthHeaders() }).catch(() => {});
  }
  const db = readDb();
  db.session = null;
  writeDb(db);
}

export function getSession() {
  const stored = localStorage.getItem("bloom_current_user");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  const db = readDb();
  if (!db.session) return null;
  const user = db.users[db.session.email];
  if (!user) return null;
  return { name: user.name, email: user.email };
}

// ---------------------------------------------------------------------------
// Check-ins / dashboard
// ---------------------------------------------------------------------------

export async function getDashboard() {
  if (USE_REAL_API) {
    try {
      const res = await fetch(`${API_BASE}/checkins/summary`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const d = await res.json();
        // Hydrate local cache from MongoDB Atlas for cross-device persistence
        if (d.latestExamReport) {
          localStorage.setItem("bloom_latest_exam_report", JSON.stringify(d.latestExamReport));
        }
        if (Array.isArray(d.aiNotes) && d.aiNotes.length > 0) {
          localStorage.setItem("bloom_ai_checkin_notes", JSON.stringify(d.aiNotes));
        }
        if (d.personalizedBaseline) {
          localStorage.setItem("bloom_user_baseline", JSON.stringify(d.personalizedBaseline));
        }
        if (Array.isArray(d.sessionHistory) && d.sessionHistory.length > 0) {
          localStorage.setItem("bloom_session_history", JSON.stringify(d.sessionHistory));
        }
        return d;
      }
    } catch (e) {
      console.warn("Backend dashboard fetch notice:", e.message);
    }
  }

  await delay(150);
  const db = readDb();
  const session = db.session;
  if (!session) return null;
  const user = db.users[session.email];
  return {
    checkinCount: user?.checkins?.length || 0,
    nextReminder: user?.nextReminder || null,
    history: user?.checkins || [],
  };
}

export async function submitCheckin({ answers, report, session }) {
  if (USE_REAL_API) {
    try {
      const res = await fetch(`${API_BASE}/checkins`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ answers, report, session }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Backend checkin submit notice:", e.message);
    }
  }

  await delay(200);
  const db = readDb();
  const sessionUser = db.session;
  if (!sessionUser) throw new Error("Not logged in.");
  const user = db.users[sessionUser.email];
  const next = new Date();
  next.setDate(next.getDate() + 30);
  user.checkins.push({ answers, date: new Date().toISOString() });
  user.nextReminder = next.toISOString();
  writeDb(db);
  return { checkinCount: user.checkins.length, nextReminder: user.nextReminder };
}

// ---------------------------------------------------------------------------
// Flashcards
// ---------------------------------------------------------------------------

export async function getFlashcards() {
  await delay(100);
  return [
    {
      id: "fc1",
      question: "How often should a self-exam be done?",
      answer: "Roughly once a month, ideally a few days after a period ends when tissue is least tender.",
    },
    {
      id: "fc2",
      question: "Is breast pain usually a sign of cancer?",
      answer: "Rarely. Cyclical pain tied to a menstrual cycle is common and usually not a warning sign — persistent, one-sided pain is worth mentioning to a doctor.",
    },
    {
      id: "fc3",
      question: "What's one change worth mentioning to a doctor?",
      answer: "A new lump that feels different from surrounding tissue, skin dimpling, or unexplained nipple discharge.",
    },
    {
      id: "fc4",
      question: "Do self-exams replace mammograms?",
      answer: "No — they're a complement, not a substitute. Self-exams build familiarity with your own body between clinical screenings.",
    },
    {
      id: "fc5",
      question: "Does a lump always mean cancer?",
      answer: "No. Most breast lumps are benign (cysts, fibroadenomas). Still, any new or changing lump is worth having checked.",
    },
  ];
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

import { BLOG_POSTS } from "../data/blogPosts";

export async function getBlogPosts() {
  await delay(100);
  return BLOG_POSTS;
}

// ---------------------------------------------------------------------------
// AI Chatbot with Gemini & Clinical Triage Extraction
// ---------------------------------------------------------------------------

const GEMINI_SYSTEM_INSTRUCTION = `You are Bloom Assistant, a warm, supportive, evidence-based breast health awareness companion.
Your tone is conversational, empathetic, non-alarmist, and clear. 
Always reassure the user that over 80% of breast lumps or changes are benign (cysts, fibroadenomas, cyclical variations), but persistent changes warrant clinical evaluation.
At the very end of your response, output a compact triage tag on its own line:
[TRIAGE: nature(normal|cyclical|lump|discharge|general), quadrant(upper-outer|upper-inner|lower-outer|lower-inner|areola-nipple|underarm-axilla|none), risk(low|cyclical|clinical_review), clinical_summary, contextual_next_step]
Do not write labels like "1-sentence note:" or "Next step:" inside the fields. The clinical_summary should be a crisp summary of what was discussed or found. The contextual_next_step should be a tailored, actionable recommendation specific to their query or symptom (e.g. "Recheck tissue 3–5 days post-menstruation", "Schedule clinician exam and targeted ultrasound", "Practice circular palpation technique via the self-exam guide", or "Continue monthly awareness rhythm").`;

export async function sendChatMessage({ message, history = [], user = null }) {
  let reply = "";
  let triage = null;

  const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || "";

  // Build clean contents list ensuring the conversation starts with a user turn
  const contents = [];
  if (Array.isArray(history)) {
    for (const msg of history) {
      if (msg.type === "user" || msg.role === "user") {
        contents.push({ role: "user", parts: [{ text: msg.text || msg.content }] });
      } else if (contents.length > 0 && (msg.type === "bot" || msg.role === "model")) {
        const cleanText = (msg.text || msg.content || "")
          .replace(/<bloom_triage>[\s\S]*?<\/bloom_triage>/g, "")
          .replace(/\[TRIAGE:[^\]]*\]/g, "")
          .trim();
        if (cleanText) {
          contents.push({ role: "model", parts: [{ text: cleanText }] });
        }
      }
    }
  }
  contents.push({ role: "user", parts: [{ text: message }] });

  // Ultra-fast Flash-Lite models with automatic cascade (under 1.5s response time)
  const MODELS_TO_TRY = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.8-flash"];

  for (const modelName of MODELS_TO_TRY) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: GEMINI_SYSTEM_INSTRUCTION }] },
            contents,
          }),
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (rawText) {
          // Parse compact triage tag [TRIAGE: nature, quadrant, risk, note, next_step]
          const triageMatch = rawText.match(/\[TRIAGE:\s*([^,\]]+),\s*([^,\]]+),\s*([^,\]]+),\s*([^,\]]+)(?:,\s*([^\]]+))?\]/i);
          if (triageMatch) {
            const [, nat, quad, risk, note, step] = triageMatch;
            const mappedQuad = quad.trim().toLowerCase();
            let finalQuad = null;
            if (mappedQuad.includes("upper") && mappedQuad.includes("outer")) finalQuad = "quadrant-upper-outer";
            else if (mappedQuad.includes("upper") && mappedQuad.includes("inner")) finalQuad = "quadrant-upper-inner";
            else if (mappedQuad.includes("lower") && mappedQuad.includes("outer")) finalQuad = "quadrant-lower-outer";
            else if (mappedQuad.includes("lower") && mappedQuad.includes("inner")) finalQuad = "quadrant-lower-inner";
            else if (mappedQuad.includes("areola") || mappedQuad.includes("nipple")) finalQuad = "areola-nipple";
            else if (mappedQuad.includes("axilla") || mappedQuad.includes("underarm") || mappedQuad.includes("armpit")) finalQuad = "underarm-axilla";

            const cleanNote = (note || "").replace(/^(1-sentence note|note|clinical insight):\s*/i, "").trim();
            let cleanStep = (step || "").replace(/^(next step|action|recommendation):\s*/i, "").trim();
            if (!cleanStep) {
              cleanStep = risk.toLowerCase().includes("clinical") || risk.toLowerCase().includes("review")
                ? "Schedule clinical evaluation with healthcare provider"
                : risk.toLowerCase().includes("cyclical")
                ? "Recheck tissue 3–5 days after period ends"
                : "Continue routine monthly self-awareness check-in";
            }

            triage = {
              symptomNature: nat.trim().toLowerCase(),
              detectedQuadrant: finalQuad,
              riskCategory: risk.trim().toLowerCase(),
              riskScoreImpact: risk.toLowerCase().includes("clinical") || risk.toLowerCase().includes("review") ? 3 : risk.toLowerCase().includes("cyclical") ? 1 : 0,
              summaryNote: cleanNote,
              baselineObservation: "Conversational check-in finding",
              recommendedAction: cleanStep,
            };
          }

          // Strip the triage tag from the user-visible reply
          reply = rawText
            .replace(/\[TRIAGE:[^\]]*\]/gi, "")
            .replace(/<bloom_triage>[\s\S]*?<\/bloom_triage>/gi, "")
            .trim();
          break; // Succeeded!
        }
      } else {
        const err = await geminiRes.json().catch(() => ({}));
        console.warn(`Model ${modelName} returned status ${geminiRes.status}:`, err.error?.message || err);
      }
    } catch (netErr) {
      console.warn(`Fetch to ${modelName} failed:`, netErr.message);
    }
  }

  // Graceful conversational response if network is offline
  if (!reply) {
    const lower = message.toLowerCase();
    if (lower.includes("stress") || lower.includes("eat") || lower.includes("scared") || lower.includes("anxious") || lower.includes("worry")) {
      reply = "I completely hear you. Discovering a new sensation in your body or worrying about your health can feel deeply overwhelming and stressful. Please take a slow, gentle breath. Remember that the vast majority (over 80%) of breast changes are harmless cysts, normal glandular tissue, or hormonal fluctuations. You are in control, and taking things one step at a time is the best path forward.";
    } else {
      reply = "Thank you for sharing that with me. Whether you are doing your routine check or exploring a specific question, tell me what you're noticing or how you are feeling—we can go through it together at your own pace.";
    }
  }

  if (!triage) {
    triage = {
      symptomNature: "general_query",
      detectedQuadrant: null,
      riskCategory: "low",
      riskScoreImpact: 0,
      summaryNote: "Conversational check-in with Bloom AI",
      baselineObservation: "Individual baseline tissue inquiry",
      recommendedAction: "Continue gentle monthly body literacy",
    };
  }

  // 4. Persist AI check-in note to localStorage for Dashboard timeline
  try {
    const rawNotes = localStorage.getItem("bloom_ai_checkin_notes");
    const notes = rawNotes ? JSON.parse(rawNotes) : [];
    notes.unshift({
      id: Date.now(),
      date: new Date().toISOString(),
      userMessage: message,
      summaryNote: triage?.summaryNote || "Check-in consultation with Bloom AI",
      nature: triage?.symptomNature || "general_query",
      quadrant: triage?.detectedQuadrant || null,
      riskCategory: triage?.riskCategory || "low",
      scoreImpact: triage?.riskScoreImpact || 0,
      action: triage?.recommendedAction || "Continue monthly awareness routine",
      baseline: triage?.baselineObservation || "Normal pliable baseline tissue",
    });
    localStorage.setItem("bloom_ai_checkin_notes", JSON.stringify(notes.slice(0, 20)));

    // Persist into longitudinal session history log
    const rawHistory = localStorage.getItem("bloom_session_history");
    const history = rawHistory ? JSON.parse(rawHistory) : [];
    const recentAiSession = history.find(
      (h) => h.source === "ai-chat" && Date.now() - new Date(h.date).getTime() < 10 * 60 * 1000
    );
    if (recentAiSession) {
      recentAiSession.summary = `${triage?.summaryNote || "AI Consultation"} (Latest: "${message.slice(0, 50)}")`;
      recentAiSession.riskLevel =
        triage?.riskScoreImpact >= 3
          ? "Clinical Review Recommended"
          : triage?.riskScoreImpact >= 1
          ? "Moderate / Cyclical Changes"
          : "Low Risk / Baseline Typical";
    } else {
      history.unshift({
        id: `ai_${Date.now()}`,
        date: new Date().toISOString(),
        type: "Bloom AI Consultation",
        badge: "Conversational Triage",
        riskLevel:
          triage?.riskScoreImpact >= 3
            ? "Clinical Review Recommended"
            : triage?.riskScoreImpact >= 1
            ? "Moderate / Cyclical Changes"
            : "Low Risk / Baseline Typical",
        summary: `${triage?.summaryNote || "Consultation with Bloom"} ("${message.slice(0, 60)}")`,
        source: "ai-chat",
      });
    }
    localStorage.setItem("bloom_session_history", JSON.stringify(history.slice(0, 30)));
  } catch (e) {
    console.error("Failed to store AI check-in note:", e);
  }

  // 2. Dynamic Symptom Mapping to Quadrant Graph:
  // If a quadrant symptom was detected, update or inject it into bloom_latest_exam_report
  if (triage?.detectedQuadrant && triage?.riskScoreImpact !== undefined) {
    try {
      const storedReport = localStorage.getItem("bloom_latest_exam_report");
      const report = storedReport ? JSON.parse(storedReport) : { answers: {} };
      if (!report.answers) report.answers = {};

      const existingScore = report.answers[triage.detectedQuadrant]?.score || 0;
      // Only upgrade or update score if not overriding a higher clinical finding
      const newScore = Math.max(existingScore, triage.riskScoreImpact);

      report.answers[triage.detectedQuadrant] = {
        stageName: triage.detectedQuadrant,
        selection: `AI Chat: ${triage.summaryNote}`,
        score: newScore,
        tag: triage.riskCategory,
        fromAiChat: true,
        updatedAt: new Date().toISOString(),
      };

      report.totalScore = Object.values(report.answers).reduce((sum, item) => sum + (item.score || 0), 0);
      report.riskLevel = report.totalScore >= 3 ? "Clinical Review Recommended" : report.totalScore >= 1 ? "Moderate / Cyclical Changes" : "Low Risk / Baseline Typical";
      localStorage.setItem("bloom_latest_exam_report", JSON.stringify(report));
    } catch (e) {
      console.error("Failed to map symptom to quadrant report:", e);
    }
  }

  // 3. Personalized Baseline Tracking:
  if (triage?.baselineObservation) {
    try {
      localStorage.setItem("bloom_user_baseline", JSON.stringify({
        profile: triage.baselineObservation,
        updatedAt: new Date().toISOString(),
      }));
    } catch (e) {}
  }

  // 5. Cross-device sync to MongoDB Atlas when logged in
  if (USE_REAL_API && localStorage.getItem("bloom_jwt_token")) {
    try {
      const storedReport = localStorage.getItem("bloom_latest_exam_report");
      const currentReport = storedReport ? JSON.parse(storedReport) : null;
      const storedBaseline = localStorage.getItem("bloom_user_baseline");
      const currentBaseline = storedBaseline ? JSON.parse(storedBaseline) : null;

      fetch(`${API_BASE}/checkins/ai-note`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          note: {
            id: Date.now(),
            date: new Date().toISOString(),
            userMessage: message,
            summaryNote: triage?.summaryNote || "Check-in consultation with Bloom AI",
            nature: triage?.symptomNature || "general_query",
            quadrant: triage?.detectedQuadrant || null,
            riskCategory: triage?.riskCategory || "low",
            scoreImpact: triage?.riskScoreImpact || 0,
            action: triage?.recommendedAction || "Continue monthly awareness routine",
            baseline: triage?.baselineObservation || "Normal pliable baseline tissue",
          },
          baseline: currentBaseline,
          quadrantReport: currentReport,
          session: {
            id: `ai_${Date.now()}`,
            date: new Date().toISOString(),
            type: "Bloom AI Consultation",
            badge: "Conversational Triage",
            riskLevel:
              triage?.riskScoreImpact >= 3
                ? "Clinical Review Recommended"
                : triage?.riskScoreImpact >= 1
                ? "Moderate / Cyclical Changes"
                : "Low Risk / Baseline Typical",
            summary: `${triage?.summaryNote || "Consultation with Bloom"} ("${message.slice(0, 60)}")`,
            source: "ai-chat",
          },
        }),
      }).catch((e) => console.warn("MongoDB AI note sync notice:", e.message));
    } catch (e) {}
  }

  return { reply, triage };
}
