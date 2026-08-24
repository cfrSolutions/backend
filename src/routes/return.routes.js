// import mongoose from "mongoose";
// import express from "express";
// import SurveyResponse from "../models/SurveyResponse.model.js";
// import Survey from "../models/Survey.model.js";
// import Wallet from "../models/Wallet.model.js";
// import WalletTransaction from "../models/WalletTransaction.model.js";
// import User from "../models/User.model.js";
// const router = express.Router();

// router.get("/complete", async (req, res) => {
//   // console.log("RETURN QUERY:", req.query);
//   try {
//    //const { uid } = req.query;
//    const uid =  req.query.rid || req.query.RID || req.query.uid || req.query.id || req.query.pid|| req.query.PID || Object.values(req.query)[0];

//    const tk = req.query.tk || "";
   
//   //  const uid =
//   // req.query.uid ||
//   // req.query.id ||
//   // req.query.pid ||
//   // req.query.PID ||
//   // Object.values(req.query).find(v =>
//   //   mongoose.Types.ObjectId.isValid(v)
//   // );
// if (!uid) return res.send("Missing response id");
//     // const response = await SurveyResponse.findById(uid).populate("survey");
//     const response = await SurveyResponse.findOne({
//   rid: uid,
//   expectedCompleteTk: tk,
// }).populate("survey");
   
//         if (!response) return res.status(404).send("Invalid response");
//    if (response.status === "COMPLETED") {
        
//         return res.redirect(`${response.survey.returnBaseUrl}/user/dashboard?st=com`);
//     }

//     // FIX: Explicitly convert to ObjectId
//     const userId = response.user;
//     const points = response.survey?.points || 0;

//     // 2. Atomic Wallet Update
//     await Wallet.findOneAndUpdate(
//       { user: userId },
//       { $inc: { balance: points, totalEarned: points } },
//       { upsert: true, new: true }
//     );

//     // 3. Update Response Status
//     response.status = "COMPLETED";
//     response.completedAt = new Date();
//    if (response.startedAt) {
//         response.durationSeconds = (response.completedAt - response.startedAt) / 1000;
//     }
//     const started = response.startedAt || new Date();
// response.durationSeconds =
//   Math.max(
//     Math.floor((response.completedAt - started) / 1000),
//     10
//   );
//     await response.save();

//     // 4. Create Transaction Record
//     await WalletTransaction.create({
//       user: userId,
//       type: "EARN",
//       points,
//       description: `Completed: ${response.survey.title}`,
//       survey: response.survey._id,
//     });

//     // 5. Update Survey Stats
//     await Survey.updateOne(
//       { _id: response.survey._id },
//       { $inc: { responsesCount: 1 } }
//     );
// console.log("SURVEY COMPLETED BY USER:", userId.toString());
// await User.updateOne(
//   { _id: response.user },
//   { $set: { hasCompletedSurvey: true } }
// );

//     // 6. Redirect to Frontend
//     const surveySlug = response.survey.title.toLowerCase().replace(/\s+/g, "-");
//   // const redirectUrl =
//   //   `${process.env.FRONTEND_URL}/${surveySlug}` +
//   //   `?resid=${response._id}&st=com`;
// const redirectUrl = `${response.survey.returnBaseUrl}/user/dashboard?st=com`;
//   res.redirect(redirectUrl);
//   }
//   catch (err) {
//     console.error("WALLET UPDATE ERROR:", err);
//     res.status(500).send("Internal Server Error");
//   }
// });


// router.get("/screenout", async (req, res) => {
//   //const { uid } = req.query;
// // const uid = Object.values(req.query)[0];
// const uid =
//   req.query.rid ||
//   req.query.RID ||
//   Object.values(req.query)[0];

//   const tk = req.query.tk || "";

//   // const response = await SurveyResponse.findById(uid).populate("survey");
//  const response = await SurveyResponse.findOne({
//   rid: uid,
//   expectedDqTk: tk,
// }).populate("survey");

//   if (!response) return res.send("Invalid response");

//   response.status = "SCREENOUT";
//   await response.save();

//   const surveySlug = response.survey.title
//     .toLowerCase()
//     .replace(/\s+/g, "-");

//   res.redirect(
//     `${process.env.FRONTEND_URL}/${surveySlug}?resid=${response._id}&st=scr`
//   );
// });



// router.get("/quota", async (req, res) => {
//  //const { uid } = req.query;
// // const uid = Object.values(req.query)[0];
// const uid =
//   req.query.rid ||
//   req.query.RID ||
//   Object.values(req.query)[0];

