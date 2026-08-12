// import express from "express";
// import Survey from "../models/Survey.model.js"; 
// import { authMiddleware } from "../middleware/auth.middleware.js";
// import SurveyResponse from "../models/SurveyResponse.model.js";
// const router = express.Router();

// // GET active surveys for users
// router.get("/available", authMiddleware, async (req, res) => {
//   try {
//     const surveys = await Survey.find({ status: "ACTIVE" })
//       .select(
//         "title description points difficulty surveyType externalSurveyUrl timeLimit createdAt"
//       )
//       .sort({ createdAt: -1 });

//       const responses = await SurveyResponse.find({
//   user: req.user._id || req.user.id || req.user.userId
// });

// const completedSurveyIds = responses
//   .filter(r => r.status === "COMPLETED")
//   .map(r => r.survey.toString());

// const result = surveys.map(s => ({
//   ...s.toObject(),
//   completed: completedSurveyIds.includes(s._id.toString())
// }));
      
//     res.json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to load surveys" });
//   }
// });

// export default router;


// import express from "express";
// import Survey from "../models/Survey.model.js";
// import UserProfile from "../models/UserProfile.model.js";
// import { authMiddleware } from "../middleware/auth.middleware.js";
// import SurveyResponse from "../models/SurveyResponse.model.js";

// const router = express.Router();

// const normalize = (value) => {
//   if (value === null || value === undefined) {
//     return "";
//   }

//   return String(value).trim().toLowerCase();
// };


// // Check whether ONE target group matches the user's profile
// const matchesTargetGroup = (group, profile) => {
//   // --------------------------------------------------
//   // EMPLOYMENT STATUS
//   // --------------------------------------------------

//   if (
//     group.employmentStatus &&
//     normalize(group.employmentStatus) !== "any"
//   ) {
//     if (
//       normalize(group.employmentStatus) !==
//       normalize(profile.employmentStatus)
//     ) {
//       return false;
//     }
//   }


//   // --------------------------------------------------
//   // PROFESSION
//   // --------------------------------------------------

//   if (
//     group.profession &&
//     normalize(group.profession) !== "any"
//   ) {
//     if (
//       normalize(group.profession) !==
//       normalize(profile.profession)
//     ) {
//       return false;
//     }
//   }


//   // --------------------------------------------------
//   // SPECIALTY
//   // --------------------------------------------------

//   if (
//     Array.isArray(group.specialties) &&
//     group.specialties.length > 0
//   ) {
//     const userSpecialty = normalize(profile.specialty);

//     const specialtyMatches = group.specialties.some(
//       (specialty) =>
//         normalize(specialty) === userSpecialty
//     );

//     if (!specialtyMatches) {
//       return false;
//     }
//   }


//   // --------------------------------------------------
//   // GENDER
//   // --------------------------------------------------

//   if (
//     group.gender &&
//     normalize(group.gender) !== "all"
//   ) {
//     if (
//       normalize(group.gender) !==
//       normalize(profile.gender)
//     ) {
//       return false;
//     }
//   }


//   // --------------------------------------------------
//   // COUNTRY
//   // --------------------------------------------------

//   if (
//     group.country &&
//     normalize(group.country) !== "all"
//   ) {
//     if (
//       normalize(group.country) !==
//       normalize(profile.country)
//     ) {
//       return false;
//     }
//   }


//   // --------------------------------------------------
//   // AGE
//   // --------------------------------------------------

//   if (profile.dob) {
//     const today = new Date();
//     const dob = new Date(profile.dob);

//     let age =
//       today.getFullYear() -
//       dob.getFullYear();

//     const monthDifference =
//       today.getMonth() -
//       dob.getMonth();

//     if (
//       monthDifference < 0 ||
//       (
//         monthDifference === 0 &&
//         today.getDate() < dob.getDate()
//       )
//     ) {
//       age--;
//     }


//     if (
//       group.ageFrom !== null &&
//       group.ageFrom !== undefined
//     ) {
//       if (age < group.ageFrom) {
//         return false;
//       }
//     }


