// import crypto from "crypto";
// import express from "express";
// import Project from "../models/Project.model.js";

// const router = express.Router();
// global.sessions = global.sessions || {};
// //global.completedUsers = global.completedUsers || {};

// router.get("/start", async (req, res) => {
//   const { tk } = req.query;
//   const fingerprint = `${req.ip}-${req.headers["user-agent"]}`;
//   const project = await Project.findOne({
//     "redirects.start.token": tk,
//   });

//   if (!project) return res.send("Invalid link");


//   if(project.status == "COMPLETED"){
//     return res.send("survey completed");
//   }
  
//   if (project.status !== "LIVE") {
//     return res.send("Survey not Live");
//   }
// const existingSid = req.cookies.sid;

// if (
//   existingSid &&
//   global.sessions[existingSid] &&
//   !global.sessions[existingSid].used &&
//   global.sessions[existingSid].projectId === project._id.toString()
// ) {
//   return res.redirect(project.surveyLinks.live);
// }


//   //const key = `${project._id}-${fingerprint}`;

// // if (global.completedUsers[key]) {
// //   return res.send("You already completed this survey");
// // }
// if (req.cookies[`completed_${project._id}`]) {
//   return res.send("You already completed this survey");
// }
//    const sid = crypto.randomBytes(16).toString("hex");

 
//   global.sessions[sid] = {
//     projectId: project._id.toString(),
//     used: false,
//     ip: req.ip,
//     ua: req.headers["user-agent"],
//     createdAt: Date.now(),
//   };

//   res.cookie("sid", sid, {
//     httpOnly: true,
//     maxAge: 1000 * 60 * 60, 
//     sameSite: "none",
//   secure: true,
//   domain: ".inputify.io",
//   });

//   if (project.completes >= project.targetCompletes) {
//     return res.redirect(`/api/redirect/qf?tk=${project.redirects.quotaFull.token}`);
//   }
  

//   const surveyLink = project.surveyLinks?.live;
//   if (!surveyLink) return res.send("Survey not Set");

//   res.redirect(surveyLink);
// });

// router.get("/c", async (req, res) => {
//   const { tk } = req.query;
//   const sid = req.cookies.sid;
//   if(!sid){
//     return res.send("No Session");
//   }

//   const session = global.sessions[sid];
//    if (!session || session.used) {
//     return res.send("Invalid or reused session");
//   }

//   const project = await Project.findOne({
//     "redirects.complete.token": tk,
//   });

//   if (!project) return res.send("Invalid");

//   if (session.projectId !== project._id.toString()) {
//     return res.send("Session mismatch");
//   }

// res.cookie(`completed_${project._id}`, "true", {
//   httpOnly: true,
//   maxAge: 1000 * 60 * 60 * 24 * 30,
//  sameSite: "none",
// secure: true,
// domain: ".inputify.io",
// });
  
// //   if (session.ip !== req.ip) {
// //   console.log("IP changed:", session.ip, req.ip);
// // }

//   // if (project.completes >= project.targetCompletes) {
//   //   return res.redirect(`/api/redirect/qf?tk=${project.redirects.quotaFull.token}`);
//   // }

//   if (project.completes >= project.targetCompletes) {
//     await Project.updateOne(
//     { _id: project._id },
//     {
//       $inc: {
//         quotaFull: 1,
//         totalResponses: 1,
//       },
//     }
//   );

//   return res.redirect("https://inputify.io/quota-full");
//   }

//   session.used = true;

// delete global.sessions[sid];


// res.clearCookie("sid", {
//   domain: ".inputify.io",
// });

//   await Project.updateOne(
//     { _id: project._id },
//     { $inc: { completes: 1, totalResponses: 1, }, }
//   );

//   if(project.completes + 1 >= project.targetCompletes){
//     await Project.updateOne(
//       {_id: project._id},
//       {
//         status: "COMPLETED",
//       }
//     );
//   }
// //   const fingerprint = `${req.ip}-${req.headers["user-agent"]}`;

