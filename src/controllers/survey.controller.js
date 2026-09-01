
// import mongoose from "mongoose";
// import Survey from "../models/Survey.model.js";
// import SurveyResponse from "../models/SurveyResponse.model.js";
// import Notification from "../models/Notification.model.js";
// import User from "../models/User.model.js";

// /* CREATE SURVEY */
// export const createSurvey = async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       points,
//       difficulty,
//       category,
//       countries,
//       status,
//       timeLimit,
//     } = req.body;

//     const survey = await Survey.create({
//       title: req.body.title,
//       description: req.body.description,
//       points: req.body.points || 0,
//       difficulty: req.body.difficulty,
//       category: req.body.category || "GENERAL",
//       countries: req.body.countries || ["ALL"],
//       status: req.body.status || "DRAFT",
//       timeLimit: timeLimit || 10,
//       surveyType: req.body.surveyType,
//       targetGroups: req.body.targetGroups || [],
//       companySurveyUrl: req.body.companySurveyUrl || null,
//       vendorCompleteUrl: req.body.vendorCompleteUrl || null,
//       vendorDisqualifyUrl: req.body.vendorDisqualifyUrl || null,
//       vendorQuotaUrl: req.body.vendorQuotaUrl || null,
//       trackingParam: req.body.trackingParam || null,

//       // ✅ AUTO SET BASE URL
//       returnBaseUrl: process.env.FRONTEND_URL || "https://inputify.io",
//       createdBy: req.user._id || req.user.userId || req.user.id,
//     });

//     const users = await User.find({ role: "USER" });

//     for (const user of users) {
//       await Notification.create({
//         user: user._id,
//         title: "New Survey Available",
//         message: `A new survey "${survey.title}" is available for you.`,
//         type: "SURVEY",
//         link: `/user/dashboard/surveys`,
//       });
//     }

//     res.status(201).json(survey);
//   } catch (err) {
//     res.status(500).json({ message: "Survey creation failed" });
//   }
// };
// // export const createSurvey = async (req, res) => {
// //   try {
// //     const survey = await Survey.create({
// //       title: req.body.title,
// //       description: req.body.description,
// //       points: req.body.points,
// //       timeLimit: req.body.timeLimit,
// //       difficulty: req.body.difficulty,
// //       category: req.body.category,
// //       countries: req.body.countries,
// //       status: req.body.status,

// //       // 🔥 MUST SAVE THESE
// //       surveyType: req.body.surveyType,
// //       companySurveyUrl: req.body.companySurveyUrl || null,
// //       trackingParam: req.body.trackingParam || null,

// //       createdBy: req.user._id,
// //     });

// //     res.json(survey);
// //   } catch (err) {
// //     console.error("CREATE SURVEY ERROR:", err);
// //     res.status(400).json({ message: err.message });
// //   }
// // };
// /* GET ALL SURVEYS (Admin) */
// export const getSurveys = async (req, res) => {
//   try {
//     const surveys = await Survey.find().sort({ createdAt: -1 });
//     res.json(surveys);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch surveys" });
//   }
// };

// /* GET SINGLE SURVEY */
// export const getSurveyById = async (req, res) => {
//   try {
//     const survey = await Survey.findById(req.params.id);
//     if (!survey) {
//       return res.status(404).json({ message: "Survey not found" });
//     }
//     res.json(survey);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch survey" });
//   }
// };


// export const surveyStats = async (req, res) => {
//   try {
//     const { surveyId } = req.params;

//     const totalStarts = await SurveyResponse.countDocuments({ survey: surveyId });

//     const completes = await SurveyResponse.countDocuments({
//       survey: surveyId,
//       status: "COMPLETED",
//     });

//     const screenouts = await SurveyResponse.countDocuments({
//       survey: surveyId,
//       status: "SCREENOUT",
//     });

//     const quotaFull = await SurveyResponse.countDocuments({
//       survey: surveyId,
//       status: "QUOTA_FULL",
//     });

//     const attachment = await SurveyResponse.aggregate([
//       {
//         $match: {
//           survey: new mongoose.Types.ObjectId(surveyId),
//           status: "COMPLETED",
//         },
//       },
//       { $group: { _id: null, avg: { $avg: "$durationSeconds" } } },
//     ]);

//     const loi = attachment[0]?.avg
    
