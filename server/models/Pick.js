import mongoose from "mongoose";

const pickSchema = new mongoose.Schema(
  {
    season: { type: Number, required: true },
    week: { type: Number, required: true },
    playerId: { type: String, required: true },
    playerName: { type: String, required: true },
    team: { type: String, required: true },
    opponent: { type: String, required: true },
    market: { type: String, required: true },
    line: { type: Number, required: true },
    side: { type: String, enum: ["over", "under"], required: true },
    result: { type: String, enum: ["pending", "W", "L"], default: "pending" },
    note: { type: String },
  },
  { timestamps: true }
);

pickSchema.index({ season: -1, week: -1 });
pickSchema.index({ playerId: 1, season: -1, week: -1 });

const Pick = mongoose.models.Pick || mongoose.model("Pick", pickSchema, "picks");

export default Pick;
