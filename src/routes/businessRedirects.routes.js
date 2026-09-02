
// import crypto from "crypto";
// import express from "express";
// import Project from "../models/Project.model.js";
// import SurveyResponse from "../models/SurveyResponse.model.js";
// const router = express.Router();

// global.sessions = global.sessions || {};


// // =====================================================
// // URL VARIABLE HELPERS
// // =====================================================

// function getDateString() {
//   const now = new Date();

//   return now
//     .toISOString()
//     .slice(0, 10)
//     .replace(/-/g, "");
// }


// function randomHex(length = 8) {
//   return crypto
//     .randomBytes(Math.ceil(length / 2))
//     .toString("hex")
//     .toUpperCase()
//     .slice(0, length);
// }


// function randomNumber(length = 6) {
//   let result = "";

//   for (let i = 0; i < length; i++) {
//     result += crypto.randomInt(0, 10);
//   }

//   return result;
// }


// // =====================================================
// // GENERATE VALUE FROM PATTERN
// // =====================================================

// function generatePatternValue(pattern) {

//   const date = getDateString();

//   return String(pattern)
//     .replace(
//       /\{date\}/gi,
//       date
//     )
//     .replace(
//       /\{random\}/gi,
//       randomHex(32)
//     )
//     .replace(
//       /\{number\}/gi,
//       randomNumber(8)
//     )
//     .replace(
//       /\{shortRandom\}/gi,
//       randomHex(12)
//     );
// }


// // router.get("/start", async (req, res) => {
// //   const { tk } = req.query;

// //   const project = await Project.findOne({
// //     "redirects.start.token": tk,
// //   });

// //   if (!project) {
// //     return res.send("Invalid link");
// //   }

// //   let surveyLink = project.surveyLinks?.live;

// //   if (!surveyLink) {
// //     return res.send("Survey not Set");
// //   }

// //   // console.log("START QUERY:", req.query);

// //   const rid =
// //     req.query.pid ||
// //     req.query.PID ||
// //     req.query.rid ||
// //     req.query.RID;

// //   if (!rid) {
// //     return res.send("Missing RID");
// //   }

// //   try {
// //     await SurveyResponse.create({
// //       project: project._id,
// //       vendor:
// //       project.vendorLinks?.[0]?.vendorName || "",
// //       rid,
// //       status: "STARTED",
// //       startedAt: new Date(),
// //     });

// //     // console.log(
// //     //   "CREATED RESPONSE RID:",
// //     //   rid
// //     // );
// //   } catch (err) {
// //     // console.log("CREATE ERROR:", err);
// //     return res.status(500).send(err.message);
// //   }

// //   surveyLink = surveyLink.replace(
// //     /\[%RID%\]/g,
// //     rid
// //   );

// //   return res.redirect(surveyLink);
// // });

// router.get("/start", async (req, res) => {
//   try {

//     // =================================================
//     // GET TOKEN
//     // =================================================

//     const { tk } = req.query;

//     if (!tk) {
//       return res.status(400).send("Invalid link");
//     }


//     // =================================================
//     // FIND PROJECT
//     // =================================================

//     const project = await Project.findOne({
//       "redirects.start.token": tk,
//     });

//     if (!project) {
//       return res.status(404).send("Invalid link");
//     }


//     // =================================================
//     // GET LIVE SURVEY
//     // =================================================

//     let surveyLink = project.surveyLinks?.live;

//     if (!surveyLink) {
//       return res.send("Survey not Set");
//     }


//     // =================================================
//     // GENERATE URL VARIABLES
//     // =================================================

//     const generatedValues = {};

//     const variables =
//       Array.isArray(project.urlVariables)
//         ? project.urlVariables
//         : [];


//     for (const variable of variables) {

//       if (
//         !variable ||
//         !variable.param
//       ) {
//         continue;
//       }

//       const param =
//         String(variable.param).trim();

//       const pattern =
//         String(
//           variable.pattern || ""
//         ).trim();


//       if (!param) {
//         continue;
//       }


//       // -----------------------------------------------
//       // If pattern exists → generate from pattern
//       // -----------------------------------------------

//       if (pattern) {