//       ? (attachment[0].avg / 60).toFixed(1)
//       : 0;

//     const ir =
//       totalStarts === 0 ? 0 : ((completes / totalStarts) * 100).toFixed(2);

//     res.json({
//       totalStarts,
//       completes,
//       screenouts,
//       quota: quotaFull,
//       ir,
//       loi,
//     });
//   } catch (err) {
//     // console.error("STATS ERROR:", err);
//     res.status(500).json({ message: "Failed to load survey stats" });
//   }
// };


// export const adminOverviewStats = async (req, res) => {
//   try {

//     // ================= BASIC STATS =================

//     const totalStarted = await SurveyResponse.countDocuments();

//     const completed = await SurveyResponse.countDocuments({
//       status: "COMPLETED",
//     });

//     const screenout = await SurveyResponse.countDocuments({
//       status: "SCREENOUT",
//     });

//     const quota = await SurveyResponse.countDocuments({
//       status: "QUOTA_FULL",
//     });

//     const cancelled = await SurveyResponse.countDocuments({
//       status: "CANCELLED",
//     });

//     const cleaned = await SurveyResponse.countDocuments({
//       status: "CLEANED",
//     });

//     const avgDurationAgg = await SurveyResponse.aggregate([
//       { $match: { status: "COMPLETED" } },
//       {
//         $group: {
//           _id: null,
//           avg: { $avg: "$durationSeconds" }
//         }
//       }
//     ]);

//     const avgDurationSeconds = avgDurationAgg[0]?.avg || 0;

//     const incidenceRate =
//       totalStarted === 0
//         ? 0
//         : ((completed / totalStarted) * 100).toFixed(2);


//     // ================= 👇 PUT DEMOGRAPHICS HERE =================

//     const demoAgg = await SurveyResponse.aggregate([
//       { $match: { status: "COMPLETED" } },

//       {
//         $lookup: {
//           from: "users",
//           localField: "user",
//           foreignField: "_id",
//           as: "userData"
//         }
//       },
//       { $unwind: "$userData" },

//       {
//         $lookup: {
//           from: "userprofiles",
//           localField: "userData._id",
//           foreignField: "user",
//           as: "profileData"
//         }
//       },
//       { $unwind: { path: "$profileData", preserveNullAndEmptyArrays: true } },

//       {
//         $project: {
//           gender: "$profileData.gender",
//           birthYear: { $year: "$profileData.dob" }
//         }
//       }
//     ]);

//     const gender = {};
//     const ageGroups = {};

//     const currentYear = new Date().getFullYear();

//     demoAgg.forEach(item => {

//       const g = item.gender || "Unknown";
//       gender[g] = (gender[g] || 0) + 1;

//       let group = "Unknown";

//       if (item.birthYear) {
//         const age = currentYear - item.birthYear;

//         if (age <= 18) group = "Under 18";
//         else if (age <= 24) group = "18-24";
//         else if (age <= 34) group = "25-34";
//         else if (age <= 44) group = "35-44";
//         else if (age <= 54) group = "45-54";
//         else if (age <= 64) group = "55-64";
//         else group = "65+";
//       }

//       ageGroups[group] = (ageGroups[group] || 0) + 1;
//     });


//     // ================= RETURN =================

//     res.json({
//       totalStarted,
//       completed,
//       screenout,
//       quota,
//       cancelled,
//       cleaned,
//       incidenceRate,
//       avgDurationSeconds,
//       gender,
//       ageGroups
//     });

//   } catch (err) {
    
//     res.status(500).json({ message: "Failed to load admin overview" });
//   }
// };


// export const adminDashboardSummary = async (req, res) => {
//   try {
//     const totalSurveys = await Survey.countDocuments();

//     const activeSurveys = await Survey.countDocuments({
//       status: "ACTIVE"
//     });

//     const totalResponses = await SurveyResponse.countDocuments();

//     const flagged = await SurveyResponse.countDocuments({
//       status: "FLAGGED"
//     });

//     // Last 7 days responses
//     const last7Days = await SurveyResponse.aggregate([
//       {
//         $match: {
//           createdAt: {
//             $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
//           }
//         }
//       },
//       {
//         $group: {
//           _id: { $dayOfWeek: "$createdAt" },
//           count: { $sum: 1 }
//         }
//       }
//     ]);

