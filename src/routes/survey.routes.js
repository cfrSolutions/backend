// import express from "express";
// import { authMiddleware } from "../middleware/auth.middleware.js";
// import adminOnly from "../middleware/admin.middleware.js";
// import {
//   createSurvey,
//   getAllSurveys,
//   getSurveyById,
// } from "../controllers/survey.controller.js";

// const router = express.Router();

// router.post("/", authMiddleware, adminOnly, createSurvey);
// router.get("/", authMiddleware, adminOnly, getAllSurveys);
// router.get("/:id", authMiddleware, getSurveyById);

// export default router;
// import express from "express";
// import { authMiddleware } from "../middleware/auth.middleware.js";
// import {
//   createSurvey,
//   getSurveys,
//   getSurveyById,
// } from "../controllers/survey.controller.js";

// const router = express.Router();

// router.post("/", authMiddleware, createSurvey);
// router.get("/", authMiddleware, getSurveys);
// router.get("/:id", authMiddleware, getSurveyById);

// export default router;


// import express from "express";
// import { authMiddleware } from "../middleware/auth.middleware.js";
// import adminOnly from "../middleware/admin.middleware.js";
// import Survey from "../models/Survey.model.js";
// import {
//   createSurvey,
//   surveyStats,
// } from "../controllers/survey.controller.js";
// const router = express.Router();

// // /* CREATE */
// // router.post("/", authMiddleware, adminOnly, createSurvey, async (req, res) => {
// //   try {
// //     const survey = await Survey.create({
// //       ...req.body,
// //       createdBy: req.user.id,
// //     });
// //     res.json(survey);
// //   } catch (err) {
// //     res.status(500).json({ message: "Failed to create survey" });
// //   }
// // });
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
// router.get("/stats/:surveyId", authMiddleware, adminOnly, surveyStats);
// export default router;


import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import adminOnly from "../middleware/admin.middleware.js";
import Survey from "../models/Survey.model.js";
import {
  createSurvey,
  surveyStats,
} from "../controllers/survey.controller.js";
import UserProfile from "../models/UserProfile.model.js";
import SurveyResponse from "../models/SurveyResponse.model.js";
import { adminOverviewStats, adminDashboardSummary } from "../controllers/survey.controller.js";
const router = express.Router();

// /* CREATE */
// router.post("/", authMiddleware, adminOnly, createSurvey, async (req, res) => {
//   try {
//     const survey = await Survey.create({
//       ...req.body,
//       createdBy: req.user.id,
//     });
//     res.json(survey);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to create survey" });
//   }
// });
router.post("/", authMiddleware, adminOnly, createSurvey);

/* GET ALL */
router.get("/", authMiddleware, adminOnly, async (req, res) => {
  const surveys = await Survey.find().sort({ createdAt: -1 });
  res.json(surveys);
});

/* GET ONE */
router.get("/:id", authMiddleware, async (req, res) => {
  const survey = await Survey.findById(req.params.id);
  if (!survey) return res.status(404).json({ message: "Not found" });
  res.json(survey);
});

/* DELETE */
router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    await Survey.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to delete survey" });
  }
});
router.get("/:surveyId/stats", authMiddleware, async (req, res) => {
  const { surveyId } = req.params;

  const responses = await SurveyResponse.find({ survey: surveyId });

  const totalStarted = responses.length;
  const completed = responses.filter(r => r.status === "COMPLETED").length;
  const pending = responses.filter(r => r.status === "STARTED").length;
  const screenout = responses.filter(r => r.status === "SCREENOUT").length;
  const quota = responses.filter(r => r.status === "QUOTA_FULL").length;
  const cancelled = responses.filter(r => r.status === "CANCELLED").length;
  const cleaned = responses.filter(r => r.status === "CLEANED").length;

  const completedDurations = responses
    .filter(r => r.durationSeconds)
    .map(r => r.durationSeconds);

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
});

router.get("/admin/reports/overview", authMiddleware, adminOverviewStats);
router.get("/admin/dashboard-summary", authMiddleware, adminDashboardSummary);
router.get("/:surveyId/demographics", authMiddleware, async (req, res) => {
  try {
    const responses = await SurveyResponse.find({
      survey: req.params.surveyId,
      status: "COMPLETED",
    }).populate("user"); // 👈 get user

    const gender = {};
    const generations = {};

    for (const r of responses) {
      const profile = await UserProfile.findOne({ user: r.user._id });

      if (!profile) continue;

      // Gender
      if (profile.gender) {
        gender[profile.gender] = (gender[profile.gender] || 0) + 1;
      }

      // Age from DOB
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

        generations[gen] = (generations[gen] || 0) + 1;
      }
    }

    res.json({ gender, generations });
  } catch (err) {
    res.status(500).json({ message: "Demographics error" });
  }
});
/* TOGGLE STATUS */
router.patch("/:id/status", authMiddleware, adminOnly, async (req, res) => {
  try {
    const survey = await Survey.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(survey);
  } catch {
    res.status(500).json({ message: "Failed to update status" });
  }
});
// router.get("/stats/:surveyId", authMiddleware, adminOnly, surveyStats);
export default router;

// import express from "express";
// import { authMiddleware } from "../middleware/auth.middleware.js";
// import adminOnly from "../middleware/admin.middleware.js";
// import {
//   createSurvey,
//   surveyStats,
// } from "../controllers/survey.controller.js";
// import Survey from "../models/Survey.model.js";

// const router = express.Router();

// router.post("/", authMiddleware, adminOnly, createSurvey);
// router.get("/", authMiddleware, async (req, res) => {
//   const surveys = await Survey.find({ status: "ACTIVE" })
//     .sort({ createdAt: -1 });

//   res.json(surveys);
// });
// router.get("/stats/:surveyId", authMiddleware, adminOnly, surveyStats);

// export default router;
