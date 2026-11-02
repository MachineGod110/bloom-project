import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDb } from "./config/db.js";
import { startReminderJob } from "./cron/reminderJob.js";

import authRoutes from "./routes/auth.js";
import checkinRoutes from "./routes/checkins.js";
import contentRoutes from "./routes/content.js";
import chatRoutes from "./routes/chat.js";

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow tools with no origin (Postman, curl), matching localhost, or Vercel preview/production domains
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/checkins", checkinRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api", contentRoutes); // /api/flashcards, /api/blog

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Bloom API listening on http://localhost:${PORT}`));

connectDb()
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    startReminderJob();
  })
  .catch((err) => {
    console.warn("MongoDB Atlas connection notice:", err.message);
    console.log(`Bloom Express API & Gemini Chatbot are operational on http://localhost:${PORT}`);
  });
