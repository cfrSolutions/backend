import mongoose from "mongoose";
import TargetGroupSchema from "./TargetGroupSchema.js";

const RedirectSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true, // 🔥 important for fast lookup
    minlength: 32,
    maxlength: 128,
  },
  url: {
    type: String,
    default: "",
    maxlength: 2000,
  },
}, { _id: false });


const ProjectSchema = new mongoose.Schema({
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    surveyId: {
      type: String,
      unique: true,
    },

    // sector: {
    //     type: String,
    //     required: true,
    // },

    // market: {
    //     type: String,
    //     required: true,
    // },

    // ageFrom: {
    //     type: Number,
    //     required: true,
    // },

    // ageTo: {
    //     type: Number,
    //     required: true,
    // },
    advancedCalendar: {
  timezone: {
    type: String,
    default: null,
  },
  marketTimezone: {
    type: String,
    default: null,
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  startTime: {
    type: String,
    default: null,
  },
  endTime: {
    type: String,
    default: null,
  },
},
    // gender:{
    //     type: String,
    //     enum: ["Male", "Female", "All"],
    //     default: "All",
    // },

    completes: {
        type: Number,
        default: 0, 
        min: 0,
    },
    // targetCompletes: { type: Number, required: true },
    disqualified: { type: Number, default: 0, min: 0 },
    quotaFull: { type: Number, default: 0, min: 0 },

    
//     loi: {
//         type: Number,
//         required: true,
//     },

//     cpi: {
//   type: Number,
//   default: 0,   
// },

// totalCost: {
//   type: Number,
//   default: 0,
// },

    totalResponses: { type: Number, default: 0, min: 0 },

    // incidence:{
    //     type: Number,
    //     required: true,
    // },

    // timeline: {
    //     type: Number,
    //     required: true,
    // },

    // devices: {
    //   mobile: { type: Boolean, default: true },
    //   desktop: { type: Boolean, default: true },
    //   tablet: { type: Boolean, default: true },
    // },

    // openEnded: {
    //     type: Number,
    //     default: 0,
    // },

     name: {
    type: String,
    required: true,
  },

  projectManager: {
  type: String,
  default: "",
},

    description: {
        type: String,
        maxlength: 1000,
    },

    // budget: {
    //     type: Number,
    //     required: true,
    // },

    surveyLinks: {
  test: { type: String, maxlength: 2000, },
  live: { type: String, maxlength: 2000, },
},

urlVariables: [
  {
    param: {
      type: String,
      required: true,
      maxlength: 100,
    },

    pattern: {
      type: String,
      required: true,
      maxlength: 500,
    },
  },
],

clientKeysFile: {
  type: String,
},
    status: {
        type: String,
        enum: ["DRAFT", "TESTING", "LIVE", "HOLD", "COMPLETED","ACCEPTED", "CLOSED", "NEGOTIATION", "REJECTED"],
        default: "DRAFT",
    },

    targetGroups: [TargetGroupSchema],


    redirects: {
    start: RedirectSchema, 
    complete: RedirectSchema,
    disqualified: RedirectSchema,
    quotaFull: RedirectSchema,
  },

  negotiations: [
  {
    sender: {
      type: String,
      enum: ["ADMIN", "BUSINESS"],
    },

    message: String,

    proposedCpi: Number,

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
],

// vendorLinks: [
//   {
//     vendorName: String,

//     capture: String,

//     complete: String,

//     disqualified: String,

//     quotaFull: String,
//   },
// ],

vendorLinks: [
  {
    vendorName: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    capture: {
      type: String,
      maxlength: 2000,
    },

    complete: {
      type: String,
      maxlength: 2000,
    },

    disqualified: {
      type: String,
      maxlength: 2000,
    },

    quotaFull: {
      type: String,
      maxlength: 2000,
    },
  },
],

},
{ timestamps: true }
);

export default mongoose.model("Project", ProjectSchema);