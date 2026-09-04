
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

function generateResponseToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashResponseToken(token) {
  return crypto
    .createHash("sha256")
    .update(String(token))
    .digest("hex");
}

function getResponseToken(req) {
  const token =
    req.query.rt ||
    req.query.RT ||
    req.query.responseToken ||
    req.query.ResponseToken;

  if (!token) {
    return null;
  }

  const value = String(token).trim();

  // 64 hexadecimal characters = 32 random bytes
  if (!/^[a-fA-F0-9]{64}$/.test(value)) {
    return null;
  }

  return value;
}

// =====================================================
// SECURE RESPONSE SESSION
// =====================================================

const RESPONSE_SESSION_COOKIE =
  "__Host-inputify_sid";

const RESPONSE_SESSION_TTL =
  1000 * 60 * 60; // 1 hour


function generateSessionId() {
  return crypto
    .randomBytes(32)
    .toString("hex");
}


function createResponseSession({
  responseId,
  projectId,
  targetGroupId,
  rid,
}) {
  const sessionId =
    generateSessionId();

  global.sessions[sessionId] = {
    responseId: String(responseId),
    projectId: String(projectId),
    targetGroupId: String(targetGroupId),
    rid: String(rid),
    createdAt: Date.now(),
  };

  return sessionId;
}


function getSessionId(req) {
  const cookieHeader =
    req.headers.cookie || "";

  const cookies =
    cookieHeader
      .split(";")
      .map((item) => item.trim());

  for (const cookie of cookies) {
    const separator =
      cookie.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const name =
      cookie.slice(0, separator);

    const value =
      cookie.slice(separator + 1);

    if (
      name === RESPONSE_SESSION_COOKIE
    ) {
      return decodeURIComponent(value);
    }
  }

  return null;
}


