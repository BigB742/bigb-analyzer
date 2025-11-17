import Player from "../models/Player.js";
import {
  normalizeIdentity,
  normalizePlayerData,
} from "./playerNormalization.js";

export async function upsertPlayer(rawData = {}) {
  const normalized = normalizePlayerData(rawData);
  if (!normalized.name) {
    return { inserted: false, skipped: true, reason: "Missing name" };
  }

  if (normalized.externalId) {
    normalized.externalId = String(normalized.externalId);
  }

  const identity = normalizeIdentity(normalized);
  const now = new Date();
  const updateDoc = {
    $set: {
      ...normalized,
      updatedAt: now,
    },
    $setOnInsert: {
      createdAt: now,
    },
  };

  if (normalized.externalId) {
    try {
      const res = await Player.updateOne(
        { externalId: normalized.externalId },
        updateDoc,
        { upsert: false }
      );
      if (res.matchedCount > 0) {
        return { inserted: false, normalized, identity };
      }
    } catch (err) {
      if (err?.code !== 11000) throw err;
      await Player.updateOne(identity, updateDoc, { upsert: false });
      return { inserted: false, normalized, identity };
    }
  }

  try {
    const res = await Player.updateOne(identity, updateDoc, {
      upsert: true,
      setDefaultsOnInsert: true,
    });
    const inserted = res.upsertedCount > 0;
    return { inserted, normalized, identity };
  } catch (err) {
    if (err?.code === 11000) {
      await Player.updateOne(identity, updateDoc, { upsert: false });
      return { inserted: false, normalized, identity };
    }
    throw err;
  }
}
