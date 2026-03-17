// import express from "express";
// import Survey from "../models/Survey.model.js";
// import SurveyResponse from "../models/SurveyResponse.model.js";
// import { authMiddleware } from "../middleware/auth.middleware.js";

// const router = express.Router();

// router.get("/stats", authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user._id;

//     // all active surveys
//     const totalSurveys = await Survey.countDocuments({
//       status: "ACTIVE",
//     });

//     // user responses
//     const responses = await SurveyResponse.find({ user: userId });

//     const completed = responses.filter(
//       r => r.status === "COMPLETED"
//     ).length;

//     const pending = responses.filter(
//       r => r.status === "STARTED"
//     ).length;

//     // surveys already completed by user
//     const completedSurveyIds = responses
//       .filter(r => r.status === "COMPLETED")
//       .map(r => r.survey.toString());

//     const available = await Survey.countDocuments({
//       status: "ACTIVE",
//       _id: { $nin: completedSurveyIds }
//     });

//     res.json({
//       totalSurveys,
//       available,
//       completed,
//       pending
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to fetch stats" });
//   }
// });

// export default router;


import express from "express";
import Survey from "../models/Survey.model.js";
import SurveyResponse from "../models/SurveyResponse.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import WalletTransaction from "../models/WalletTransaction.model.js";

import mongoose from "mongoose";
const router = express.Router();

router.get("/stats", authMiddleware, async (req, res) => {
  try {
   
   const userId = req.user._id || req.user.id || req.user.userId;


    // 1. Get counts directly from MongoDB (more reliable than .filter)
   const completedCount = await SurveyResponse.countDocuments({ 
    user: userId, 
    status: "COMPLETED" 
});

    const pendingCount = await SurveyResponse.countDocuments({ 
      user: userId, 
      status: "STARTED" 
    });

    const totalSurveys = await Survey.countDocuments({ status: "ACTIVE" });

    // 2. Get IDs of completed surveys to calculate "Available"
    const completedResponses = await SurveyResponse.find({ 
      user: userId, 
      status: "COMPLETED" 
    }).select('survey');
    
    const completedSurveyIds = completedResponses.map(r => r.survey);

    const available = await Survey.countDocuments({
      status: "ACTIVE",
      _id: { $nin: completedSurveyIds }
    });

    res.json({
      totalSurveys,
      available,
      completed: completedCount, // This will now show 1 instead of 0
      pending: pendingCount,
      
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

router.get("/report-stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.user.userId;

    const responses = await SurveyResponse.find({
      user: userId,
      status: "COMPLETED"
    }).sort({ completedAt: -1 });

    /* ---------- AVG TIME ---------- */
    const totalTime = responses.reduce(
      (sum, r) => sum + (r.durationSeconds || 0),
      0
    );

   const avgTimeMinutes =
  responses.length > 0
    ? Number((totalTime / responses.length / 60).toFixed(1))
    : 0;


    /* ---------- STREAK DAYS ---------- */
    let streak = 0;
    let currentDate = new Date();
currentDate.setHours(0,0,0,0);


    for (const r of responses) {
      const completedDate = new Date(r.completedAt);
completedDate.setHours(0,0,0,0);

const diff =
  (currentDate - completedDate) /
  (1000 * 60 * 60 * 24);


      if (diff === streak) {
        streak++;
      } else {
        break;
      }
    }

    res.json({
      avgTimeMinutes,
      streakDays: streak
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Report stats error" });
  }
});
router.get("/activity", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.user.userId;

    const last7Days = await WalletTransaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          type: "EARN"
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          points: { $sum: "$points" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(last7Days);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Activity fetch error" });
  }
});

export default router;
