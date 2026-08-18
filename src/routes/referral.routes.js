// import express from "express";
// import mongoose from "mongoose";
// import { authMiddleware } from "../middleware/auth.middleware.js";
// import User from "../models/User.model.js";
// import WalletTransaction from "../models/WalletTransaction.model.js";
// const router = express.Router();

// /* ================= REFERRAL STATS ================= */


// router.get("/stats", authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user._id || req.user.userId || req.user.id;
//     if (!userId) {
//       return res.status(401).json({
//         message: "User not found in authentication token",
//       });
//     }
//     const totalReferrals = await User.countDocuments({
//       referredBy: userId
//     });

//     // ✅ count referral transactions
//     const referralTx = await WalletTransaction.aggregate([
//       {
//         $match: {
//           user: new mongoose.Types.ObjectId(userId),
//            source: "SURVEY"
//         }
//       },
//       {
//         $group: {
//           _id: null,
//           totalPoints: { $sum: "$points" },
//           count: { $sum: 1 }
//         }
//       }
//     ]);

//     res.json({
//       totalReferrals,
//       successful: referralTx[0]?.count || 0,
//       pointsEarned: referralTx[0]?.totalPoints || 0
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Referral stats error" });
//   }
// });


// export default router;


import express from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/auth.middleware.js";
import User from "../models/User.model.js";
import WalletTransaction from "../models/WalletTransaction.model.js";
const router = express.Router();

router.get("/stats", authMiddleware, async (req, res) => {
  try {
    // Get authenticated user ID
    const userId =
      req.user._id ||
      req.user.userId ||
      req.user.id;

    // --------------------------------
    // Validate authenticated user
    // --------------------------------
    if (!userId) {
      return res.status(401).json({
        message: "User not found in authentication token",
      });
    }

    // --------------------------------
    // Validate MongoDB ObjectId
    // --------------------------------
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        message: "Invalid authentication user ID",
      });
    }

    const objectUserId =
      new mongoose.Types.ObjectId(userId);

    // --------------------------------
    // Count referrals belonging to user
    // --------------------------------
    const totalReferrals =
      await User.countDocuments({
        referredBy: objectUserId,
      });

    // --------------------------------
    // Calculate user's referral earnings
    // --------------------------------
    const referralTx =
      await WalletTransaction.aggregate([
        {
          $match: {
            user: objectUserId,
            source: "SURVEY",
          },
        },
        {
          $group: {
            _id: null,
            totalPoints: {
              $sum: "$points",
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]);

    // --------------------------------
    // Send only required data
    // --------------------------------
    return res.status(200).json({
      totalReferrals,
      successful: referralTx[0]?.count || 0,
      pointsEarned: referralTx[0]?.totalPoints || 0,
    });

  } catch (err) {
    console.error("REFERRAL STATS ERROR:", err);

    return res.status(500).json({
      message: "Unable to fetch referral stats",
    });
  }
});