import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import User from "../models/User.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

const SYSTEM_INSTRUCTION = `You are Bloom, an empathetic, supportive, clinician-reviewed breast health awareness companion.
Your tone is calm, non-alarmist, scientifically grounded, and warm.

Clinical & Safety Guardrails:
1. Clearly reinforce that you are an educational awareness assistant and do NOT provide clinical medical diagnoses.
2. Reassure the user that over 80% of breast lumps or changes are completely benign (cysts, fibroadenomas, hormonal glandular changes), but persistent changes always warrant evaluation by a healthcare provider.
3. Help the user understand the difference between cyclical tenderness (often bilateral, sore during luteal phase/leading up to menstruation) and localized nodules (discrete, persistent across cycles).
4. Guide them on optimal examination timing: 3 to 5 days after their menstrual period concludes, when estrogen/progesterone levels are lowest and tissue is softest.
5. If the user mentions concerning signs (unilateral spontaneous bloody discharge, distinct hard unmovable knot, sudden nipple retraction, orange-peel skin dimpling), gently recommend scheduling a clinical breast examination with their doctor for peace of mind.

CRITICAL: Structured Triage Block:
At the very end of your response, you MUST provide a structured JSON clinical triage block enclosed strictly inside <bloom_triage> and </bloom_triage> tags. Do not wrap this block in markdown code fences. Example:

<bloom_triage>
{
  "symptomNature": "normal" | "cyclical" | "lump" | "discharge" | "skin_change" | "general_query",
  "detectedQuadrant": "quadrant-upper-outer" | "quadrant-upper-inner" | "quadrant-lower-inner" | "quadrant-lower-outer" | "areola-nipple" | "underarm-axilla" | null,
  "riskCategory": "low" | "cyclical" | "clinical_review",
  "riskScoreImpact": 0 | 1 | 3,
  "summaryNote": "Concise 1-sentence clinician summary of reported symptom or finding",
  "baselineObservation": "Observation about user's tissue pattern (e.g., naturally dense, cyclical tenderness, normal pliable)",
  "recommendedAction": "Actionable next step (e.g., continue monthly routine, re-check 5 days post-period, schedule clinical exam)"
}
</bloom_triage>
`;

// Helper: parse <bloom_triage> tag
function extractTriage(text) {
  const match = text.match(/<bloom_triage>([\s\S]*?)<\/bloom_triage>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch (err) {
    console.error("Failed to parse triage JSON:", err);
    return null;
  }
}

router.post("/", optionalAuth, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "Message is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Gemini API key is not configured on the server." });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format chat history for Gemini
    const contents = [];

    if (Array.isArray(history)) {
      for (const msg of history) {
        if (msg.type === "user" || msg.role === "user") {
          contents.push({ role: "user", parts: [{ text: msg.text || msg.content }] });
        } else if (msg.type === "bot" || msg.role === "model") {
          // Strip any previous <bloom_triage> tags from history so it doesn't confuse model
          const cleanText = (msg.text || msg.content || "").replace(/<bloom_triage>[\s\S]*?<\/bloom_triage>/g, "").trim();
          if (cleanText) {
            contents.push({ role: "model", parts: [{ text: cleanText }] });
          }
        }
      }
    }

    // Add current user message
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const fullResponseText = response.text || "";
    const triage = extractTriage(fullResponseText);
    const cleanReply = fullResponseText.replace(/<bloom_triage>[\s\S]*?<\/bloom_triage>/g, "").trim();

    // If authenticated, persist check-in note to user profile
    if (req.userId) {
      try {
        const user = await User.findById(req.userId);
        if (user) {
          user.checkins.push({
            date: new Date(),
            answers: {
              type: "ai_chat",
              userMessage: message,
              aiSummary: triage?.summaryNote || cleanReply.slice(0, 120),
              triage,
            },
          });
          await user.save();
        }
      } catch (dbErr) {
        console.error("Error saving checkin to user profile:", dbErr);
      }
    }

    return res.json({
      reply: cleanReply,
      triage: triage || {
        symptomNature: "general_query",
        detectedQuadrant: null,
        riskCategory: "low",
        riskScoreImpact: 0,
        summaryNote: "Routine educational conversation with Bloom AI",
        baselineObservation: "Baseline tissue awareness inquiry",
        recommendedAction: "Continue regular monthly check-ins",
      },
    });
  } catch (error) {
    console.error("Gemini Chat Route Error:", error);
    return res.status(500).json({
      message: "An error occurred while generating a response from Bloom AI.",
      error: error.message,
    });
  }
});

export default router;
