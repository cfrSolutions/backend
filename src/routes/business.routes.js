// // routes/business.routes.js
// import express from "express";
// import { authMiddleware } from "../middleware/auth.middleware.js";
// import { businessOnly } from "../middleware/business.middleware.js";
// import Project from "../models/Project.model.js";

// const router = express.Router();


// // 📊 Get dashboard data
// router.get(
//   "/dashboard",
//   authMiddleware,
//   businessOnly,
//   async (req, res) => {
//     const projects = await Project.find({
//       businessId: req.user.userId,
//     });

//     // calculate stats
//     const total = projects.length;
//     const live = projects.filter(p => p.status === "LIVE").length;
//     const hold = projects.filter(p => p.status === "HOLD").length;
//     const closed = projects.filter(p => p.status === "CLOSED").length;

//     res.json({
//       total,
//       live,
//       hold,
//       closed,
//       projects,
//     });
//   }
// );


// // ➕ Create project
// router.post(
//   "/project",
//   authMiddleware,
//   businessOnly,
//   async (req, res) => {
//     const { name } = req.body;

//     const surveyId = Math.random().toString(36).substring(2, 8);

//     const project = await Project.create({
//       name,
//       surveyId,
//       businessId: req.user.userId,
//       status: "LIVE",
//     });

//     res.json(project);
//   }
// );


// // 📄 Get all projects
// router.get(
//   "/projects",
//   authMiddleware,
//   businessOnly,
//   async (req, res) => {
//     const projects = await Project.find({
//       businessId: req.user.userId,
//     });

//     res.json(projects);
//   }
// );

// export default router;