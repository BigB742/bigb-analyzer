import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const { STRIPE_SECRET_KEY } = process.env;

let stripeClient = null;

if (STRIPE_SECRET_KEY) {
  stripeClient = new Stripe(STRIPE_SECRET_KEY);
} else {
  console.warn("[stripe] STRIPE_SECRET_KEY is not set. Premium checkout will be disabled.");
}

export default stripeClient;