//     // Survey completion vs drop
//     const completion = await SurveyResponse.aggregate([
//       {
//         $lookup: {
//           from: "surveys",
//           localField: "survey",
//           foreignField: "_id",
//           as: "surveyData"
//         }
//       },
//       { $unwind: "$surveyData" },
//       {
//         $group: {
//           _id: "$surveyData.title",
//           completed: {
//             $sum: {
//               $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0]
//             }
//           },
//           dropped: {
//             $sum: {
//               $cond: [{ $ne: ["$status", "COMPLETED"] }, 1, 0]
//             }
//           }
//         }
//       },
     
//     ]);

//     res.json({
//       totalSurveys,
//       activeSurveys,
//       totalResponses,
//       flagged,
//       last7Days,
//       completion
//     });

//   } catch (err) {
   
//     res.status(500).json({ message: "Dashboard load failed" });
//   }
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
      targetGroups: req.body.targetGroups || [],
      companySurveyUrl: req.body.companySurveyUrl || null,
      vendorCompleteUrl: req.body.vendorCompleteUrl || null,
      vendorDisqualifyUrl: req.body.vendorDisqualifyUrl || null,
      vendorQuotaUrl: req.body.vendorQuotaUrl || null,
      trackingParam: req.body.trackingParam || null,

      // ✅ AUTO SET BASE URL
      returnBaseUrl: process.env.FRONTEND_URL || "https://inputify.io",
      createdBy: req.user.userId,
    });

    const users = await User.find({ role: "USER" });
//     console.log("========== CREATE SURVEY ==========");
// console.log("CREATED BY:", req.user.userId);
// console.log("ROLE:", req.user.role);
// console.log("===================================");

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
// export const getSurveys = async (req, res) => {
//   try {
//     const surveys = await Survey.find().sort({ createdAt: -1 });
//     res.json(surveys);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch surveys" });
//   }
// };
export const getSurveys = async (req, res) => {
  try {
    // Your authMiddleware ALWAYS gives us userId
    const userId = req.user?.userId;
    const role = String(req.user?.role || "").toUpperCase();

    // console.log("\n=================================");
    // console.log("GET SURVEYS");
    // console.log("AUTH USER ID:", userId);
    // console.log("AUTH ROLE:", role);

    if (!userId) {
      return res.status(401).json({
        message: "User ID not found",
      });
    }

    let surveys;

    if (role === "SUPERADMIN") {
      // SUPERADMIN can see everything
      surveys = await Survey.find({})
        .sort({ createdAt: -1 });
    } 
    
    else if (role === "ADMIN") {
      // ADMIN can ONLY see surveys created by this admin
      surveys = await Survey.find({
        createdBy: userId,
      }).sort({ createdAt: -1 });
    } 
    
    else {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    // console.log(
    //   "RETURNED SURVEYS:",
    //   surveys.map((survey) => ({
    //     title: survey.title,
    //     id: survey._id.toString(),
    //     createdBy: survey.createdBy?.toString(),
    //   }))
    // );

    // console.log("=================================\n");

    return res.status(200).json(surveys);

  } catch (err) {
    console.error("GET SURVEYS ERROR:", err);

    return res.status(500).json({
      message: "Failed to fetch surveys",
    });
  }
};

/* GET SINGLE SURVEY */
// export const getSurveyById = async (req, res) => {
//   try {
//     const survey = await Survey.findById(req.params.id);
//     if (!survey) {
//       return res.status(404).json({ message: "Survey not found" });
//     }
//     res.json(survey);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch survey" });
//   }
// };

export const getSurveyById = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({
        message: "Survey not found",
      });
    }

    // ADMIN can only access surveys created by themselves
    if (
  req.user.role === "ADMIN" &&
  survey.createdBy.toString() !== String(req.user.userId)
) {
  return res.status(403).json({
    message: "You are not authorized to access this survey",
  });
}

    res.json(survey);
  } catch (err) {
    console.error("GET SURVEY BY ID ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch survey",
    });
  }
};

// export const surveyStats = async (req, res) => {
//   try {
//     const { surveyId } = req.params;

//     const totalStarts = await SurveyResponse.countDocuments({ survey: surveyId });

//     const completes = await SurveyResponse.countDocuments({
//       survey: surveyId,
//       status: "COMPLETED",
//     });

