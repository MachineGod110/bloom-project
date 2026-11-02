import { Router } from "express";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const { answers, report, session } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.checkins.push({ answers: answers || {}, date: new Date() });

    if (report) {
      user.latestExamReport = report;
    }

    if (session) {
      if (!Array.isArray(user.sessionHistory)) user.sessionHistory = [];
      user.sessionHistory.unshift(session);
      user.sessionHistory = user.sessionHistory.slice(0, 50);
    }

    const next = new Date();
    next.setDate(next.getDate() + (user.reminderIntervalDays || 30));
    user.nextReminder = next;

    await user.save();
    res.status(201).json({
      checkinCount: user.checkins.length,
      nextReminder: user.nextReminder,
      latestExamReport: user.latestExamReport,
      sessionHistory: user.sessionHistory,
    });
  } catch (err) {
    console.error("Save checkin error:", err);
    res.status(500).json({ message: "Failed to record check-in." });
  }
});

router.post("/ai-note", requireAuth, async (req, res) => {
  try {
    const { note, baseline, session, quadrantReport } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (note) {
      if (!Array.isArray(user.aiNotes)) user.aiNotes = [];
      user.aiNotes.unshift(note);
      user.aiNotes = user.aiNotes.slice(0, 30);
    }

    if (baseline) {
      user.personalizedBaseline = baseline;
    }

    if (quadrantReport) {
      user.latestExamReport = quadrantReport;
    }

    if (session) {
      if (!Array.isArray(user.sessionHistory)) user.sessionHistory = [];
      const recentAiSession = user.sessionHistory.find(
        (h) => h.source === "ai-chat" && Date.now() - new Date(h.date).getTime() < 10 * 60 * 1000
      );
      if (recentAiSession) {
        recentAiSession.summary = session.summary;
        recentAiSession.riskLevel = session.riskLevel;
      } else {
        user.sessionHistory.unshift(session);
        user.sessionHistory = user.sessionHistory.slice(0, 50);
      }
    }

    await user.save();
    res.json({
      ok: true,
      aiNotes: user.aiNotes,
      personalizedBaseline: user.personalizedBaseline,
      sessionHistory: user.sessionHistory,
      latestExamReport: user.latestExamReport,
    });
  } catch (err) {
    console.error("Save AI note error:", err);
    res.status(500).json({ message: "Failed to save AI note." });
  }
});

router.get("/summary", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({
      checkinCount: user.checkins.length,
      nextReminder: user.nextReminder,
      history: user.checkins,
      aiNotes: user.aiNotes || [],
      personalizedBaseline: user.personalizedBaseline || null,
      latestExamReport: user.latestExamReport || null,
      sessionHistory: user.sessionHistory || [],
    });
  } catch (err) {
    console.error("Get summary error:", err);
    res.status(500).json({ message: "Failed to fetch summary." });
  }
});

export default router;
