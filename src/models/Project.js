import mongoose from "mongoose";
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

    gender:{
        type: String,
        enum: ["Male", "Female", "All"],
        default: "All",
    },

    completes: {
        type: Number,
        required: true,
    },
    disqualified: { type: Number, default: 0 },
    quotaFull: { type: Number, default: 0 },

    loi: {
        type: Number,
        required: true,
    },

    cpi: Number,
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

    budget: {
        type: Number,
        required: true,
    },

    status: {
        type: String,
        enum: ["DRAFT", "LIVE", "HOLD", "CLOSED"],
        default: "DRAFT",
    },
},
{ timestamps: true }
);

export default mongoose.model("Project", projectSchema);