//     const screenouts = await SurveyResponse.countDocuments({
//       survey: surveyId,
//       status: "SCREENOUT",
//     });

//     const quotaFull = await SurveyResponse.countDocuments({
//       survey: surveyId,
//       status: "QUOTA_FULL",
//     });

//     const attachment = await SurveyResponse.aggregate([
//       {
//         $match: {
//           survey: new mongoose.Types.ObjectId(surveyId),
//           status: "COMPLETED",
//         },
//       },
//       { $group: { _id: null, avg: { $avg: "$durationSeconds" } } },
//     ]);

//     const loi = attachment[0]?.avg
    
//       ? (attachment[0].avg / 60).toFixed(1)
//       : 0;

//     const ir =
//       totalStarts === 0 ? 0 : ((completes / totalStarts) * 100).toFixed(2);

//     res.json({
//       totalStarts,
//       completes,
//       screenouts,
//       quota: quotaFull,
//       ir,
//       loi,
//     });
//   } catch (err) {
//     // console.error("STATS ERROR:", err);
//     res.status(500).json({ message: "Failed to load survey stats" });
//   }
// };

export const surveyStats = async (req, res) => {
  try {
    const { surveyId } = req.params;

    const responses = await SurveyResponse.find({
      survey: surveyId,
    });

    const totalStarted = responses.length;

    const completed = responses.filter(
      (r) => r.status === "COMPLETED"
    ).length;

    const pending = responses.filter(
      (r) => r.status === "STARTED"
    ).length;

    const screenout = responses.filter(
      (r) => r.status === "SCREENOUT"
    ).length;

    const quota = responses.filter(
      (r) => r.status === "QUOTA_FULL"
    ).length;

    const cancelled = responses.filter(
      (r) => r.status === "CANCELLED"
    ).length;

    const cleaned = responses.filter(
      (r) => r.status === "CLEANED"
    ).length;

    const completedDurations = responses
      .filter(
        (r) =>
          r.status === "COMPLETED" &&
          typeof r.durationSeconds === "number" &&
          r.durationSeconds > 0
      )
      .map((r) => r.durationSeconds);

    const avgDurationSeconds =
      completedDurations.length > 0
        ? Math.round(
            completedDurations.reduce(
              (sum, duration) => sum + duration,
              0
            ) / completedDurations.length
          )
        : 0;

    const incidenceRate =
      totalStarted > 0
        ? ((completed / totalStarted) * 100).toFixed(1)
        : "0.0";

    return res.status(200).json({
      totalStarted,
      completed,
      pending,
      screenout,
      quota,
      cancelled,
      cleaned,
      incidenceRate,
      avgDurationSeconds,
    });

  } catch (err) {
    console.error("SURVEY STATS ERROR:", err);

    return res.status(500).json({
      message: "Failed to load survey stats",
    });
  }
};

export const getDemographics = async (req, res) => {
  try {
    const { surveyId } = req.params;

    const responses = await SurveyResponse.find({
      survey: surveyId,
      status: "COMPLETED",
    }).populate("user");

    const gender = {};
    const generations = {};

    for (const r of responses) {
      if (!r.user) continue;

      const profile = await UserProfile.findOne({
        user: r.user._id,
      });

      if (!profile) continue;

      // Gender
      if (profile.gender) {
        gender[profile.gender] =
          (gender[profile.gender] || 0) + 1;
      }

      // Age / Generation
      if (profile.dob) {
        const age =
          new Date().getFullYear() -
          new Date(profile.dob).getFullYear();

        let gen =
          age <= 26
            ? "Gen Z"
            : age <= 42
            ? "Millennials"
            : age <= 58
            ? "Gen X"
            : "Boomers";

        generations[gen] =
          (generations[gen] || 0) + 1;
      }
    }

    return res.status(200).json({
      gender,
      generations,
    });

  } catch (err) {
    console.error("DEMOGRAPHICS ERROR:", err);

    return res.status(500).json({
      message: "Demographics error",
    });
  }
};

// export const adminOverviewStats = async (req, res) => {
//   try {

//     // ================= BASIC STATS =================

//     const totalStarted = await SurveyResponse.countDocuments();

//     const completed = await SurveyResponse.countDocuments({
//       status: "COMPLETED",
//     });

//     const screenout = await SurveyResponse.countDocuments({
//       status: "SCREENOUT",
//     });

