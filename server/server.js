import "dotenv/config";
import express from "express";
import cors from "cors";
import pingRoutes from "./routes/pingRoutes.js";
import playerRoutes from "./routes/playerRoutes.js";
import syncRoutes from "./routes/syncRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import qbLinesRoutes from "./routes/qbLinesRoutes.js";
import bigbPicksRoutes from "./routes/bigbPicksRoutes.js";
import picksRoutes from "./routes/picksRoutes.js";
import playerDetailsRoutes from "./routes/playerDetailsRoutes.js";
import authRoutes from "./routes/auth.js";
import premiumRoutes from "./routes/premium.js";
import { stripeWebhookHandler } from "./routes/stripeWebhook.js";
import { connectMongo } from "./db/mongo.js";
import weeklyUnlockRoutes from "./routes/weeklyUnlock.js";

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhookHandler);
app.use(express.json());

app.use("/api", pingRoutes);
app.use("/api", qbLinesRoutes);
app.use("/api", bigbPicksRoutes);
app.use("/api", picksRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api", playerDetailsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/weekly-unlock", weeklyUnlockRoutes);

app.get("/", (req, res) => {
  res.send("Fantasy Analyzer backend is running");
});

connectMongo()
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
