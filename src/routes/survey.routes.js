// import express from "express";
// import { authMiddleware } from "../middleware/auth.middleware.js";
// import adminOnly from "../middleware/admin.middleware.js";
// import Survey from "../models/Survey.model.js";
// import {
//   createSurvey,
//   surveyStats,
// } from "../controllers/survey.controller.js";
// import UserProfile from "../models/UserProfile.model.js";
// import SurveyResponse from "../models/SurveyResponse.model.js";
// import { adminOverviewStats, adminDashboardSummary } from "../controllers/survey.controller.js";
// const router = express.Router();


// router.post("/", authMiddleware, adminOnly, createSurvey);

// /* GET ALL */
// router.get("/", authMiddleware, adminOnly, async (req, res) => {
//   const surveys = await Survey.find().sort({ createdAt: -1 });
//   res.json(surveys);
// });

// /* GET ONE */
// router.get("/:id", authMiddleware, async (req, res) => {
//   const survey = await Survey.findById(req.params.id);
//   if (!survey) return res.status(404).json({ message: "Not found" });
//   res.json(survey);
// });

// /* DELETE */
// router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
//   try {
//     await Survey.findByIdAndDelete(req.params.id);
//     res.json({ success: true });
//   } catch {
//     res.status(500).json({ message: "Failed to delete survey" });
//   }
// });
// router.get("/:surveyId/stats", authMiddleware, async (req, res) => {
//   const { surveyId } = req.params;

//   const responses = await SurveyResponse.find({ survey: surveyId });

//   const totalStarted = responses.length;
//   const completed = responses.filter(r => r.status === "COMPLETED").length;
//   const pending = responses.filter(r => r.status === "STARTED").length;
//   const screenout = responses.filter(r => r.status === "SCREENOUT").length;
//   const quota = responses.filter(r => r.status === "QUOTA_FULL").length;
//   const cancelled = responses.filter(r => r.status === "CANCELLED").length;
//   const cleaned = responses.filter(r => r.status === "CLEANED").length;

//   const completedDurations = responses
//     .filter(r => r.durationSeconds)
//     .map(r => r.durationSeconds);

//   const avgDurationSeconds =
//     completedDurations.length > 0
//       ? Math.round(
//           completedDurations.reduce((a, b) => a + b, 0) /
//             completedDurations.length
//         )
//       : 0;

//   const incidenceRate =
//     totalStarted > 0
//       ? ((completed / totalStarted) * 100).toFixed(1)
//       : "0.0";

//   res.json({
//     totalStarted,
//     completed,
//     pending,
//     screenout,
//     quota,
//     cancelled,
//     cleaned,
//     incidenceRate,
//     avgDurationSeconds,
//   });
// });

// router.get("/admin/reports/overview", authMiddleware, adminOverviewStats);
// router.get("/admin/dashboard-summary", authMiddleware, adminDashboardSummary);
// router.get("/:surveyId/demographics", authMiddleware, async (req, res) => {
//   try {
//     const responses = await SurveyResponse.find({
//       survey: req.params.surveyId,
//       status: "COMPLETED",
//     }).populate("user"); // 👈 get user

//     const gender = {};
//     const generations = {};

//     for (const r of responses) {
//       const profile = await UserProfile.findOne({ user: r.user._id });

//       if (!profile) continue;

//       // Gender
//       if (profile.gender) {
//         gender[profile.gender] = (gender[profile.gender] || 0) + 1;
//       }

//       // Age from DOB
//       if (profile.dob) {
//         const age =
//           new Date().getFullYear() -
//           new Date(profile.dob).getFullYear();

//         let gen =
//           age <= 26
//             ? "Gen Z"
//             : age <= 42
//             ? "Millennials"
//             : age <= 58
//             ? "Gen X"
//             : "Boomers";

//         generations[gen] = (generations[gen] || 0) + 1;
//       }
//     }

