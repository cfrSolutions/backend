import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  sid: String,
  projectId: mongoose.Schema.Types.ObjectId,
  used: Boolean,
  ip: String,
  ua: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600,
  },
});

export default mongoose.model("SurveySession", sessionSchema);