//         generatedValues[param] =
//           generatePatternValue(
//             pattern
//           );

//       }

//     }


//     // =================================================
//     // RID
//     // =================================================
//     //
//     // RID is the identifier we use for SurveyResponse.
//     //
//     // If RID was configured in Build URL,
//     // use the generated RID.
//     //
//     // Otherwise generate a default RID.
//     // =================================================

//     let rid =
//       generatedValues.RID;


//     if (!rid) {

//       rid =
//         `RID-${getDateString()}-${randomHex(10)}`;

//       generatedValues.RID = rid;
//     }


//     // =================================================
//     // SUPPORT EXISTING INCOMING RID
//     // =================================================
//     //
//     // This keeps backward compatibility.
//     //
//     // If an external vendor already sends RID/PID,
//     // we can still use it.
//     // =================================================

//     const incomingRid =
//       req.query.rid ||
//       req.query.RID ||
//       req.query.pid ||
//       req.query.PID;


//     if (incomingRid) {

//       rid =
//         String(incomingRid);

//       generatedValues.RID =
//         rid;
//     }


//     // =================================================
//     // CREATE SURVEY RESPONSE
//     // =================================================

//     try {

//       await SurveyResponse.create({

//         project:
//           project._id,

//         vendor:
//           project.vendorLinks?.[0]
//             ?.vendorName || "",

//         rid,

//         urlVariables:
//     generatedValues,

//         status:
//           "STARTED",

//         startedAt:
//           new Date(),

//       });

//     } catch (err) {

//       console.error(
//         "CREATE RESPONSE ERROR:",
//         err
//       );

//       return res
//         .status(500)
//         .send(
//           "Unable to create survey response"
//         );
//     }


//     // =================================================
//     // REPLACE %RID%
//     // =================================================
//     //
//     // Your existing survey link can still contain:
//     //
//     // https://supplier.com/survey?RID=%RID%
//     //
//     // We replace it with generated RID.
//     // =================================================

//     surveyLink =
//       surveyLink.replace(
//         /%RID%/gi,
//         encodeURIComponent(rid)
//       );


//     // =================================================
//     // ADD ALL GENERATED VARIABLES
//     // =================================================

//     const url =
//       new URL(surveyLink);


//     for (
//       const [key, value]
//       of Object.entries(
//         generatedValues
//       )
//     ) {

//       // Don't add empty values

//       if (
//         value === undefined ||
//         value === null ||
//         value === ""
//       ) {
//         continue;
//       }


//       url.searchParams.set(
//         key,
//         value
//       );
//     }


//     // =================================================
//     // REDIRECT
//     // =================================================

//     return res.redirect(
//       url.toString()
//     );


//   } catch (err) {

//     console.error(
//       "START ROUTE ERROR:",
//       err
//     );

//     return res
//       .status(500)
//       .send(
//         "Unable to start survey"
//       );
//   }
// });

// router.get("/c", async (req, res) => {
// // console.log("COMPLETE ROUTE");

// const { tk } = req.query;

// const RID =
// req.query.pid ||
// req.query.PID ||
// req.query.rid ||
// req.query.RID;

// // console.log("COMPLETE QUERY:", req.query);

// const project = await Project.findOne({
// "redirects.complete.token": tk,
// });

// if (!project) {
// return res.send("Invalid");
// }
// //  console.log("COMPLETE ROUTE");
// // If RID is available, use respondent tracking
// const redirectUrl =
//   project.vendorLinks?.[0]?.complete;

// // console.log("FINAL REDIRECT URL:");
// //   console.log(redirectUrl);


// const thankYouUrl =
//   redirectUrl ||
//   "https://inputify.io/thank-you";

// if (RID) {
//   const response =
//     await SurveyResponse.findOne({
//       project: project._id,
//       rid: RID,
//     });
// if (!response) return res.send("Response not found");
  
//     if (response.status === "COMPLETED") {
//       // console.log(
//       //   "COMPLETE ROUTE already completed, redirecting to",
//       //   thankYouUrl
//       // );
//       return res.redirect(thankYouUrl);
//     }

//     response.status = "COMPLETED";
//     response.completedAt = new Date();

