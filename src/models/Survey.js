const mongoose = require("mongoose");

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

    options: [String],

    conditions: [ConditionSchema],
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
    },

    description: String,

    completeUrl: String,

    disqualifyUrl: String,

    quotaFullUrl: String,

    questions: [QuestionSchema],

    status: {
      type: String,
      enum: [
        "Draft",
        "Published",
      ],
      default: "Draft",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Survey",
  SurveySchema
);