// import express from "express";
// import auth from "../middleware/auth.js";
// import UserSession from "../models/UserSession.js";

// const router = express.Router();

// router.get("/sessions", auth, async (req, res) => {
//   try {
//     const sessions = await UserSession.find({
//       userId: req.user.userId,
//       isActive: true,
//     }).sort({ lastActiveAt: -1 });

//     res.json({
//       count: sessions.length,
//       sessions: sessions.map((s) => ({
//         id: s._id,
//         device: s.device,
//         os: s.os,
//         ip: s.ip,
//         lastActiveAt: s.lastActiveAt,
//         isCurrent: s._id.toString() === req.user.sessionId,
//       })),
//     });
//   } catch (err) {
//     console.error("SESSIONS ERROR:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// export default router;


import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import UserSession from "../models/UserSession.js";

const router = express.Router();

/* GET ACTIVE SESSIONS */
router.get("/sessions", authMiddleware, async (req, res) => {
  console.log("Fetching sessions for:", req.user.userId);

  const sessions = await UserSession.find({
    userId: req.user.userId,
    isActive: true,
  }).sort({ lastActiveAt: -1 });

  res.json({
    sessions: sessions.map((s) => ({
      id: s._id,
      device: s.device,
      os: s.os,
      lastActiveAt: s.lastActiveAt,
      isCurrent: s._id.toString() === req.user.sessionId,
    })),
  });
});


/* LOGOUT DEVICE */
router.delete("/sessions/:id", authMiddleware, async (req, res) => {
  if (req.params.id === req.user.sessionId) {
    return res.status(400).json({
      message: "Cannot log out current device",
    });
  }

  await UserSession.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.userId },
    { isActive: false }
  );

  res.json({ message: "Device logged out" });
});

export default router;