//   const tk = req.query.tk || "";

//   // const response = await SurveyResponse.findById(uid).populate("survey");
//   const response = await SurveyResponse.findOne({
//   rid: uid,
//   expectedQuotaTk: tk,
// }).populate("survey");

//   if (!response) return res.send("Invalid response");

//   response.status = "QUOTA_FULL";
//   await response.save();

//   const surveySlug = response.survey.title
//     .toLowerCase()
//     .replace(/\s+/g, "-");

//   res.redirect(
//     `${process.env.FRONTEND_URL}/${surveySlug}?resid=${response._id}&st=quo`
//   );
// });



// export default router;


import mongoose from "mongoose";
import express from "express";
import SurveyResponse from "../models/SurveyResponse.model.js";
import Survey from "../models/Survey.model.js";
import Wallet from "../models/Wallet.model.js";
import WalletTransaction from "../models/WalletTransaction.model.js";
import User from "../models/User.model.js";
const router = express.Router();

// router.get("/complete", async (req, res) => {
//   // console.log("RETURN QUERY:", req.query);
//   try {
//    //const { uid } = req.query;
//    const uid =  req.query.rid || req.query.RID || req.query.uid || req.query.id || req.query.pid|| req.query.PID || Object.values(req.query)[0];

//    const tk = req.query.tk || "";
   
//   //  const uid =
//   // req.query.uid ||
//   // req.query.id ||
//   // req.query.pid ||
//   // req.query.PID ||
//   // Object.values(req.query).find(v =>
//   //   mongoose.Types.ObjectId.isValid(v)
//   // );
// if (!uid) return res.send("Missing response id");
//     // const response = await SurveyResponse.findById(uid).populate("survey");
//     const response = await SurveyResponse.findOne({
//   rid: uid,
//   expectedCompleteTk: tk,
// }).populate("survey");
   
//         if (!response) return res.status(404).send("Invalid response");
//    if (response.status === "COMPLETED") {
        
//         return res.redirect(`${response.survey.returnBaseUrl}/user/dashboard?st=com`);
//     }

//     // FIX: Explicitly convert to ObjectId
//     const userId = response.user;
//     const points = response.survey?.points || 0;

//     // 2. Atomic Wallet Update
//     await Wallet.findOneAndUpdate(
//       { user: userId },
//       { $inc: { balance: points, totalEarned: points } },
//       { upsert: true, new: true }
//     );

//     // 3. Update Response Status
//     response.status = "COMPLETED";
//     response.completedAt = new Date();
//    if (response.startedAt) {
//         response.durationSeconds = (response.completedAt - response.startedAt) / 1000;
//     }
//     const started = response.startedAt || new Date();
// response.durationSeconds =
//   Math.max(
//     Math.floor((response.completedAt - started) / 1000),
//     10
//   );
//     await response.save();

//     // 4. Create Transaction Record
//     await WalletTransaction.create({
//       user: userId,
//       type: "EARN",
//       points,
//       description: `Completed: ${response.survey.title}`,
//       survey: response.survey._id,
//     });

//     // 5. Update Survey Stats
//     await Survey.updateOne(
//       { _id: response.survey._id },
//       { $inc: { responsesCount: 1 } }
//     );
// console.log("SURVEY COMPLETED BY USER:", userId.toString());
// await User.updateOne(
//   { _id: response.user },
//   { $set: { hasCompletedSurvey: true } }
// );

//     // 6. Redirect to Frontend
//     const surveySlug = response.survey.title.toLowerCase().replace(/\s+/g, "-");
//   // const redirectUrl =
//   //   `${process.env.FRONTEND_URL}/${surveySlug}` +
//   //   `?resid=${response._id}&st=com`;
// const redirectUrl = `${response.survey.returnBaseUrl}/user/dashboard?st=com`;
//   res.redirect(redirectUrl);
//   }
//   catch (err) {
//     console.error("WALLET UPDATE ERROR:", err);
//     res.status(500).send("Internal Server Error");
//   }
// });