//     res.json({ gender, generations });
//   } catch (err) {
//     res.status(500).json({ message: "Demographics error" });
//   }
// });
// /* TOGGLE STATUS */
// router.patch("/:id/status", authMiddleware, adminOnly, async (req, res) => {
//   try {
//     const survey = await Survey.findByIdAndUpdate(
//       req.params.id,
//       { status: req.body.status },
//       { new: true }
//     );
//     res.json(survey);
//   } catch {
//     res.status(500).json({ message: "Failed to update status" });
//   }
// });
// // router.get("/stats/:surveyId", authMiddleware, adminOnly, surveyStats);
// export default router;


import express from "express";

import { authMiddleware } from "../middleware/auth.middleware.js";
import adminOnly from "../middleware/admin.middleware.js";

import {
  createSurvey,
  getSurveys,
  getSurveyById,
  surveyStats,
  adminOverviewStats,
  adminDashboardSummary,
} from "../controllers/survey.controller.js";

import Survey from "../models/Survey.model.js";
import UserProfile from "../models/UserProfile.model.js";
import SurveyResponse from "../models/SurveyResponse.model.js";

const router = express.Router();

/* =====================================================
   CREATE SURVEY
===================================================== */

router.post(
  "/",
  authMiddleware,
  adminOnly,
  createSurvey
);


/* =====================================================
   GET ALL SURVEYS

   SUPERADMIN → ALL
   ADMIN      → ONLY OWN
===================================================== */

// router.get(
//   "/",
//   authMiddleware,
//   adminOnly,
//   async (req, res) => {
//     try {
//        console.log("\n\n");
//       console.log("🔥🔥🔥🔥🔥 SURVEY ROUTE HIT 🔥🔥🔥🔥🔥");
//       console.log("USER:", req.user);
//       console.log("ROLE:", req.user?.role);
//       console.log(
//         "ID:",
//         req.user?._id ||
//         req.user?.userId ||
//         req.user?.id
//       );
//       const role = String(req.user?.role || "").toUpperCase();

//       const userId =
//         req.user?._id ||
//         req.user?.userId ||
//         req.user?.id;

     

//       if (!userId) {
//         return res.status(401).json({
//           message: "User ID not found",
//         });
//       }

//       let surveys;

//       if (role === "SUPERADMIN") {
//         // Superadmin sees everything
//         surveys = await Survey.find({})
//           .sort({ createdAt: -1 });
//       } else if (role === "ADMIN") {
//         // Admin sees ONLY their own surveys
//         surveys = await Survey.find({
//           createdBy: userId,
//         }).sort({ createdAt: -1 });
//       } else {
//         return res.status(403).json({
//           message: "Unauthorized",
//         });
//       }

//       console.log(
//         "RETURNING:",
//         surveys.map((survey) => ({
//           title: survey.title,
//           createdBy: survey.createdBy?.toString(),
//         }))
//       );

//       console.log("=================================");

//       res.json(surveys);
//     } catch (err) {
//       console.error("GET SURVEYS ERROR:", err);

//       res.status(500).json({
//         message: "Failed to fetch surveys",
//       });
//     }
//   }
// );

router.get(
  "/",
  authMiddleware,
  adminOnly,
  getSurveys
);
/* =====================================================
   ADMIN REPORT OVERVIEW

   Keep these BEFORE /:id
===================================================== */

router.get(
  "/admin/reports/overview",
  authMiddleware,
  adminOnly,
  adminOverviewStats
);


/* =====================================================
   ADMIN DASHBOARD SUMMARY
===================================================== */

router.get(
  "/admin/dashboard-summary",
  authMiddleware,
  adminOnly,
  adminDashboardSummary
);


/* =====================================================
   SURVEY STATS
===================================================== */

