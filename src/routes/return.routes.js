import mongoose from "mongoose";
import express from "express";
import SurveyResponse from "../models/SurveyResponse.model.js";
import Survey from "../models/Survey.model.js";
import Wallet from "../models/Wallet.model.js";
import WalletTransaction from "../models/WalletTransaction.model.js";
import User from "../models/User.model.js";
const router = express.Router();

router.get("/complete", async (req, res) => {
  console.log("RETURN QUERY:", req.query);
  try {
   //const { uid } = req.query;
   const uid = req.query.uid || req.query.id || req.query.pid|| req.query.PID || Object.values(req.query)[0];

  //  const uid =
  // req.query.uid ||
  // req.query.id ||
  // req.query.pid ||
  // req.query.PID ||
  // Object.values(req.query).find(v =>
  //   mongoose.Types.ObjectId.isValid(v)
  // );
if (!uid) return res.send("Missing response id");
    const response = await SurveyResponse.findById(uid).populate("survey");
    // 1. Get the ID from the query (handle different possible param names)
        if (!response) return res.status(404).send("Invalid response");
   if (response.status === "COMPLETED") {
        // Redirect immediately if already done to prevent double-paying
        return res.redirect(`${response.survey.returnBaseUrl}/user/dashboard?st=com`);
    }

    // FIX: Explicitly convert to ObjectId
    const userId = response.user;
    const points = response.survey?.points || 0;

    // 2. Atomic Wallet Update
    await Wallet.findOneAndUpdate(
      { user: userId },
      { $inc: { balance: points, totalEarned: points } },
      { upsert: true, new: true }
    );

    // 3. Update Response Status
    response.status = "COMPLETED";
    response.completedAt = new Date();
   if (response.startedAt) {
        response.durationSeconds = (response.completedAt - response.startedAt) / 1000;
    }
    const started = response.startedAt || new Date();
response.durationSeconds =
  Math.max(
    Math.floor((response.completedAt - started) / 1000),
    10
  );
    await response.save();

    // 4. Create Transaction Record
    await WalletTransaction.create({
      user: userId,
      type: "EARN",
      points,
      description: `Completed: ${response.survey.title}`,
      survey: response.survey._id,
    });

    // 5. Update Survey Stats
    await Survey.updateOne(
      { _id: response.survey._id },
      { $inc: { responsesCount: 1 } }
    );
console.log("SURVEY COMPLETED BY USER:", userId.toString());
await User.updateOne(
  { _id: response.user },
  { $set: { hasCompletedSurvey: true } }
);

    // 6. Redirect to Frontend
    const surveySlug = response.survey.title.toLowerCase().replace(/\s+/g, "-");
  // const redirectUrl =
  //   `${process.env.FRONTEND_URL}/${surveySlug}` +
  //   `?resid=${response._id}&st=com`;
const redirectUrl = `${response.survey.returnBaseUrl}/user/dashboard?st=com`;
  res.redirect(redirectUrl);
  }
  catch (err) {
    console.error("WALLET UPDATE ERROR:", err);
    res.status(500).send("Internal Server Error");
  }
});


router.get("/screenout", async (req, res) => {
  //const { uid } = req.query;
const uid = Object.values(req.query)[0];

  const response = await SurveyResponse.findById(uid).populate("survey");
  if (!response) return res.send("Invalid response");

  response.status = "SCREENOUT";
  await response.save();

  const surveySlug = response.survey.title
    .toLowerCase()
    .replace(/\s+/g, "-");

  res.redirect(
    `${process.env.FRONTEND_URL}/${surveySlug}?resid=${response._id}&st=scr`
  );
});



router.get("/quota", async (req, res) => {
 //const { uid } = req.query;
const uid = Object.values(req.query)[0];

  const response = await SurveyResponse.findById(uid).populate("survey");
  if (!response) return res.send("Invalid response");

  response.status = "QUOTA_FULL";
  await response.save();

  const surveySlug = response.survey.title
    .toLowerCase()
    .replace(/\s+/g, "-");

  res.redirect(
    `${process.env.FRONTEND_URL}/${surveySlug}?resid=${response._id}&st=quo`
  );
});



export default router;



// import mongoose from "mongoose";
// import express from "express";
// import SurveyResponse from "../models/SurveyResponse.model.js";
// import Survey from "../models/Survey.model.js";
// import Wallet from "../models/Wallet.model.js";
// import WalletTransaction from "../models/WalletTransaction.model.js";
// import User from "../models/User.model.js";
// import RouterSession from "../models/RouterSession.model.js";

// const router = express.Router();

// router.get("/complete", async (req, res) => {
//   console.log("RETURN QUERY:", req.query);
//   try {
//    //const { uid } = req.query;
//    const token = req.query.uid || req.query.id || req.query.pid|| req.query.PID || Object.values(req.query)[0];

//   //  const uid =
//   // req.query.uid ||
//   // req.query.id ||
//   // req.query.pid ||
//   // req.query.PID ||
//   // Object.values(req.query).find(v =>
//   //   mongoose.Types.ObjectId.isValid(v)
//   // );
// if (!uid) return res.send("Missing response id");
// const session = await RouterSession.findOne({ token });

//     if (!session) {
//       return res.status(404).send("Invalid token");
//     }

//     const response = await SurveyResponse.findById(session.response).populate("survey");
//        if (!response) return res.status(404).send("Invalid response");
//        if (response.status === "COMPLETED") {
//         return res.redirect(`${response.survey.returnBaseUrl}/user/dashboard?st=com`);
//     }

   
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
// const uid = Object.values(req.query)[0];

// const session = await RouterSession.findOne({ token: uid });
// const response = await SurveyResponse.findById(session.response).populate("survey");

//   //const response = await SurveyResponse.findById(uid).populate("survey");
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
// const uid = Object.values(req.query)[0];
// const session = await RouterSession.findOne({ token: uid });
// const response = await SurveyResponse.findById(session.response).populate("survey");

//   //const response = await SurveyResponse.findById(uid).populate("survey");
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
