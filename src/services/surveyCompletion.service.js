import SurveyResponse from "../models/SurveyResponse.model.js";
import Survey from "../models/Survey.model.js";
import Wallet from "../models/Wallet.model.js";
import WalletTransaction from "../models/WalletTransaction.model.js";
import User from "../models/User.model.js";
import crypto from "crypto";


// =====================================================
// SAFE TOKEN COMPARISON
// =====================================================

export function safeTokenMatch(
  provided,
  expected
) {
  if (!provided || !expected) {
    return false;
  }

  const providedBuffer =
    Buffer.from(String(provided), "utf8");

  const expectedBuffer =
    Buffer.from(String(expected), "utf8");

  if (
    providedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    providedBuffer,
    expectedBuffer
  );
}


// =====================================================
// PROCESS SURVEY STATUS
// =====================================================

export async function processSurveyStatus({
  rid,
  status,
}) {

  // =========================================
  // FIND RESPONSE
  // =========================================

  const response =
    await SurveyResponse.findOne({ rid })
      .select(
        "+expectedCompleteTk " +
        "+expectedDqTk " +
        "+expectedQuotaTk " +
        "+postbackToken"
      );

  if (!response) {
    return {
      success: false,
      code: 404,
      message: "RID not found",
    };
  }

  // =========================================
  // FIND SURVEY
  // =========================================

  const survey =
    await Survey.findById(
      response.survey
    );

  if (!survey) {
    return {
      success: false,
      code: 404,
      message: "Survey not found",
    };
  }

  // =========================================
  // NORMALIZE STATUS
  // =========================================

  const normalizedStatus =
    String(status || "")
      .toUpperCase();

  if (
    ![
      "COMPLETED",
      "SCREENOUT",
      "QUOTA_FULL",
    ].includes(normalizedStatus)
  ) {
    return {
      success: false,
      code: 400,
      message: "Invalid status",
    };
  }

  // =========================================
  // ALREADY PROCESSED
  // =========================================

  if (
    response.status !== "STARTED"
  ) {

    if (
      response.status ===
      normalizedStatus
    ) {
      return {
        success: true,
        alreadyProcessed: true,
        message:
          "Already processed",
      };
    }

    return {
      success: false,
      code: 409,
      message:
        `Response already has status ${response.status}`,
    };
  }

  // =========================================
  // ATOMIC STATUS LOCK
  //
  // This prevents:
  //
  // request A -> COMPLETED
  // request B -> COMPLETED
  //
  // from both paying the user.
  // =========================================

  const lockedResponse =
    await SurveyResponse.findOneAndUpdate(
      {
        _id: response._id,
        status: "STARTED",
      },
      {
        $set: {
          status: normalizedStatus,
        },
      },
      {
        new: true,
      }
    );

  if (!lockedResponse) {
    return {
      success: false,
      code: 409,
      message:
        "Response has already been processed",
    };
  }

  // =========================================
  // SCREENOUT
  // =========================================

  if (
    normalizedStatus ===
    "SCREENOUT"
  ) {

    lockedResponse.completedAt =
      new Date();

    await lockedResponse.save();

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

    return {
      success: true,
      status: "SCREENOUT",
    };
  }

  // =========================================
  // QUOTA FULL
  // =========================================

  if (
    normalizedStatus ===
    "QUOTA_FULL"
  ) {

    lockedResponse.completedAt =
      new Date();

    await lockedResponse.save();

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

    return {
      success: true,
      status: "QUOTA_FULL",
    };
  }

  // =========================================
  // COMPLETED
  // =========================================

  const completedAt =
    new Date();

  let durationSeconds = 10;

  if (lockedResponse.startedAt) {
    durationSeconds =
      Math.max(
        Math.floor(
          (
            completedAt -
            lockedResponse.startedAt
          ) / 1000
        ),
        10
      );
  }

  lockedResponse.completedAt =
    completedAt;

  lockedResponse.durationSeconds =
    durationSeconds;

  await lockedResponse.save();

  // =========================================
  // POINTS
  // =========================================

  const points =
    Number(survey.points) || 0;

  // =========================================
  // WALLET
  // =========================================

  await Wallet.findOneAndUpdate(
    {
      user: lockedResponse.user,
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

  // =========================================
  // WALLET TRANSACTION
  // =========================================

  await WalletTransaction.create({
    user: lockedResponse.user,

    type: "EARN",

    points,

    description:
      `Completed: ${survey.title}`,

    survey: survey._id,
  });

  // =========================================
  // SURVEY COUNT
  // =========================================

  const surveyUpdate =
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
    "SURVEY COUNT UPDATED:",
    surveyUpdate
  );

  // =========================================
  // USER
  // =========================================

  await User.updateOne(
    {
      _id: lockedResponse.user,
    },
    {
      $set: {
        hasCompletedSurvey: true,
      },
    }
  );

  console.log(
    "COMPLETION PROCESS FINISHED:",
    rid
  );

  return {
    success: true,
    status: "COMPLETED",
  };
}