// // const key = `${project._id}-${fingerprint}`;

// // global.completedUsers[key] = true;
//   // res.send("Completed");
//   res.redirect("https://inputify.io/thank-you");
// });

// router.get("/dq", async (req, res) => {
//   const { tk } = req.query;
//   const sid = req.cookies.sid;

// if (!sid) {
//   return res.send("No Session");
// }

// const session = global.sessions[sid];

// if (!session || session.used) {
//   return res.send("Invalid or reused session");
// }

//   const project = await Project.findOne({
//     "redirects.disqualified.token": tk,
//   });

//   if (!project) return res.send("Invalid");
//   if (session.projectId !== project._id.toString()) {
//   return res.send("Session mismatch");
// }
// session.used = true;
//   await Project.updateOne(
//     { _id: project._id },
//     { $inc: { disqualified: 1, totalResponses: 1, } }
//   );
// const fingerprint = `${req.ip}-${req.headers["user-agent"]}`;

// //const key = `${project._id}-${fingerprint}`;

// // global.completedUsers[key] = true;
//   // res.send("Disqualified");
//   res.redirect("https://inputify.io/disqualified");
// });

// router.get("/qf", async (req, res) => {
//   const { tk } = req.query;
// const sid = req.cookies.sid;

// if (!sid) {
//   return res.send("No Session");
// }

// const session = global.sessions[sid];

// if (!session || session.used) {
//   return res.send("Invalid or reused session");
// }
//   const project = await Project.findOne({
//     "redirects.quotaFull.token": tk,
//   });

//   if (!project) return res.send("Invalid");
//   if (session.projectId !== project._id.toString()) {
//   return res.send("Session mismatch");
// }
// session.used = true;
//   await Project.updateOne(
//     { _id: project._id },
//     { $inc: { quotaFull: 1, totalResponses: 1, } }
//   );
// // const fingerprint = `${req.ip}-${req.headers["user-agent"]}`;

// // const key = `${project._id}-${fingerprint}`;

// // global.completedUsers[key] = true;
//   // res.send("Quota Full");
//   res.redirect("https://inputify.io/quota-full");
// });
// setInterval(() => {
//   const now = Date.now();

//   for (const sid in global.sessions) {
//     const session = global.sessions[sid];

//     // remove after 1 hour
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

router.get("/start", async (req, res) => {
  const { tk } = req.query;

  
  const project = await Project.findOne({
    "redirects.start.token": tk,
  });

  if (!project) {
    return res.send("Invalid link");
  }

  if (project.status === "COMPLETED") {
    return res.send("Survey completed");
  }

  if (project.status !== "LIVE") {
    return res.send("Survey not Live");
  }

  if (project.completes >= project.targetCompletes) {
    return res.redirect(
      `/api/redirect/qf?tk=${project.redirects.quotaFull.token}`
    );
  }

  let surveyLink = project.surveyLinks?.live;

  if (!surveyLink) {
    return res.send("Survey not Set");
  }


  const trackingParam =
  project.trackingParam || "pid";

surveyLink = surveyLink.replace(
  `${trackingParam}=`,
  `${trackingParam}=${rid}`
);
  // // Generate unique session id
  // const sid = crypto.randomBytes(16).toString("hex");

  // Store session
  global.sessions[sid] = {
    projectId: project._id.toString(),
    used: false,
    ip: req.ip,
    ua: req.headers["user-agent"],
    createdAt: Date.now(),
  };

  // Inject pid into SBO survey URL
  surveyLink = surveyLink.replace(
    "pid=",
    `pid=${sid}`
  );

  return res.redirect(surveyLink);
});

