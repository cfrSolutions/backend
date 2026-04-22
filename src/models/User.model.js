import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: function () {
        // Only require password if they ARE NOT using Google/OAuth
        return !this.googleId; 
      },
    },

    // ADD THIS FIELD:
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values for non-google users
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN", "SUPERADMIN", "BUSINESS"],
      default: "USER",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "SUSPENDED"],
      default: "PENDING",
    },

    walletNumber: {
  type: String,
  unique: true,
},
referralCode: {
  type: String,
  unique: true
},

referredBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User"
},

referralRewardGiven: {
  type: Boolean,
  default: false
},

    emailVerificationToken: String,
    emailVerificationExpires: Date,
    deleteAccountToken: String,
    deleteAccountExpires: Date,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
