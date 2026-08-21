// routes/user.routes.js
import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import User from "../models/User.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import UserProfile from "../models/UserProfile.model.js";
const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile_images",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 300, height: 300, crop: "fill" }],
  },
});

const upload = multer({ storage });

router.post(
  "/upload-profile",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId =
  req.user?._id ||
  req.user?.userId ||
  req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const imageUrl = req.file.path;

     await UserProfile.findOneAndUpdate(
  { user: userId },
  { profileImage: imageUrl },
  { upsert: true }
);


      res.json({ image: imageUrl });

    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  }
);


router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const userId =
      req.user._id ||
      req.user.userId ||
      req.user.id;

    const updatedProfile = await UserProfile.findOneAndUpdate(
      { user: userId },
      { ...req.body, user: userId },
      { new: true, upsert: true }
    );

    res.json(updatedProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Profile update failed" });
  }
});



export default router;
