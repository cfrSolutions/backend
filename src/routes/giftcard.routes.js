import express from "express";
import GiftCardV2 from "../models/GiftCardV2.model.js";
import Wallet from "../models/Wallet.model.js";
import WalletTransaction from "../models/WalletTransaction.model.js";
import GiftCardRedemption from "../models/GiftCardRedemption.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { syncGiftCards } from "../controllers/giftcardSync.controller.js";
import { sendTremendousReward } from "../services/tremendous.service.js";
import User from "../models/User.model.js";
import axios from "axios";
import UserProfile from "../models/UserProfile.model.js";
import { getCurrencyFromCountry } from "../utils/countryCurrency.js";

const tremendous = axios.create({
  baseURL: "https://testflight.tremendous.com/api/v2",
  headers: {
    Authorization: `Bearer ${process.env.TREMENDOUS_API_KEY}`,
    "Content-Type": "application/json",
  },
});

const router = express.Router();

/* GET AVAILABLE CARDS */
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user._id || req.user.id || req.user.userId;
  const user = await User.findById(userId);
   // ✅ Get profile
    const profile = await UserProfile.findOne({
      user: userId,
    });

    if (!profile || !profile.countryCode) {
      return res.json([]);
    }
    const countryCode = profile?.countryCode;
const currency = getCurrencyFromCountry(countryCode);
  const cards = await GiftCardV2.find({
      isActive: true,
  currency,
    });
  res.json(cards);
  
});
// router.get("/", authMiddleware, async (req, res) => {
//   const cards = await GiftCard.find({});
//   console.log("GiftCards:", cards.length);
//   res.json(cards);
// });

router.post("/sync", authMiddleware, syncGiftCards);


/* REDEEM */
router.post("/redeem/:id", authMiddleware, async (req, res) => {
  const userId =  req.user._id ||req.user.id || req.user.userId;
  const user = await User.findById(userId);

  const card = await GiftCardV2.findById(req.params.id);
  if (!card) return res.status(404).json({ message: "Card not found" });
  // ⭐ MINIMUM REDEMPTION RULE
if (card.value < 5) {
  return res.status(400).json({
    message: "Minimum ₹100 redemption allowed"
  });
}
console.log("REDEEM CARD DEBUG", {
  id: card._id,
  title: card.title,
  tremendousProductId: card.tremendousProductId,
  // skuId: card.skuId,
  // value: card.value,
  value: card.value,
  currency: card.currency,

});

  let wallet = await Wallet.findOne({ user: userId });

// 🧠 AUTO-CREATE WALLET
if (!wallet) {
  wallet = await Wallet.create({
    user: userId,
    balance: 0,
    totalEarned: 0,
    totalRedeemed: 0,
  });
}

// 🔐 NOW SAFE
const processingFee = 200;
const totalDeduction = card.pointsRequired + processingFee;
if (wallet.balance < totalDeduction) {
  return res.status(400).json({ message: "Insufficient points" });
} 
// if (wallet.balance < card.pointsRequired) {
//   return res.status(400).json({ message: "Insufficient points" });
// }
let order;
try {
  order = await sendTremendousReward({
    email: user.email,
    name: user.name,
    productId: card.tremendousProductId,
   value: card.value,          // 🔥 ADD
  currency: card.currency,   // 🔥 ADD
    
  });
} catch (err) {
  console.error("TREMENDOUS REJECTION:", JSON.stringify(err.response?.data, null, 2)); 

  return res.status(422).json({
    message: "Reward provider failed",
    // This sends the REAL reason to your browser console
    details: err.response?.data?.errors?.[0]?.message || "Check server logs" 
  });
}

  // 🔻 Deduct points
  // wallet.balance -= card.pointsRequired;
  // wallet.totalRedeemed += card.pointsRequired;

  wallet.balance -= totalDeduction;
  wallet.totalRedeemed += totalDeduction;

  await wallet.save();
const redemption = await GiftCardRedemption.create({
    user: userId,
    giftCard: card._id,
    faceValue: card.value,
   pointsUsed: totalDeduction,
   feePoints: processingFee,
  status: "PENDING", // ✅ VALID ENUM
  rewardId: order.order.id,
  providerResponse: order,
  });

  // 🧾 Transaction
  await WalletTransaction.create({
    user: userId,
    type: "REDEEM",
    points: card.pointsRequired,
    description: `Redeemed ${card.title}`,
  });

  // 🎁 Redemption record
  // const redemption = await GiftCardRedemption.create({
  //   user: userId,
  //   giftCard: card._id,
  //  pointsUsed: card.pointsRequired, // ✅ REQUIRED
  // status: "PENDING", // ✅ VALID ENUM
  // });

  // const order = await sendTremendousReward({
  //   email: user.email,
  //   name: user.name,
  //   productId: card.tremendousProductId,
  //   amount: card.value, // ex: 5, 10, 25
  // });
  


  // 4️⃣ Update status
  redemption.status = "SUCCESS";
  redemption.tremendousOrderId = order.order.id;
  await redemption.save();

 
  res.json({ success: true });
});

export default router;
