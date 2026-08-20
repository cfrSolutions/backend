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
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    postbackToken: {
  type: String,
  unique: true,
  sparse: true,
      index: true,
      select: false,
},

    expectedCompleteTk: {
  type: String,
  default: "",
  select: false,
},

expectedDqTk: {
  type: String,
  default: "",
  select: false,
},

expectedQuotaTk: {
  type: String,
  default: "",
  select: false,
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
