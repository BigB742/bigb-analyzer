import mongoose from "mongoose";

const sheetCacheSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const SheetCache = mongoose.models.SheetCache
  || mongoose.model("SheetCache", sheetCacheSchema, "sheet_cache");

export default SheetCache;