router.get("/c", async (req, res) => {
  const { tk } = req.query;

  const { pid } = req.query;

  console.log("PID:", pid);
  const response = await SurveyResponse.findById(pid);
  console.log("RESPONSE:", response);

if (response && response.status !== "COMPLETED") {
  response.status = "COMPLETED";
  response.completedAt = new Date();

  await response.save();
}
  const project = await Project.findOne({
    "redirects.complete.token": tk,
  });

  if (!project) {
    return res.send("Invalid");
  }

  if (project.completes >= project.targetCompletes) {
    await Project.updateOne(
      { _id: project._id },
      {
        $inc: {
          quotaFull: 1,
          totalResponses: 1,
        },
      }
    );

    return res.redirect("https://inputify.io/quota-full");
  }

  await Project.updateOne(
    { _id: project._id },
    {
      $inc: {
        completes: 1,
        totalResponses: 1,
      },
    }
  );

  if (project.completes + 1 >= project.targetCompletes) {
    await Project.updateOne(
      { _id: project._id },
      {
        status: "COMPLETED",
      }
    );
  }

  return res.redirect("https://inputify.io/thank-you");
});


// router.get("/c", async (req, res) => {
//   const { tk } = req.query;

//   const project = await Project.findOne({
//     "redirects.complete.token": tk,
//   });

//   if (!project) {
//     return res.send("Invalid");
//   }

//   // DYNAMIC PARAM SUPPORT
//   const trackingParam =
//     project.trackingParam || "pid";

//   const id = req.query[trackingParam];

//   if (!id) {
//     return res.send("Missing tracking id");
//   }

//   const response =
//     await SurveyResponse.findById(id);

//   if (
//     response &&
//     response.status !== "COMPLETED"
//   ) {
//     response.status = "COMPLETED";
//     response.completedAt = new Date();

//     await response.save();
//   }

//   if (
//     project.completes >=
//     project.targetCompletes
//   ) {
//     await Project.updateOne(
//       { _id: project._id },
//       {
//         $inc: {
//           quotaFull: 1,
//           totalResponses: 1,
//         },
//       }
//     );

//     return res.redirect(
//       "https://inputify.io/quota-full"
//     );
//   }

//   await Project.updateOne(
//     { _id: project._id },
//     {
//       $inc: {
//         completes: 1,
//         totalResponses: 1,
//       },
//     }
//   );

//   if (
//     project.completes + 1 >=
//     project.targetCompletes
//   ) {
//     await Project.updateOne(
//       { _id: project._id },
//       {
//         status: "COMPLETED",
//       }
//     );
//   }

//   return res.redirect(
//     "https://inputify.io/user/dashboard?st=com"
//   );
// });



router.get("/dq", async (req, res) => {
  const { tk } = req.query;

  // IMPORTANT: get pid from URL
  const sid = req.query.pid;

  if (!sid) {
    return res.send("No Session");
  }

  const session = global.sessions[sid];

  if (!session || session.used) {
    return res.send("Invalid or reused session");
  }

  const project = await Project.findOne({
    "redirects.disqualified.token": tk,
  });

  if (!project) {
    return res.send("Invalid");
  }

  if (session.projectId !== project._id.toString()) {
    return res.send("Session mismatch");
  }

  session.used = true;

  delete global.sessions[sid];

  await Project.updateOne(
    { _id: project._id },
    {
      $inc: {
        disqualified: 1,
        totalResponses: 1,
      },
    }
  );

  return res.redirect("https://inputify.io/disqualified");
});

router.get("/qf", async (req, res) => {
  const { tk } = req.query;

  // IMPORTANT: get pid from URL
  const sid = req.query.pid;

  if (!sid) {
    return res.send("No Session");
  }

  const session = global.sessions[sid];

  if (!session || session.used) {
    return res.send("Invalid or reused session");
  }

  const project = await Project.findOne({
    "redirects.quotaFull.token": tk,
  });

  if (!project) {
    return res.send("Invalid");
  }

  if (session.projectId !== project._id.toString()) {
    return res.send("Session mismatch");
  }

  session.used = true;

  delete global.sessions[sid];

  await Project.updateOne(
    { _id: project._id },
    {
      $inc: {
        quotaFull: 1,
        totalResponses: 1,
      },
    }
  );

  return res.redirect("https://inputify.io/quota-full");
});

// Cleanup old sessions every 10 minutes
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