router.get("/complete", async (req, res) => {
  try {
    const uid =
      req.query.rid ||
      req.query.RID ||
      req.query.uid ||
      req.query.id ||
      req.query.pid ||
      req.query.PID ||
      Object.values(req.query)[0];

    const tk = req.query.tk || "";

    if (!uid || !tk) {
      return res.status(400).send("Missing response credentials");
    }

    /*
    =====================================================
    1. ATOMICALLY CLAIM THE RESPONSE
    =====================================================

    Only a response that is NOT already COMPLETED
    can be changed to COMPLETED.

    This prevents two simultaneous requests from
    both receiving the reward.
    */

    const response = await SurveyResponse.findOneAndUpdate(
      {
        rid: uid,
        expectedCompleteTk: tk,

        // IMPORTANT:
        // Only one request can transition this response
        // into COMPLETED.
        status: { $ne: "COMPLETED" },
      },
      {
        $set: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      },
      {
        new: true,
      }
    ).populate("survey");

    /*
    =====================================================
    2. INVALID / ALREADY COMPLETED
    =====================================================
    */

    if (!response) {

      /*
      Check whether this was simply an already completed
      response so the user can still be redirected.
      */

      const existingResponse =
        await SurveyResponse.findOne({
          rid: uid,
          expectedCompleteTk: tk,
        }).populate("survey");

      if (!existingResponse) {
        return res.status(404).send("Invalid response");
      }

      if (existingResponse.status === "COMPLETED") {
        return res.redirect(
          `${existingResponse.survey.returnBaseUrl}/user/dashboard?st=com`
        );
      }

      return res.status(409).send(
        "Unable to complete response"
      );
    }

    /*
    =====================================================
    3. GET USER + SURVEY POINTS FROM DATABASE
    =====================================================
    */

    const userId = response.user;
    const points = response.survey?.points || 0;

    if (!userId || !response.survey) {
      return res.status(400).send("Invalid survey response");
    }

    /*
    =====================================================
    4. CALCULATE DURATION
    =====================================================
    */

    const completedAt = response.completedAt;

    if (response.startedAt) {
      response.durationSeconds = Math.max(
        Math.floor(
          (completedAt - response.startedAt) / 1000
        ),
        10
      );
    }

    await response.save();

    /*
    =====================================================
    5. ADD WALLET REWARD
    =====================================================
    */

    await Wallet.findOneAndUpdate(
      {
        user: userId,
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

    /*
    =====================================================
    6. CREATE WALLET TRANSACTION
    =====================================================
    */

    await WalletTransaction.create({
      user: userId,
      type: "EARN",
      points,
      source: "SURVEY",
      description: `Completed: ${response.survey.title}`,
      survey: response.survey._id,
    });

    /*
    =====================================================
    7. UPDATE SURVEY STATISTICS
    =====================================================
    */

    await Survey.updateOne(
      {
        _id: response.survey._id,
      },
      {
        $inc: {
          responsesCount: 1,
        },
      }
    );

    /*
    =====================================================
    8. MARK USER AS HAVING COMPLETED A SURVEY
    =====================================================
    */

    await User.updateOne(
      {
        _id: userId,
      },
      {
        $set: {
          hasCompletedSurvey: true,
        },
      }
    );

    console.log(
      "SURVEY COMPLETED BY USER:",
      userId.toString()
    );

    /*
    =====================================================
    9. REDIRECT
    =====================================================
    */

    const redirectUrl =
      `${response.survey.returnBaseUrl}` +
      `/user/dashboard?st=com`;

    return res.redirect(redirectUrl);

  } catch (err) {

    console.error(
      "SURVEY COMPLETE ERROR:",
      err
    );

    return res.status(500).send(
      "Internal Server Error"
    );
  }
});

// router.get("/screenout", async (req, res) => {
//   //const { uid } = req.query;
// // const uid = Object.values(req.query)[0];
// const uid =
//   req.query.rid ||
//   req.query.RID ||
//   Object.values(req.query)[0];

//   const tk = req.query.tk || "";

//   // const response = await SurveyResponse.findById(uid).populate("survey");
//  const response = await SurveyResponse.findOne({
//   rid: uid,
//   expectedDqTk: tk,
// }).populate("survey");

//   if (!response) return res.send("Invalid response");

//   response.status = "SCREENOUT";
//   await response.save();

//   const surveySlug = response.survey.title
//     .toLowerCase()
//     .replace(/\s+/g, "-");

//   res.redirect(
//     `${process.env.FRONTEND_URL}/${surveySlug}?resid=${response._id}&st=scr`
//   );
// });
router.get("/screenout", async (req, res) => {
  try {
    const uid =
      req.query.rid ||
      req.query.RID ||
      Object.values(req.query)[0];

    const tk = req.query.tk || "";

    if (!uid || !tk) {
      return res.status(400).send("Missing response credentials");
    }

    /*
    =====================================================
    1. ATOMICALLY CHANGE RESPONSE TO SCREENOUT
    =====================================================
    */

    const response = await SurveyResponse.findOneAndUpdate(
      {
        rid: uid,
        expectedDqTk: tk,

        // Do not change an already finalized response
        status: {
          $nin: [
            "COMPLETED",
            "SCREENOUT",
            "QUOTA_FULL",
          ],
        },
      },
      {
        $set: {
          status: "SCREENOUT",
        },
      },
      {
        new: true,
      }
    ).populate("survey");

    /*
    =====================================================
    2. INVALID / ALREADY FINALIZED RESPONSE
    =====================================================
    */

    if (!response) {
      const existingResponse =
        await SurveyResponse.findOne({
          rid: uid,
          expectedDqTk: tk,
        }).populate("survey");

      if (!existingResponse) {
        return res.status(404).send("Invalid response");
      }

      /*
      Already finalized.
      Do NOT change it again.
      */

      if (
        [
          "COMPLETED",
          "SCREENOUT",
          "QUOTA_FULL",
        ].includes(existingResponse.status)
      ) {
        return res.redirect(
          `${existingResponse.survey.returnBaseUrl}/user/dashboard?st=${existingResponse.status}`
        );
      }

      return res.status(409).send(
        "Unable to update response"
      );
    }

    /*
    =====================================================
    3. REDIRECT
    =====================================================
    */

    return res.redirect(
      `${response.survey.returnBaseUrl}/user/dashboard?st=scr`
    );

  } catch (error) {
    console.error(
      "SCREENOUT ERROR:",
      error
    );

    return res.status(500).send(
      "Internal Server Error"
    );
  }
});


// router.get("/quota", async (req, res) => {
//  //const { uid } = req.query;
// // const uid = Object.values(req.query)[0];
// const uid =
//   req.query.rid ||
//   req.query.RID ||
//   Object.values(req.query)[0];

//   const tk = req.query.tk || "";

//   // const response = await SurveyResponse.findById(uid).populate("survey");
//   const response = await SurveyResponse.findOne({
//   rid: uid,
//   expectedQuotaTk: tk,
// }).populate("survey");

//   if (!response) return res.send("Invalid response");

//   response.status = "QUOTA_FULL";
//   await response.save();

//   const surveySlug = response.survey.title
//     .toLowerCase()
//     .replace(/\s+/g, "-");

//   res.redirect(
//     `${process.env.FRONTEND_URL}/${surveySlug}?resid=${response._id}&st=quo`
//   );
// });

router.get("/quota", async (req, res) => {
  try {
    const uid =
      req.query.rid ||
      req.query.RID ||
      Object.values(req.query)[0];

    const tk = req.query.tk || "";

    if (!uid || !tk) {
      return res.status(400).send("Missing response credentials");
    }

    /*
    =====================================================
    1. ATOMICALLY CHANGE RESPONSE TO QUOTA_FULL
    =====================================================
    */

    const response = await SurveyResponse.findOneAndUpdate(
      {
        rid: uid,
        expectedQuotaTk: tk,

        // Do not modify an already finalized response
        status: {
          $nin: [
            "COMPLETED",
            "SCREENOUT",
            "QUOTA_FULL",
          ],
        },
      },
      {
        $set: {
          status: "QUOTA_FULL",
        },
      },
      {
        new: true,
      }
    ).populate("survey");

    /*
    =====================================================
    2. INVALID / ALREADY FINALIZED RESPONSE
    =====================================================
    */

    if (!response) {
      const existingResponse =
        await SurveyResponse.findOne({
          rid: uid,
          expectedQuotaTk: tk,
        }).populate("survey");

      if (!existingResponse) {
        return res.status(404).send("Invalid response");
      }

      /*
      Already finalized.
      Do not change the status again.
      */

      if (
        [
          "COMPLETED",
          "SCREENOUT",
          "QUOTA_FULL",
        ].includes(existingResponse.status)
      ) {
        return res.redirect(
          `${existingResponse.survey.returnBaseUrl}/user/dashboard?st=${existingResponse.status}`
        );
      }

      return res.status(409).send(
        "Unable to update response"
      );
    }

    /*
    =====================================================
    3. REDIRECT
    =====================================================
    */

    return res.redirect(
      `${response.survey.returnBaseUrl}/user/dashboard?st=quo`
    );

  } catch (error) {
    console.error(
      "QUOTA ERROR:",
      error
    );

    return res.status(500).send(
      "Internal Server Error"
    );
  }
});



export default router;
