// import mongoose from "mongoose";

// const surveySchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     status: {
//       type: String,
//       enum: ["DRAFT", "ACTIVE", "PAUSED"],
//       default: "DRAFT",
//     },

//     points: {
//       type: Number,
//       default: 0,
//     },

//     difficulty: {
//       type: String,
//       enum: ["Easy", "Medium", "Hard"],
//       default: "Easy",
//     },

//     responsesCount: {
//       type: Number,
//       default: 0,
//     },

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Survey", surveySchema);

// Admin Survey Model

import mongoose from "mongoose";

const targetGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // =========================
    // BASIC TARGETING
    // =========================

    employmentStatus: {
      type: String,
      default: "ANY",
    },

    profession: {
      type: String,
      default: "ANY",
    },

    specialties: {
      type: [String],
      default: [],
    },

    // =========================
    // DEMOGRAPHICS
    // =========================

    ageFrom: {
      type: Number,
      default: null,
    },

    ageTo: {
      type: Number,
      default: null,
    },

    gender: {
      type: String,
      default: "All",
    },

    country: {
      type: String,
      default: "ALL",
    },

    // =========================
    // SURVEY TARGET
    // =========================

    targetCompletes: {
      type: Number,
      default: 0,
    },

    // =========================
    // DEVICE
    // =========================

    devices: {
      mobile: {
        type: Boolean,
        default: true,
      },
      desktop: {
        type: Boolean,
        default: true,
      },
      tablet: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    _id: true,
  }
);

const surveySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      uppercase: true,
      enum: ["DRAFT", "ACTIVE", "PAUSED"],
      default: "DRAFT",
    },

    points: {
      type: Number,
      default: 0,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },

    category: {
      type: String,
      trim: true,
      uppercase: true, // GENERAL, DOCTOR, IT, ENGINEERING
      default: "GENERAL",
    },

    countries: {
      type: [String], // ["IN", "US"]
      default: ["ALL"],
    },

    surveyType: {
      type: String,
      enum: ["INTERNAL", "EXTERNAL"],
      default: "EXTERNAL",
    },

    companySurveyUrl: String,
    vendorCompleteUrl: String,
    vendorDisqualifyUrl: String,
    vendorQuotaUrl: String,
    
    trackingParam: {
    type: String,
    default: null // pid | id | user | RID
  },
  
  trackingVariables: [
  {
    label: {
      type: String,
      required: true,
    },
    param: {
      type: String,
      required: true,
    },
  },
],

screener: [
    {
      field: String,        // "age"
      operator: String,     // ">"
      value: Number,        // 18
      failRedirect: String, // "SCREENOUT"
    }
  ],

  // 🔹 QUOTA RULES
  quotas: [
    {
      field: String,      // "gender"
      value: String,      // "male"
      limit: Number       // 5
    }
  ],
    /* TARGET & STATS */
    completesTarget: {
      type: Number,
      default: 0,
    },
    
    externalSurveyUrl: {
      type: String,
      default: null,
    },
    responsesCount: {
      type: Number,
      default: 0,
    },
timeLimit: {
  type: Number, 
  default: 5,
},
returnBaseUrl: {
  type: String,
  required: true, 
},

targetGroups: {
  type: [targetGroupSchema],
  default: [],
},

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Survey", surveySchema);
