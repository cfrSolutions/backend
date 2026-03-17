import mongoose from "mongoose";

const surveyResponseSchema = new mongoose.Schema(
  {
    survey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },

    status: {
      type: String,
      uppercase: true,
      enum: ["STARTED", "COMPLETED", "INVALID", "FLAGGED", "SCREENOUT", "QUOTA_FULL", "CANCELLED", "CLEANED",],
      default: "STARTED",
    },

    country: {
      type: String,
      default: "UNKNOWN",
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: Date,

    durationSeconds: Number,
    answers: Object,
  },
  { timestamps: true }
);

export default mongoose.model("SurveyResponse", surveyResponseSchema);
