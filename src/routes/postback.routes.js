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
    // =========================================
    // 1. Get RID
    // =========================================

    const rid =
      req.query.rid ||
      req.query.RID ||
      req.query.pid ||
      req.query.PID ||
      req.query.uid;

    if (!rid) {
      return res.status(400).json({
        success: false,
        message: "Missing RID",
      });
    }

    // =========================================
    // 2. Get status
    // =========================================

    const status = String(
      req.query.status || ""
    ).toUpperCase();

    const allowedStatuses = [
      "COMPLETED",
      "SCREENOUT",
      "QUOTA_FULL",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // =========================================
    // 3. Get vendor token
    // =========================================

    const tk = String(req.query.tk || "");

    if (!tk) {
      return res.status(401).json({
        success: false,
        message: "Missing postback token",
      });
    }

    // =========================================
    // 4. Find response
    // =========================================

    const response = await SurveyResponse.findOne({
      rid,
    });

    if (!response) {
      return res.status(404).json({
        success: false,
        message: "RID not found",
      });
    }

    // =========================================
    // 5. Select expected token
    // =========================================

    let expectedToken = null;

    if (status === "COMPLETED") {
      expectedToken = response.expectedCompleteTk;
    }

    if (status === "SCREENOUT") {
      expectedToken = response.expectedDqTk;
    }

    if (status === "QUOTA_FULL") {
      expectedToken = response.expectedQuotaTk;
    }

    if (!expectedToken) {
      return res.status(403).json({
        success: false,
        message: "Postback authorization not configured",
      });
    }

    // =========================================
    // 6. Constant-time token comparison
    // =========================================

    const providedBuffer = Buffer.from(
      tk,
      "utf8"
    );

    const expectedBuffer = Buffer.from(
      String(expectedToken),
      "utf8"
    );

    if (
      providedBuffer.length !== expectedBuffer.length ||
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

    // =========================================
    // 7. Find survey
    // =========================================

    const survey = await Survey.findById(
      response.survey
    );

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: "Survey not found",
      });
    }

    // =========================================
    // 8. COMPLETED
    // =========================================

    if (status === "COMPLETED") {

      // Already completed
      if (response.status === "COMPLETED") {
        return res.json({
          success: true,
          message: "Already completed",
        });
      }

      // Only STARTED can become COMPLETED
      if (response.status !== "STARTED") {
        return res.status(409).json({
          success: false,
          message: "Survey response is not active",
        });
      }

      const points =
        Number(survey.points) || 0;

      const completedAt = new Date();

      let durationSeconds = null;

      if (response.startedAt) {
        durationSeconds = Math.max(
          Math.floor(
            (
              completedAt -
              response.startedAt
            ) / 1000
          ),
          10
        );
      }

      // -----------------------------------------
      // Update response
      // -----------------------------------------

      response.status = "COMPLETED";
      response.completedAt = completedAt;

      if (durationSeconds !== null) {
        response.durationSeconds =
          durationSeconds;
      }

      await response.save();

      // -----------------------------------------
      // Wallet
      // -----------------------------------------

      await Wallet.findOneAndUpdate(
        {
          user: response.user,
        },
        {
          $inc: {
            balance: points,
            totalEarned: points,
          },
        },
        {
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

      // -----------------------------------------
      // Wallet transaction
      // -----------------------------------------

      await WalletTransaction.create({
        user: response.user,
        type: "EARN",
        points,
        description:
          `Completed: ${survey.title}`,
        survey: survey._id,
      });

      // -----------------------------------------
      // Survey completion count
      // -----------------------------------------

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

      // -----------------------------------------
      // User
      // -----------------------------------------

      await User.updateOne(
        {
          _id: response.user,
        },
        {
          $set: {
            hasCompletedSurvey: true,
          },
        }
      );
    }

    // =========================================
    // SCREENOUT
    // =========================================

    else if (status === "SCREENOUT") {

      if (response.status === "COMPLETED") {
        return res.status(409).json({
          success: false,
          message:
            "Completed response cannot be screenout",
        });
      }

      if (response.status !== "STARTED") {
        return res.json({
          success: true,
          message: "Already processed",
        });
      }

      response.status = "SCREENOUT";

      await response.save();
    }

    // =========================================
    // QUOTA FULL
    // =========================================

    else if (status === "QUOTA_FULL") {

      if (response.status === "COMPLETED") {
        return res.status(409).json({
          success: false,
          message:
            "Completed response cannot be quota full",
        });
      }

      if (response.status !== "STARTED") {
        return res.json({
          success: true,
          message: "Already processed",
        });
      }

      response.status = "QUOTA_FULL";

      await response.save();
    }

    // =========================================
    // 9. Success
    // =========================================

    return res.json({
      success: true,
      message: status,
    });

  } catch (err) {

    console.error(
      "POSTBACK ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Unable to process postback",
    });
  }
});

export default router;