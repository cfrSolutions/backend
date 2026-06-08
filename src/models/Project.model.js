import mongoose from "mongoose";

const RedirectSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true, // 🔥 important for fast lookup
  },
  url: {
    type: String,
    default: "",
  },
}, { _id: false });


const ProjectSchema = new mongoose.Schema({
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    surveyId: {
      type: String,
      unique: true,
    },

    sector: {
        type: String,
        required: true,
    },

    market: {
        type: String,
        required: true,
    },

    ageFrom: {
        type: Number,
        required: true,
    },

    ageTo: {
        type: Number,
        required: true,
    },
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
    gender:{
        type: String,
        enum: ["Male", "Female", "All"],
        default: "All",
    },

    completes: {
        type: Number,
        default: 0, 
    },
    targetCompletes: { type: Number, required: true },
    disqualified: { type: Number, default: 0 },
    quotaFull: { type: Number, default: 0 },

    
    loi: {
        type: Number,
        required: true,
    },

    cpi: {
  type: Number,
  default: 0,   
},

totalCost: {
  type: Number,
  default: 0,
},

    totalResponses: { type: Number, default: 0 },
    incidence:{
        type: Number,
        required: true,
    },

    timeline: {
        type: Number,
        required: true,
    },

    devices: {
      mobile: { type: Boolean, default: true },
      desktop: { type: Boolean, default: true },
      tablet: { type: Boolean, default: true },
    },

    openEnded: {
        type: Number,
        default: 0,
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
  test: { type: String },
  live: { type: String },
},

clientKeysFile: {
  type: String,
},
    status: {
        type: String,
        enum: ["DRAFT", "TESTING", "LIVE", "HOLD", "COMPLETED","ACCEPTED", "CLOSED", "NEGOTIATION", "REJECTED"],
        default: "DRAFT",
    },

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
},
{ timestamps: true }
);

export default mongoose.model("Project", ProjectSchema);