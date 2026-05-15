import crypto from "crypto";
import express from "express";
import Project from "../models/Project.model.js";

const router = express.Router();
global.sessions = global.sessions || {};

router.get("/start", async (req, res) => {
  const { tk } = req.query;

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

  // same IP + browser check
  if (
    session.ip !== req.ip ||
    session.ua !== req.headers["user-agent"]
  ) {
    return res.send("Fingerprint mismatch");
  }

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
  // res.send("Completed");
  res.redirect("https://inputify.io/thank-you");
});

router.get("/dq", async (req, res) => {
  const { tk } = req.query;

  const project = await Project.findOne({
    "redirects.disqualified.token": tk,
  });

  if (!project) return res.send("Invalid");

  await Project.updateOne(
    { _id: project._id },
    { $inc: { disqualified: 1, totalResponses: 1, } }
  );

  // res.send("Disqualified");
  res.redirect("https://inputify.io/disqualified");
});

router.get("/qf", async (req, res) => {
  const { tk } = req.query;

  const project = await Project.findOne({
    "redirects.quotaFull.token": tk,
  });

  if (!project) return res.send("Invalid");

  await Project.updateOne(
    { _id: project._id },
    { $inc: { quotaFull: 1, totalResponses: 1, } }
  );

  // res.send("Quota Full");
  res.redirect("https://inputify.io/quota-full");
});

export default router;