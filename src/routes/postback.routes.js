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
// console.log(
//       "Response found:",
//       response._id
//     );

//     console.log(
//       "Current status:",
//       response.status
//     );

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
//   console.log(
//         "RESPONSE MARKED COMPLETED:",
//         response.rid
//       );

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

//   const surveyUpdate = await Survey.updateOne(
//     { _id: survey._id },
//     {
//       $inc: {
//         responsesCount: 1,
//       },
//     }
//   );

//   console.log(
//         "SURVEY COUNT UPDATED:",
//         surveyUpdate
//       );

//   await User.updateOne(
//   { _id: response.user },
//   {
//     $set: {
//       hasCompletedSurvey: true,
//     },
//   }
// );
//  console.log(
//         "COMPLETION PROCESS FINISHED"
//       );
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
import crypto from "crypto";

import SurveyResponse from "../models/SurveyResponse.model.js";
import Wallet from "../models/Wallet.model.js";
import WalletTransaction from "../models/WalletTransaction.model.js";
import Survey from "../models/Survey.model.js";
import User from "../models/User.model.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| VERIFY INPUTIFY SERVER
|--------------------------------------------------------------------------
|
| The browser MUST NOT know this secret.
|
| Inputify server -> your API
|
| Header:
| X-Inputify-Postback-Secret: <secret>
|
*/

function verifyInputifyRequest(req) {

  const receivedSecret =
    String(
      req.get(
        "X-Inputify-Postback-Secret"
      ) || ""
    );

  const expectedSecret =
    String(
      process.env.INPUTIFY_POSTBACK_SECRET ||
      ""
    );

  if (
    !receivedSecret ||
    !expectedSecret
  ) {
    return false;
  }

  const receivedBuffer =
    Buffer.from(
      receivedSecret,
      "utf8"
    );

  const expectedBuffer =
    Buffer.from(
      expectedSecret,
      "utf8"
    );

  if (
    receivedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  );
}


