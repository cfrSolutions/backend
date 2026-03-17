import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import { adminDashboard } from "../controllers/admin.controller.js";
import adminOnly from "../middleware/admin.middleware.js";
import SurveyResponse from "../models/SurveyResponse.model.js";
import Survey from "../models/Survey.model.js";
import User from "../models/User.model.js";
const router = express.Router();
router.get(
    "/dashboard",
    authMiddleware,
    roleMiddleware(["ADMIN", "SUPERADMIN"]),
    adminDashboard
);

// router.post("/create-admin", authMiddleware, adminOnly);
router.post("/create-admin", authMiddleware, async (req, res) => {
  try {
    // only SUPERADMIN allowed
    if (req.user.role !== "SUPERADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { name, email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email,
      password: hashed,
      role: "ADMIN",
      isEmailVerified: true,
      status: "ACTIVE",
    });

    res.json({ message: "Admin created successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/toggle-role", authMiddleware, async (req, res) => {
  try {
    // 🔐 only superadmin allowed
    if (req.user.role !== "SUPERADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { email, isAdmin } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    // const user = await User.findOne({ email });

    // // ✅ IMPORTANT: prevent crash
    // if (!user) {
    //   return res.status(404).json({ message: "User not found" });
    // }

    let user = await User.findOne({ email: profile.emails[0].value });

if (!user) {
  user = await User.create({
    name: profile.displayName,
    email: profile.emails[0].value,
    isEmailVerified: true,
    status: "ACTIVE",
    referralCode: generateReferralCode(profile.displayName)
  });
}


    user.role = isAdmin ? "ADMIN" : "USER";

    await user.save();

    res.json({ message: "Role updated successfully" });

  } catch (err) {
    console.error("TOGGLE ROLE ERROR:", err); // 🔥 check terminal
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/surveys", authMiddleware, adminOnly, async (req, res) => {
  try {
    const surveys = await Survey.aggregate([
      {
        $lookup: {
          from: "surveyresponses", // 👈 Mongo collection name
          localField: "_id",
          foreignField: "survey",
          as: "responses",
        },
      },
      {
        $addFields: {
          responsesCount: { $size: "$responses" },
        },
      },
      {
        $project: {
          responses: 0, // ❌ hide full responses array
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    res.json(surveys);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load surveys" });
  }
});

router.get(
  "/surveys/:id/responses",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const responses = await SurveyResponse.find({
        survey: req.params.id,
        status: "COMPLETED", // ✅ only completed surveys
      })
        .populate("user", "email")
        .sort({ completedAt: -1 });

      res.json(responses);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to load responses" });
    }
  }
);

export default router;