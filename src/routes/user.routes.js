// // routes/user.routes.js
// import express from "express";
// import multer from "multer";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import cloudinary from "../config/cloudinary.js";
// import User from "../models/User.model.js";
// import { authMiddleware } from "../middleware/auth.middleware.js";
// import UserProfile from "../models/UserProfile.model.js";
// const router = express.Router();

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "profile_images",
//     allowed_formats: ["jpg", "jpeg", "png"],
//     transformation: [{ width: 300, height: 300, crop: "fill" }],
//   },
// });

// const upload = multer({ storage });

// router.post(
//   "/upload-profile",
//   authMiddleware,
//   upload.single("image"),
//   async (req, res) => {
//     try {
//       if (!req.file) {
//         return res.status(400).json({ message: "No file uploaded" });
//       }

//       const userId =
//   req.user?._id ||
//   req.user?.userId ||
//   req.user?.id;
//       if (!userId) {
//         return res.status(401).json({ message: "User not authenticated" });
//       }

//       const imageUrl = req.file.path;

//      await UserProfile.findOneAndUpdate(
//   { user: userId },
//   { profileImage: imageUrl },
//   { upsert: true }
// );


//       res.json({ image: imageUrl });

//     } catch (err) {
//       console.error("UPLOAD ERROR:", err);
//       res.status(500).json({ message: err.message });
//     }
//   }
// );


// router.put("/profile", authMiddleware, async (req, res) => {
//   try {
//     const userId =
//       req.user._id ||
//       req.user.userId ||
//       req.user.id;

//     const updatedProfile = await UserProfile.findOneAndUpdate(
//       { user: userId },
//       { ...req.body, user: userId },
//       { new: true, upsert: true }
//     );

//     res.json(updatedProfile);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Profile update failed" });
//   }
// });



// export default router;


// routes/user.routes.js

import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import UserProfile from "../models/UserProfile.model.js";

const router = express.Router();

/*
=====================================================
CLOUDINARY PROFILE IMAGE STORAGE
=====================================================
*/

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile_images",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [
      {
        width: 300,
        height: 300,
        crop: "fill",
      },
    ],
  },
});

// const upload = multer({
//   storage,

//   // Prevent unnecessarily large uploads
//   limits: {
//     fileSize: 2 * 1024 * 1024, // 2 MB
//   },
// });
const upload = multer({
  storage,

  limits: {
    fileSize: 2 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG and PNG images are allowed")
      );
    }

    cb(null, true);
  },
});

/*
=====================================================
UPLOAD PROFILE IMAGE
Authenticated user only
=====================================================
*/

router.post(
  "/upload-profile",
  authMiddleware,
  upload.single("image"),

  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const userId =
        req.user?._id ||
        req.user?.userId ||
        req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const imageUrl = req.file.path;

      await UserProfile.findOneAndUpdate(
        {
          user: userId,
        },
        {
          $set: {
            profileImage: imageUrl,
          },
          $setOnInsert: {
            user: userId,
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      return res.json({
        success: true,
        image: imageUrl,
      });

    } catch (err) {
      // console.error("UPLOAD PROFILE ERROR:", err);

      return res.status(500).json({
        success: false,
        message: "Profile image upload failed",
      });
    }
  }
);


/*
=====================================================
UPDATE PROFILE
Authenticated user can update ONLY THEIR profile
=====================================================
*/

router.put(
  "/profile",
  authMiddleware,

  async (req, res) => {
    try {
      const userId =
        req.user?._id ||
        req.user?.userId ||
        req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      /*
      -------------------------------------------------
      Protected fields

      These fields must never be controlled by the
      frontend through this endpoint.
      -------------------------------------------------
      */

      const protectedFields = new Set([
        "_id",
        "id",
        "user",
        "__v",
        "createdAt",
        "updatedAt",
      ]);

      /*
      -------------------------------------------------
      Copy frontend data and remove protected fields.
      -------------------------------------------------
      */

      const updates = {};

      for (const [key, value] of Object.entries(req.body || {})) {
        if (!protectedFields.has(key)) {
          updates[key] = value;
        }
      }

      /*
      -------------------------------------------------
      Always force ownership to authenticated user.
      -------------------------------------------------
      */

      const updatedProfile =
        await UserProfile.findOneAndUpdate(
          {
            user: userId,
          },
          {
            $set: updates,

            $setOnInsert: {
              user: userId,
            },
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
          }
        );

      return res.json({
        success: true,
        profile: updatedProfile,
      });

    } catch (err) {
      console.error("PROFILE UPDATE ERROR:", err);

      return res.status(500).json({
        success: false,
        message: "Profile update failed",
      });
    }
  }
);


export default router;