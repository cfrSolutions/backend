// import Survey from "../models/Survey.model.js";

// /* ======================
//    CREATE SURVEY
// ====================== */
// export const createSurvey = async (req, res) => {
//   try {
//     const { title, points, difficulty } = req.body;

//     if (!title) {
//       return res.status(400).json({ message: "Title required" });
//     }

//     const survey = await Survey.create({
//       title,
//       points,
//       difficulty,
//       createdBy: req.user._id,
//     });

//     res.status(201).json(survey);
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// /* ======================
//    GET ALL SURVEYS (ADMIN)
// ====================== */
// export const getAllSurveys = async (req, res) => {
//   const surveys = await Survey.find().sort({ createdAt: -1 });
//   res.json(surveys);
// };
import mongoose from "mongoose";
import Survey from "../models/Survey.model.js";
import SurveyResponse from "../models/SurveyResponse.model.js";
import Notification from "../models/Notification.model.js";
import User from "../models/User.model.js";

/* CREATE SURVEY */
export const createSurvey = async (req, res) => {
  try {
    const {
      title,
      description,
      points,
      difficulty,
      category,
      countries,
      status,
      timeLimit,
    } = req.body;

    const survey = await Survey.create({
      title: req.body.title,
      description: req.body.description,
      points: req.body.points || 0,
      difficulty: req.body.difficulty,
      category: req.body.category || "GENERAL",
      countries: req.body.countries || ["ALL"],
      status: req.body.status || "DRAFT",
      timeLimit: timeLimit || 10,
      surveyType: req.body.surveyType,
      companySurveyUrl: req.body.companySurveyUrl || null,
      trackingParam: req.body.trackingParam || null,

      // ✅ AUTO SET BASE URL
      returnBaseUrl: process.env.FRONTEND_URL || "http://localhost:5173",
      createdBy: req.user._id || req.user.userId || req.user.id,
    });

    const users = await User.find({ role: "USER" });

    for (const user of users) {
      await Notification.create({
        user: user._id,
        title: "New Survey Available",
        message: `A new survey "${survey.title}" is available for you.`,
        type: "SURVEY",
        link: `/user/dashboard/surveys`,
      });
    }

    res.status(201).json(survey);
  } catch (err) {
    res.status(500).json({ message: "Survey creation failed" });
  }
};
// export const createSurvey = async (req, res) => {
//   try {
//     const survey = await Survey.create({
//       title: req.body.title,
//       description: req.body.description,
//       points: req.body.points,
//       timeLimit: req.body.timeLimit,
//       difficulty: req.body.difficulty,
//       category: req.body.category,
//       countries: req.body.countries,
//       status: req.body.status,

//       // 🔥 MUST SAVE THESE
//       surveyType: req.body.surveyType,
//       companySurveyUrl: req.body.companySurveyUrl || null,
//       trackingParam: req.body.trackingParam || null,

//       createdBy: req.user._id,
//     });

//     res.json(survey);
//   } catch (err) {
//     console.error("CREATE SURVEY ERROR:", err);
//     res.status(400).json({ message: err.message });
//   }
// };
/* GET ALL SURVEYS (Admin) */
export const getSurveys = async (req, res) => {
  try {
    const surveys = await Survey.find().sort({ createdAt: -1 });
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch surveys" });
  }
};

/* GET SINGLE SURVEY */
export const getSurveyById = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }
    res.json(survey);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch survey" });
  }
};


export const surveyStats = async (req, res) => {
  try {
    const { surveyId } = req.params;

    const totalStarts = await SurveyResponse.countDocuments({ survey: surveyId });

    const completes = await SurveyResponse.countDocuments({
      survey: surveyId,
      status: "COMPLETED",
    });

    const screenouts = await SurveyResponse.countDocuments({
      survey: surveyId,
      status: "SCREENOUT",
    });

    const quotaFull = await SurveyResponse.countDocuments({
      survey: surveyId,
      status: "QUOTA_FULL",
    });

    const attachment = await SurveyResponse.aggregate([
      {
        $match: {
          survey: new mongoose.Types.ObjectId(surveyId),
          status: "COMPLETED",
        },
      },
      { $group: { _id: null, avg: { $avg: "$durationSeconds" } } },
    ]);

    const loi = attachment[0]?.avg
    
      ? (attachment[0].avg / 60).toFixed(1)
      : 0;

    const ir =
      totalStarts === 0 ? 0 : ((completes / totalStarts) * 100).toFixed(2);

    res.json({
      totalStarts,
      completes,
      screenouts,
      quota: quotaFull,
      ir,
      loi,
    });
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: "Failed to load survey stats" });
  }
};


