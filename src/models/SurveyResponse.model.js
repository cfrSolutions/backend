import mongoose from "mongoose";

const surveyResponseSchema = new mongoose.Schema(
  {
    survey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
      
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      
    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },

    project: {
      type:
        mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },

    rid: {
      type: String,
      index: true,
    },

    pid: String,

    bidIncidence: String,

    supplierId: String,

    supplierName: String,

    mid: String,

    rsid: String,

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