//     const quota = await SurveyResponse.countDocuments({
//       status: "QUOTA_FULL",
//     });

//     const cancelled = await SurveyResponse.countDocuments({
//       status: "CANCELLED",
//     });

//     const cleaned = await SurveyResponse.countDocuments({
//       status: "CLEANED",
//     });

//     const avgDurationAgg = await SurveyResponse.aggregate([
//       { $match: { status: "COMPLETED" } },
//       {
//         $group: {
//           _id: null,
//           avg: { $avg: "$durationSeconds" }
//         }
//       }
//     ]);

//     const avgDurationSeconds = avgDurationAgg[0]?.avg || 0;

//     const incidenceRate =
//       totalStarted === 0
//         ? 0
//         : ((completed / totalStarted) * 100).toFixed(2);


//     // ================= 👇 PUT DEMOGRAPHICS HERE =================

//     const demoAgg = await SurveyResponse.aggregate([
//       { $match: { status: "COMPLETED" } },

//       {
//         $lookup: {
//           from: "users",
//           localField: "user",
//           foreignField: "_id",
//           as: "userData"
//         }
//       },
//       { $unwind: "$userData" },

//       {
//         $lookup: {
//           from: "userprofiles",
//           localField: "userData._id",
//           foreignField: "user",
//           as: "profileData"
//         }
//       },
//       { $unwind: { path: "$profileData", preserveNullAndEmptyArrays: true } },

//       {
//         $project: {
//           gender: "$profileData.gender",
//           birthYear: { $year: "$profileData.dob" }
//         }
//       }
//     ]);

//     const gender = {};
//     const ageGroups = {};

//     const currentYear = new Date().getFullYear();

//     demoAgg.forEach(item => {

//       const g = item.gender || "Unknown";
//       gender[g] = (gender[g] || 0) + 1;

//       let group = "Unknown";

//       if (item.birthYear) {
//         const age = currentYear - item.birthYear;

//         if (age <= 18) group = "Under 18";
//         else if (age <= 24) group = "18-24";
//         else if (age <= 34) group = "25-34";
//         else if (age <= 44) group = "35-44";
//         else if (age <= 54) group = "45-54";
//         else if (age <= 64) group = "55-64";
//         else group = "65+";
//       }

//       ageGroups[group] = (ageGroups[group] || 0) + 1;
//     });


//     // ================= RETURN =================

//     res.json({
//       totalStarted,
//       completed,
//       screenout,
//       quota,
//       cancelled,
//       cleaned,
//       incidenceRate,
//       avgDurationSeconds,
//       gender,
//       ageGroups
//     });

//   } catch (err) {
    
