import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
  code: String,
  category: String,
  question: String,
  answerType: String, // single, multi, range

  options: [String],
});

export default mongoose.model(
  "Profile",
  profileSchema
);