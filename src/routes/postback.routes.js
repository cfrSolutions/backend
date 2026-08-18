import express from "express";
import SurveyResponse from "../models/SurveyResponse.model.js";
import Wallet from "../models/Wallet.model.js";
import WalletTransaction from "../models/WalletTransaction.model.js";
import Survey from "../models/Survey.model.js";
import User from "../models/User.model.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const rid =
      req.query.rid ||
      req.query.RID ||
      req.query.pid ||
      req.query.PID ||
      req.query.uid;

    console.log("POSTBACK:", req.query);

    if (!rid) {
      return res.status(400).json({
        success: false,
        message: "Missing RID",
      });
    }

    const response = await SurveyResponse.findOne({ rid });

if (!response) {
  return res.status(404).json({
    success: false,
    message: "RID not found",
  });
}

   const status = req.query.status || "COMPLETED";

const survey = await Survey.findById(response.survey);

if (status === "COMPLETED") {

  if (response.status === "COMPLETED") {
    return res.json({
      success: true,
      message: "Already completed",
    });
  }

  const points = survey?.points || 0;

  response.status = "COMPLETED";
  response.completedAt = new Date();

  if (response.startedAt) {
    response.durationSeconds = Math.max(
      Math.floor((response.completedAt - response.startedAt) / 1000),
      10
    );
  }

  await response.save();

  await Wallet.findOneAndUpdate(
    { user: response.user },
    {
      $inc: {
        balance: points,
        totalEarned: points,
      },
    },
    {
      upsert: true,
    }
  );

  await WalletTransaction.create({
    user: response.user,
    type: "EARN",
    points,
    description: `Completed: ${survey.title}`,
    survey: survey._id,
  });

  await Survey.updateOne(
    { _id: survey._id },
    {
      $inc: {
        responsesCount: 1,
      },
    }
  );

  await User.updateOne(
  { _id: response.user },
  {
    $set: {
      hasCompletedSurvey: true,
    },
  }
);
}

else if (status === "SCREENOUT") {

  response.status = "SCREENOUT";
  await response.save();

}

else if (status === "QUOTA_FULL") {

  response.status = "QUOTA_FULL";
  await response.save();

}

return res.json({
  success: true,
  message: status,
});

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to process postback",
    });
  }
});

export default router;



// import express from "express";
// import crypto from "crypto";

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

//     const rid = String(
//       req.query.rid ||
//       req.query.RID ||
//       req.query.pid ||
//       req.query.PID ||
//       req.query.uid ||
//       ""
//     ).trim();

//     if (!rid) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing RID",
//       });
//     }

//     // =====================================================
//     // 2. GET STATUS
//     // =====================================================
//     //
//     // Inputify is sending:
//     //
//     // st=com  -> COMPLETED
//     // st=dq   -> SCREENOUT
//     // st=qf   -> QUOTA_FULL
//     //
//     // We ALSO support your old:
//     //
//     // status=COMPLETED
//     // status=SCREENOUT
//     // status=QUOTA_FULL
//     //
//     // =====================================================

//     const rawStatus = String(
//       req.query.status ||
//       req.query.st ||
//       ""
//     )
//       .trim()
//       .toLowerCase();

//     let status;

//     switch (rawStatus) {
//       case "com":
//       case "complete":
//       case "completed":
//         status = "COMPLETED";
//         break;

//       case "dq":
//       case "screenout":
//       case "disqualified":
//         status = "SCREENOUT";
//         break;

//       case "qf":
//       case "quota":
//       case "quota_full":
//       case "quotafull":
//         status = "QUOTA_FULL";
//         break;

//       default:
//         return res.status(400).json({
//           success: false,
//           message: "Invalid postback status",
//         });
//     }

//     console.log("RID:", rid);
//     console.log("RAW STATUS:", rawStatus);
//     console.log("NORMALIZED STATUS:", status);

//     // =====================================================
//     // 3. GET POSTBACK TOKEN
//     // =====================================================

//     const tk = String(
//       req.query.tk || ""
//     ).trim();

//     console.log(
//       "TK RECEIVED:",
//       tk ? "YES" : "NO"
//     );

//     if (!tk) {
//       return res.status(401).json({
//         success: false,
//         message: "Missing postback token",
//       });
//     }

//     // =====================================================
//     // 4. FIND RESPONSE
//     // =====================================================

//     const response =
//       await SurveyResponse.findOne({ rid });

//     if (!response) {
//       return res.status(404).json({
//         success: false,
//         message: "RID not found",
//       });
//     }

//     console.log(
//       "Response found:",
//       response._id.toString()
//     );

//     console.log(
//       "Current status:",
//       response.status
//     );

//     // =====================================================
//     // 5. FIND SURVEY
//     // =====================================================

//     const survey =
//       await Survey.findById(response.survey);

//     if (!survey) {
//       return res.status(404).json({
//         success: false,
//         message: "Survey not found",
//       });
//     }

//     // =====================================================
//     // 6. GET EXPECTED TOKEN
//     // =====================================================

//     let expectedToken = "";

