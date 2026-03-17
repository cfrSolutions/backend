// models/WalletTransaction.model.js
import mongoose from "mongoose";

const walletTxnSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["EARN", "REDEEM"],
      required: true,
    },

    points: {
      type: Number,
      required: true,
    },

    source: {
      type: String, // SURVEY | BONUS | MANUAL
      default: "SURVEY",
    },

    survey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
    },
  },
  { timestamps: true }
);

export default mongoose.model("WalletTransaction", walletTxnSchema);