//     if (
//       group.ageTo !== null &&
//       group.ageTo !== undefined
//     ) {
//       if (age > group.ageTo) {
//         return false;
//       }
//     }
//   }


//   // --------------------------------------------------
//   // EVERYTHING MATCHED
//   // --------------------------------------------------

//   return true;
// };


// // Check whether user matches ANY target group
// const userMatchesSurvey = (survey, profile) => {

//   // No target groups = General Public
//   if (
//     !survey.targetGroups ||
//     survey.targetGroups.length === 0
//   ) {
//     return true;
//   }


//   // User must match at least ONE group
//   return survey.targetGroups.some((group) =>
//     matchesTargetGroup(group, profile)
//   );
// };



// router.get("/available", authMiddleware, async (req, res) => {
//   try {
//     const userId =
//       req.user._id ||
//       req.user.id ||
//       req.user.userId;

//       const profile = await UserProfile.findOne({
//       user: userId,
//     }).lean();

//     const surveys = await Survey.find({
//       status: "ACTIVE",
//     })
//       .select(
//         "title description points difficulty surveyType externalSurveyUrl timeLimit createdAt targetGroups"
//       )
//       .sort({ createdAt: -1 }).lean();

//     const responses = await SurveyResponse.find({
//       user: userId,
//     }).select("survey status");

//     // Create a map: surveyId -> status
//     const responseMap = {};

//     responses.forEach((r) => {
//       responseMap[r.survey.toString()] = r.status;
//     });

//     const availableSurveys = surveys.filter(
//       (survey) => {

//         // --------------------------------------------
//         // GENERAL PUBLIC SURVEY
//         // --------------------------------------------

//         if (
//           !survey.targetGroups ||
//           survey.targetGroups.length === 0
//         ) {
//           return true;
//         }


//         // --------------------------------------------
//         // TARGETED SURVEY
//         // --------------------------------------------

//         // No profile = cannot match targeted survey
//         if (!profile) {
//           return false;
//         }


//         return userMatchesSurvey(
//           survey,
//           profile
//         );
//       }
//     );

//     const result = surveys.map((survey) => ({
//       ...survey.toObject(),

//       userStatus:
//         responseMap[survey._id.toString()] ||
//         "NOT_STARTED",
//     }));

//     res.json(result);
//   } catch (err) {
//     console.error(err);

//     res.status(500).json({
//       message: "Failed to load surveys",
//     });
//   }
// });

// export default router;


import express from "express";
import Survey from "../models/Survey.model.js";
import UserProfile from "../models/UserProfile.model.js";
import SurveyResponse from "../models/SurveyResponse.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();


// ======================================================
// HELPERS
// ======================================================

const normalize = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().toLowerCase();
};


