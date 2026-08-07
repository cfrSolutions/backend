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
  type: String,
  default: "",
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

    expectedCompleteTk: {
  type: String,
  default: "",
},

expectedDqTk: {
  type: String,
  default: "",
},

expectedQuotaTk: {
  type: String,
  default: "",
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
      enum: ["STARTED", "COMPLETED", "INVALID", "FLAGGED", "SCREENOUT", "QUOTA_FULL", "DISQUALIFIED", "CANCELLED", "CLEANED",],
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