//     res.status(500).json({ message: "Failed to load admin overview" });
//   }
// };
export const adminOverviewStats = async (req, res) => {
  try {
    const role = String(req.user?.role || "")
      .trim()
      .toUpperCase();

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found",
      });
    }

    // =====================================================
    // DETERMINE WHICH SURVEYS THIS ADMIN CAN SEE
    // =====================================================

    let surveyFilter = {};

    if (role === "SUPERADMIN") {
      // SUPERADMIN → ALL SURVEYS
      surveyFilter = {};
    } else if (role === "ADMIN") {
      // ADMIN → ONLY THEIR OWN SURVEYS
      surveyFilter = {
        createdBy: userId,
      };
    } else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get only surveys this user is allowed to access
    const allowedSurveyIds = await Survey.distinct(
      "_id",
      surveyFilter
    );

    // =====================================================
    // RESPONSE FILTER
    // =====================================================

    const responseFilter = {
      survey: {
        $in: allowedSurveyIds,
      },
    };

    // =====================================================
    // BASIC STATS
    // =====================================================

    const totalStarted =
      await SurveyResponse.countDocuments(responseFilter);

    const completed =
      await SurveyResponse.countDocuments({
        ...responseFilter,
        status: "COMPLETED",
      });

    const screenout =
      await SurveyResponse.countDocuments({
        ...responseFilter,
        status: "SCREENOUT",
      });

    const quota =
      await SurveyResponse.countDocuments({
        ...responseFilter,
        status: "QUOTA_FULL",
      });

    const cancelled =
      await SurveyResponse.countDocuments({
        ...responseFilter,
        status: "CANCELLED",
      });

    const cleaned =
      await SurveyResponse.countDocuments({
        ...responseFilter,
        status: "CLEANED",
      });

    // =====================================================
    // AVERAGE DURATION
    // =====================================================

    const avgDurationAgg =
      await SurveyResponse.aggregate([
        {
          $match: {
            ...responseFilter,
            status: "COMPLETED",
            durationSeconds: {
              $type: "number",
            },
          },
        },
        {
          $group: {
            _id: null,
            avg: {
              $avg: "$durationSeconds",
            },
          },
        },
      ]);

    const avgDurationSeconds =
      avgDurationAgg[0]?.avg || 0;

    // =====================================================
    // INCIDENCE RATE
    // =====================================================

    const incidenceRate =
      totalStarted === 0
        ? 0
        : ((completed / totalStarted) * 100).toFixed(2);

    // =====================================================
    // DEMOGRAPHICS
    // =====================================================

    const demoAgg =
      await SurveyResponse.aggregate([
        {
          $match: {
            ...responseFilter,
            status: "COMPLETED",
          },
        },

        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userData",
          },
        },

        {
          $unwind: "$userData",
        },

        {
          $lookup: {
            from: "userprofiles",
            localField: "userData._id",
            foreignField: "user",
            as: "profileData",
          },
        },

        {
          $unwind: {
            path: "$profileData",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            gender: "$profileData.gender",
            birthYear: {
              $cond: [
                {
                  $ne: ["$profileData.dob", null],
                },
                {
                  $year: "$profileData.dob",
                },
                null,
              ],
            },
          },
        },
      ]);

    // =====================================================
    // BUILD DEMOGRAPHIC COUNTS
    // =====================================================

    const gender = {};
    const ageGroups = {};

    const currentYear =
      new Date().getFullYear();

    demoAgg.forEach((item) => {
      // -------------------------
      // GENDER
      // -------------------------

      const g = item.gender || "Unknown";

      gender[g] =
        (gender[g] || 0) + 1;

      // -------------------------
      // AGE
      // -------------------------

      let group = "Unknown";

      if (item.birthYear) {
        const age =
          currentYear - item.birthYear;

        if (age < 18) {
          group = "Under 18";
        } else if (age <= 24) {
          group = "18-24";
        } else if (age <= 34) {
          group = "25-34";
        } else if (age <= 44) {
          group = "35-44";
        } else if (age <= 54) {
          group = "45-54";
        } else if (age <= 64) {
          group = "55-64";
        } else {
          group = "65+";
        }
      }

      ageGroups[group] =
        (ageGroups[group] || 0) + 1;
    });

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      totalStarted,
      completed,
      screenout,
      quota,
      cancelled,
      cleaned,
      incidenceRate,
      avgDurationSeconds,
      gender,
      ageGroups,
    });

  } catch (err) {
    console.error(
      "ADMIN OVERVIEW STATS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load admin overview",
    });
  }
};

// export const adminDashboardSummary = async (req, res) => {
//   try {
//     const totalSurveys = await Survey.countDocuments();

//     const activeSurveys = await Survey.countDocuments({
//       status: "ACTIVE"
//     });

//     const totalResponses = await SurveyResponse.countDocuments();

//     const flagged = await SurveyResponse.countDocuments({
//       status: "FLAGGED"
//     });

//     // Last 7 days responses
//     const last7Days = await SurveyResponse.aggregate([
//       {
//         $match: {
//           createdAt: {
//             $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
//           }
//         }
//       },
//       {
//         $group: {
//           _id: { $dayOfWeek: "$createdAt" },
//           count: { $sum: 1 }
//         }
//       }
//     ]);

//     // Survey completion vs drop
//     const completion = await SurveyResponse.aggregate([
//       {
//         $lookup: {
//           from: "surveys",
//           localField: "survey",
//           foreignField: "_id",
//           as: "surveyData"
//         }
//       },
//       { $unwind: "$surveyData" },
//       {
//         $group: {
//           _id: "$surveyData.title",
//           completed: {
//             $sum: {
//               $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0]
//             }
//           },
//           dropped: {
//             $sum: {
//               $cond: [{ $ne: ["$status", "COMPLETED"] }, 1, 0]
//             }
//           }
//         }
//       },
     
//     ]);

//     res.json({
//       totalSurveys,
//       activeSurveys,
//       totalResponses,
//       flagged,
//       last7Days,
//       completion
//     });

