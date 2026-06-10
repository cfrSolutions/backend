import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
  code: String,
  category: String,
  question: String,
  type: String,
  answerType: String,
  options: [String],
   active: {
      type: Boolean,
      default: true,
    },
});

export default mongoose.model(
  "Profile",
  profileSchema
);