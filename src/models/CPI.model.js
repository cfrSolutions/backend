import mongoose from "mongoose";

const CPISchema = new mongoose.Schema({
  country: String,
  ir: Number,
  loi: Number,
  cpi: Number,
});

export default mongoose.model(
  "CPI",
  CPISchema
);