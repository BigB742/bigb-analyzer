import Player from "../models/Player.js";
import {
  normalizeIdentity,
  normalizeName,
  normalizePosition,
  normalizeTeam,
} from "./playerNormalization.js";

function identityKey(identity) {
  return `${identity.name}|${identity.team}|${identity.position}`;
}

function sortDocsDesc(a, b) {
  const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
  const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
  if (aTime !== bTime) return bTime - aTime;
  if (String(a._id) < String(b._id)) return 1;
  if (String(a._id) > String(b._id)) return -1;
  return 0;
}

export async function normalizeAndDedupePlayers({ target } = {}) {
  const projection = { name: 1, team: 1, position: 1, updatedAt: 1 };
  const docs = await Player.find({}, projection).lean().exec();

  const targetIdentity = target ? normalizeIdentity(target) : null;
  const targetKey = targetIdentity ? identityKey(targetIdentity) : null;

  const scopedDocs = targetKey
    ? docs.filter((doc) => identityKey(normalizeIdentity(doc)) === targetKey)
    : docs;

  if (scopedDocs.length === 0) {
    return {
      normalizedCount: 0,
      duplicateGroups: 0,
      removedCount: 0,
    };
  }

  let normalizedCount = 0;
  const ops = [];

  for (const doc of scopedDocs) {
    const normName = normalizeName(doc.name);
    const normTeam = normalizeTeam(doc.team);
    const normPos = normalizePosition(doc.position);
    const updates = {};

    if (normName !== doc.name) updates.name = normName;
    if (normTeam !== doc.team) updates.team = normTeam;
    if (normPos !== doc.position) updates.position = normPos;

    if (Object.keys(updates).length > 0) {
      normalizedCount++;
      ops.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: updates },
        },
      });
    }
  }

  if (ops.length > 0) {
    await Player.bulkWrite(ops);
  }

  const ids = scopedDocs.map((doc) => doc._id);
  const refreshed = targetKey
    ? await Player.find({ _id: { $in: ids } }, projection)
        .sort({ updatedAt: -1, _id: -1 })
        .lean()
        .exec()
    : await Player.find({}, projection)
        .sort({ updatedAt: -1, _id: -1 })
        .lean()
        .exec();

  const groups = new Map();

  for (const doc of refreshed) {
    const identity = normalizeIdentity(doc);
    const key = identityKey(identity);
    if (targetKey && key !== targetKey) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(doc);
  }

  let duplicateGroups = 0;
  const idsToDelete = [];

  for (const docsForKey of groups.values()) {
    if (docsForKey.length <= 1) continue;
    duplicateGroups++;
    const sorted = [...docsForKey].sort(sortDocsDesc);
    for (const dup of sorted.slice(1)) {
      idsToDelete.push(dup._id);
    }
  }

  if (idsToDelete.length > 0) {
    await Player.deleteMany({ _id: { $in: idsToDelete } });
  }

  return {
    normalizedCount,
    duplicateGroups,
    removedCount: idsToDelete.length,
  };
}
