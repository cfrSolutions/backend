// import express from "express";
// import Profile from "../models/Profile.model.js";
// const router = express.Router();

// router.get("/", async (req, res) => {

//   const profiles =
//     await Profile.find();

//   res.json(profiles);

// });

// router.get(
//   "/profile-library",
//   async (req, res) => {

//     const profiles =
//       await Profile.find({
//         active: true
//       });

//     res.json(profiles);

//   }
// );



// router.get("/profiles", async (req, res) => {
//   const profiles = await Profile.find({
//     active: true,
//   });

//   res.json(profiles);
// });

// export default router;


// import express from "express";
// import Profile from "../models/Profile.model.js";
// import adminOnly from "../middleware/admin.middleware.js";
// import { authMiddleware } from "../middleware/auth.middleware.js";

// const router = express.Router();

// /*
// =====================================================
// GET ALL PROFILES
// Authenticated users only
// =====================================================
// */
// router.get("/", authMiddleware, adminOnly, async (req, res) => {
//   try {
//     const profiles = await Profile.find();

//     return res.json(profiles);
//   } catch (error) {
//     console.error("GET PROFILES ERROR:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to load profiles",
//     });
//   }
// });


// /*
// =====================================================
// PROFILE LIBRARY
// Authenticated users only
// =====================================================
// */
// router.get(
//   "/profile-library",
//   authMiddleware,
//   async (req, res) => {
//     try {
//       const profiles = await Profile.find({
//         active: true,
//       });

//       return res.json(profiles);
//     } catch (error) {
//       console.error(
//         "PROFILE LIBRARY ERROR:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message: "Failed to load profile library",
//       });
//     }
//   }
// );


// /*
// =====================================================
// ACTIVE PROFILES
// Authenticated users only
// =====================================================
// */
// router.get(
//   "/profiles",
//   authMiddleware,
//   async (req, res) => {
//     try {
//       const profiles = await Profile.find({
//         active: true,
//       });

//       return res.json(profiles);
//     } catch (error) {
//       console.error(
//         "ACTIVE PROFILES ERROR:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message: "Failed to load profiles",
//       });
//     }
//   }
// );

// export default router;

import express from "express";
import Profile from "../models/Profile.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import adminOnly from "../middleware/admin.middleware.js";

const router = express.Router();

// =====================================================
// ADMIN ONLY — ALL PROFILES
// =====================================================

// router.get(
//   "/",
//   authMiddleware,
//   async (req, res) => {
//     try {
//       const profiles = await Profile.find()
//         .select("-__v");

//       return res.json(profiles);
//     } catch (error) {
//       console.error("GET PROFILES ERROR:", error);

//       return res.status(500).json({
//         success: false,
//         message: "Failed to load profiles",
//       });
//     }
//   }
// );

// ALL PROFILES — ADMIN ONLY
router.get(
  "/all",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const profiles = await Profile.find()
        .select("-__v")
        .lean();

      return res.json(profiles);
    } catch (error) {
      console.error("GET PROFILES ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to load profiles",
      });
    }
  }
);


// ACTIVE PROFILES — AUTHENTICATED USERS
router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const profiles = await Profile.find(
        { active: true },
        {
          name: 1,
          description: 1,
          image: 1,
          category: 1,
        }
      ).lean();

      return res.json(profiles);
    } catch (error) {
      console.error("ACTIVE PROFILES ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to load profiles",
      });
    }
  }
);

// =====================================================
// AUTHENTICATED USERS — ACTIVE PROFILE LIBRARY
// Only return fields the frontend actually needs.
// =====================================================

router.get(
  "/profile-library",
  authMiddleware, adminOnly,
  async (req, res) => {
    try {
      const profiles = await Profile.find(
        { active: true },
        {
          name: 1,
          description: 1,
          image: 1,
          category: 1,
        }
      );

      return res.json(profiles);
    } catch (error) {
      console.error("PROFILE LIBRARY ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to load profile library",
      });
    }
  }
);

// =====================================================
// AUTHENTICATED USERS — ACTIVE PROFILES
// =====================================================

router.get(
  "/profiles",
  authMiddleware,
  async (req, res) => {
    try {
      const profiles = await Profile.find(
        { active: true },
        {
          name: 1,
          description: 1,
          image: 1,
          category: 1,
        }
      );

      return res.json(profiles);
    } catch (error) {
      console.error("ACTIVE PROFILES ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to load profiles",
      });
    }
  }
);

export default router;