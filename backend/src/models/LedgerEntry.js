import mongoose from "mongoose";
import { LEDGER_TYPES } from "../config/constants.js";

const LedgerEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: Object.values(LEDGER_TYPES), required: true, index: true },
    amount: { type: Number, required: true }, 
    note: { type: String, default: "" },
    refId: { type: String, default: null },
    isHidden: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

export default mongoose.model("LedgerEntry", LedgerEntrySchema);