//     await response.save();
//     try {
//   const postbackUrl =
//   `https://api.inputify.io/api/postback` +
//   `?rid=${encodeURIComponent(RID)}` +
//   `&status=COMPLETED`;

// const result = await fetch(postbackUrl, {
//   headers: {
//     "X-Inputify-Postback-Secret":
//       process.env.INPUTIFY_POSTBACK_SECRET,
//   },
// });

//   // console.log(
//   //   "USER POSTBACK:",
//   //   await result.text()
//   // );

// } catch (err) {
//   // console.log(
//   //   "USER POSTBACK FAILED:"
//   // );
// }

// } else {
//   // Static redirect protection
//   global.completeHits = global.completeHits || new Map();

//   const key = tk;
//   const now = Date.now();

//   const lastHit = global.completeHits.get(key);

//   if (lastHit && now - lastHit < 5000) {
//     // console.log("DUPLICATE COMPLETE BLOCKED");
//     return res.redirect(thankYouUrl);
//   }

//   global.completeHits.set(key, now);
// }

// await Project.updateOne(
//   { _id: project._id },
//   {
//     $inc: {
//       completes: 1,
//       totalResponses: 1,
//     },
//   }
// );

// // console.log("REDIRECTING TO:", thankYouUrl);
// return res.redirect(thankYouUrl);
// });

// router.get("/dq", async (req, res) => {
// const { tk } = req.query;

// const RID =
// req.query.pid ||
// req.query.PID ||
// req.query.rid ||
// req.query.RID;

// // console.log("DQ QUERY:", req.query);

// const project = await Project.findOne({
// "redirects.disqualified.token": tk,
// });

// if (!project) {
// return res.send("Invalid");
// }

// if (RID) {
// const response =
// await SurveyResponse.findOne({
// project: project._id,
// rid: RID,
// });

// if (response) {
//   if (
//     response.status ===
//     "DISQUALIFIED"
//   ) {
//     return res.send(
//       "Already disqualified"
//     );
//   }

//   response.status =
//     "DISQUALIFIED";

//   await response.save();
//   try {
//   await fetch(
//     `https://api.inputify.io/api/postback` +
//     `?rid=${encodeURIComponent(RID)}` +
//     `&status=SCREENOUT`,
//     {
//     headers: {
//       "X-Inputify-Postback-Secret":
//         process.env.INPUTIFY_POSTBACK_SECRET,
//     },
//   }
//   );
// } catch (err) {
//   console.log(err.message);
// }
// }


// } else {
// global.dqHits =
// global.dqHits || new Map();


// const key = tk;
// const now = Date.now();

// const lastHit =
//   global.dqHits.get(key);

// if (
//   lastHit &&
//   now - lastHit < 5000
// ) {
//   // console.log(
//   //   "DUPLICATE DQ BLOCKED"
//   // );

//   return res.send(
//     "Duplicate ignored"
//   );
// }

// global.dqHits.set(
//   key,
//   now
// );


// }

// await Project.updateOne(
// { _id: project._id },
// {
// $inc: {
// disqualified: 1,
// totalResponses: 1,
// },
// }
// );

// const redirectUrl =
// project.vendorLinks?.[0]
// ?.disqualified;

// if (redirectUrl) {
// return res.redirect(
// redirectUrl
// );
// }

// return res.redirect(
// "https://inputify.io/disqualified"
// );
// });

// router.get("/qf", async (req, res) => {
// const { tk } = req.query;

// const RID =
// req.query.pid ||
// req.query.PID ||
// req.query.rid ||
// req.query.RID;

// // console.log("QF QUERY:", req.query);

// const project = await Project.findOne({
// "redirects.quotaFull.token": tk,
// });

// if (!project) {
// return res.send("Invalid");
// }

// if (RID) {
// const response =
// await SurveyResponse.findOne({
// project: project._id,
// rid: RID,
// });

// if (response) {
//   if (
//     response.status ===
//     "QUOTA_FULL"
//   ) {
//     return res.send(
//       "Already quota full"
//     );
//   }

//   response.status =
//     "QUOTA_FULL";

