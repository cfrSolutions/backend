import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    firstName: String,
    lastName: String,
    dob: Date,
    gender: String,
    country: String,
    postalCode: String,
    address: String,

    education: String,
    employmentStatus: String,
    profession: String,
    incomeRange: String,

    industry: String,
    companySize: String,
    seniority: String,

    // ✅ CONSUMER MODULE (ADD THIS)
    household: String,
    parental: String,
    primary: String,
    ownership: String,
    techStack: String,
    health: String,

    // ✅ HEALTHCARE MODULE
specialty: String,
workSetting: String,
patientVolume: String,
prescribingAuthority: String,

    phone: String,
    countryCode: String,
    whatsapp: String,

    profileImage: String,
  },
  { timestamps: true }
);

export default mongoose.model("UserProfile", userProfileSchema);
