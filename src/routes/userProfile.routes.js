// import express from "express";
// import UserProfile from "../models/UserProfile.model.js";
// import { authMiddleware } from "../middleware/auth.middleware.js";

// const router = express.Router();

// /* GET PROFILE */
// router.get("/", authMiddleware, async (req, res) => {
//   const userId = req.user.userId;

//   let profile = await UserProfile.findOne({ user: userId });

//   // auto create empty profile
//   if (!profile) {
//     profile = await UserProfile.create({ user: userId });
//   }

//   res.json(profile);
// });

// /* UPDATE PROFILE */
// router.put("/", authMiddleware, async (req, res) => {
//   const userId = req.user.userId;

//   const profile = await UserProfile.findOneAndUpdate(
//     { user: userId },
//     req.body,
//     { new: true, upsert: true }
//   );

//   res.json(profile);
// });

// export default router;


import express from "express";
import UserProfile from "../models/UserProfile.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/*
=====================================================
GET PROFILE
Authenticated user can only access their own profile
=====================================================
*/

router.get("/", authMiddleware, async (req, res) => {
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

    let profile = await UserProfile.findOne({
      user: userId,
    });

    // Auto-create empty profile
    if (!profile) {
      profile = await UserProfile.create({
        user: userId,
      });
    }

    return res.json(profile);

  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load profile",
    });
  }
});


/*
=====================================================
UPDATE PROFILE
Authenticated user can only update their own profile
=====================================================
*/

router.put("/", authMiddleware, async (req, res) => {
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
    Fields that must NEVER be controlled by frontend
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
    Keep all legitimate profile fields.
    Only remove protected/system fields.
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
    IMPORTANT:
    The query itself uses authenticated user's ID.
    A user cannot choose another user's ID.
    -------------------------------------------------
    */

    const profile =
      await UserProfile.findOneAndUpdate(
        {
          user: userId,
        },
        {
          $set: updates,

          // Only used when profile doesn't exist
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
      profile,
    });

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Profile update failed",
    });
  }
});


export default router;