//     switch (status) {
//       case "COMPLETED":
//         expectedToken =
//           response.expectedCompleteTk;
//         break;

//       case "SCREENOUT":
//         expectedToken =
//           response.expectedDqTk;
//         break;

//       case "QUOTA_FULL":
//         expectedToken =
//           response.expectedQuotaTk;
//         break;
//     }

//     if (!expectedToken) {
//       console.error(
//         "Expected token missing for:",
//         status
//       );

//       return res.status(403).json({
//         success: false,
//         message:
//           "Postback authorization not configured",
//       });
//     }

//     // =====================================================
//     // 7. CONSTANT-TIME TOKEN CHECK
//     // =====================================================

//     const providedBuffer =
//       Buffer.from(tk, "utf8");

//     const expectedBuffer =
//       Buffer.from(
//         String(expectedToken),
//         "utf8"
//       );

//     if (
//       providedBuffer.length !==
//       expectedBuffer.length
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "Invalid postback token",
//       });
//     }

//     const tokenValid =
//       crypto.timingSafeEqual(
//         providedBuffer,
//         expectedBuffer
//       );

//     if (!tokenValid) {
//       return res.status(403).json({
//         success: false,
//         message: "Invalid postback token",
//       });
//     }

//     console.log("POSTBACK TOKEN VERIFIED");

//     // =====================================================
//     // 8. HANDLE DUPLICATE CALLBACK
//     // =====================================================

//     if (response.status !== "STARTED") {

//       // Same callback received again
//       if (response.status === status) {
//         console.log(
//           "Duplicate postback:",
//           status
//         );

//         return res.json({
//           success: true,
//           message: "Already processed",
//         });
//       }

//       // Completed response can never become DQ/QF
//       if (response.status === "COMPLETED") {
//         return res.status(409).json({
//           success: false,
//           message:
//             "Completed response cannot be changed",
//         });
//       }

//       return res.status(409).json({
//         success: false,
//         message:
//           "Survey response is no longer active",
//       });
//     }

//     // =====================================================
//     // 9. COMPLETED
//     // =====================================================

//     if (status === "COMPLETED") {

//       const points =
//         Number(survey.points) || 0;

//       const completedAt =
//         new Date();

//       let durationSeconds = 10;

//       if (response.startedAt) {
//         durationSeconds =
//           Math.max(
//             Math.floor(
//               (
//                 completedAt -
//                 response.startedAt
//               ) / 1000
//             ),
//             10
//           );
//       }

//       // ---------------------------------------------------
//       // UPDATE RESPONSE
//       // ---------------------------------------------------

//       response.status = "COMPLETED";

//       response.completedAt =
//         completedAt;

//       response.durationSeconds =
//         durationSeconds;

//       await response.save();

//       console.log(
//         "Response marked COMPLETED:",
//         response.rid
//       );

//       // ---------------------------------------------------
//       // WALLET
//       // ---------------------------------------------------

//       if (points > 0) {

//         await Wallet.findOneAndUpdate(
//           {
//             user: response.user,
//           },
//           {
//             $inc: {
//               balance: points,
//               totalEarned: points,
//             },
//           },
//           {
//             upsert: true,
//             new: true,
//           }
//         );

//         console.log(
//           "Wallet credited:",
//           points
//         );

//         // -------------------------------------------------
//         // WALLET TRANSACTION
//         // -------------------------------------------------

//         await WalletTransaction.create({
//           user: response.user,
//           type: "EARN",
//           points,
//           description:
//             `Completed: ${survey.title}`,
//           survey: survey._id,
//         });

//         console.log(
//           "Wallet transaction created"
//         );
//       }

//       // ---------------------------------------------------
//       // SURVEY COMPLETION COUNT
//       // ---------------------------------------------------

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

//       console.log(
//         "Survey responsesCount updated:",
//         surveyUpdate
//       );

//       // ---------------------------------------------------
//       // USER
//       // ---------------------------------------------------

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

//       console.log(
//         "USER COMPLETION UPDATED"
//       );

//       return res.json({
//         success: true,
//         message: "COMPLETED",
//         rid,
//       });
//     }

//     // =====================================================
//     // 10. SCREENOUT
//     // =====================================================

//     if (status === "SCREENOUT") {

//       response.status =
//         "SCREENOUT";

//       response.completedAt =
//         new Date();

//       await response.save();

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

//       console.log(
//         "SCREENOUT recorded:",
//         rid
//       );

//       return res.json({
//         success: true,
//         message: "SCREENOUT",
//         rid,
//       });
//     }

//     // =====================================================
//     // 11. QUOTA FULL
//     // =====================================================

//     if (status === "QUOTA_FULL") {

//       response.status =
//         "QUOTA_FULL";

//       response.completedAt =
//         new Date();

//       await response.save();

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

//       console.log(
//         "QUOTA FULL recorded:",
//         rid
//       );

//       return res.json({
//         success: true,
//         message: "QUOTA_FULL",
//         rid,
//       });
//     }

//     return res.status(400).json({
//       success: false,
//       message: "Unsupported status",
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