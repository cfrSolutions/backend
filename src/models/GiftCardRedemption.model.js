import mongoose from "mongoose";

const giftCardRedemptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    giftCard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GiftCard",
      required: true,
    },

    pointsUsed: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED","PROCESSING"],
      default: "PENDING",
    },

    provider: {
      type: String,
      default: "TREMENDOUS",
    },

    rewardId: {
      type: String, // Tremendous reward ID
    },

    providerResponse: {
      type: Object, // full Tremendous API response
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "GiftCardRedemption",
  giftCardRedemptionSchema
);
