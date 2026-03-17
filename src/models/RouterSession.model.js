import mongoose from "mongoose";

const routerSessionSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },

    response: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SurveyResponse",
      required: true,
    },

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

    status: {
      type: String,
      enum: ["STARTED", "COMPLETED", "SCREENOUT", "QUOTA"],
      default: "STARTED",
    },
  },
  { timestamps: true }
);

export default mongoose.model("RouterSession", routerSessionSchema);
