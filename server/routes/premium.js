import { Router } from "express";
import dotenv from "dotenv";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { canUseFreeUnlock, markFreeUnlockUsed } from "../utils/freeUnlock.js";
import stripe from "../stripeClient.js";

dotenv.config();

const router = Router();
const {
  STRIPE_PRICE_ID,
  CLIENT_ORIGIN,
} = process.env;
const PREMIUM_REDIRECT_BASE = CLIENT_ORIGIN || "https://bigb-analyzer.vercel.app";

router.post("/unlock-once", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (user.isPremium) {
      return res.json({ allowed: true, freeUnlockUsed: false, reason: "premium" });
    }
    let status = canUseFreeUnlock(user);
    if (!status.allowed) {
      return res.status(403).json({ allowed: false, reason: status.reason });
    }
    if (status.needsReset) {
      user.hasUsedWeeklyUnlock = false;
      user.lastFreeUnlockAt = null;
      await user.save();
      status = { allowed: true, reason: "reset" };
    }
    await markFreeUnlockUsed(user);
    return res.json({ allowed: true, freeUnlockUsed: true, reason: "unlock_granted" });
  } catch (error) {
    console.error("[premium.unlock-once] error", error);
    return res.status(500).json({ message: "Unable to grant free unlock right now." });
  }
});

router.post("/create-checkout-session", requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured." });
    }
    if (!STRIPE_PRICE_ID) {
      return res.status(500).json({ message: "Stripe price is not configured." });
    }
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user._id.toString(),
        },
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      billing_address_collection: "auto",
      customer: user.stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${PREMIUM_REDIRECT_BASE}/premium?status=success`,
      cancel_url: `${PREMIUM_REDIRECT_BASE}/premium?status=cancelled`,
      metadata: {
        userId: user._id.toString(),
      },
    });
    return res.json({ url: session.url });
  } catch (error) {
    console.error("[premium.create-checkout-session] error", error);
    return res.status(500).json({ message: "Unable to start checkout session." });
  }
});

export default router;