//   } catch (err) {
   
//     res.status(500).json({ message: "Dashboard load failed" });
//   }
// };


export const adminDashboardSummary = async (req, res) => {
  try {
    const role = String(req.user?.role || "")
      .trim()
      .toUpperCase();

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found",
      });
    }

    // =====================================================
    // DETERMINE WHICH SURVEYS THIS USER CAN SEE
    // =====================================================

    let surveyFilter = {};

    if (role === "SUPERADMIN") {
      // SUPERADMIN → ALL SURVEYS
      surveyFilter = {};
    } else if (role === "ADMIN") {
      // ADMIN → ONLY THEIR OWN SURVEYS
      surveyFilter = {
        createdBy: userId,
      };
    } else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // =====================================================
    // GET ALLOWED SURVEY IDS
    // =====================================================

    const allowedSurveyIds = await Survey.distinct(
      "_id",
      surveyFilter
    );

    // =====================================================
    // BASIC SURVEY STATS
    // =====================================================

    const totalSurveys =
      await Survey.countDocuments(surveyFilter);

    const activeSurveys =
      await Survey.countDocuments({
        ...surveyFilter,
        status: "ACTIVE",
      });

    // =====================================================
    // RESPONSE FILTER
    // =====================================================

    const responseFilter = {
      survey: {
        $in: allowedSurveyIds,
      },
    };

    // =====================================================
    // RESPONSE STATS
    // =====================================================

    const totalResponses =
      await SurveyResponse.countDocuments(
        responseFilter
      );

    const flagged =
      await SurveyResponse.countDocuments({
        ...responseFilter,
        status: "FLAGGED",
      });

    // =====================================================
    // LAST 7 DAYS RESPONSES
    // =====================================================

    const last7Days =
      await SurveyResponse.aggregate([
        {
          $match: {
            ...responseFilter,
            createdAt: {
              $gte: new Date(
                Date.now() -
                  7 * 24 * 60 * 60 * 1000
              ),
            },
          },
        },
        {
          $group: {
            _id: {
              $dayOfWeek: "$createdAt",
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]);

    // =====================================================
    // SURVEY COMPLETION VS DROP
    // =====================================================

    const completion =
      await SurveyResponse.aggregate([
        {
          $match: {
            ...responseFilter,
          },
        },

        {
          $lookup: {
            from: "surveys",
            localField: "survey",
            foreignField: "_id",
            as: "surveyData",
          },
        },

        {
          $unwind: "$surveyData",
        },

        {
          $group: {
            _id: "$surveyData.title",

            completed: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "COMPLETED",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            dropped: {
              $sum: {
                $cond: [
                  {
                    $ne: [
                      "$status",
                      "COMPLETED",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      totalSurveys,
      activeSurveys,
      totalResponses,
      flagged,
      last7Days,
      completion,
    });

  } catch (err) {
    console.error(
      "ADMIN DASHBOARD SUMMARY ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Dashboard load failed",
    });
  }
};


/* DELETE SURVEY */
export const deleteSurvey = async (req, res) => {
  try {
    // adminCanAccessSurvey already verified:
    // - survey exists
    // - SUPERADMIN can access it
    // - ADMIN owns it
    const survey = req.survey;

    if (!survey) {
      return res.status(404).json({
        message: "Survey not found",
      });
    }

    await Survey.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Survey deleted successfully",
    });
  } catch (err) {
    console.error("DELETE SURVEY ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to delete survey",
    });
  }
};


/* TOGGLE SURVEY STATUS */
export const updateSurveyStatus = async (req, res) => {
  try {
    // adminCanAccessSurvey already verified ownership/access
    const survey = req.survey;

    if (!survey) {
      return res.status(404).json({
        message: "Survey not found",
      });
    }

    const { status } = req.body;

    // Do not allow arbitrary values
    const allowedStatuses = [
      "DRAFT",
      "ACTIVE",
      "PAUSED",
      "COMPLETED",
      "CANCELLED",
    ];

    if (
      typeof status !== "string" ||
      !allowedStatuses.includes(status.toUpperCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid survey status",
      });
    }

    survey.status = status.toUpperCase();

    await survey.save();

    return res.status(200).json({
      success: true,
      survey,
    });
  } catch (err) {
    console.error("UPDATE SURVEY STATUS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to update survey status",
    });
  }
};