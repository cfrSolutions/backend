import mongoose from "mongoose";
import crypto from "crypto";

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
    operator: {
    type: String,
    default: "equals"
}
  },
  
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
        "matrix"
      ],
      required: true,
    },

    rows: {
  type: [String],
  default: [],
},

columns: {
  type: [String],
  default: [],
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
  
);

const SurveySchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    publicToken: {
    type: String,
    unique: true,
    index: true,
    default: () =>
        crypto.randomBytes(12).toString("hex"),
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