router.get(
  "/:surveyId/stats",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const { surveyId } = req.params;

      const responses = await SurveyResponse.find({
        survey: surveyId,
      });

      const totalStarted = responses.length;

      const completed = responses.filter(
        (r) => r.status === "COMPLETED"
      ).length;

      const pending = responses.filter(
        (r) => r.status === "STARTED"
      ).length;

      const screenout = responses.filter(
        (r) => r.status === "SCREENOUT"
      ).length;

      const quota = responses.filter(
        (r) => r.status === "QUOTA_FULL"
      ).length;

      const cancelled = responses.filter(
        (r) => r.status === "CANCELLED"
      ).length;

      const cleaned = responses.filter(
        (r) => r.status === "CLEANED"
      ).length;

      const completedDurations = responses
        .filter((r) => r.durationSeconds)
        .map((r) => r.durationSeconds);

      const avgDurationSeconds =
        completedDurations.length > 0
          ? Math.round(
              completedDurations.reduce((a, b) => a + b, 0) /
                completedDurations.length
            )
          : 0;

      const incidenceRate =
        totalStarted > 0
          ? ((completed / totalStarted) * 100).toFixed(1)
          : "0.0";

      res.json({
        totalStarted,
        completed,
        pending,
        screenout,
        quota,
        cancelled,
        cleaned,
        incidenceRate,
        avgDurationSeconds,
      });
    } catch (err) {
      console.error("SURVEY STATS ERROR:", err);

      res.status(500).json({
        message: "Failed to load survey stats",
      });
    }
  }
);


/* =====================================================
   DEMOGRAPHICS
===================================================== */

router.get(
  "/:surveyId/demographics",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const responses = await SurveyResponse.find({
        survey: req.params.surveyId,
        status: "COMPLETED",
      }).populate("user");

      const gender = {};
      const generations = {};

      for (const r of responses) {
        if (!r.user) continue;

        const profile = await UserProfile.findOne({
          user: r.user._id,
        });

        if (!profile) continue;

        // Gender
        if (profile.gender) {
          gender[profile.gender] =
            (gender[profile.gender] || 0) + 1;
        }

        // Age
        if (profile.dob) {
          const age =
            new Date().getFullYear() -
            new Date(profile.dob).getFullYear();

          let gen =
            age <= 26
              ? "Gen Z"
              : age <= 42
              ? "Millennials"
              : age <= 58
              ? "Gen X"
              : "Boomers";

          generations[gen] =
            (generations[gen] || 0) + 1;
        }
      }

      res.json({
        gender,
        generations,
      });
    } catch (err) {
      console.error("DEMOGRAPHICS ERROR:", err);

      res.status(500).json({
        message: "Demographics error",
      });
    }
  }
);


/* =====================================================
   GET ONE SURVEY
===================================================== */

router.get(
  "/:id",
  authMiddleware,
  adminOnly,
  getSurveyById
);


/* =====================================================
   DELETE SURVEY
===================================================== */

router.delete(
  "/:id",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const survey = await Survey.findById(req.params.id);

      if (!survey) {
        return res.status(404).json({
          message: "Survey not found",
        });
      }

      const role = String(
        req.user?.role || ""
      ).toUpperCase();

      const userId =
        req.user?._id ||
        req.user?.userId ||
        req.user?.id;

      // Admin can delete only their own survey
      if (
        role === "ADMIN" &&
        survey.createdBy.toString() !== userId.toString()
      ) {
        return res.status(403).json({
          message: "You are not authorized to delete this survey",
        });
      }

      await Survey.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
      });
    } catch (err) {
      console.error("DELETE SURVEY ERROR:", err);

      res.status(500).json({
        message: "Failed to delete survey",
      });
    }
  }
);


/* =====================================================
   TOGGLE SURVEY STATUS
===================================================== */

router.patch(
  "/:id/status",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const survey = await Survey.findById(req.params.id);

      if (!survey) {
        return res.status(404).json({
          message: "Survey not found",
        });
      }

      const role = String(
        req.user?.role || ""
      ).toUpperCase();

      const userId =
        req.user?._id ||
        req.user?.userId ||
        req.user?.id;

      // Admin can modify only their own survey
      if (
        role === "ADMIN" &&
        survey.createdBy.toString() !== userId.toString()
      ) {
        return res.status(403).json({
          message: "You are not authorized to modify this survey",
        });
      }

      survey.status = req.body.status;

      await survey.save();

      res.json(survey);
    } catch (err) {
      console.error("UPDATE SURVEY STATUS ERROR:", err);

      res.status(500).json({
        message: "Failed to update status",
      });
    }
  }
);

export default router;