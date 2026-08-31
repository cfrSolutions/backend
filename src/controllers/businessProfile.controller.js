import BusinessProfile from "../models/BusinessProfile.model.js";

// GET BUSINESS PROFILE
export const getBusinessProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    let profile = await BusinessProfile.findOne({ userId });

    // Create an empty profile if it doesn't exist yet
    if (!profile) {
      profile = await BusinessProfile.create({
        userId,
        name: "",
        email: "",
        phone: "",
        company: "",
        location: "",
      });
    }

    return res.status(200).json({
      success: true,
      profile,
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
    const userId = req.user.id;

    const {
      name,
      phone,
      company,
      location,
    } = req.body;

    const profile = await BusinessProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          name: name?.trim() || "",
          phone: phone?.trim() || "",
          company: company?.trim() || "",
          location: location?.trim() || "",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Business profile updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Update business profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update business profile",
    });
  }
};