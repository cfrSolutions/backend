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

/*
|--------------------------------------------------------------------------
| SURVEY POSTBACK
|--------------------------------------------------------------------------
|
| Vendor calls:
|
| /postback?rid=RID&tk=VENDOR_TOKEN&status=COMPLETED
|
| Security:
|
| 1. RID identifies the response
| 2. TK authorizes the postback
| 3. TK is compared against the correct server-side token
| 4. Status is strictly validated
| 5. Only STARTED responses can be completed
| 6. Points are taken from the database
|
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {

    // ==================================================
    // 1. GET RID
    // ==================================================

    const rid = req.query.rid;

    if (!rid || typeof rid !== "string") {
      return res.status(400).json({
        success: false,
        message: "Missing RID",
      });
    }

    // Prevent excessively large input
    if (rid.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid RID",
      });
    }

    // ==================================================
    // 2. GET STATUS
    // ==================================================

    const status = String(
      req.query.status || "COMPLETED"
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

    // ==================================================
    // 3. GET VENDOR TOKEN
    // ==================================================

    const tk = req.query.tk;

    if (!tk || typeof tk !== "string") {
      return res.status(401).json({
        success: false,
        message: "Missing postback token",
      });
    }

    // Prevent huge token abuse
    if (tk.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Invalid postback token",
      });
    }

    // ==================================================
    // 4. FIND RESPONSE
    // ==================================================

    const response =
      await SurveyResponse.findOne({ rid });

    if (!response) {
      return res.status(404).json({
        success: false,
        message: "RID not found",
      });
    }

    // ==================================================
    // 5. SELECT EXPECTED TOKEN
    // ==================================================

    let expectedToken = null;

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

    // ==================================================
    // 6. TOKEN MUST EXIST
    // ==================================================

    if (
      !expectedToken ||
      typeof expectedToken !== "string"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Postback authorization not configured",
      });
    }

    // ==================================================
    // 7. CONSTANT-TIME TOKEN COMPARISON
    // ==================================================

    const providedBuffer =
      Buffer.from(String(tk));

    const expectedBuffer =
      Buffer.from(String(expectedToken));

    if (
      providedBuffer.length !==
        expectedBuffer.length ||
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

    // ==================================================
    // 8. FIND SURVEY
    // ==================================================

    const survey =
      await Survey.findById(response.survey);

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: "Survey not found",
      });
    }

    // ==================================================
    // 9. COMPLETED
    // ==================================================

    if (status === "COMPLETED") {

      // -----------------------------------------------
      // Already completed
      // -----------------------------------------------

      if (response.status === "COMPLETED") {
        return res.json({
          success: true,
          message: "Already completed",
        });
      }

      // -----------------------------------------------
      // Only STARTED can become COMPLETED
      // -----------------------------------------------

      if (response.status !== "STARTED") {
        return res.status(409).json({
          success: false,
          message:
            "Survey response is not active",
        });
      }

      // -----------------------------------------------
      // Points MUST come from database
      // -----------------------------------------------

      const points =
        Number(survey.points) || 0;

      // -----------------------------------------------
      // Mark response completed
      // -----------------------------------------------

      response.status = "COMPLETED";
      response.completedAt = new Date();

      // -----------------------------------------------
      // Calculate duration
      // -----------------------------------------------

      if (response.startedAt) {

        response.durationSeconds =
          Math.max(
            Math.floor(
              (
                response.completedAt -
                response.startedAt
              ) / 1000
            ),
            10
          );
      }

      // -----------------------------------------------
      // Save response
      // -----------------------------------------------

      await response.save();

      // -----------------------------------------------
      // Credit wallet
      // -----------------------------------------------

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
          returnDocument: "after",
        }
      );

      // -----------------------------------------------
      // Create wallet transaction
      // -----------------------------------------------

      await WalletTransaction.create({
        user: response.user,
        type: "EARN",
        points,
        description:
          `Completed: ${survey.title}`,
        survey: survey._id,
      });

      // -----------------------------------------------
      // Update survey statistics
      // -----------------------------------------------

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

      // -----------------------------------------------
      // Update user statistics
      // -----------------------------------------------

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

      return res.json({
        success: true,
        message: "COMPLETED",
      });
    }

    // ==================================================
    // SCREENOUT
    // ==================================================

    if (status === "SCREENOUT") {

      // -----------------------------------------------
      // Completed cannot become screenout
      // -----------------------------------------------

      if (response.status === "COMPLETED") {
        return res.status(409).json({
          success: false,
          message:
            "Completed response cannot be screenout",
        });
      }

      // -----------------------------------------------
      // Already processed
      // -----------------------------------------------

      if (response.status !== "STARTED") {
        return res.json({
          success: true,
          message: "Already processed",
        });
      }

      // -----------------------------------------------
      // Mark screenout
      // -----------------------------------------------

      response.status = "SCREENOUT";

      await response.save();

      return res.json({
        success: true,
        message: "SCREENOUT",
      });
    }

    // ==================================================
    // QUOTA FULL
    // ==================================================

    if (status === "QUOTA_FULL") {

      // -----------------------------------------------
      // Completed cannot become quota full
      // -----------------------------------------------

      if (response.status === "COMPLETED") {
        return res.status(409).json({
          success: false,
          message:
            "Completed response cannot be quota full",
        });
      }

      // -----------------------------------------------
      // Already processed
      // -----------------------------------------------

      if (response.status !== "STARTED") {
        return res.json({
          success: true,
          message: "Already processed",
        });
      }

      // -----------------------------------------------
      // Mark quota full
      // -----------------------------------------------

      response.status = "QUOTA_FULL";

      await response.save();

      return res.json({
        success: true,
        message: "QUOTA_FULL",
      });
    }

    // ==================================================
    // SHOULD NEVER REACH HERE
    // ==================================================

    return res.status(400).json({
      success: false,
      message: "Invalid postback request",
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