function setResponseSessionCookie(
  res,
  sessionId
) {
  const parts = [
    `${RESPONSE_SESSION_COOKIE}=${encodeURIComponent(sessionId)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=3600",
    "Secure",
  ];

  res.setHeader(
    "Set-Cookie",
    parts.join("; ")
  );
}


function validateResponseSession(
  req,
  response,
  project,
  targetGroup
) {
  const sessionId =
    getSessionId(req);

  if (!sessionId) {
    return false;
  }

  const session =
    global.sessions[sessionId];

  if (!session) {
    return false;
  }

  // Session expired
  if (
    Date.now() - session.createdAt >
    RESPONSE_SESSION_TTL
  ) {
    delete global.sessions[sessionId];
    return false;
  }

  // Session must belong to the exact response
  if (
    session.responseId !==
    String(response._id)
  ) {
    return false;
  }

  // Session must belong to exact project
  if (
    session.projectId !==
    String(project._id)
  ) {
    return false;
  }

  // Session must belong to exact target group
  if (
    session.targetGroupId !==
    String(targetGroup._id)
  ) {
    return false;
  }

  // Session RID must match request RID
  if (
    session.rid !==
    String(response.rid)
  ) {
    return false;
  }

  return true;
}


function destroyResponseSession(req) {
  const sessionId =
    getSessionId(req);

  if (!sessionId) {
    return;
  }

  delete global.sessions[sessionId];
}

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
//       Array.isArray(targetGroup.urlVariables)
//         ? targetGroup.urlVariables
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

// =====================================================
// START SURVEY - TARGET GROUP SPECIFIC
// =====================================================

router.get("/start", async (req, res) => {
  try {
    // =================================================
    // GET TOKEN
    // =================================================
    const responseToken =
  crypto.randomBytes(32).toString("hex");

const responseTokenHash =
  crypto
    .createHash("sha256")
    .update(responseToken)
    .digest("hex");

    const { tk } = req.query;

    if (!tk) {
      return res.status(400).send("Invalid link");
    }

    // =================================================
    // FIND PROJECT USING TARGET GROUP START TOKEN
    // =================================================

    const project = await Project.findOne({
      "targetGroups.redirects.start.token": tk,
    });

    if (!project) {
      // console.error(
      //   "START LINK NOT FOUND. TOKEN:",
      //   tk
      // );

      return res.status(404).send("Invalid link");
    }

    // =================================================
    // FIND EXACT TARGET GROUP
    // =================================================

    const targetGroup = project.targetGroups.find(
      (group) =>
        group.redirects?.start?.token === tk
    );

    if (!targetGroup) {
      console.error(
        "TARGET GROUP NOT FOUND FOR START TOKEN:",
        tk
      );

      return res.status(404).send("Invalid link");
    }

    // =================================================
    // GET TARGET GROUP LIVE SURVEY URL
    // =================================================

    let surveyLink =
      targetGroup.surveyLinks?.live || "";

    if (!surveyLink) {
      return res.status(400).send(
        "Target group does not have a live survey URL"
      );
    }

    // =================================================
    // GENERATE TARGET GROUP URL VARIABLES
    // =================================================

    const generatedValues = {};

    const variables =
      Array.isArray(targetGroup.urlVariables)
        ? targetGroup.urlVariables
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

      if (pattern) {
        generatedValues[param] =
          generatePatternValue(pattern);
      }
    }

    // =================================================
    // GENERATE INTERNAL RID
    // =================================================

    let rid =
      generatedValues.RID;

    if (!rid) {
      rid =
        `RID-${getDateString()}-${randomHex(32)}`;

      // Only add RID to generatedValues if
      // RID is actually configured for this group.
      const hasRIDVariable =
        variables.some(
          (variable) =>
            String(variable?.param || "")
              .trim()
              .toUpperCase() === "RID"
        );

      if (hasRIDVariable) {
        generatedValues.RID = rid;
      }
    }

    // =================================================
    // SUPPORT INCOMING RID
    // =================================================

    const incomingRid =
      req.query.rid ||
      req.query.RID;

    if (incomingRid) {
      rid = String(incomingRid).trim();

      const hasRIDVariable =
        variables.some(
          (variable) =>
            String(variable?.param || "")
              .trim()
              .toUpperCase() === "RID"
        );

      if (hasRIDVariable) {
        generatedValues.RID = rid;
      }
    }

    // =================================================
    // CREATE SURVEY RESPONSE
    // =================================================

    const response =
      await SurveyResponse.create({
        project: project._id,

        // IMPORTANT:
        // Save the exact target group
        targetGroup: targetGroup._id,

        vendor:
          project.vendorLinks?.[0]
            ?.vendorName || "",

        rid,

        responseTokenHash,

        urlVariables:
          generatedValues,

        status: "STARTED",

        startedAt: new Date(),
      });

      // =================================================
// CREATE SERVER-SIDE RESPONSE SESSION
// =================================================

const sessionId =
  createResponseSession({
    responseId: response._id,
    projectId: project._id,
    targetGroupId: targetGroup._id,
    rid,
  });

setResponseSessionCookie(
  res,
  sessionId
);

    // console.log(
    //   "STARTED TARGET GROUP RESPONSE:",
    //   {
    //     projectId: project._id,
    //     targetGroupId: targetGroup._id,
    //     rid,
    //     urlVariables: generatedValues,
    //   }
    // );

    // =================================================
    // REPLACE EXISTING %RID%
    // =================================================

    surveyLink =
      surveyLink.replace(
        /%RID%/gi,
        encodeURIComponent(rid)
      );

    // =================================================
    // ADD GENERATED TARGET GROUP VARIABLES
    // =================================================

    const url =
      new URL(surveyLink);

    for (
      const [key, value]
      of Object.entries(generatedValues)
    ) {
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
    // REDIRECT TO TARGET GROUP'S SURVEY
    // =================================================

    console.log(
      "REDIRECTING TO TARGET GROUP SURVEY:",
      {
    projectId: project._id,
    targetGroupId: targetGroup._id,
    rid,
  }
    );

    return res.redirect(
      url.toString()
    );

  } catch (err) {
    console.error(
      "TARGET GROUP START ROUTE ERROR:",
      err
    );

    return res.status(500).send(
      "Unable to start survey"
    );
  }
});

// router.get("/c", async (req, res) => {
//   try {
//     const { tk } = req.query;

//     if (!tk) {
//       return res.status(400).send("Missing redirect token");
//     }

//     const RID = getRid(req);

//     // IMPORTANT:
//     // Complete can NEVER happen without a real RID.
//     if (!RID) {
//       return res.status(400).send("Missing or invalid RID");
//     }

//     // Find project using complete redirect token
//     const project = await Project.findOne({
//       "redirects.complete.token": tk,
//     });

//     if (!project) {
//       return res.status(404).send("Invalid complete link");
//     }

//     // Find response belonging to THIS project
//     const response = await SurveyResponse.findOne({
//       project: project._id,
//       rid: RID,
//     });

//     if (!response) {
//       return res.status(404).send("Response not found");
//     }

//     // Already completed
//     if (response.status === "COMPLETED") {
//       return res.status(409).send("Response already completed");
//     }

//     // DQ/QF are final states
//     if (
//       response.status === "DISQUALIFIED" ||
//       response.status === "QUOTA_FULL"
//     ) {
//       return res.status(409).send(
//         "Response has already been finalized"
//       );
//     }

//     // Only STARTED can become COMPLETED
//     if (response.status !== "STARTED") {
//       return res.status(409).send(
//         "Response is not active"
//       );
//     }

//     // ATOMIC STATE TRANSITION
//     const updatedResponse =
//       await SurveyResponse.findOneAndUpdate(
//         {
//           _id: response._id,
//           status: "STARTED",
//         },
//         {
//           $set: {
//             status: "COMPLETED",
//             completedAt: new Date(),
//           },
//         },
//         {
//           new: true,
//         }
//       );

//     // Another request may have completed it
//     if (!updatedResponse) {
//       return res.status(409).send(
//         "Response has already been finalized"
//       );
//     }

//     // Increment ONLY after successful transition
//     await Project.updateOne(
//       { _id: project._id },
//       {
//         $inc: {
//           completes: 1,
//         },
//       }
//     );

//     // Postback
//     try {
//       await fetch(
//         `https://api.inputify.io/api/postback` +
//         `?rid=${encodeURIComponent(RID)}` +
//         `&status=COMPLETED`,
//         {
//           headers: {
//             "X-Inputify-Postback-Secret":
//               process.env.INPUTIFY_POSTBACK_SECRET,
//           },
//         }
//       );
//     } catch (err) {
//       console.error(
//         "Complete postback failed:",
//         err.message
//       );
//     }

//     let redirectUrl =
//       project.vendorLinks?.[0]?.complete;

//     if (!redirectUrl) {
//       redirectUrl =
//         "https://inputify.io/thank-you";
//     }

//     // Pass RID to vendor if needed
//     try {
//       const url = new URL(redirectUrl);

//       url.searchParams.set("RID", RID);

//       redirectUrl = url.toString();
//     } catch {
//       // Keep original URL if invalid
//     }

//     return res.redirect(redirectUrl);

//   } catch (err) {
//     console.error(
//       "COMPLETE REDIRECT ERROR:",
//       err
//     );

//     return res.status(500).send(
//       "Unable to complete response"
//     );
//   }
// });

// =====================================================
// COMPLETE - TARGET GROUP SPECIFIC
// =====================================================

router.get("/c", async (req, res) => {
  try {
    const { tk } = req.query;

    if (!tk) {
      return res.status(400).send(
        "Missing redirect token"
      );
    }

    // =================================================
    // GET RID
    // =================================================

    const RID = getRid(req);

    if (!RID) {
      return res.status(400).send(
        "Missing or invalid RID"
      );
    }

    // =================================================
    // FIND PROJECT USING TARGET GROUP COMPLETE TOKEN
    // =================================================

    const project = await Project.findOne({
      "targetGroups.redirects.complete.token": tk,
    });

    if (!project) {
      return res.status(404).send(
        "Invalid complete link"
      );
    }

    // =================================================
    // FIND EXACT TARGET GROUP
    // =================================================

    const targetGroup = project.targetGroups.find(
      (group) =>
        group.redirects?.complete?.token === tk
    );

    if (!targetGroup) {
      return res.status(404).send(
        "Target group not found"
      );
    }

    // =================================================
    // FIND RESPONSE
    // =================================================

    const response =
      await SurveyResponse.findOne({
        project: project._id,
        targetGroup: targetGroup._id,
        rid: RID,
      });

    if (!response) {
      return res.status(404).send(
        "Response not found"
      );
    }

    // =================================================
// VERIFY RESPONSE SESSION
// =================================================

const validSession =
  validateResponseSession(
    req,
    response,
    project,
    targetGroup
  );

if (!validSession) {
  return res.status(403).send(
    "Invalid or expired survey session"
  );
}
    // =================================================
    // CHECK CURRENT STATUS
    // =================================================

    if (response.status === "COMPLETED") {
      return res.status(409).send(
        "Response already completed"
      );
    }

    if (
      response.status === "DISQUALIFIED" ||
      response.status === "QUOTA_FULL"
    ) {
      return res.status(409).send(
        "Response has already been finalized"
      );
    }

    if (response.status !== "COMPLETION_CONFIRMED") {
      return res.status(409).send(
        "Response is not eligible for completion"
      );
    }

    // =================================================
    // ATOMIC RESPONSE TRANSITION
    // =================================================

    const updatedResponse =
      await SurveyResponse.findOneAndUpdate(
        {
          _id: response._id,
          project: project._id,
      targetGroup: targetGroup._id,
      rid: RID,
          status: "COMPLETION_CONFIRMED",
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

    if (!updatedResponse) {
      return res.status(409).send(
        "Response has already been finalized"
      );
    }

    destroyResponseSession(req);

    // =================================================
    // INCREMENT TARGET GROUP COUNTERS
    // =================================================

    await Project.updateOne(
      {
        _id: project._id,
        "targetGroups._id": targetGroup._id,
      },
      {
        $inc: {
          "targetGroups.$.completes": 1,
          "targetGroups.$.totalResponses": 1,
        },
      }
    );

    // =================================================
    // ALSO UPDATE PROJECT TOTAL
    // =================================================

    await Project.updateOne(
      {
        _id: project._id,
      },
      {
        $inc: {
          completes: 1,
          totalResponses: 1,
        },
      }
    );

    // =================================================
    // POSTBACK
    // =================================================

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

    // =================================================
    // TARGET GROUP COMPLETE REDIRECT
    // =================================================

    let redirectUrl =
      targetGroup.redirects?.complete?.url ||
      project.vendorLinks?.[0]?.complete ||
      "https://inputify.io/thank-you";

    // =================================================
    // PASS RID
    // =================================================

    try {
      const url = new URL(redirectUrl);

      url.searchParams.set(
        "RID",
        RID
      );

      redirectUrl =
        url.toString();

    } catch {
      // Keep original URL
    }

    return res.redirect(
      redirectUrl
    );

  } catch (err) {
    console.error(
      "TARGET GROUP COMPLETE REDIRECT ERROR:",
      err
    );

    return res.status(500).send(
      "Unable to complete response"
    );
  }
});

// router.get("/dq", async (req, res) => {
//   try {
//     const { tk } = req.query;

//     if (!tk) {
//       return res.status(400).send(
//         "Missing redirect token"
//       );
//     }

//     const RID = getRid(req);

//     if (!RID) {
//       return res.status(400).send(
//         "Missing or invalid RID"
//       );
//     }

//     const project = await Project.findOne({
//       "redirects.disqualified.token": tk,
//     });

//     if (!project) {
//       return res.status(404).send(
//         "Invalid disqualified link"
//       );
//     }

//     const response =
//       await SurveyResponse.findOne({
//         project: project._id,
//         rid: RID,
//       });

//     if (!response) {
//       return res.status(404).send(
//         "Response not found"
//       );
//     }

//     if (
//       response.status === "DISQUALIFIED"
//     ) {
//       return res.status(409).send(
//         "Response already disqualified"
//       );
//     }

//     if (
//       response.status === "COMPLETED" ||
//       response.status === "QUOTA_FULL"
//     ) {
//       return res.status(409).send(
//         "Response has already been finalized"
//       );
//     }

//     if (response.status !== "STARTED") {
//       return res.status(409).send(
//         "Response is not active"
//       );
//     }

//     // ATOMIC transition
//     const updatedResponse =
//       await SurveyResponse.findOneAndUpdate(
//         {
//           _id: response._id,
//           status: "STARTED",
//         },
//         {
//           $set: {
//             status: "DISQUALIFIED",
//           },
//         },
//         {
//           new: true,
//         }
//       );

//     if (!updatedResponse) {
//       return res.status(409).send(
//         "Response has already been finalized"
//       );
//     }

//     // Increment ONLY once
//     await Project.updateOne(
//       { _id: project._id },
//       {
//         $inc: {
//           disqualified: 1,
//         },
//       }
//     );

//     // Postback
//     try {
//       await fetch(
//         `https://api.inputify.io/api/postback` +
//         `?rid=${encodeURIComponent(RID)}` +
//         `&status=SCREENOUT`,
//         {
//           headers: {
//             "X-Inputify-Postback-Secret":
//               process.env.INPUTIFY_POSTBACK_SECRET,
//           },
//         }
//       );
//     } catch (err) {
//       console.error(
//         "DQ postback failed:",
//         err.message
//       );
//     }

//     let redirectUrl =
//       project.vendorLinks?.[0]?.disqualified;

//     if (!redirectUrl) {
//       redirectUrl =
//         "https://inputify.io/disqualified";
//     }

//     try {
//       const url = new URL(redirectUrl);

//       url.searchParams.set(
//         "RID",
//         RID
//       );

//       redirectUrl = url.toString();

//     } catch {}

//     return res.redirect(
//       redirectUrl
//     );

//   } catch (err) {
//     console.error(
//       "DQ REDIRECT ERROR:",
//       err
//     );

//     return res.status(500).send(
//       "Unable to disqualify response"
//     );
//   }
// });

// =====================================================
// DISQUALIFIED - TARGET GROUP SPECIFIC
// =====================================================

router.get("/dq", async (req, res) => {
  try {
    const { tk } = req.query;

    if (!tk) {
      return res.status(400).send(
        "Missing redirect token"
      );
    }

    // =================================================
    // GET RID
    // =================================================

    const RID = getRid(req);

    if (!RID) {
      return res.status(400).send(
        "Missing or invalid RID"
      );
    }

    // =================================================
    // FIND PROJECT USING TARGET GROUP DQ TOKEN
    // =================================================

    const project = await Project.findOne({
      "targetGroups.redirects.disqualified.token": tk,
    });

    if (!project) {
      return res.status(404).send(
        "Invalid disqualified link"
      );
    }

    // =================================================
    // FIND EXACT TARGET GROUP
    // =================================================

    const targetGroup = project.targetGroups.find(
      (group) =>
        group.redirects?.disqualified?.token === tk
    );

    if (!targetGroup) {
      return res.status(404).send(
        "Target group not found"
      );
    }

    // =================================================
    // FIND RESPONSE
    // =================================================

    const response =
      await SurveyResponse.findOne({
        project: project._id,
        targetGroup: targetGroup._id,
        rid: RID,
      });

    if (!response) {
      return res.status(404).send(
        "Response not found"
      );
    }

    // =================================================
// VERIFY RESPONSE SESSION
// =================================================

const validSession =
  validateResponseSession(
    req,
    response,
    project,
    targetGroup
  );

if (!validSession) {
  return res.status(403).send(
    "Invalid or expired survey session"
  );
}

    // =================================================
    // CHECK CURRENT STATUS
    // =================================================

    if (response.status === "DISQUALIFIED") {
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

    // =================================================
    // ATOMIC RESPONSE TRANSITION
    // =================================================

    const updatedResponse =
      await SurveyResponse.findOneAndUpdate(
        {
          _id: response._id,
          project: project._id,
      targetGroup: targetGroup._id,
      rid: RID,
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

    destroyResponseSession(req);

    // =================================================
    // INCREMENT TARGET GROUP COUNTERS
    // =================================================

    await Project.updateOne(
      {
        _id: project._id,
        "targetGroups._id": targetGroup._id,
      },
      {
        $inc: {
          "targetGroups.$.disqualified": 1,
          "targetGroups.$.totalResponses": 1,
        },
      }
    );

    // =================================================
    // UPDATE PROJECT TOTALS
    // =================================================

    await Project.updateOne(
      {
        _id: project._id,
      },
      {
        $inc: {
          disqualified: 1,
          totalResponses: 1,
        },
      }
    );

    // =================================================
    // POSTBACK
    // =================================================

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

    // =================================================
    // TARGET GROUP DQ REDIRECT
    // =================================================

    let redirectUrl =
      targetGroup.redirects?.disqualified?.url ||
      project.vendorLinks?.[0]?.disqualified ||
      "https://inputify.io/disqualified";

    // =================================================
    // PASS RID
    // =================================================

    try {
      const url = new URL(redirectUrl);

      url.searchParams.set(
        "RID",
        RID
      );

      redirectUrl =
        url.toString();

    } catch {
      // Keep original URL
    }

    return res.redirect(
      redirectUrl
    );

  } catch (err) {
    console.error(
      "TARGET GROUP DQ REDIRECT ERROR:",
      err
    );

    return res.status(500).send(
      "Unable to disqualify response"
    );
  }
});

// router.get("/qf", async (req, res) => {
//   try {
//     const { tk } = req.query;

//     if (!tk) {
//       return res.status(400).send(
//         "Missing redirect token"
//       );
//     }

//     const RID = getRid(req);

//     if (!RID) {
//       return res.status(400).send(
//         "Missing or invalid RID"
//       );
//     }

//     const project = await Project.findOne({
//       "redirects.quotaFull.token": tk,
//     });

//     if (!project) {
//       return res.status(404).send(
//         "Invalid quota link"
//       );
//     }

//     const response =
//       await SurveyResponse.findOne({
//         project: project._id,
//         rid: RID,
//       });

//     if (!response) {
//       return res.status(404).send(
//         "Response not found"
//       );
//     }

//     if (
//       response.status === "QUOTA_FULL"
//     ) {
//       return res.status(409).send(
//         "Response already quota full"
//       );
//     }

//     if (
//       response.status === "COMPLETED" ||
//       response.status === "DISQUALIFIED"
//     ) {
//       return res.status(409).send(
//         "Response has already been finalized"
//       );
//     }

//     if (response.status !== "STARTED") {
//       return res.status(409).send(
//         "Response is not active"
//       );
//     }

//     // ATOMIC transition
//     const updatedResponse =
//       await SurveyResponse.findOneAndUpdate(
//         {
//           _id: response._id,
//           status: "STARTED",
//         },
//         {
//           $set: {
//             status: "QUOTA_FULL",
//           },
//         },
//         {
//           new: true,
//         }
//       );

//     if (!updatedResponse) {
//       return res.status(409).send(
//         "Response has already been finalized"
//       );
//     }

//     // Increment ONLY once
//     await Project.updateOne(
//       { _id: project._id },
//       {
//         $inc: {
//           quotaFull: 1,
//         },
//       }
//     );

//     // Postback
//     try {
//       await fetch(
//         `https://api.inputify.io/api/postback` +
//         `?rid=${encodeURIComponent(RID)}` +
//         `&status=QUOTA_FULL`,
//         {
//           headers: {
//             "X-Inputify-Postback-Secret":
//               process.env.INPUTIFY_POSTBACK_SECRET,
//           },
//         }
//       );
//     } catch (err) {
//       console.error(
//         "QF postback failed:",
//         err.message
//       );
//     }

//     let redirectUrl =
//       project.vendorLinks?.[0]?.quotaFull;

//     if (!redirectUrl) {
//       redirectUrl =
//         "https://inputify.io/quota-full";
//     }

//     try {
//       const url = new URL(redirectUrl);

//       url.searchParams.set(
//         "RID",
//         RID
//       );

//       redirectUrl = url.toString();

//     } catch {}

//     return res.redirect(
//       redirectUrl
//     );

//   } catch (err) {
//     console.error(
//       "QF REDIRECT ERROR:",
//       err
//     );

//     return res.status(500).send(
//       "Unable to mark quota full"
//     );
//   }
// });
// =====================================================
// QUOTA FULL - TARGET GROUP SPECIFIC
// =====================================================

router.get("/qf", async (req, res) => {
  try {
    const { tk } = req.query;

    if (!tk) {
      return res.status(400).send(
        "Missing redirect token"
      );
    }

    // =================================================
    // GET RID
    // =================================================

    const RID = getRid(req);

    if (!RID) {
      return res.status(400).send(
        "Missing or invalid RID"
      );
    }

    // =================================================
    // FIND PROJECT USING TARGET GROUP QF TOKEN
    // =================================================

    const project = await Project.findOne({
      "targetGroups.redirects.quotaFull.token": tk,
    });

    if (!project) {
      return res.status(404).send(
        "Invalid quota link"
      );
    }

    // =================================================
    // FIND EXACT TARGET GROUP
    // =================================================

    const targetGroup = project.targetGroups.find(
      (group) =>
        group.redirects?.quotaFull?.token === tk
    );

    if (!targetGroup) {
      return res.status(404).send(
        "Target group not found"
      );
    }

    // =================================================
    // FIND RESPONSE
    // =================================================

    const response =
      await SurveyResponse.findOne({
        project: project._id,
        targetGroup: targetGroup._id,
        rid: RID,
      });

    if (!response) {
      return res.status(404).send(
        "Response not found"
      );
    }

    // =================================================
// VERIFY RESPONSE SESSION
// =================================================

const validSession =
  validateResponseSession(
    req,
    response,
    project,
    targetGroup
  );

if (!validSession) {
  return res.status(403).send(
    "Invalid or expired survey session"
  );
}

    // =================================================
    // CHECK CURRENT STATUS
    // =================================================

    if (response.status === "QUOTA_FULL") {
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

    // =================================================
    // ATOMIC RESPONSE TRANSITION
    // =================================================

    const updatedResponse =
      await SurveyResponse.findOneAndUpdate(
        {
          _id: response._id,
          project: project._id,
      targetGroup: targetGroup._id,
      rid: RID,
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

    destroyResponseSession(req);

    // =================================================
    // INCREMENT TARGET GROUP COUNTERS
    // =================================================

    await Project.updateOne(
      {
        _id: project._id,
        "targetGroups._id": targetGroup._id,
      },
      {
        $inc: {
          "targetGroups.$.quotaFull": 1,
          "targetGroups.$.totalResponses": 1,
        },
      }
    );

    // =================================================
    // UPDATE PROJECT TOTALS
    // =================================================

    await Project.updateOne(
      {
        _id: project._id,
      },
      {
        $inc: {
          quotaFull: 1,
          totalResponses: 1,
        },
      }
    );

    // =================================================
    // POSTBACK
    // =================================================

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

    // =================================================
    // TARGET GROUP QF REDIRECT
    // =================================================

    let redirectUrl =
      targetGroup.redirects?.quotaFull?.url ||
      project.vendorLinks?.[0]?.quotaFull ||
      "https://inputify.io/quota-full";

    // =================================================
    // PASS RID
    // =================================================

    try {
      const url = new URL(redirectUrl);

      url.searchParams.set(
        "RID",
        RID
      );

      redirectUrl =
        url.toString();

    } catch {
      // Keep original URL
    }

    return res.redirect(
      redirectUrl
    );

  } catch (err) {
    console.error(
      "TARGET GROUP QF REDIRECT ERROR:",
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


