import express from "express";
import SurveyResponse from "../models/SurveyResponse.model.js";
import Survey from "../models/Survey.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/start", authMiddleware, async (req, res) => {
  try {
    const { surveyId } = req.body;

    
    const userId = req.user._id || req.user.id || req.user.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ CHECK IF ALREADY COMPLETED
  const existingCompleted = await SurveyResponse.findOne({
    survey: surveyId,
    user: userId,
    status: "COMPLETED",
  });

  if (existingCompleted) {
    return res.status(400).json({
      message: "Survey already completed",
    });
  }

  // ✅ CHECK IF ALREADY STARTED (resume instead)
  const existingStarted = await SurveyResponse.findOne({
    survey: surveyId,
    user: userId,
    status: "STARTED",
  });

  if (existingStarted) {
    return res.json({
      redirectUrl:
        `${existingStarted.survey.companySurveyUrl}?uid=${existingStarted._id}`
    });
  }
    // ✅ CREATE RESPONSE (THIS IS THE UID)
    const response = await SurveyResponse.create({
      survey: surveyId,
      user: userId,
      status: "STARTED",
      startedAt: new Date(),
    });

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    if (!response.user) {
      return res.status(400).send("Response has no user attached");
    }

    // ✅ INTERNAL SURVEY → YOUR FORM
    if (survey.surveyType === "INTERNAL") {
      return res.json({
        redirectUrl: `${process.env.FRONTEND_URL}/user/survey/${surveyId}?uid=${response._id}`,
      });
    }

    // ✅ EXTERNAL SURVEY → COMPANY FORM
    let redirectUrl = survey.companySurveyUrl;

    if (!survey.trackingParam) {
      return res.status(400).json({
        message: "Tracking placeholder not configured for this survey",
      });
    }

    // // 🔥 REPLACE COMPANY PLACEHOLDER WITH RESPONSE ID
    // redirectUrl = redirectUrl.replace(
    //   survey.trackingParam,
    //   response._id.toString()
    // );
const separator = redirectUrl.includes("?") ? "&" : "?";

redirectUrl =
  `${redirectUrl}${separator}${survey.trackingParam}=${response._id}`;


    return res.json({ redirectUrl });

  } catch (err) {
    console.error("START SURVEY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;


// import express from "express";
// import SurveyResponse from "../models/SurveyResponse.model.js";
// import Survey from "../models/Survey.model.js";
// import { authMiddleware } from "../middleware/auth.middleware.js";
// import crypto from "crypto";
// import RouterSession from "../models/RouterSession.model.js";

// const router = express.Router();

// router.post("/start", authMiddleware, async (req, res) => {
//   try {
//     const { surveyId } = req.body;

    
//     const userId = req.user._id || req.user.id || req.user.userId;
//     if (!userId) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     // ✅ CHECK IF ALREADY COMPLETED
//   const existingCompleted = await SurveyResponse.findOne({
//     survey: surveyId,
//     user: userId,
//     status: "COMPLETED",
//   });

//   if (existingCompleted) {
//     return res.status(400).json({
//       message: "Survey already completed",
//     });
//   }

//   // ✅ CHECK IF ALREADY STARTED (resume instead)
//   const existingStarted = await SurveyResponse.findOne({
//     survey: surveyId,
//     user: userId,
//     status: "STARTED",
//   });

//   if (existingStarted) {
//     return res.json({
//       redirectUrl:
//         `${existingStarted.survey.companySurveyUrl}?uid=${existingStarted._id}`
//     });
//   }
//     // ✅ CREATE RESPONSE (THIS IS THE UID)
//     const response = await SurveyResponse.create({
//       survey: surveyId,
//       user: userId,
//       status: "STARTED",
//       startedAt: new Date(),
//     });

//     const survey = await Survey.findById(surveyId);
//     if (!survey) {
//       return res.status(404).json({ message: "Survey not found" });
//     }

//     if (!response.user) {
//       return res.status(400).send("Response has no user attached");
//     }

//     // ✅ INTERNAL SURVEY → YOUR FORM
//     if (survey.surveyType === "INTERNAL") {
//       return res.json({
//         redirectUrl: `${process.env.FRONTEND_URL}/user/survey/${surveyId}?uid=${response._id}`,
//       });
//     }

//     // ✅ Generate secure token
//     const token = crypto.randomBytes(16).toString("hex");

//     await RouterSession.create({
//       token,
//       response: response._id,
//       survey: surveyId,
//       user: userId,
//     });

//     // ✅ EXTERNAL SURVEY → COMPANY FORM
//     let redirectUrl = survey.companySurveyUrl;

//     if (!survey.trackingParam) {
//       return res.status(400).json({
//         message: "Tracking placeholder not configured for this survey",
//       });
//     }

//     // // 🔥 REPLACE COMPANY PLACEHOLDER WITH RESPONSE ID
//     // redirectUrl = redirectUrl.replace(
//     //   survey.trackingParam,
//     //   response._id.toString()
//     // );
// const separator = redirectUrl.includes("?") ? "&" : "?";

// redirectUrl =
//   `${redirectUrl}${separator}${survey.trackingParam}=${token}`;


//     return res.json({ redirectUrl });

//   } catch (err) {
//     console.error("START SURVEY ERROR:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// export default router;

