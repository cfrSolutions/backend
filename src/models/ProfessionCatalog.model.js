import mongoose from "mongoose";

const professionCatalogSchema = new mongoose.Schema(
  {
    profession: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    specialties: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "ProfessionCatalog",
  professionCatalogSchema
);