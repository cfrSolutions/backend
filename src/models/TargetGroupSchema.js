import mongoose from "mongoose";

const TargetGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    default: "Target Group",
  },

  market: String,


  sector: String,

  language: {
    type: String,
    default: "English",
  },

  targetCompletes: Number,

  loi: Number,

  incidence: Number,

  cpi: Number,

  totalCost: Number,

  ageFrom: Number,

  ageTo: Number,

  gender: {
    type: String,
    enum: ["Male", "Female", "All"],
    default: "All",
  },

  devices: {
    mobile: Boolean,
    desktop: Boolean,
    tablet: Boolean,
  },

  advancedCalendar: {
    timezone: String,
    marketTimezone: String,
    startDate: Date,
    endDate: Date,
    startTime: String,
    endTime: String,
  },

  status: {
    type: String,
    default: "DRAFT",
  },
  timeline: {
  type: Number,
  default: 0,
},

openEnded: {
  type: Number,
  default: 0,
},

containsPII: {
  type: Boolean,
  default: false,
},

});

export default TargetGroupSchema;