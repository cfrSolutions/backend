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

   if (response.status === "COMPLETED") {
  return res.json({
    success: true,
    message: "Already completed",
  });
}

const survey = await Survey.findById(response.survey);

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
    hasCompletedSurvey: true,
  }
);

return res.json({
  success: true,
  message: "Survey completed successfully",
});

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;