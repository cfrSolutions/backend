import express from "express";
import SurveyResponse from "../models/SurveyResponse.model.js";
import Survey from "../models/Survey.model.js";
import crypto from "crypto";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/start", authMiddleware, async (req, res) => {
  try {
    const { surveyId } = req.body;

    
    const userId = req.user._id || req.user.id || req.user.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

   
  // const existingCompleted = await SurveyResponse.findOne({
  //   survey: surveyId,
  //   user: userId,
  //   status: "COMPLETED",
  // });

  // if (existingCompleted) {
  //   return res.status(400).json({
  //     message: "Survey already completed",
  //   });
  // }

  const existingResponse = await SurveyResponse.findOne({
  survey: surveyId,
  user: userId,
  status: {
    $in: [
      "COMPLETED",
      "SCREENOUT",
      "QUOTA_FULL",
    ],
  },
});

if (existingResponse) {
  return res.status(400).json({
    status: existingResponse.status,
    message: "Survey already finished",
  });
}

  
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
    // CREATE RESPONSE (THIS IS THE UID)
    const rid = crypto.randomBytes(8).toString("hex").toUpperCase();
    const survey = await Survey.findById(surveyId);
     if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }
const completeTk = survey.vendorCompleteUrl
  ? new URL(survey.vendorCompleteUrl).searchParams.get("tk")
  : "";

const dqTk = survey.vendorDisqualifyUrl
  ? new URL(survey.vendorDisqualifyUrl).searchParams.get("tk")
  : "";

const quotaTk = survey.vendorQuotaUrl
  ? new URL(survey.vendorQuotaUrl).searchParams.get("tk")
  : "";
    const response = await SurveyResponse.create({
      survey: surveyId,
      user: userId,
      rid,
      status: "STARTED",
      startedAt: new Date(),
      expectedCompleteTk: completeTk,
      expectedDqTk: dqTk,
      expectedQuotaTk: quotaTk,
    });

    
    
   

    if (!response.user) {
      return res.status(400).send("Response has no user attached");
    }

    // INTERNAL SURVEY → YOUR FORM
    if (survey.surveyType === "INTERNAL") {
      return res.json({
        redirectUrl: `${process.env.FRONTEND_URL}/user/survey/${surveyId}?uid=${response._id}`,
      });
    }

    // EXTERNAL SURVEY COMPANY FORM
    let redirectUrl = survey.companySurveyUrl;

    if (!survey.trackingParam) {
      return res.status(400).json({
        message: "Tracking placeholder not configured for this survey",
      });
    }

    // //  REPLACE COMPANY PLACEHOLDER WITH RESPONSE ID
    // redirectUrl = redirectUrl.replace(
    //   survey.trackingParam,
    //   response._id.toString()
    // );
const separator = redirectUrl.includes("?") ? "&" : "?";

redirectUrl =
`${redirectUrl}${separator}${survey.trackingParam}=${response.rid}`;

// redirectUrl =
//   `${redirectUrl}${separator}${survey.trackingParam}=${response._id}`;


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
// import crypto from "crypto";
// import { authMiddleware } from "../middleware/auth.middleware.js";

// const router = express.Router();

// router.post("/start", authMiddleware, async (req, res) => {
//   try {
//     const { surveyId } = req.body;

//     // -----------------------------------------
//     // 1. Validate surveyId
//     // -----------------------------------------
//     if (!surveyId || !crypto.isValidUUID?.(surveyId)) {
//       // Remove this validation if surveyId is Mongo ObjectId
//     }

//     const userId = req.user._id || req.user.id || req.user.userId;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     // -----------------------------------------
//     // 2. Find survey FIRST
//     // -----------------------------------------
//     const survey = await Survey.findById(surveyId);

//     if (!survey) {
//       return res.status(404).json({
//         success: false,
//         message: "Survey not found",
//       });
//     }

//     // -----------------------------------------
//     // 3. Check already finished
//     // -----------------------------------------
//     const existingResponse = await SurveyResponse.findOne({
//       survey: surveyId,
//       user: userId,
//       status: {
//         $in: [
//           "COMPLETED",
//           "SCREENOUT",
//           "QUOTA_FULL",
//         ],
//       },
//     });

