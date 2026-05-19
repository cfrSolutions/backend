import crypto from "crypto";
import express from "express";
import Project from "../models/Project.model.js";

const router = express.Router();
global.sessions = global.sessions || {};
//global.completedUsers = global.completedUsers || {};

router.get("/start", async (req, res) => {
  const { tk } = req.query;
  const fingerprint = `${req.ip}-${req.headers["user-agent"]}`;
  const project = await Project.findOne({
    "redirects.start.token": tk,
  });

  if (!project) return res.send("Invalid link");


  if(project.status == "COMPLETED"){
    return res.send("survey completed");
  }
  
  if (project.status !== "LIVE") {
    return res.send("Survey not Live");
  }
const existingSid = req.cookies.sid;

if (
  existingSid &&
  global.sessions[existingSid] &&
  !global.sessions[existingSid].used &&
  global.sessions[existingSid].projectId === project._id.toString()
) {
  return res.redirect(project.surveyLinks.live);
}


  //const key = `${project._id}-${fingerprint}`;

// if (global.completedUsers[key]) {
//   return res.send("You already completed this survey");
// }
if (req.cookies[`completed_${project._id}`]) {
  return res.send("You already completed this survey");
}
   const sid = crypto.randomBytes(16).toString("hex");

 
  global.sessions[sid] = {
    projectId: project._id.toString(),
    used: false,
    ip: req.ip,
    ua: req.headers["user-agent"],
    createdAt: Date.now(),
  };

  res.cookie("sid", sid, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60, 
    sameSite: "lax",
  });

  if (project.completes >= project.targetCompletes) {
    return res.redirect(`/api/redirect/qf?tk=${project.redirects.quotaFull.token}`);
  }
  

  const surveyLink = project.surveyLinks?.live;
  if (!surveyLink) return res.send("Survey not Set");

  res.redirect(surveyLink);
});

router.get("/c", async (req, res) => {
  const { tk } = req.query;
  const sid = req.cookies.sid;
  if(!sid){
    return res.send("No Session");
  }

  const session = global.sessions[sid];
   if (!session || session.used) {
    return res.send("Invalid or reused session");
  }

  const project = await Project.findOne({
    "redirects.complete.token": tk,
  });

  if (!project) return res.send("Invalid");

  if (session.projectId !== project._id.toString()) {
    return res.send("Session mismatch");
  }

res.cookie(`completed_${project._id}`, "true", {
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24 * 30,
  sameSite: "lax",
  secure: true,
  domain: ".inputify.io",
});
  
//   if (session.ip !== req.ip) {
//   console.log("IP changed:", session.ip, req.ip);
// }

  // if (project.completes >= project.targetCompletes) {
  //   return res.redirect(`/api/redirect/qf?tk=${project.redirects.quotaFull.token}`);
  // }

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

  session.used = true;

delete global.sessions[sid];


res.clearCookie("sid");

  await Project.updateOne(
    { _id: project._id },
    { $inc: { completes: 1, totalResponses: 1, }, }
  );

  if(project.completes + 1 >= project.targetCompletes){
    await Project.updateOne(
      {_id: project._id},
      {
        status: "COMPLETED",
      }
    );
  }
//   const fingerprint = `${req.ip}-${req.headers["user-agent"]}`;

// const key = `${project._id}-${fingerprint}`;

// global.completedUsers[key] = true;
  // res.send("Completed");
  res.redirect("https://inputify.io/thank-you");
});

router.get("/dq", async (req, res) => {
  const { tk } = req.query;
  const sid = req.cookies.sid;

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

  if (!project) return res.send("Invalid");
  if (session.projectId !== project._id.toString()) {
  return res.send("Session mismatch");
}
session.used = true;
  await Project.updateOne(
    { _id: project._id },
    { $inc: { disqualified: 1, totalResponses: 1, } }
  );
const fingerprint = `${req.ip}-${req.headers["user-agent"]}`;

//const key = `${project._id}-${fingerprint}`;

// global.completedUsers[key] = true;
  // res.send("Disqualified");
  res.redirect("https://inputify.io/disqualified");
});

router.get("/qf", async (req, res) => {
  const { tk } = req.query;
const sid = req.cookies.sid;

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

  if (!project) return res.send("Invalid");
  if (session.projectId !== project._id.toString()) {
  return res.send("Session mismatch");
}
session.used = true;
  await Project.updateOne(
    { _id: project._id },
    { $inc: { quotaFull: 1, totalResponses: 1, } }
  );
// const fingerprint = `${req.ip}-${req.headers["user-agent"]}`;

// const key = `${project._id}-${fingerprint}`;

// global.completedUsers[key] = true;
  // res.send("Quota Full");
  res.redirect("https://inputify.io/quota-full");
});
setInterval(() => {
  const now = Date.now();

  for (const sid in global.sessions) {
    const session = global.sessions[sid];

    // remove after 1 hour
    if (now - session.createdAt > 1000 * 60 * 60) {
      delete global.sessions[sid];
    }
  }
}, 1000 * 60 * 10);
export default router;