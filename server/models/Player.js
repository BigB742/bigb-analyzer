import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    externalId: { type: String, index: true, unique: true, sparse: true },

    name: { type: String, required: true },
    team: { type: String, required: true },
    position: { type: String, required: true },

    passAttempts: { type: Number, default: 0 },
    completions:  { type: Number, default: 0 },
    passYds:      { type: Number, default: 0 },
    passTDs:      { type: Number, default: 0 },
    interceptions:{ type: Number, default: 0 },
    rushAtt:      { type: Number, default: 0 },
    rushYds:      { type: Number, default: 0 },
    rushTDs:      { type: Number, default: 0 },
    fumbles:      { type: Number, default: 0 },

    rec:          { type: Number, default: 0 },
    recYds:       { type: Number, default: 0 },
    recTD:        { type: Number, default: 0 },
    twoPt:        { type: Number, default: 0 },

    fgm_0_19:     { type: Number, default: 0 },
    fgm_20_29:    { type: Number, default: 0 },
    fgm_30_39:    { type: Number, default: 0 },
    fgm_40_49:    { type: Number, default: 0 },
    fgm_50_59:    { type: Number, default: 0 },
    fgm_60_plus:  { type: Number, default: 0 },
    xpm:          { type: Number, default: 0 },
    fgMiss:       { type: Number, default: 0 },
    xpMiss:       { type: Number, default: 0 },

    season:       { type: Number, default: 2025 },
    lastWeek:     { type: Number, default: 0 },
  },
  { timestamps: true }
);

playerSchema.index({ position: 1, team: 1, name: 1 });

export default mongoose.models.Player ||
  mongoose.model("Player", playerSchema, "players");
