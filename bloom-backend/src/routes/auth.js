import { Router } from "express";
import User from "../models/User.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Name, email, and password are all required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: "An account with that email already exists." });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash });

    const token = signToken(user._id.toString());
    res.cookie("bloom_token", token, COOKIE_OPTS);
    res.status(201).json({ ...user.toSafeJSON(), token });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong creating your account." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await user.comparePassword(password))) {
      // Same message for both cases so we don't reveal which emails are registered.
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const token = signToken(user._id.toString());
    res.cookie("bloom_token", token, COOKIE_OPTS);
    res.json({ ...user.toSafeJSON(), token });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong logging you in." });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("bloom_token");
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json(user.toSafeJSON());
});

export default router;
