import express from "express";
import UserProfile from "../models/UserProfile.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/* GET PROFILE */
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user.userId;

  let profile = await UserProfile.findOne({ user: userId });

  // auto create empty profile
  if (!profile) {
    profile = await UserProfile.create({ user: userId });
  }

  res.json(profile);
});

/* UPDATE PROFILE */
router.put("/", authMiddleware, async (req, res) => {
  const userId = req.user.userId;

  const profile = await UserProfile.findOneAndUpdate(
    { user: userId },
    req.body,
    { new: true, upsert: true }
  );

  res.json(profile);
});

export default router;
