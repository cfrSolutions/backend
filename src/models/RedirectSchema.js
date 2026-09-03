import mongoose from "mongoose";

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

export default RedirectSchema;