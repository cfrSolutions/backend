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

    // ✅ CONSUMER MODULE
    household: String,
    parental: String,
    primary: String,
    ownership: String,
    techStack: String,
    health: String,

    // ✅ HEALTHCARE MODULE
    healthcareRole: String,
    specialty: String,
    workSetting: String,
    healthcareExperience: String,
    patientVolume: String,
    prescribingAuthority: String,
    healthcareChallenge: String,

    phone: String,
    countryCode: String,
    whatsapp: String,

    profileImage: String,

    itRole: String,
    itDomain: String,
    itEmploymentType: String,
    itExperience: String,
    itChallenge: String,

    educationRole: String,
    institutionType: String,
    teachingMethod: String,
    educationExperience: String,
    educationChallenge: String,

    businessRole: String,
    businessCompanySize: String,
    businessIndustry: String,
    businessExperience: String,
    businessChallenge: String,

    financeRole: String,
    financeSpecialization: String,
    financeOrganizationType: String,
    financeExperience: String,
    financeChallenge: String,

    household: String,
    parental: String,
    primary: String,

    ownership: String,
    techStack: String,

    alcoholConsumption: String,
    smokingHabit: String,
    vapingHabit: String,
    physicalActivity: String,
    dietaryPreference: String,
    sleepDuration: String,

    shoppingPreference: String,
    onlineShoppingFrequency: String,

    travelFrequency: String,
    travelType: String,

    entertainmentPreference: String,

    petOwnership: String,
    petType: String,
    petCount: String,

    carOwnership: String,
    vehicleType: String,
    vehicleCount: String,
    vehicleUsage: String,

  },
  { timestamps: true }
);

export default mongoose.model("UserProfile", userProfileSchema);
