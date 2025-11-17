import mongoose from "mongoose";

const playerWeekStatSchema = new mongoose.Schema(
  {
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
    externalId: { type: String, required: true },
    season: { type: Number, required: true },
    week: { type: Number, required: true },
    position: { type: String, required: true },
    team: { type: String, default: "" },

    passAtt: { type: Number, default: 0 },
    passCmp: { type: Number, default: 0 },
    passYds: { type: Number, default: 0 },
    passTD: { type: Number, default: 0 },
    interceptions: { type: Number, default: 0 },

    rushAtt: { type: Number, default: 0 },
    rushYds: { type: Number, default: 0 },
    rushTD: { type: Number, default: 0 },

    rec: { type: Number, default: 0 },
    recYds: { type: Number, default: 0 },
    recTD: { type: Number, default: 0 },
    twoPt: { type: Number, default: 0 },

    fgm_0_19: { type: Number, default: 0 },
    fgm_20_29: { type: Number, default: 0 },
    fgm_30_39: { type: Number, default: 0 },
    fgm_40_49: { type: Number, default: 0 },
    fgm_50_59: { type: Number, default: 0 },
    fgm_60_plus: { type: Number, default: 0 },
    xpm: { type: Number, default: 0 },
    fgMiss: { type: Number, default: 0 },
    xpMiss: { type: Number, default: 0 },
  },
  { timestamps: true }
);

playerWeekStatSchema.index({ season: 1, week: 1, playerId: 1 }, { unique: true });
playerWeekStatSchema.index({ playerId: 1, season: 1 });
playerWeekStatSchema.index({ season: 1, week: 1, position: 1, team: 1 });

export default mongoose.models.PlayerWeekStat ||
  mongoose.model("PlayerWeekStat", playerWeekStatSchema, "player_week_stats");