//     if (existingResponse) {
//       return res.status(400).json({
//         success: false,
//         status: existingResponse.status,
//         message: "Survey already finished",
//       });
//     }

//     // -----------------------------------------
//     // 4. Check already started
//     // -----------------------------------------
//     const existingStarted = await SurveyResponse.findOne({
//       survey: surveyId,
//       user: userId,
//       status: "STARTED",
//     });

//     if (existingStarted) {
//       let redirectUrl;

//       if (survey.surveyType === "INTERNAL") {
//         redirectUrl =
//           `${process.env.FRONTEND_URL}/user/survey/${surveyId}?uid=${existingStarted._id}`;
//       } else {
//         redirectUrl = survey.companySurveyUrl;

//         if (!survey.trackingParam) {
//           return res.status(400).json({
//             success: false,
//             message: "Tracking placeholder not configured",
//           });
//         }

//         const separator = redirectUrl.includes("?") ? "&" : "?";

//         redirectUrl =
//           `${redirectUrl}${separator}${survey.trackingParam}=${encodeURIComponent(existingStarted.rid)}`;
//       }

//       return res.json({
//         success: true,
//         redirectUrl,
//       });
//     }

//     // -----------------------------------------
//     // 5. Generate secure RID
//     // -----------------------------------------
//     const rid = crypto
//       .randomBytes(16)
//       .toString("hex")
//       .toUpperCase();

//     // -----------------------------------------
//     // 6. Get vendor postback tokens
//     // -----------------------------------------
//     let completeTk = "";
//     let dqTk = "";
//     let quotaTk = "";

//     try {
//       if (survey.vendorCompleteUrl) {
//         completeTk = new URL(
//           survey.vendorCompleteUrl
//         ).searchParams.get("tk") || "";
//       }

//       if (survey.vendorDisqualifyUrl) {
//         dqTk = new URL(
//           survey.vendorDisqualifyUrl
//         ).searchParams.get("tk") || "";
//       }

//       if (survey.vendorQuotaUrl) {
//         quotaTk = new URL(
//           survey.vendorQuotaUrl
//         ).searchParams.get("tk") || "";
//       }
//     } catch (urlError) {
//       console.error("INVALID VENDOR URL:", urlError);

//       return res.status(400).json({
//         success: false,
//         message: "Invalid vendor postback URL configuration",
//       });
//     }

//     // -----------------------------------------
//     // 7. Create response
//     // -----------------------------------------
//     const response = await SurveyResponse.create({
//       survey: surveyId,
//       user: userId,
//       rid,

//       status: "STARTED",
//       startedAt: new Date(),

//       expectedCompleteTk: completeTk,
//       expectedDqTk: dqTk,
//       expectedQuotaTk: quotaTk,
//     });

//     // -----------------------------------------
//     // 8. Internal survey
//     // -----------------------------------------
//     if (survey.surveyType === "INTERNAL") {
//       return res.json({
//         success: true,
//         redirectUrl:
//           `${process.env.FRONTEND_URL}/user/survey/${surveyId}?uid=${response._id}`,
//       });
//     }

//     // -----------------------------------------
//     // 9. External survey
//     // -----------------------------------------
//     if (!survey.companySurveyUrl) {
//       return res.status(400).json({
//         success: false,
//         message: "Company survey URL not configured",
//       });
//     }

//     if (!survey.trackingParam) {
//       return res.status(400).json({
//         success: false,
//         message: "Tracking parameter not configured",
//       });
//     }

//     let redirectUrl = survey.companySurveyUrl;

//     const separator =
//       redirectUrl.includes("?") ? "&" : "?";

//     redirectUrl =
//       `${redirectUrl}${separator}${survey.trackingParam}=${encodeURIComponent(rid)}`;

//     return res.json({
//       success: true,
//       redirectUrl,
//     });

//   } catch (err) {
//     console.error("START SURVEY ERROR:", err);

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// });

// export default router;