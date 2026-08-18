// import express from "express";
// import SurveyResponse from "../models/SurveyResponse.model.js";
// import Wallet from "../models/Wallet.model.js";
// import WalletTransaction from "../models/WalletTransaction.model.js";
// import Survey from "../models/Survey.model.js";
// import User from "../models/User.model.js";

// const router = express.Router();

// router.get("/", async (req, res) => {
//   try {
//     const rid =
//       req.query.rid ||
//       req.query.RID ||
//       req.query.pid ||
//       req.query.PID ||
//       req.query.uid;

//     console.log("POSTBACK:", req.query);

//     if (!rid) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing RID",
//       });
//     }

//     const response = await SurveyResponse.findOne({ rid });

// if (!response) {
//   return res.status(404).json({
//     success: false,
//     message: "RID not found",
//   });
// }

//    const status = req.query.status || "COMPLETED";

// const survey = await Survey.findById(response.survey);

// if (status === "COMPLETED") {

//   if (response.status === "COMPLETED") {
//     return res.json({
//       success: true,
//       message: "Already completed",
//     });
//   }

//   const points = survey?.points || 0;

//   response.status = "COMPLETED";
//   response.completedAt = new Date();

//   if (response.startedAt) {
//     response.durationSeconds = Math.max(
//       Math.floor((response.completedAt - response.startedAt) / 1000),
//       10
//     );
//   }

//   await response.save();

//   await Wallet.findOneAndUpdate(
//     { user: response.user },
//     {
//       $inc: {
//         balance: points,
//         totalEarned: points,
//       },
//     },
//     {
//       upsert: true,
//     }
//   );

//   await WalletTransaction.create({
//     user: response.user,
//     type: "EARN",
//     points,
//     description: `Completed: ${survey.title}`,
//     survey: survey._id,
//   });

//   await Survey.updateOne(
//     { _id: survey._id },
//     {
//       $inc: {
//         responsesCount: 1,
//       },
//     }
//   );

//   await User.updateOne(
//   { _id: response.user },
//   {
//     $set: {
//       hasCompletedSurvey: true,
//     },
//   }
// );
// }

// else if (status === "SCREENOUT") {

//   response.status = "SCREENOUT";
//   await response.save();

// }

// else if (status === "QUOTA_FULL") {

//   response.status = "QUOTA_FULL";
//   await response.save();

// }

// return res.json({
//   success: true,
//   message: status,
// });

//   } catch (err) {
//     console.error(err);

//     res.status(500).json({
//       success: false,
//       message: "Unable to process postback",
//     });
//   }
// });

// export default router;



import express from "express";
import crypto from "crypto";

