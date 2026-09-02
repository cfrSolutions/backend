// import express from "express";
// import SurveyResponse from "../models/SurveyResponse.model.js";
// import Wallet from "../models/Wallet.model.js";
// import WalletTransaction from "../models/WalletTransaction.model.js";
// import Survey from "../models/Survey.model.js";
// import User from "../models/User.model.js";

// const router = express.Router();

// router.get("/", async (req, res) => {
//   try {
//     console.log("=================================");
//     console.log("POSTBACK RECEIVED");
//     console.log("QUERY:", req.query);
//     console.log("=================================");

//     // =====================================================
//     // 1. GET RID
//     // =====================================================

//     const rid =
//       req.query.rid ||
//       req.query.RID ||
//       req.query.pid ||
//       req.query.PID ||
//       req.query.uid;

    

//     if (!rid) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing RID",
//       });
//     }

//     // =====================================================
//     // 2. FIND RESPONSE
//     // =====================================================

//     const response = await SurveyResponse.findOne({ rid });

//     if (!response) {
//       return res.status(404).json({
//         success: false,
//         message: "RID not found",
//       });
//     }

//     console.log(
//       "Response found:",
//       response._id
//     );

//     console.log(
//       "Current status:",
//       response.status
//     );

//     // =====================================================
//     // 3. GET STATUS
//     // =====================================================

//     const status = String(
//       req.query.status || "COMPLETED"
//     ).toUpperCase();

//     const allowedStatuses = [
//       "COMPLETED",
//       "SCREENOUT",
//       "QUOTA_FULL",
//     ];

//     if (!allowedStatuses.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid status",
//       });
//     }

//     // =====================================================
//     // 4. FIND SURVEY
//     // =====================================================

//     const survey = await Survey.findById(
//       response.survey
//     );

//     if (!survey) {
//       return res.status(404).json({
//         success: false,
//         message: "Survey not found",
//       });
//     }

//     // =====================================================
//     // 5. COMPLETED
//     // =====================================================

//     if (status === "COMPLETED") {

//       // Already completed
//       if (response.status === "COMPLETED") {
//         return res.json({
//           success: true,
//           message: "Already completed",
//         });
//       }

//       // IMPORTANT:
//       // SCREENOUT and QUOTA_FULL are FINAL.
//       // User cannot go back and complete the survey.
//       if (
//         response.status === "SCREENOUT" ||
//         response.status === "QUOTA_FULL"
//       ) {
//         console.log(
//           "COMPLETION REJECTED - RESPONSE ALREADY FINALIZED:",
//           response.rid,
//           response.status
//         );

//         return res.status(409).json({
//           success: false,
//           message: "Survey response is already finalized",
//         });
//       }

//       // Only STARTED responses can become COMPLETED
//       if (response.status !== "STARTED") {
//         return res.status(409).json({
//           success: false,
//           message: "Survey response is not active",
//         });
//       }

//       // ===================================================
//       // POINTS
//       // ===================================================

//       const points = Number(
//         survey.points || 0
//       );

//       const completedAt = new Date();

//       // ===================================================
//       // DURATION
//       // ===================================================

//       if (response.startedAt) {
//         response.durationSeconds = Math.max(
//           Math.floor(
//             (completedAt - response.startedAt) /
//               1000
//           ),
//           10
//         );
//       }

//       // ===================================================
//       // MARK COMPLETED
//       // ===================================================

//       response.status = "COMPLETED";
//       response.completedAt = completedAt;

//       await response.save();

//       // console.log(
//       //   "RESPONSE MARKED COMPLETED:",
//       //   response.rid
//       // );

//       // ===================================================
//       // CREDIT WALLET
//       // ===================================================

//       await Wallet.findOneAndUpdate(
//         {
//           user: response.user,
//         },
//         {
//           $inc: {
//             balance: points,
//             totalEarned: points,
//           },
//         },
//         {
//           upsert: true,
//         }
//       );

//       // console.log(
//       //   "WALLET CREDITED:",
//       //   points
//       // );

//       // ===================================================
//       // WALLET TRANSACTION
//       // ===================================================

//       await WalletTransaction.create({
//         user: response.user,
//         type: "EARN",
//         points,
//         description:
//           `Completed: ${survey.title}`,
//         survey: survey._id,
//       });

//       // console.log(
//       //   "WALLET TRANSACTION CREATED"
//       // );

//       // ===================================================
//       // INCREASE COMPLETION COUNT
//       // ===================================================

//       const surveyUpdate =
//         await Survey.updateOne(
//           {
//             _id: survey._id,
//           },
//           {
//             $inc: {
//               responsesCount: 1,
//             },
//           }
//         );

//       // console.log(
//       //   "SURVEY COUNT UPDATED:",
//       //   surveyUpdate
//       // );

//       // ===================================================
//       // USER STATISTICS
//       // ===================================================