// Check whether ONE target group matches the user's profile
const matchesTargetGroup = (group, profile) => {
  // --------------------------------------------------
  // EMPLOYMENT STATUS
  // --------------------------------------------------

  if (
    group.employmentStatus &&
    normalize(group.employmentStatus) !== "any"
  ) {
    if (
      normalize(group.employmentStatus) !==
      normalize(profile.employmentStatus)
    ) {
      return false;
    }
  }


  // --------------------------------------------------
  // PROFESSION
  // --------------------------------------------------

  if (
    group.profession &&
    normalize(group.profession) !== "any"
  ) {
    if (
      normalize(group.profession) !==
      normalize(profile.profession)
    ) {
      return false;
    }
  }


  // --------------------------------------------------
  // SPECIALTY
  // --------------------------------------------------

  if (
    Array.isArray(group.specialties) &&
    group.specialties.length > 0
  ) {
    const userSpecialty = normalize(profile.specialty);

    const specialtyMatches = group.specialties.some(
      (specialty) =>
        normalize(specialty) === userSpecialty
    );

    if (!specialtyMatches) {
      return false;
    }
  }


  // --------------------------------------------------
  // GENDER
  // --------------------------------------------------

  if (
    group.gender &&
    normalize(group.gender) !== "all"
  ) {
    if (
      normalize(group.gender) !==
      normalize(profile.gender)
    ) {
      return false;
    }
  }


  // --------------------------------------------------
  // COUNTRY
  // --------------------------------------------------

  if (
    group.country &&
    normalize(group.country) !== "all"
  ) {
    if (
      normalize(group.country) !==
      normalize(profile.country)
    ) {
      return false;
    }
  }


  // --------------------------------------------------
  // AGE
  // --------------------------------------------------

  if (profile.dob) {
    const today = new Date();
    const dob = new Date(profile.dob);

    let age =
      today.getFullYear() -
      dob.getFullYear();

    const monthDifference =
      today.getMonth() -
      dob.getMonth();

    if (
      monthDifference < 0 ||
      (
        monthDifference === 0 &&
        today.getDate() < dob.getDate()
      )
    ) {
      age--;
    }


    if (
      group.ageFrom !== null &&
      group.ageFrom !== undefined
    ) {
      if (age < group.ageFrom) {
        return false;
      }
    }


    if (
      group.ageTo !== null &&
      group.ageTo !== undefined
    ) {
      if (age > group.ageTo) {
        return false;
      }
    }
  }


  // --------------------------------------------------
  // EVERYTHING MATCHED
  // --------------------------------------------------

  return true;
};


// Check whether user matches ANY target group
const userMatchesSurvey = (survey, profile) => {

  // No target groups = General Public
  if (
    !survey.targetGroups ||
    survey.targetGroups.length === 0
  ) {
    return true;
  }


  // User must match at least ONE group
  return survey.targetGroups.some((group) =>
    matchesTargetGroup(group, profile)
  );
};


// ======================================================
// AVAILABLE SURVEYS
// ======================================================

router.get("/available", authMiddleware, async (req, res) => {

  try {

    const userId =
      req.user._id ||
      req.user.id ||
      req.user.userId;


    // --------------------------------------------------
    // GET USER PROFILE
    // --------------------------------------------------

    const profile = await UserProfile.findOne({
      user: userId,
    }).lean();


    // --------------------------------------------------
    // GET ACTIVE SURVEYS
    // --------------------------------------------------

    const surveys = await Survey.find({
      status: "ACTIVE",
    })
      .select(
        `
        title
        description
        points
        difficulty
        surveyType
        externalSurveyUrl
        timeLimit
        createdAt
        targetGroups
        `
      )
      .sort({
        createdAt: -1,
      })
      .lean();


    // --------------------------------------------------
    // GET USER RESPONSES
    // --------------------------------------------------

    const responses = await SurveyResponse.find({
      user: userId,
    }).select(
      "survey status"
    );


    // --------------------------------------------------
    // CREATE RESPONSE MAP
    // --------------------------------------------------

    const responseMap = {};

    responses.forEach((response) => {

      responseMap[
        response.survey.toString()
      ] = response.status;

    });


    // --------------------------------------------------
    // FILTER SURVEYS
    // --------------------------------------------------

    const availableSurveys = surveys.filter(
      (survey) => {

        // --------------------------------------------
        // GENERAL PUBLIC SURVEY
        // --------------------------------------------

        if (
          !survey.targetGroups ||
          survey.targetGroups.length === 0
        ) {
          return true;
        }


        // --------------------------------------------
        // TARGETED SURVEY
        // --------------------------------------------

        // No profile = cannot match targeted survey
        if (!profile) {
          return false;
        }


        return userMatchesSurvey(
          survey,
          profile
        );
      }
    );


    // --------------------------------------------------
    // FINAL RESPONSE
    // --------------------------------------------------

    const result = availableSurveys.map(
      (survey) => ({

        ...survey,

        userStatus:
          responseMap[
            survey._id.toString()
          ] || "NOT_STARTED",

      })
    );


    res.json(result);

  } catch (err) {

    console.error(
      "Available surveys error:",
      err
    );

    res.status(500).json({
      message: "Failed to load surveys",
    });

  }

});


export default router;