import SurveyResponse from "../models/SurveyResponse.model.js";
import Wallet from "../models/Wallet.model.js";
import WalletTransaction from "../models/WalletTransaction.model.js";
import Survey from "../models/Survey.model.js";
import User from "../models/User.model.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    console.log("=================================");
    console.log("POSTBACK RECEIVED");
    console.log("QUERY:", req.query);
    console.log("=================================");

    // =========================================
    // 1. GET RID
    // =========================================

    const rid = String(
      req.query.rid ||
      req.query.RID ||
      req.query.pid ||
      req.query.PID ||
      req.query.uid ||
      ""
    ).trim();

    if (!rid) {
      return res.status(400).json({
        success: false,
        message: "Missing RID",
      });
    }

    // =========================================
    // 2. GET STATUS
    // =========================================

    const status = String(
      req.query.status ||
      req.query.STATUS ||
      req.query.st ||
      ""
    )
      .trim()
      .toUpperCase();

    const allowedStatuses = [
      "COMPLETED",
      "SCREENOUT",
      "QUOTA_FULL",
    ];

    if (!allowedStatuses.includes(status)) {
      console.error(
        "Invalid postback status:",
        status
      );

      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // =========================================
    // 3. GET TOKEN
    // =========================================

    const tk = String(
      req.query.tk || ""
    ).trim();

    if (!tk) {
      return res.status(401).json({
        success: false,
        message: "Missing postback token",
      });
    }

    console.log("RID:", rid);
    console.log("STATUS:", status);
    console.log("TOKEN RECEIVED:", !!tk);

    // =========================================
    // 4. FIND RESPONSE
    // =========================================

    const response =
      await SurveyResponse.findOne({
        rid,
      });

    if (!response) {
      console.error(
        "RID NOT FOUND:",
        rid
      );

      return res.status(404).json({
        success: false,
        message: "RID not found",
      });
    }

    console.log(
      "Response:",
      response._id.toString()
    );

    console.log(
      "Current status:",
      response.status
    );

    // =========================================
    // 5. FIND SURVEY
    // =========================================

    const survey =
      await Survey.findById(
        response.survey
      );

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: "Survey not found",
      });
    }

    // =========================================
    // 6. SELECT EXPECTED TOKEN
    // =========================================

    let expectedToken = "";

    if (status === "COMPLETED") {
      expectedToken =
        response.expectedCompleteTk;
    }

    if (status === "SCREENOUT") {
      expectedToken =
        response.expectedDqTk;
    }

    if (status === "QUOTA_FULL") {
      expectedToken =
        response.expectedQuotaTk;
    }

    if (!expectedToken) {
      console.error(
        "Expected token missing for:",
        status
      );

      return res.status(403).json({
        success: false,
        message:
          "Postback authorization not configured",
      });
    }

    // =========================================
    // 7. CONSTANT-TIME TOKEN CHECK
    // =========================================

    const providedBuffer =
      Buffer.from(tk, "utf8");

    const expectedBuffer =
      Buffer.from(
        String(expectedToken),
        "utf8"
      );

    if (
      providedBuffer.length !==
      expectedBuffer.length
    ) {
      return res.status(403).json({
        success: false,
        message: "Invalid postback token",
      });
    }

    if (
      !crypto.timingSafeEqual(
        providedBuffer,
        expectedBuffer
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Invalid postback token",
      });
    }

    console.log(
      "POSTBACK TOKEN VALID"
    );

    // =========================================
    // 8. ALREADY PROCESSED
    // =========================================

    if (response.status !== "STARTED") {

      if (response.status === status) {
        return res.json({
          success: true,
          message: "Already processed",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          `Response already has status ${response.status}`,
      });
    }

    // =========================================
    // 9. COMPLETED
    // =========================================

    if (status === "COMPLETED") {

      const points =
        Math.max(
          Number(survey.points) || 0,
          0
        );

      const completedAt =
        new Date();

      const durationSeconds =
        response.startedAt
          ? Math.max(
              Math.floor(
                (
                  completedAt -
                  response.startedAt
                ) / 1000
              ),
              10
            )
          : 10;

      // =======================================
      // ATOMIC STATUS CHANGE
      // =======================================

      const completedResponse =
        await SurveyResponse.findOneAndUpdate(
          {
            _id: response._id,
            status: "STARTED",
          },
          {
            $set: {
              status: "COMPLETED",
              completedAt,
              durationSeconds,
            },
          },
          {
            new: true,
          }
        );

      // Another request already completed it
      if (!completedResponse) {
        return res.json({
          success: true,
          message: "Already processed",
        });
      }

      console.log(
        "RESPONSE MARKED COMPLETED:",
        completedResponse._id
      );

      // =======================================
      // CREDIT WALLET
      // =======================================

      await Wallet.findOneAndUpdate(
        {
          user: completedResponse.user,
        },
        {
          $inc: {
            balance: points,
            totalEarned: points,
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      console.log(
        "WALLET CREDITED:",
        points
      );

      // =======================================
      // WALLET TRANSACTION
      // =======================================

      await WalletTransaction.create({
        user: completedResponse.user,
        type: "EARN",
        points,
        description:
          `Completed: ${survey.title}`,
        survey: survey._id,
      });

      // =======================================
      // SURVEY COMPLETION COUNT
      // =======================================

      await Survey.updateOne(
        {
          _id: survey._id,
        },
        {
          $inc: {
            responsesCount: 1,
          },
        }
      );

      console.log(
        "SURVEY responsesCount INCREMENTED"
      );

      // =======================================
      // USER FLAG
      // =======================================

      await User.updateOne(
        {
          _id: completedResponse.user,
        },
        {
          $set: {
            hasCompletedSurvey: true,
          },
        }
      );

      console.log(
        "SURVEY COMPLETION SUCCESS"
      );

      return res.json({
        success: true,
        message: "COMPLETED",
        rid,
      });
    }

    // =========================================
    // 10. SCREENOUT
    // =========================================

    if (status === "SCREENOUT") {

      const updated =
        await SurveyResponse.findOneAndUpdate(
          {
            _id: response._id,
            status: "STARTED",
          },
          {
            $set: {
              status: "SCREENOUT",
              completedAt: new Date(),
            },
          },
          {
            new: true,
          }
        );

      if (!updated) {
        return res.json({
          success: true,
          message: "Already processed",
        });
      }

      await Survey.updateOne(
        {
          _id: survey._id,
        },
        {
          $inc: {
            disqualified: 1,
          },
        }
      );

      return res.json({
        success: true,
        message: "SCREENOUT",
      });
    }

    // =========================================
    // 11. QUOTA FULL
    // =========================================

    if (status === "QUOTA_FULL") {

      const updated =
        await SurveyResponse.findOneAndUpdate(
          {
            _id: response._id,
            status: "STARTED",
          },
          {
            $set: {
              status: "QUOTA_FULL",
              completedAt: new Date(),
            },
          },
          {
            new: true,
          }
        );

      if (!updated) {
        return res.json({
          success: true,
          message: "Already processed",
        });
      }

      await Survey.updateOne(
        {
          _id: survey._id,
        },
        {
          $inc: {
            quotaFull: 1,
          },
        }
      );

      return res.json({
        success: true,
        message: "QUOTA_FULL",
      });
    }

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