export const adminOverviewStats = async (req, res) => {
  try {

    // ================= BASIC STATS =================

    const totalStarted = await SurveyResponse.countDocuments();

    const completed = await SurveyResponse.countDocuments({
      status: "COMPLETED",
    });

    const screenout = await SurveyResponse.countDocuments({
      status: "SCREENOUT",
    });

    const quota = await SurveyResponse.countDocuments({
      status: "QUOTA_FULL",
    });

    const cancelled = await SurveyResponse.countDocuments({
      status: "CANCELLED",
    });

    const cleaned = await SurveyResponse.countDocuments({
      status: "CLEANED",
    });

    const avgDurationAgg = await SurveyResponse.aggregate([
      { $match: { status: "COMPLETED" } },
      {
        $group: {
          _id: null,
          avg: { $avg: "$durationSeconds" }
        }
      }
    ]);

    const avgDurationSeconds = avgDurationAgg[0]?.avg || 0;

    const incidenceRate =
      totalStarted === 0
        ? 0
        : ((completed / totalStarted) * 100).toFixed(2);


    // ================= 👇 PUT DEMOGRAPHICS HERE =================

    const demoAgg = await SurveyResponse.aggregate([
      { $match: { status: "COMPLETED" } },

      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userData"
        }
      },
      { $unwind: "$userData" },

      {
        $lookup: {
          from: "userprofiles",
          localField: "userData._id",
          foreignField: "user",
          as: "profileData"
        }
      },
      { $unwind: { path: "$profileData", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          gender: "$profileData.gender",
          birthYear: { $year: "$profileData.dob" }
        }
      }
    ]);

    const gender = {};
    const ageGroups = {};

    const currentYear = new Date().getFullYear();

    demoAgg.forEach(item => {

      const g = item.gender || "Unknown";
      gender[g] = (gender[g] || 0) + 1;

      let group = "Unknown";

      if (item.birthYear) {
        const age = currentYear - item.birthYear;

        if (age <= 18) group = "Under 18";
        else if (age <= 24) group = "18-24";
        else if (age <= 34) group = "25-34";
        else if (age <= 44) group = "35-44";
        else if (age <= 54) group = "45-54";
        else if (age <= 64) group = "55-64";
        else group = "65+";
      }

      ageGroups[group] = (ageGroups[group] || 0) + 1;
    });


    // ================= RETURN =================

    res.json({
      totalStarted,
      completed,
      screenout,
      quota,
      cancelled,
      cleaned,
      incidenceRate,
      avgDurationSeconds,
      gender,
      ageGroups
    });

  } catch (err) {
    console.error("ADMIN OVERVIEW ERROR:", err);
    res.status(500).json({ message: "Failed to load admin overview" });
  }
};


export const adminDashboardSummary = async (req, res) => {
  try {
    const totalSurveys = await Survey.countDocuments();

    const activeSurveys = await Survey.countDocuments({
      status: "ACTIVE"
    });

    const totalResponses = await SurveyResponse.countDocuments();

    const flagged = await SurveyResponse.countDocuments({
      status: "FLAGGED"
    });

    // Last 7 days responses
    const last7Days = await SurveyResponse.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Survey completion vs drop
    const completion = await SurveyResponse.aggregate([
      {
        $lookup: {
          from: "surveys",
          localField: "survey",
          foreignField: "_id",
          as: "surveyData"
        }
      },
      { $unwind: "$surveyData" },
      {
        $group: {
          _id: "$surveyData.title",
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0]
            }
          },
          dropped: {
            $sum: {
              $cond: [{ $ne: ["$status", "COMPLETED"] }, 1, 0]
            }
          }
        }
      },
     
    ]);

    res.json({
      totalSurveys,
      activeSurveys,
      totalResponses,
      flagged,
      last7Days,
      completion
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Dashboard load failed" });
  }
};
// import Survey from "../models/Survey.model.js";
// import SurveyResponse from "../models/SurveyResponse.model.js";
// export const createSurvey = async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       points,
//       difficulty,
//       category,
//       countries,
//       timeLimit,
//       companySurveyUrl,
//       completesTarget,
//     } = req.body;

//     const survey = await Survey.create({
//       title,
//       description,
//       points,
//       difficulty,
//       category,
//       countries,
//       timeLimit,
//       companySurveyUrl,
//       completesTarget,
//       surveyType: "EXTERNAL",
//       createdBy: req.user._id || req.user.id,
//     });

//     res.status(201).json(survey);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Survey creation failed" });
//   }
// };


// export const surveyStats = async (req, res) => {
//   try {
//     const { surveyId } = req.params;

//     const totalStarts = await SurveyResponse.countDocuments({
//       survey: surveyId,
//     });

//     const completes = await SurveyResponse.countDocuments({
//       survey: surveyId,
//       status: "COMPLETED",
//     });

//     const screenouts = await SurveyResponse.countDocuments({
//       survey: surveyId,
//       status: "DISQUALIFIED",
//     });

//     const quotaFull = await SurveyResponse.countDocuments({
//       survey: surveyId,
//       status: "QUOTA_FULL",
//     });

//     // Incidence Rate (IR)
//     const ir =
//       totalStarts === 0 ? 0 : ((completes / totalStarts) * 100).toFixed(2);

//     const attachment = await SurveyResponse.aggregate([
//     { $match: { survey: new mongoose.Types.ObjectId(surveyId), status: "COMPLETED" } },
//     { $group: { _id: null, avg: { $avg: "$durationSeconds" } } },
//   ]);

//   const loi = attachment[0]?.avg
//     ? (attachment[0].avg / 60).toFixed(1)
//     : 0;

//   res.json({
//     totalStarts,
//     completes,
//     screenouts,
//     quota,
//     ir,
//     loi,
//   });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to load survey stats" });
//   }
// };