//   await response.save();
//   try {
//   await fetch(
//     `https://api.inputify.io/api/postback` +
//     `?rid=${encodeURIComponent(RID)}` +
//     `&status=QUOTA_FULL`,
//      {
//     headers: {
//       "X-Inputify-Postback-Secret":
//         process.env.INPUTIFY_POSTBACK_SECRET,
//     },
//   }
//   );
// } catch (err) {
//   console.log(err.message);
// }
// }


// } else {
// global.qfHits =
// global.qfHits || new Map();


// const key = tk;
// const now = Date.now();

// const lastHit =
//   global.qfHits.get(key);

// if (
//   lastHit &&
//   now - lastHit < 5000
// ) {
//   // console.log(
//   //   "DUPLICATE QF BLOCKED"
//   // );

//   return res.send(
//     "Duplicate ignored"
//   );
// }

// global.qfHits.set(
//   key,
//   now
// );


// }

// await Project.updateOne(
// { _id: project._id },
// {
// $inc: {
// quotaFull: 1,
// totalResponses: 1,
// },
// }
// );

// const redirectUrl =
// project.vendorLinks?.[0]
// ?.quotaFull;

// if (redirectUrl) {
// return res.redirect(
// redirectUrl
// );
// }

// return res.redirect(
// "https://inputify.io/quota-full"
// );
// });


// setInterval(() => {
//   const now = Date.now();

//   for (const sid in global.sessions) {
//     const session = global.sessions[sid];

//     // Remove after 1 hour
//     if (now - session.createdAt > 1000 * 60 * 60) {
//       delete global.sessions[sid];
//     }
//   }
// }, 1000 * 60 * 10);

// export default router;




import crypto from "crypto";
import express from "express";
import Project from "../models/Project.model.js";
import SurveyResponse from "../models/SurveyResponse.model.js";
const router = express.Router();

global.sessions = global.sessions || {};

const TERMINAL_STATUSES = [
  "COMPLETED",
  "DISQUALIFIED",
  "QUOTA_FULL",
];

const RID_REGEX = /^[A-Za-z0-9_-]{3,128}$/;

function getRid(req) {
  const rid =
    req.query.RID ||
    req.query.rid ||
    req.query.PID ||
    req.query.pid;

  if (!rid) {
    return null;
  }

  const value = String(rid).trim();

  if (!RID_REGEX.test(value)) {
    return null;
  }

  return value;
}

// =====================================================
// URL VARIABLE HELPERS
// =====================================================

function getDateString() {
  const now = new Date();

  return now
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
}


function randomHex(length = 8) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .toUpperCase()
    .slice(0, length);
}


function randomNumber(length = 6) {
  let result = "";

  for (let i = 0; i < length; i++) {
    result += crypto.randomInt(0, 10);
  }

  return result;
}


// =====================================================
// GENERATE VALUE FROM PATTERN
// =====================================================

function generatePatternValue(pattern) {

  const date = getDateString();

  return String(pattern)
    .replace(
      /\{date\}/gi,
      date
    )
    .replace(
      /\{random\}/gi,
      randomHex(32)
    )
    .replace(
      /\{number\}/gi,
      randomNumber(8)
    )
    .replace(
      /\{shortRandom\}/gi,
      randomHex(12)
    );
}


// router.get("/start", async (req, res) => {
//   const { tk } = req.query;

//   const project = await Project.findOne({
//     "redirects.start.token": tk,
//   });

//   if (!project) {
//     return res.send("Invalid link");
//   }

//   let surveyLink = project.surveyLinks?.live;

//   if (!surveyLink) {
//     return res.send("Survey not Set");
//   }

//   // console.log("START QUERY:", req.query);

//   const rid =
//     req.query.pid ||
//     req.query.PID ||
//     req.query.rid ||
//     req.query.RID;

//   if (!rid) {
//     return res.send("Missing RID");
//   }

//   try {
//     await SurveyResponse.create({
//       project: project._id,
//       vendor:
//       project.vendorLinks?.[0]?.vendorName || "",
//       rid,
//       status: "STARTED",
//       startedAt: new Date(),
//     });

