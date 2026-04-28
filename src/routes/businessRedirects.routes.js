import express from "express";
import Project from "../models/Project.model.js";

const router = express.Router();

router.get("/start", async (req, res) => {
  const { tk } = req.query;

  const project = await Project.findOne({
    "redirects.complete.token": tk,
  });

  if (!project) return res.send("Invalid link");

  if (project.status !== "LIVE") {
    return res.send("Survey not Live");
  }

  if (project.completes >= project.targetCompletes) {
    return res.redirect(`/api/redirect/qf?tk=${project.redirects.quotaFull.token}`);
  }

  const surveyLink = project.surveyLinks?.live;
  if (!surveyLink) return res.send("Survey not Set");

  res.redirect(surveyLink);
});

router.get("/c", async (req, res) => {
  const { tk } = req.query;

  const project = await Project.findOne({
    "redirects.complete.token": tk,
  });

  if (!project) return res.send("Invalid");

  if (project.completes >= project.targetCompletes) {
    return res.redirect(`/api/redirect/qf?tk=${project.redirects.quotaFull.token}`);
  }

  await Project.updateOne(
    { _id: project._id },
    { $inc: { completes: 1 } }
  );

  res.send("Completed");
});

router.get("/dq", async (req, res) => {
  const { tk } = req.query;

  const project = await Project.findOne({
    "redirects.disqualified.token": tk,
  });

  if (!project) return res.send("Invalid");

  await Project.updateOne(
    { _id: project._id },
    { $inc: { disqualified: 1 } }
  );

  res.send("Disqualified");
});

router.get("/qf", async (req, res) => {
  const { tk } = req.query;

  const project = await Project.findOne({
    "redirects.quotaFull.token": tk,
  });

  if (!project) return res.send("Invalid");

  await Project.updateOne(
    { _id: project._id },
    { $inc: { quotaFull: 1 } }
  );

  res.send("Quota Full");
});

export default router;