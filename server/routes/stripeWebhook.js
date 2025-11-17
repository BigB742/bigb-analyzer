import dotenv from "dotenv";
import stripe from "../stripeClient.js";
import User from "../models/User.js";

dotenv.config();

const { STRIPE_WEBHOOK_SECRET } = process.env;

export async function stripeWebhookHandler(req, res) {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return res.status(500).send("Stripe webhook not configured.");
  }

  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    console.log("[stripe webhook] Event received", event.type, event.id);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email =
        session?.customer_details?.email
        || session?.customer_email
        || (session?.metadata?.email ?? "").trim().toLowerCase();

      if (!email) {
        console.warn("[stripe webhook] checkout.session.completed missing email", session.id);
        return res.json({ received: true, note: "missing email" });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        console.warn("[stripe webhook] User not found for email", email);
        return res.json({ received: true, note: "user not found" });
      }

      user.isPremium = true;
      user.premiumSince = user.premiumSince || new Date();
      user.stripeCustomerId = session.customer || user.stripeCustomerId || null;
      user.stripeSubscriptionId = session.subscription || user.stripeSubscriptionId || null;
      await user.save();
    } else {
      console.log(`[stripe webhook] Unhandled event type ${event.type}`);
    }
    res.json({ received: true });
  } catch (err) {
    console.error("[stripe webhook] handler error", err);
    res.status(500).send("Webhook handler error.");
  }
}