//     // console.log(
//     //   "CREATED RESPONSE RID:",
//     //   rid
//     // );
//   } catch (err) {
//     // console.log("CREATE ERROR:", err);
//     return res.status(500).send(err.message);
//   }

//   surveyLink = surveyLink.replace(
//     /\[%RID%\]/g,
//     rid
//   );

//   return res.redirect(surveyLink);
// });

router.get("/start", async (req, res) => {
  try {

    // =================================================
    // GET TOKEN
    // =================================================

    const { tk } = req.query;

    if (!tk) {
      return res.status(400).send("Invalid link");
    }


    // =================================================
    // FIND PROJECT
    // =================================================

    const project = await Project.findOne({
      "redirects.start.token": tk,
    });

    if (!project) {
      return res.status(404).send("Invalid link");
    }


    // =================================================
    // GET LIVE SURVEY
    // =================================================

    let surveyLink = project.surveyLinks?.live;

    if (!surveyLink) {
      return res.send("Survey not Set");
    }


    // =================================================
    // GENERATE URL VARIABLES
    // =================================================

    const generatedValues = {};

    const variables =
      Array.isArray(project.urlVariables)
        ? project.urlVariables
        : [];


    for (const variable of variables) {

      if (
        !variable ||
        !variable.param
      ) {
        continue;
      }

      const param =
        String(variable.param).trim();

      const pattern =
        String(
          variable.pattern || ""
        ).trim();


      if (!param) {
        continue;
      }


      // -----------------------------------------------
      // If pattern exists → generate from pattern
      // -----------------------------------------------

      if (pattern) {

        generatedValues[param] =
          generatePatternValue(
            pattern
          );

      }

    }


    // =================================================
    // RID
    // =================================================
    //
    // RID is the identifier we use for SurveyResponse.
    //
    // If RID was configured in Build URL,
    // use the generated RID.
    //
    // Otherwise generate a default RID.
    // =================================================

    let rid =
      generatedValues.RID;


    if (!rid) {

      rid =
        `RID-${getDateString()}-${randomHex(10)}`;

      generatedValues.RID = rid;
    }


    // =================================================
    // SUPPORT EXISTING INCOMING RID
    // =================================================
    //
    // This keeps backward compatibility.
    //
    // If an external vendor already sends RID/PID,
    // we can still use it.
    // =================================================

    const incomingRid =
      req.query.rid ||
      req.query.RID ||
      req.query.pid ||
      req.query.PID;


    if (incomingRid) {

      rid =
        String(incomingRid);

      generatedValues.RID =
        rid;
    }


    // =================================================
    // CREATE SURVEY RESPONSE
    // =================================================

    try {

      await SurveyResponse.create({

        project:
          project._id,

        vendor:
          project.vendorLinks?.[0]
            ?.vendorName || "",

        rid,

        urlVariables:
    generatedValues,

        status:
          "STARTED",

        startedAt:
          new Date(),

      });

    } catch (err) {

      console.error(
        "CREATE RESPONSE ERROR:",
        err
      );

      return res
        .status(500)
        .send(
          "Unable to create survey response"
        );
    }


    // =================================================
    // REPLACE %RID%
    // =================================================
    //
    // Your existing survey link can still contain:
    //
    // https://supplier.com/survey?RID=%RID%
    //
    // We replace it with generated RID.
    // =================================================

    surveyLink =
      surveyLink.replace(
        /%RID%/gi,
        encodeURIComponent(rid)
      );


    // =================================================
    // ADD ALL GENERATED VARIABLES
    // =================================================

    const url =
      new URL(surveyLink);


    for (
      const [key, value]
      of Object.entries(
        generatedValues
      )
    ) {

      // Don't add empty values

      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        continue;
      }


      url.searchParams.set(
        key,
        value
      );
    }


    // =================================================
    // REDIRECT
    // =================================================

    return res.redirect(
      url.toString()
    );


  } catch (err) {

    console.error(
      "START ROUTE ERROR:",
      err
    );

    return res
      .status(500)
      .send(
        "Unable to start survey"
      );
  }
});

