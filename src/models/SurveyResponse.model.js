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

   completionTokenHash: {
  type: String,
  default: null,
  select: false,
},

completionConfirmedAt: {
  type: Date,
  default: null,
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

   targetGroup: {
  type: mongoose.Schema.Types.ObjectId,
  default: null,
},

    urlVariables: {
  type: Map,
  of: String,
  default: {},
},

    status: {
      type: String,
      uppercase: true,
      enum: ["STARTED", "COMPLETION_CONFIRMED", "COMPLETED", "INVALID", "FLAGGED", "SCREENOUT", "QUOTA_FULL", "DISQUALIFIED", "CANCELLED", "CLEANED",],
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
    ipHash: {
      type: String,
      default: "",
      index: true,
    },

    deviceHash: {
      type: String,
      default: "",
      index: true,
    },

    userAgentHash: {
      type: String,
      default: "",
    },

    fraudScore: {
      type: Number,
      default: 0,
      index: true,
    },

    fraudStatus: {
      type: String,
      enum: [
        "CLEAR",
        "REVIEW",
        "HIGH_RISK",
        "CONFIRMED",
      ],
      default: "CLEAR",
      index: true,
    },

    fraudFlags: [
      {
        type: {
          type: String,
        },

        score: {
          type: Number,
          default: 0,
        },

        message: {
          type: String,
          default: "",
        },

        detectedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("SurveyResponse", surveyResponseSchema);
