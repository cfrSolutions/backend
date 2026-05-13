import express from "express";
import Project from "../models/Project.model.js";

const router = express.Router();

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