import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumSince: {
      type: Date,
      default: null,
    },
    premiumPlan: {
      type: String,
      default: null,
    },
    lastFreeUnlockAt: {
      type: Date,
      default: null,
    },
    hasUsedWeeklyUnlock: {
      type: Boolean,
      default: false,
    },
    weeklyUnlockPlayerId: {
      type: String,
      default: null,
    },
    weeklyUnlockPlayerName: {
      type: String,
      default: null,
    },
    weeklyUnlockWeek: {
      type: Number,
      default: null,
    },
    weeklyUnlockUsedAt: {
      type: Date,
      default: null,
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    premiumExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);

export default User;
