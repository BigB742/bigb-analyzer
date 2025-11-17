import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { buildUserResponse } from "../utils/userResponse.js";

dotenv.config();

const router = Router();
const { JWT_SECRET } = process.env;
const SALT_ROUNDS = 10;

function signToken(user) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET not configured");
  }
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      isPremium: user.isPremium,
    },
    JWT_SECRET,
    { expiresIn: "14d" },
  );
}

const sanitizeUser = buildUserResponse;

router.post("/signup", async (req, res) => {
  try {
    const { firstName = "", lastName = "", email = "", password = "" } = req.body || {};
    const trimmedEmail = String(email).trim().toLowerCase();
    if (!trimmedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ message: "Invalid email address." });
    }
    const existing = await User.findOne({ email: trimmedEmail });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }
    const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);
    const user = await User.create({
      firstName: firstName?.trim() || "",
      lastName: lastName?.trim() || "",
      email: trimmedEmail,
      passwordHash,
      isPremium: false,
      premiumSince: null,
      premiumPlan: null,
      lastFreeUnlockAt: null,
      hasUsedWeeklyUnlock: false,
    });
    const token = signToken(user);
    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error("[auth.signup] error", error);
    return res.status(500).json({ message: "Unable to create account right now." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email = "", password = "" } = req.body || {};
    const trimmedEmail = String(email).trim().toLowerCase();
    if (!trimmedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const passwordValid = await bcrypt.compare(String(password), user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error("[auth.login] error", error);
    return res.status(500).json({ message: "Unable to login right now." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error("[auth.me] error", error);
    return res.status(500).json({ message: "Unable to load profile." });
  }
});

export default router;
