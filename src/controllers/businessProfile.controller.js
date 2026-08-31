// import BusinessProfile from "../models/BusinessProfile.model.js";
// import User from "../models/User.model.js";

// // GET BUSINESS PROFILE
// export const getBusinessProfile = async (req, res) => {
//   try {
//     const userId = req.user.userId;

//     let profile = await BusinessProfile.findOne({ userId });

//     if (!profile) {
//       profile = await BusinessProfile.create({
//         userId,
//         name: "",
//         phone: "",
//         company: "",
//         country: "",
//         location: "",
//         postalCode:"",
//       });
//     }

//     // Login email comes from User model
//     const user = await User.findById(userId).select("email");

//     return res.status(200).json({
//       success: true,
//       profile: {
//         ...profile.toObject(),
//         email: user?.email || "",
//       },
//     });
//   } catch (error) {
//     console.error("Get business profile error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to load business profile",
//     });
//   }
// };

// // UPDATE BUSINESS PROFILE
// export const updateBusinessProfile = async (req, res) => {
//   try {
//     const userId = req.user.userId;

//     const {
//       name,
//       phone,
//       company,
//       country,
//       location,
//       postalCode,
//     } = req.body;

//     const profile = await BusinessProfile.findOneAndUpdate(
//       { userId },
//       {
//         $set: {
//           name: name?.trim() || "",
//           phone: phone?.trim() || "",
//           company: company?.trim() || "",
//           country: country?.trim() || "",
//           location: location?.trim() || "",
//           postalCode: postalCode?.trim() || "",
//         },
//       },
//       {
//         new: true,
//         upsert: true,
//         runValidators: true,
//       }
//     );

//     // Login email comes from User model
//     const user = await User.findById(userId).select("email");

//     return res.status(200).json({
//       success: true,
//       message: "Business profile updated successfully",
//       profile: {
//         ...profile.toObject(),
//         email: user?.email || "",
//       },
//     });
//   } catch (error) {
//     console.error("Update business profile error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update business profile",
//     });
//   }
// };



import BusinessProfile from "../models/BusinessProfile.model.js";
import User from "../models/User.model.js";

const MAX_LENGTHS = {
  name: 100,
  phone: 30,
  company: 150,
  country: 100,
  location: 300,
  postalCode: 20,
};

const ALLOWED_FIELDS = Object.keys(MAX_LENGTHS);

const cleanString = (value, fieldName) => {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value !== "string") {
    const error = new Error(`${fieldName} must be a string`);
    error.statusCode = 400;
    throw error;
  }

  const valueTrimmed = value.trim();

  if (valueTrimmed.length > MAX_LENGTHS[fieldName]) {
    const error = new Error(`${fieldName} is too long`);
    error.statusCode = 400;
    throw error;
  }

  return valueTrimmed;
};

const formatProfile = (profile, email) => ({
  name: profile.name || "",
  phone: profile.phone || "",
  company: profile.company || "",
  country: profile.country || "",
  location: profile.location || "",
  postalCode: profile.postalCode || "",
  email: email || "",
});

// GET BUSINESS PROFILE
export const getBusinessProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    let profile = await BusinessProfile.findOne({ userId }).lean();

    if (!profile) {
      profile = await BusinessProfile.create({
        userId,
        name: "",
        phone: "",
        company: "",
        country: "",
        location: "",
        postalCode: "",
      });

      profile = profile.toObject();
    }

    const user = await User.findById(userId)
      .select("email")
      .lean();

    return res.status(200).json({
      success: true,
      profile: formatProfile(profile, user?.email),
    });
  } catch (error) {
    console.error("Get business profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load business profile",
    });
  }
};

// UPDATE BUSINESS PROFILE
export const updateBusinessProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Reject non-object bodies
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body",
      });
    }

     const receivedFields = Object.keys(req.body);

    const unexpectedFields = receivedFields.filter(
      (field) => !ALLOWED_FIELDS.includes(field)
    );

    if (unexpectedFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile fields",
      });
    }

    const {
      name,
      phone,
      company,
      country,
      location,
      postalCode,
    } = req.body;

    const cleanedData = {
      name: cleanString(name, "name"),
      phone: cleanString(phone, "phone"),
      company: cleanString(company, "company"),
      country: cleanString(country, "country"),
      location: cleanString(location, "location"),
      postalCode: cleanString(postalCode, "postalCode"),
    };

    const profile = await BusinessProfile.findOneAndUpdate(
      { userId },
      {
        $set: cleanedData,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    const user = await User.findById(userId)
      .select("email")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Business profile updated successfully",
      profile: formatProfile(profile, user?.email),
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update business profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update business profile",
    });
  }
};