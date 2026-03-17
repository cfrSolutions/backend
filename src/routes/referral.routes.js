// import express from "express";
// import { authMiddleware } from "../middleware/auth.middleware.js";
// import User from "../models/User.model.js";

// const router = express.Router();

// /* ================= REFERRAL STATS ================= */

// router.get("/stats", authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user._id || req.user.userId || req.user.id;

//     // total users referred
//     const totalReferrals = await User.countDocuments({
//       referredBy: userId
//     });

//     // users who completed first survey
//     const successful = await User.countDocuments({
//       referredBy: userId,
//       hasCompletedSurvey: true
//     });

//     const pointsEarned = successful * 50;

//     res.json({
//       totalReferrals,
//       successful,
//       pointsEarned
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

/* ================= REFERRAL STATS ================= */


router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;

    const totalReferrals = await User.countDocuments({
      referredBy: userId
    });

    // ✅ count referral transactions
    const referralTx = await WalletTransaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
           source: "SURVEY"
        }
      },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: "$points" },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalReferrals,
      successful: referralTx[0]?.count || 0,
      pointsEarned: referralTx[0]?.totalPoints || 0
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Referral stats error" });
  }
});


export default router;
