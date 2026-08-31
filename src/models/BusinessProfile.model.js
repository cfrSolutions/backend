import mongoose from "mongoose";

const businessProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      trim: true,
      default: "",
    },

    // email: {
    //   type: String,
    //   trim: true,
    //   lowercase: true,
    //   default: "",
    // },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    company: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const BusinessProfile = mongoose.model(
  "BusinessProfile",
  businessProfileSchema
);

export default BusinessProfile;