router.get("/c", async (req, res) => {
  try {
    const { tk } = req.query;

    if (!tk) {
      return res.status(400).send("Missing redirect token");
    }

    const RID = getRid(req);

    // IMPORTANT:
    // Complete can NEVER happen without a real RID.
    if (!RID) {
      return res.status(400).send("Missing or invalid RID");
    }

    // Find project using complete redirect token
    const project = await Project.findOne({
      "redirects.complete.token": tk,
    });

    if (!project) {
      return res.status(404).send("Invalid complete link");
    }

    // Find response belonging to THIS project
    const response = await SurveyResponse.findOne({
      project: project._id,
      rid: RID,
    });

    if (!response) {
      return res.status(404).send("Response not found");
    }

    // Already completed
    if (response.status === "COMPLETED") {
      return res.status(409).send("Response already completed");
    }

    // DQ/QF are final states
    if (
      response.status === "DISQUALIFIED" ||
      response.status === "QUOTA_FULL"
    ) {
      return res.status(409).send(
        "Response has already been finalized"
      );
    }

    // Only STARTED can become COMPLETED
    if (response.status !== "STARTED") {
      return res.status(409).send(
        "Response is not active"
      );
    }

    // ATOMIC STATE TRANSITION
    const updatedResponse =
      await SurveyResponse.findOneAndUpdate(
        {
          _id: response._id,
          status: "STARTED",
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
      );

    // Another request may have completed it
    if (!updatedResponse) {
      return res.status(409).send(
        "Response has already been finalized"
      );
    }

    // Increment ONLY after successful transition
    await Project.updateOne(
      { _id: project._id },
      {
        $inc: {
          completes: 1,
        },
      }
    );

    // Postback
    try {
      await fetch(
        `https://api.inputify.io/api/postback` +
        `?rid=${encodeURIComponent(RID)}` +
        `&status=COMPLETED`,
        {
          headers: {
            "X-Inputify-Postback-Secret":
              process.env.INPUTIFY_POSTBACK_SECRET,
          },
        }
      );
    } catch (err) {
      console.error(
        "Complete postback failed:",
        err.message
      );
    }

    let redirectUrl =
      project.vendorLinks?.[0]?.complete;

    if (!redirectUrl) {
      redirectUrl =
        "https://inputify.io/thank-you";
    }

    // Pass RID to vendor if needed
    try {
      const url = new URL(redirectUrl);

      url.searchParams.set("RID", RID);

      redirectUrl = url.toString();
    } catch {
      // Keep original URL if invalid
    }

    return res.redirect(redirectUrl);

  } catch (err) {
    console.error(
      "COMPLETE REDIRECT ERROR:",
      err
    );

    return res.status(500).send(
      "Unable to complete response"
    );
  }
});

router.get("/dq", async (req, res) => {
  try {
    const { tk } = req.query;

    if (!tk) {
      return res.status(400).send(
        "Missing redirect token"
      );
    }

    const RID = getRid(req);

    if (!RID) {
      return res.status(400).send(
        "Missing or invalid RID"
      );
    }

    const project = await Project.findOne({
      "redirects.disqualified.token": tk,
    });

    if (!project) {
      return res.status(404).send(
        "Invalid disqualified link"
      );
    }

    const response =
      await SurveyResponse.findOne({
        project: project._id,
        rid: RID,
      });

    if (!response) {
      return res.status(404).send(
        "Response not found"
      );
    }

    if (
      response.status === "DISQUALIFIED"
    ) {
      return res.status(409).send(
        "Response already disqualified"
      );
    }

    if (
      response.status === "COMPLETED" ||
      response.status === "QUOTA_FULL"
    ) {
      return res.status(409).send(
        "Response has already been finalized"
      );
    }

    if (response.status !== "STARTED") {
      return res.status(409).send(
        "Response is not active"
      );
    }

    // ATOMIC transition
    const updatedResponse =
      await SurveyResponse.findOneAndUpdate(
        {
          _id: response._id,
          status: "STARTED",
        },
        {
          $set: {
            status: "DISQUALIFIED",
          },
        },
        {
          new: true,
        }
      );

    if (!updatedResponse) {
      return res.status(409).send(
        "Response has already been finalized"
      );
    }

    // Increment ONLY once
    await Project.updateOne(
      { _id: project._id },
      {
        $inc: {
          disqualified: 1,
        },
      }
    );

    // Postback
    try {
      await fetch(
        `https://api.inputify.io/api/postback` +
        `?rid=${encodeURIComponent(RID)}` +
        `&status=SCREENOUT`,
        {
          headers: {
            "X-Inputify-Postback-Secret":
              process.env.INPUTIFY_POSTBACK_SECRET,
          },
        }
      );
    } catch (err) {
      console.error(
        "DQ postback failed:",
        err.message
      );
    }

    let redirectUrl =
      project.vendorLinks?.[0]?.disqualified;

    if (!redirectUrl) {
      redirectUrl =
        "https://inputify.io/disqualified";
    }

    try {
      const url = new URL(redirectUrl);

      url.searchParams.set(
        "RID",
        RID
      );

      redirectUrl = url.toString();

    } catch {}

    return res.redirect(
      redirectUrl
    );

  } catch (err) {
    console.error(
      "DQ REDIRECT ERROR:",
      err
    );

    return res.status(500).send(
      "Unable to disqualify response"
    );
  }
});

router.get("/qf", async (req, res) => {
  try {
    const { tk } = req.query;

    if (!tk) {
      return res.status(400).send(
        "Missing redirect token"
      );
    }

    const RID = getRid(req);

    if (!RID) {
      return res.status(400).send(
        "Missing or invalid RID"
      );
    }

    const project = await Project.findOne({
      "redirects.quotaFull.token": tk,
    });

    if (!project) {
      return res.status(404).send(
        "Invalid quota link"
      );
    }

    const response =
      await SurveyResponse.findOne({
        project: project._id,
        rid: RID,
      });

    if (!response) {
      return res.status(404).send(
        "Response not found"
      );
    }

    if (
      response.status === "QUOTA_FULL"
    ) {
      return res.status(409).send(
        "Response already quota full"
      );
    }

    if (
      response.status === "COMPLETED" ||
      response.status === "DISQUALIFIED"
    ) {
      return res.status(409).send(
        "Response has already been finalized"
      );
    }

    if (response.status !== "STARTED") {
      return res.status(409).send(
        "Response is not active"
      );
    }

    // ATOMIC transition
    const updatedResponse =
      await SurveyResponse.findOneAndUpdate(
        {
          _id: response._id,
          status: "STARTED",
        },
        {
          $set: {
            status: "QUOTA_FULL",
          },
        },
        {
          new: true,
        }
      );

    if (!updatedResponse) {
      return res.status(409).send(
        "Response has already been finalized"
      );
    }

    // Increment ONLY once
    await Project.updateOne(
      { _id: project._id },
      {
        $inc: {
          quotaFull: 1,
        },
      }
    );

    // Postback
    try {
      await fetch(
        `https://api.inputify.io/api/postback` +
        `?rid=${encodeURIComponent(RID)}` +
        `&status=QUOTA_FULL`,
        {
          headers: {
            "X-Inputify-Postback-Secret":
              process.env.INPUTIFY_POSTBACK_SECRET,
          },
        }
      );
    } catch (err) {
      console.error(
        "QF postback failed:",
        err.message
      );
    }

    let redirectUrl =
      project.vendorLinks?.[0]?.quotaFull;

    if (!redirectUrl) {
      redirectUrl =
        "https://inputify.io/quota-full";
    }

    try {
      const url = new URL(redirectUrl);

      url.searchParams.set(
        "RID",
        RID
      );

      redirectUrl = url.toString();

    } catch {}

    return res.redirect(
      redirectUrl
    );

  } catch (err) {
    console.error(
      "QF REDIRECT ERROR:",
      err
    );

    return res.status(500).send(
      "Unable to mark quota full"
    );
  }
});


setInterval(() => {
  const now = Date.now();

  for (const sid in global.sessions) {
    const session = global.sessions[sid];

    // Remove after 1 hour
    if (now - session.createdAt > 1000 * 60 * 60) {
      delete global.sessions[sid];
    }
  }
}, 1000 * 60 * 10);

export default router;


