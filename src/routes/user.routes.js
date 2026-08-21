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
import mongoose from "mongoose";
import { CloudinaryStorage } from "multer-storage-cloudinary";

import cloudinary from "../config/cloudinary.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

import User from "../models/User.model.js";
import UserProfile from "../models/UserProfile.model.js";

const router = express.Router();


// =====================================================
// CLOUDINARY STORAGE
// =====================================================

const storage = new CloudinaryStorage({
  cloudinary,

  params: {
    folder: "profile_images",

    allowed_formats: [
      "jpg",
      "jpeg",
      "png",
    ],

    transformation: [
      {
        width: 300,
        height: 300,
        crop: "fill",
      },
    ],
  },
});


// =====================================================
// FILE VALIDATION
// =====================================================

const fileFilter = (req, file, cb) => {

  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        "Only JPG, JPEG and PNG images are allowed"
      ),
      false
    );
  }

  cb(null, true);
};


// =====================================================
// MULTER
// =====================================================

const upload = multer({
  storage,

  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
    files: 1,
  },

  fileFilter,
});


// =====================================================
// UPLOAD PROFILE IMAGE
// USER CAN ONLY UPDATE THEIR OWN PROFILE
// =====================================================

router.post(
  "/upload-profile",
  authMiddleware,
  upload.single("image"),

  async (req, res) => {
    try {

      // -----------------------------------------------
      // AUTHENTICATED USER
      // -----------------------------------------------

      const userId =
        req.user?._id ||
        req.user?.userId ||
        req.user?.id;

      if (
        !userId ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return res.status(401).json({
          success: false,
          message: "Invalid authentication",
        });
      }


      // -----------------------------------------------
      // FILE CHECK
      // -----------------------------------------------

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload a JPG or PNG image",
        });
      }


      // -----------------------------------------------
      // MAKE SURE USER EXISTS
      // -----------------------------------------------

      const userExists = await User.exists({
        _id: userId,
      });

      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }


      // -----------------------------------------------
      // CLOUDINARY URL
      // -----------------------------------------------

      const imageUrl = req.file.path;

      if (!imageUrl) {
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
        });
      }


      // -----------------------------------------------
      // UPDATE ONLY CURRENT USER'S PROFILE
      // -----------------------------------------------

      const profile =
        await UserProfile.findOneAndUpdate(
          {
            user: userId,
          },

          {
            $set: {
              profileImage: imageUrl,
            },
          },

          {
            upsert: true,
            new: true,
          }
        );


      return res.status(200).json({
        success: true,
        image: profile.profileImage,
      });

    } catch (err) {

      console.error(
        "UPLOAD PROFILE ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Profile image upload failed",
      });
    }
  }
);


// =====================================================
// UPDATE PROFILE
// USER CAN ONLY UPDATE THEIR OWN PROFILE
// =====================================================

router.put(
  "/profile",
  authMiddleware,

  async (req, res) => {
    try {

      // -----------------------------------------------
      // AUTHENTICATED USER
      // -----------------------------------------------

      const userId =
        req.user?._id ||
        req.user?.userId ||
        req.user?.id;

      if (
        !userId ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return res.status(401).json({
          success: false,
          message: "Invalid authentication",
        });
      }


      // -----------------------------------------------
      // WHITELIST PROFILE FIELDS
      // -----------------------------------------------
      //
      // IMPORTANT:
      // Only put fields here that a normal USER
      // is actually allowed to edit.
      //
      // Add/remove fields according to your
      // UserProfile schema.
      // -----------------------------------------------

      const allowedFields = [
        "name",
        "age",
        "gender",
        "country",
        "countryCode",
        "city",
        "language",
        "phone",
        "dateOfBirth",
      ];


      const updateData = {};

      for (const field of allowedFields) {

        if (
          Object.prototype.hasOwnProperty.call(
            req.body,
            field
          )
        ) {
          updateData[field] = req.body[field];
        }
      }


      // -----------------------------------------------
      // DON'T ALLOW EMPTY / UNKNOWN UPDATES
      // -----------------------------------------------

      if (
        Object.keys(updateData).length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "No valid profile fields provided",
        });
      }


      // -----------------------------------------------
      // UPDATE ONLY THIS USER'S PROFILE
      // -----------------------------------------------

      const updatedProfile =
        await UserProfile.findOneAndUpdate(
          {
            user: userId,
          },

          {
            $set: updateData,

            // Make sure ownership always stays
            // attached to authenticated user.
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


      return res.status(200).json({
        success: true,
        profile: updatedProfile,
      });

    } catch (err) {

      console.error(
        "PROFILE UPDATE ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Profile update failed",
      });
    }
  }
);


// =====================================================
// MULTER ERROR HANDLER
// =====================================================

router.use(
  (err, req, res, next) => {

    if (err instanceof multer.MulterError) {

      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message:
            "Image must be smaller than 2 MB",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid file upload",
      });
    }


    if (
      err?.message ===
      "Only JPG, JPEG and PNG images are allowed"
    ) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }


    next(err);
  }
);


export default router;