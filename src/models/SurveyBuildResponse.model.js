// models/SurveyBuildResponse.model.js

import mongoose from "mongoose";

const SurveyBuildResponseSchema = new mongoose.Schema(
{
    survey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SurveyBuilder",
        required: true,
    },

     business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    publicToken: String,

    RID: {
  type: String,
  index: true,
},

    answers: {
        type: Object,
       default: {},
    },

    status: {
        type: String,
        enum: [
            "COMPLETE",
            "DISQUALIFIED",
            "QUOTA"
        ],
        default: "COMPLETE",
    },

    ip: String,

   userAgent: String,

    startedAt: Date,

    completedAt: Date,

    duration: Number,
},
{
    timestamps: true,
});

export default mongoose.model(
    "SurveyBuildResponse",
    SurveyBuildResponseSchema
);