// routes/wallet.routes.js
const router = express.Router();
import express from "express";
import mongoose from "mongoose";
import Wallet from "../models/Wallet.model.js";
import WalletTransaction from "../models/WalletTransaction.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
router.get("/", authMiddleware, async (req, res) => {
 const userId =
    req.user._id ||
    req.user.id ||
    req.user.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  let wallet = await Wallet.findOne({ user: userObjectId });

  if (!wallet) {
    wallet = await Wallet.create({
      user: userObjectId,
      balance: 0,
      totalEarned: 0,
      totalRedeemed: 0,
    });
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const earnedToday = await WalletTransaction.aggregate([
    {
      $match: {
        user: userObjectId,
        type: "EARN",
        createdAt: { $gte: today },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$points" },
      },
    },
  ]);
console.log("WALLET FETCH USER:", userObjectId.toString());

  res.json({
    balance: wallet?.balance || 0,
    totalEarned: wallet?.totalEarned || 0,
    totalRedeemed: wallet?.totalRedeemed || 0,
    earnedToday: earnedToday[0]?.total || 0,
  });
});

router.get("/transactions", authMiddleware, async (req, res) => {
  const userId =
    req.user._id ||
    req.user.id ||
    req.user.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tx = await WalletTransaction.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json(tx);
  
});

export default router;
