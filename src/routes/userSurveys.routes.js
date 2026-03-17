// import express from "express";
// import Survey from "../models/Survey.model.js"; // 👈 FIX PATH
// import { authMiddleware } from "../middleware/auth.middleware.js";

// const router = express.Router();

// // GET active surveys for users
// router.get("/available", authMiddleware, async (req, res) => {
//   try {
//     const surveys = await Survey.find({ status: "ACTIVE" })
//       .select(
//         "title description points difficulty surveyType externalSurveyUrl timeLimit createdAt"
//       )
//       .sort({ createdAt: -1 });

//     res.json(surveys);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to load surveys" });
//   }
// });

// export default router;


import express from "express";
import Survey from "../models/Survey.model.js"; 
import { authMiddleware } from "../middleware/auth.middleware.js";
import SurveyResponse from "../models/SurveyResponse.model.js";
const router = express.Router();

// GET active surveys for users
router.get("/available", authMiddleware, async (req, res) => {
  try {
    const surveys = await Survey.find({ status: "ACTIVE" })
      .select(
        "title description points difficulty surveyType externalSurveyUrl timeLimit createdAt"
      )
      .sort({ createdAt: -1 });

      const responses = await SurveyResponse.find({
  user: req.user._id || req.user.id || req.user.userId
});

const completedSurveyIds = responses
  .filter(r => r.status === "COMPLETED")
  .map(r => r.survey.toString());

const result = surveys.map(s => ({
  ...s.toObject(),
  completed: completedSurveyIds.includes(s._id.toString())
}));
      
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load surveys" });
  }
});

export default router;