router.get("/", async (req, res) => {

  try {

    console.log(
      "================================="
    );

    console.log(
      "POSTBACK RECEIVED"
    );

    console.log(
      "================================="

    );

    // =====================================================
    // 1. SECURITY CHECK
    // =====================================================

    if (!verifyInputifyRequest(req)) {

      console.warn(
        "UNAUTHORIZED POSTBACK ATTEMPT",
        {
          ip: req.ip,
          rid:
            req.query.rid ||
            req.query.RID,
          status:
            req.query.status,
        }
      );

      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    console.log(
      "INPUTIFY SERVER VERIFIED"
    );


    // =====================================================
    // 2. GET RID
    // =====================================================

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


    // =====================================================
    // 3. NORMALIZE STATUS
    // =====================================================

    const status =
      String(
        req.query.status ||
        "COMPLETED"
      ).toUpperCase();

    const allowedStatuses = [
      "COMPLETED",
      "SCREENOUT",
      "QUOTA_FULL",
    ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {

      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }


    // =====================================================
    // 4. FIND RESPONSE
    // =====================================================

    const response =
      await SurveyResponse.findOne({
        rid,
      });

    if (!response) {

      return res.status(404).json({
        success: false,
        message: "RID not found",
      });
    }

    console.log(
      "Response found:",
      response._id
    );

    console.log(
      "Current status:",
      response.status
    );


    // =====================================================
    // 5. FIND SURVEY
    // =====================================================

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


    // =====================================================
    // 6. COMPLETED
    // =====================================================

    if (
      status === "COMPLETED"
    ) {

      // -----------------------------------------------
      // Already completed
      // -----------------------------------------------

      if (
        response.status ===
        "COMPLETED"
      ) {

        return res.json({
          success: true,
          message:
            "Already completed",
        });
      }


      // -----------------------------------------------
      // SCREENOUT IS FINAL
      // -----------------------------------------------

      if (
        response.status ===
        "SCREENOUT"
      ) {

        console.warn(
          "COMPLETION REJECTED - SCREENOUT:",
          response.rid
        );

        return res.status(409).json({
          success: false,
          message:
            "Survey response is already finalized",
        });
      }


      // -----------------------------------------------
      // QUOTA FULL IS FINAL
      // -----------------------------------------------

      if (
        response.status ===
        "QUOTA_FULL"
      ) {

        console.warn(
          "COMPLETION REJECTED - QUOTA FULL:",
          response.rid
        );

        return res.status(409).json({
          success: false,
          message:
            "Survey response is already finalized",
        });
      }


      // -----------------------------------------------
      // ONLY STARTED CAN COMPLETE
      // -----------------------------------------------

      if (
        response.status !==
        "STARTED"
      ) {

        return res.status(409).json({
          success: false,
          message:
            "Survey response is not active",
        });
      }


      // -----------------------------------------------
      // POINTS
      // -----------------------------------------------

      const points =
        Number(
          survey.points || 0
        );


      // -----------------------------------------------
      // COMPLETION TIME
      // -----------------------------------------------

      const completedAt =
        new Date();


      // -----------------------------------------------
      // DURATION
      // -----------------------------------------------

      if (
        response.startedAt
      ) {

        response.durationSeconds =
          Math.max(
            Math.floor(
              (
                completedAt -
                response.startedAt
              ) / 1000
            ),
            10
          );
      }


      // -----------------------------------------------
      // MARK COMPLETED
      // -----------------------------------------------

      response.status =
        "COMPLETED";

      response.completedAt =
        completedAt;

      await response.save();


      console.log(
        "RESPONSE MARKED COMPLETED:",
        response.rid
      );


      // -----------------------------------------------
      // WALLET
      // -----------------------------------------------

      await Wallet.findOneAndUpdate(
        {
          user:
            response.user,
        },
        {
          $inc: {
            balance: points,
            totalEarned:
              points,
          },
        },
        {
          upsert: true,
        }
      );


      // -----------------------------------------------
      // WALLET TRANSACTION
      // -----------------------------------------------

      await WalletTransaction.create({
        user:
          response.user,

        type:
          "EARN",

        points,

        description:
          `Completed: ${survey.title}`,

        survey:
          survey._id,
      });


      // -----------------------------------------------
      // SURVEY COUNT
      // -----------------------------------------------

      const surveyUpdate =
        await Survey.updateOne(
          {
            _id:
              survey._id,
          },
          {
            $inc: {
              responsesCount:
                1,
            },
          }
        );

      console.log(
        "SURVEY COUNT UPDATED:",
        surveyUpdate
      );


      // -----------------------------------------------
      // USER
      // -----------------------------------------------

      await User.updateOne(
        {
          _id:
            response.user,
        },
        {
          $set: {
            hasCompletedSurvey:
              true,
          },
        }
      );


      console.log(
        "COMPLETION PROCESS FINISHED"
      );
    }


    // =====================================================
    // 7. SCREENOUT
    // =====================================================

    else if (
      status === "SCREENOUT"
    ) {

      // -----------------------------------------------
      // COMPLETED IS FINAL
      // -----------------------------------------------

      if (
        response.status ===
        "COMPLETED"
      ) {

        return res.status(409).json({
          success: false,
          message:
            "Completed response cannot be screenout",
        });
      }


      // -----------------------------------------------
      // QUOTA FULL IS FINAL
      // -----------------------------------------------

      if (
        response.status ===
        "QUOTA_FULL"
      ) {

        return res.status(409).json({
          success: false,
          message:
            "Survey response is already finalized",
        });
      }


      // -----------------------------------------------
      // ALREADY SCREENOUT
      // -----------------------------------------------

      if (
        response.status ===
        "SCREENOUT"
      ) {

        return res.json({
          success: true,
          message:
            "Already screenout",
        });
      }


      // -----------------------------------------------
      // ONLY STARTED
      // -----------------------------------------------

      if (
        response.status !==
        "STARTED"
      ) {

        return res.status(409).json({
          success: false,
          message:
            "Survey response is not active",
        });
      }


      response.status =
        "SCREENOUT";

      response.completedAt =
        new Date();

      await response.save();


      // -----------------------------------------------
      // DISQUALIFIED COUNT
      // -----------------------------------------------

      await Survey.updateOne(
        {
          _id:
            survey._id,
        },
        {
          $inc: {
            disqualified:
              1,
          },
        }
      );


      console.log(
        "SCREENOUT PROCESSED:",
        response.rid
      );
    }


    // =====================================================
    // 8. QUOTA FULL
    // =====================================================

    else if (
      status === "QUOTA_FULL"
    ) {

      // -----------------------------------------------
      // COMPLETED IS FINAL
      // -----------------------------------------------

      if (
        response.status ===
        "COMPLETED"
      ) {

        return res.status(409).json({
          success: false,
          message:
            "Completed response cannot be quota full",
        });
      }


      // -----------------------------------------------
      // SCREENOUT IS FINAL
      // -----------------------------------------------

      if (
        response.status ===
        "SCREENOUT"
      ) {

        return res.status(409).json({
          success: false,
          message:
            "Survey response is already finalized",
        });
      }


      // -----------------------------------------------
      // ALREADY QUOTA FULL
      // -----------------------------------------------

      if (
        response.status ===
        "QUOTA_FULL"
      ) {

        return res.json({
          success: true,
          message:
            "Already quota full",
        });
      }


      // -----------------------------------------------
      // ONLY STARTED
      // -----------------------------------------------

      if (
        response.status !==
        "STARTED"
      ) {

        return res.status(409).json({
          success: false,
          message:
            "Survey response is not active",
        });
      }


      response.status =
        "QUOTA_FULL";

      response.completedAt =
        new Date();

      await response.save();


      // -----------------------------------------------
      // QUOTA COUNT
      // -----------------------------------------------

      await Survey.updateOne(
        {
          _id:
            survey._id,
        },
        {
          $inc: {
            quotaFull:
              1,
          },
        }
      );


      console.log(
        "QUOTA FULL PROCESSED:",
        response.rid
      );
    }


    // =====================================================
    // 9. FINAL RESPONSE
    // =====================================================

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
      message:
        "Unable to process postback",
    });
  }
});

export default router;