//       await User.updateOne(
//         {
//           _id: response.user,
//         },
//         {
//           $set: {
//             hasCompletedSurvey: true,
//           },
//         }
//       );

//       // console.log(
//       //   "COMPLETION PROCESS FINISHED"
//       // );
//     }

//     // =====================================================
//     // 6. SCREENOUT
//     // =====================================================

//     else if (status === "SCREENOUT") {

//       // Already completed → cannot become SCREENOUT
//       if (response.status === "COMPLETED") {
//         return res.status(409).json({
//           success: false,
//           message:
//             "Completed response cannot be screenout",
//         });
//       }

//       // Already quota full → cannot change
//       if (response.status === "QUOTA_FULL") {
//         return res.status(409).json({
//           success: false,
//           message:
//             "Survey response is already finalized",
//         });
//       }

//       // Already screenout
//       if (response.status === "SCREENOUT") {
//         return res.json({
//           success: true,
//           message: "Already screenout",
//         });
//       }

//       // Only STARTED can become SCREENOUT
//       if (response.status !== "STARTED") {
//         return res.status(409).json({
//           success: false,
//           message:
//             "Survey response is not active",
//         });
//       }

//       response.status = "SCREENOUT";
//       response.completedAt = new Date();

//       await response.save();

//       // Increase disqualified count
//       await Survey.updateOne(
//         {
//           _id: survey._id,
//         },
//         {
//           $inc: {
//             disqualified: 1,
//           },
//         }
//       );

//       // console.log(
//       //   "SCREENOUT PROCESSED:",
//       //   response.rid
//       // );
//     }

//     // =====================================================
//     // 7. QUOTA FULL
//     // =====================================================

//     else if (status === "QUOTA_FULL") {

//       // Already completed → cannot change
//       if (response.status === "COMPLETED") {
//         return res.status(409).json({
//           success: false,
//           message:
//             "Completed response cannot be quota full",
//         });
//       }

//       // Already screenout → cannot change
//       if (response.status === "SCREENOUT") {
//         return res.status(409).json({
//           success: false,
//           message:
//             "Survey response is already finalized",
//         });
//       }

//       // Already quota full
//       if (response.status === "QUOTA_FULL") {
//         return res.json({
//           success: true,
//           message: "Already quota full",
//         });
//       }

//       // Only STARTED can become QUOTA_FULL
//       if (response.status !== "STARTED") {
//         return res.status(409).json({
//           success: false,
//           message:
//             "Survey response is not active",
//         });
//       }

//       response.status = "QUOTA_FULL";
//       response.completedAt = new Date();

//       await response.save();

//       // Increase quota full count
//       await Survey.updateOne(
//         {
//           _id: survey._id,
//         },
//         {
//           $inc: {
//             quotaFull: 1,
//           },
//         }
//       );

//       // console.log(
//       //   "QUOTA FULL PROCESSED:",
//       //   response.rid
//       // );
//     }

//     // =====================================================
//     // 8. FINAL RESPONSE
//     // =====================================================

//     return res.json({
//       success: true,
//       message: status,
//     });

//   } catch (err) {
//     console.error(
//       "POSTBACK ERROR:",
//       err
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to process postback",
//     });
//   }
// });

// export default router;



import express from "express";
import {
  processSurveyStatus,
} from "../services/surveyCompletion.service.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // console.log("=================================");
    // console.log("POSTBACK RECEIVED");
    // console.log("=================================");

    // =========================================
    // 1. AUTHENTICATE INTERNAL POSTBACK
    // =========================================

    const providedSecret = req.get(
      "X-Inputify-Postback-Secret"
    );

    const internalSecret =
      process.env.INPUTIFY_POSTBACK_SECRET;

    if (
      !internalSecret ||
      !providedSecret ||
      providedSecret !== internalSecret
    ) {
      console.warn(
        "UNAUTHORIZED POSTBACK",
        {
          ip: req.ip,
          rid: req.query.rid,
          status: req.query.status,
        }
      );

      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    // =========================================
    // 2. GET RID
    // =========================================

    const rid = String(
      req.query.rid ||
      req.query.RID ||
      ""
    )
      .trim()
      .toUpperCase();

    if (!rid) {
      return res.status(400).json({
        success: false,
        message: "Missing RID",
      });
    }

    // =========================================
    // 3. GET STATUS
    // =========================================

    const status = String(
      req.query.status || ""
    )
      .trim()
      .toUpperCase();

    if (
      ![
        "COMPLETED",
        "SCREENOUT",
        "QUOTA_FULL",
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // =========================================
    // 4. PROCESS
    // =========================================

    const result =
      await processSurveyStatus({
        rid,
        status,
      });

    if (!result.success) {
      return res.status(
        result.code || 400
      ).json(result);
    }

    return res.json({
      success: true,
      message:
        result.alreadyProcessed
          ? "Already processed"
          : result.status,
    });

  } catch (err) {
    console.error(
      "POSTBACK ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process postback",
    });
  }
});

export default router;