import BusinessProfile from "../models/BusinessProfile.model.js";
import User from "../models/User.model.js";

// GET BUSINESS PROFILE
export const getBusinessProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    let profile = await BusinessProfile.findOne({ userId });

    if (!profile) {
      profile = await BusinessProfile.create({
        userId,
        name: "",
        phone: "",
        company: "",
        country: "",
        location: "",
        postalCode:"",
      });
    }

    // Login email comes from User model
    const user = await User.findById(userId).select("email");

    return res.status(200).json({
      success: true,
      profile: {
        ...profile.toObject(),
        email: user?.email || "",
      },
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

    const {
      name,
      phone,
      company,
      country,
      location,
      postalCode,
    } = req.body;

    const profile = await BusinessProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          name: name?.trim() || "",
          phone: phone?.trim() || "",
          company: company?.trim() || "",
          country: country?.trim() || "",
          location: location?.trim() || "",
          postalCode: postalCode?.trim() || "",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    // Login email comes from User model
    const user = await User.findById(userId).select("email");

    return res.status(200).json({
      success: true,
      message: "Business profile updated successfully",
      profile: {
        ...profile.toObject(),
        email: user?.email || "",
      },
    });
  } catch (error) {
    console.error("Update business profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update business profile",
    });
  }
};