import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import Notification from "../models/Notification.model.js";

const router = express.Router();

// GET notifications
router.get("/", authMiddleware, async (req, res) => {
  const notifications = await Notification.find({
    user: req.user.userId,
  }).sort({ createdAt: -1 });

  res.json(notifications);
});

// MARK AS READ
router.put("/:id/read", authMiddleware, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, {
    read: true,
  });

  res.json({ message: "Marked as read" });
});

export default router;