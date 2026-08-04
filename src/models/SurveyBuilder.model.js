import mongoose from "mongoose";

const ConditionSchema = new mongoose.Schema(
  {
    value: String,
    action: {
      type: String,
      enum: [
        "continue",
        "complete",
        "disqualify",
        "quota",
      ],
      default: "continue",
    },
  },
  { _id: false }
);

const QuestionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "radio",
        "checkbox",
        "dropdown",
        "text",
        "textarea",
        "number",
        "email",
        "date",
      ],
      required: true,
    },

    required: {
      type: Boolean,
      default: false,
    },

    options: {
      type: [String],
      default: [],
    },

    conditions: {
      type: [ConditionSchema],
      default: [],
    },
  },
  { _id: false }
);

const SurveySchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    completeUrl: {
      type: String,
      default: "",
    },

    disqualifyUrl: {
      type: String,
      default: "",
    },

    quotaFullUrl: {
      type: String,
      default: "",
    },

    questions: {
      type: [QuestionSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Draft",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("SurveyBuilder", SurveySchema);