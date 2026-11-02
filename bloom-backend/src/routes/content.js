import { Router } from "express";

const router = Router();

// These are static for now. If you want editors to manage this content later,
// move it into a Mongoose collection (Flashcard / BlogPost) the same way
// User is modeled, and swap these handlers for a .find().

router.get("/flashcards", (req, res) => {
  res.json([
    { id: "fc1", question: "How often should a self-exam be done?", answer: "Roughly once a month, ideally a few days after a period ends." },
    { id: "fc2", question: "Is breast pain usually a sign of cancer?", answer: "Rarely — cyclical pain is common. Persistent, one-sided pain is worth a doctor's opinion." },
    { id: "fc3", question: "What's one change worth mentioning to a doctor?", answer: "A new lump, skin dimpling, or unexplained nipple discharge." },
    { id: "fc4", question: "Do self-exams replace mammograms?", answer: "No — they complement clinical screening, they don't substitute for it." },
    { id: "fc5", question: "Does a lump always mean cancer?", answer: "No, most are benign. Any new or changing lump is still worth checking." },
  ]);
});

router.get("/blog", (req, res) => {
  res.json([
    { id: "b1", icon: "🌸", title: "What 'knowing your normal' actually means", excerpt: "Self-exams build a baseline, not a diagnosis." },
    { id: "b2", icon: "🩺", title: "What actually happens at a clinical breast exam", excerpt: "Demystifying the appointment removes most of the anxiety." },
    { id: "b3", icon: "🎗️", title: "Risk factors you can and can't change", excerpt: "Genetics matter, but so do everyday, controllable factors." },
  ]);
});

export default router;
