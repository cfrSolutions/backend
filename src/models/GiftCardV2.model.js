import mongoose from "mongoose";

const GiftCardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    // 🔑 Tremendous product ID
    tremendousProductId: {
      type: String,
      required: true,
      index: true,
    },

    // 💰 Gift card value (e.g. 15, 50, 100)
    value: {
      type: Number,
      required: true,
    },

    // 💱 Currency (USD, INR, EUR)
    currency: {
      type: String,
      default: "USD",
    },

    skuId: {
  type: String,
  required: true,
},
logo: String,
    image: String,
    // ⭐ Points needed to redeem
    pointsRequired: {
      type: Number,
      required: true,
    },


    type: {
  type: String,
  enum: ["GIFT_CARD", "PAYPAL", "PREPAID"],
  default: "GIFT_CARD"
},

countries: [String],


    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("GiftCard", GiftCardSchema);
