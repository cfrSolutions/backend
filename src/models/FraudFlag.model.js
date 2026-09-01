import mongoose from "mongoose";

const fraudFlagSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    survey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
      default: null,
      index: true,
    },

    response: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SurveyResponse",
      default: null,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "SPEEDING",
        "MULTIPLE_USERS_SAME_IP",
        "MULTIPLE_ACCOUNTS_SAME_DEVICE",
        "SUSPICIOUS_FREQUENCY",
        "STRAIGHTLINING",
        "ATTENTION_CHECK_FAILED",
        "GEO_MISMATCH",
        "VPN_DETECTED",
        "PROXY_DETECTED",
        "TOR_DETECTED",
        "IMPOSSIBLE_TRAVEL",
        "INCONSISTENT_ANSWERS",
      ],
      index: true,
    },

    score: {
      type: Number,
      default: 0,
    },

    message: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "OPEN",
        "REVIEWING",
        "CONFIRMED",
        "DISMISSED",
      ],
      default: "OPEN",
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewNote: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "FraudFlag",
  fraudFlagSchema
);