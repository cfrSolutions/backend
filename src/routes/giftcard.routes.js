// import express from "express";
// import GiftCardV2 from "../models/GiftCardV2.model.js";
// import Wallet from "../models/Wallet.model.js";
// import WalletTransaction from "../models/WalletTransaction.model.js";
// import GiftCardRedemption from "../models/GiftCardRedemption.model.js";
// import { authMiddleware } from "../middleware/auth.middleware.js";
// import { syncGiftCards } from "../controllers/giftcardSync.controller.js";
// import { sendTremendousReward } from "../services/tremendous.service.js";
// import adminOnly from "../middleware/admin.middleware.js";
// import User from "../models/User.model.js";
// import axios from "axios";
// import UserProfile from "../models/UserProfile.model.js";
// import { getCurrencyFromCountry } from "../utils/countryCurrency.js";

// const tremendous = axios.create({
//   baseURL: "https://api.tremendous.com/api/v2",
//   headers: {
//     Authorization: `Bearer ${process.env.TREMENDOUS_API_KEY}`,
//     "Content-Type": "application/json",
//   },
// });

// const router = express.Router();

// /* GET AVAILABLE CARDS */
// router.get("/", authMiddleware, async (req, res) => {
//   const userId = req.user._id || req.user.id || req.user.userId;
//   const user = await User.findById(userId);
//    // ✅ Get profile
//     const profile = await UserProfile.findOne({
//       user: userId,
//     });

//     if (!profile || !profile.countryCode) {
//       return res.json([]);
//     }
//     const countryCode = profile?.countryCode;
// const currency = getCurrencyFromCountry(countryCode);
//   const cards = await GiftCardV2.find({
//       isActive: true,
//   currency,
//     });
//   res.json(cards);
  
// });
// // router.get("/", authMiddleware, async (req, res) => {
// //   const cards = await GiftCard.find({});
// //   console.log("GiftCards:", cards.length);
// //   res.json(cards);
// // });

// router.post("/sync", authMiddleware, adminOnly, syncGiftCards);


// /* REDEEM */
// router.post("/redeem/:id", authMiddleware, async (req, res) => {
//   const userId =  req.user._id ||req.user.id || req.user.userId;
//   const user = await User.findById(userId);

//   const card = await GiftCardV2.findById(req.params.id);
//   if (!card) return res.status(404).json({ message: "Card not found" });
//   // ⭐ MINIMUM REDEMPTION RULE
// if (card.value < 5) {
//   return res.status(400).json({
//     message: "Minimum ₹100 redemption allowed"
//   });
// }
// // console.log("REDEEM CARD DEBUG", {
// //   id: card._id,
// //   title: card.title,
// //   tremendousProductId: card.tremendousProductId,
// //   // skuId: card.skuId,
// //   // value: card.value,
// //   value: card.value,
// //   currency: card.currency,

// // });

//   let wallet = await Wallet.findOne({ user: userId });

// // 🧠 AUTO-CREATE WALLET
// if (!wallet) {
//   wallet = await Wallet.create({
//     user: userId,
//     balance: 0,
//     totalEarned: 0,
//     totalRedeemed: 0,
//   });
// }

// // 🔐 NOW SAFE
// const processingFee = 0;
// const totalDeduction = card.pointsRequired + processingFee;

// if (wallet.balance < totalDeduction) {
   
//   return res.status(400).json({ message: "Insufficient points" });
// } 

// // if (wallet.balance < card.pointsRequired) {
// //   return res.status(400).json({ message: "Insufficient points" });
// // }
// let order;
// try {
//   order = await sendTremendousReward({
//     email: user.email,
//     name: user.name,
//     productId: card.tremendousProductId,
//    value: card.value,          // 🔥 ADD
//   currency: card.currency,   // 🔥 ADD
    
//   });
  
// } catch (err) {
//   console.error("TREMENDOUS REJECTION:"); 

//   return res.status(422).json({
//     message: "Reward provider failed",
//     // This sends the REAL reason to your browser console
//     details: err.response?.data?.errors?.[0]?.message || "Check server logs" 
//   });
// }

//   // 🔻 Deduct points
//   // wallet.balance -= card.pointsRequired;
//   // wallet.totalRedeemed += card.pointsRequired;

//   wallet.balance -= totalDeduction;
//   wallet.totalRedeemed += totalDeduction;

//   await wallet.save();
// const redemption = await GiftCardRedemption.create({
//     user: userId,
//     giftCard: card._id,
//     faceValue: card.value,
//    pointsUsed: totalDeduction,
//    feePoints: processingFee,
//   status: "PENDING", // ✅ VALID ENUM
//   rewardId: order.order.id,
//   providerResponse: order,
//   });

//   // 🧾 Transaction
//   await WalletTransaction.create({
//     user: userId,
//     type: "REDEEM",
//     points: card.pointsRequired,
//     description: `Redeemed ${card.title}`,
//   });

//   // 🎁 Redemption record
//   // const redemption = await GiftCardRedemption.create({
//   //   user: userId,
//   //   giftCard: card._id,
//   //  pointsUsed: card.pointsRequired, // ✅ REQUIRED
//   // status: "PENDING", // ✅ VALID ENUM
//   // });

//   // const order = await sendTremendousReward({
//   //   email: user.email,
//   //   name: user.name,
//   //   productId: card.tremendousProductId,
//   //   amount: card.value, // ex: 5, 10, 25
//   // });
  


//   // 4️⃣ Update status
//   redemption.status = "SUCCESS";
//   redemption.tremendousOrderId = order.order.id;
//   await redemption.save();

 
//   res.json({ success: true });
// });

// export default router;



import express from "express";
import crypto from "crypto";
import GiftCardV2 from "../models/GiftCardV2.model.js";
import Wallet from "../models/Wallet.model.js";
import WalletTransaction from "../models/WalletTransaction.model.js";
import GiftCardRedemption from "../models/GiftCardRedemption.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { syncGiftCards } from "../controllers/giftcardSync.controller.js";
import { sendTremendousReward } from "../services/tremendous.service.js";
import adminOnly from "../middleware/admin.middleware.js";
import User from "../models/User.model.js";
import axios from "axios";
import UserProfile from "../models/UserProfile.model.js";
import { getCurrencyFromCountry } from "../utils/countryCurrency.js";

const tremendous = axios.create({
  baseURL: "https://api.tremendous.com/api/v2",
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

router.post("/sync", authMiddleware, adminOnly, syncGiftCards);


/* REDEEM */
// router.post("/redeem/:id", authMiddleware, async (req, res) => {
//   const userId =  req.user._id ||req.user.id || req.user.userId;
//   const user = await User.findById(userId);

//   const card = await GiftCardV2.findById(req.params.id);
//   if (!card) return res.status(404).json({ message: "Card not found" });
//   // ⭐ MINIMUM REDEMPTION RULE
// if (card.value < 5) {
//   return res.status(400).json({
//     message: "Minimum ₹100 redemption allowed"
//   });
// }
// // console.log("REDEEM CARD DEBUG", {
// //   id: card._id,
// //   title: card.title,
// //   tremendousProductId: card.tremendousProductId,
// //   // skuId: card.skuId,
// //   // value: card.value,
// //   value: card.value,
// //   currency: card.currency,

// // });

//   let wallet = await Wallet.findOne({ user: userId });

// // 🧠 AUTO-CREATE WALLET
// if (!wallet) {
//   wallet = await Wallet.create({
//     user: userId,
//     balance: 0,
//     totalEarned: 0,
//     totalRedeemed: 0,
//   });
// }

// // 🔐 NOW SAFE
// const processingFee = 0;
// const totalDeduction = card.pointsRequired + processingFee;

// if (wallet.balance < totalDeduction) {
   
//   return res.status(400).json({ message: "Insufficient points" });
// } 

// // if (wallet.balance < card.pointsRequired) {
// //   return res.status(400).json({ message: "Insufficient points" });
// // }
// let order;
// try {
//   order = await sendTremendousReward({
//     email: user.email,
//     name: user.name,
//     productId: card.tremendousProductId,
//    value: card.value,          // 🔥 ADD
//   currency: card.currency,   // 🔥 ADD
    
//   });
  
// } catch (err) {
//   console.error("TREMENDOUS REJECTION:"); 

//   return res.status(422).json({
//     message: "Reward provider failed",
//     // This sends the REAL reason to your browser console
//     details: err.response?.data?.errors?.[0]?.message || "Check server logs" 
//   });
// }

//   // 🔻 Deduct points
//   // wallet.balance -= card.pointsRequired;
//   // wallet.totalRedeemed += card.pointsRequired;

//   wallet.balance -= totalDeduction;
//   wallet.totalRedeemed += totalDeduction;

//   await wallet.save();
// const redemption = await GiftCardRedemption.create({
//     user: userId,
//     giftCard: card._id,
//     faceValue: card.value,
//    pointsUsed: totalDeduction,
//    feePoints: processingFee,
//   status: "PENDING", // ✅ VALID ENUM
//   rewardId: order.order.id,
//   providerResponse: order,
//   });

//   // 🧾 Transaction
//   await WalletTransaction.create({
//     user: userId,
//     type: "REDEEM",
//     points: card.pointsRequired,
//     description: `Redeemed ${card.title}`,
//   });

//   // 🎁 Redemption record
//   // const redemption = await GiftCardRedemption.create({
//   //   user: userId,
//   //   giftCard: card._id,
//   //  pointsUsed: card.pointsRequired, // ✅ REQUIRED
//   // status: "PENDING", // ✅ VALID ENUM
//   // });

//   // const order = await sendTremendousReward({
//   //   email: user.email,
//   //   name: user.name,
//   //   productId: card.tremendousProductId,
//   //   amount: card.value, // ex: 5, 10, 25
//   // });
  


//   // 4️⃣ Update status
//   redemption.status = "SUCCESS";
//   redemption.tremendousOrderId = order.order.id;
//   await redemption.save();

 
//   res.json({ success: true });
// });

/* REDEEM */
router.post(
  "/redeem/:id",
  authMiddleware,
  async (req, res) => {
    try {
      // =========================================
      // 1. AUTHENTICATED USER
      // =========================================

      const userId =
        req.user._id ||
        req.user.id ||
        req.user.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // =========================================
      // 2. FIND USER
      // =========================================

      const user =
        await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // =========================================
      // 3. FIND GIFT CARD
      // =========================================

      const card =
        await GiftCardV2.findById(
          req.params.id
        );

      if (!card) {
        return res.status(404).json({
          success: false,
          message: "Card not found",
        });
      }

      // =========================================
      // 4. MINIMUM REDEMPTION
      // =========================================

      if (card.value < 5) {
        return res.status(400).json({
          success: false,
          message:
            "Minimum ₹100 redemption allowed",
        });
      }

      // =========================================
      // 5. POINT CALCULATION
      // =========================================

      const processingFee = 0;

      const totalDeduction =
        Number(card.pointsRequired) +
        Number(processingFee);

      if (
        !Number.isFinite(totalDeduction) ||
        totalDeduction <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid redemption amount",
        });
      }

      // =========================================
      // 6. CREATE UNIQUE REDEMPTION ID
      // =========================================

      const externalId =
        `REDEEM_${userId}_${crypto.randomUUID()}`;

      // =========================================
      // 7. ATOMICALLY RESERVE POINTS
      //
      // IMPORTANT:
      //
      // This is the protection against:
      //
      // Request A -> 1000 points
      // Request B -> 1000 points
      //
      // Both cannot reserve the same points.
      // =========================================

      const wallet =
        await Wallet.findOneAndUpdate(
          {
            user: userId,

            balance: {
              $gte: totalDeduction,
            },
          },
          {
            $inc: {
              balance: -totalDeduction,
              totalRedeemed: totalDeduction,
            },
          },
          {
            new: true,
          }
        );

      if (!wallet) {
        return res.status(400).json({
          success: false,
          message: "Insufficient points",
        });
      }

      // =========================================
      // 8. CREATE PENDING REDEMPTION
      // =========================================

      let redemption;

      try {
        redemption =
          await GiftCardRedemption.create({
            user: userId,

            giftCard: card._id,

            faceValue: card.value,

            pointsUsed:
              totalDeduction,

            feePoints:
              processingFee,

            status: "PENDING",

            externalId,
          });
      } catch (dbError) {

        // =====================================
        // ROLLBACK POINTS
        // =====================================

        await Wallet.updateOne(
          {
            user: userId,
          },
          {
            $inc: {
              balance: totalDeduction,
              totalRedeemed:
                -totalDeduction,
            },
          }
        );

        console.error(
          "REDEMPTION CREATE FAILED:",
          dbError
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to create redemption",
        });
      }

      // =========================================
      // 9. CALL TREMENDOUS
      // =========================================

      let order;

      try {

        order =
          await sendTremendousReward({
            email: user.email,

            name: user.name,

            productId:
              card.tremendousProductId,

            value:
              card.value,

            currency:
              card.currency,

            // ⭐ IMPORTANT
            externalId,
          });

      } catch (err) {

        console.error(
          "TREMENDOUS REJECTION:",
          err.response?.data ||
            err.message
        );

        // =====================================
        // REFUND POINTS
        // =====================================

        await Wallet.updateOne(
          {
            user: userId,
          },
          {
            $inc: {
              balance: totalDeduction,
              totalRedeemed:
                -totalDeduction,
            },
          }
        );

        // =====================================
        // MARK REDEMPTION FAILED
        // =====================================

        redemption.status =
          "FAILED";

        await redemption.save();

        return res.status(422).json({
          success: false,
          message:
            "Reward provider failed",
        });
      }

      // =========================================
      // 10. GET ORDER ID
      // =========================================

      const orderId =
        order?.order?.id ||
        order?.id ||
        "";

      // =========================================
      // 11. UPDATE REDEMPTION
      // =========================================

      redemption.status =
        "SUCCESS";

      redemption.rewardId =
        orderId;

      redemption.tremendousOrderId =
        orderId;

      redemption.providerResponse =
        order;

      await redemption.save();

      // =========================================
      // 12. WALLET TRANSACTION
      // =========================================

      await WalletTransaction.create({
        user: userId,

        type: "REDEEM",

        points: totalDeduction,

        description:
          `Redeemed ${card.title}`,
      });

      // =========================================
      // 13. SUCCESS
      // =========================================

      return res.json({
        success: true,

        message:
          "Gift card redeemed successfully",

        redemptionId:
          redemption._id,

        orderId,
      });

    } catch (err) {

      console.error(
        "REDEEM ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Redemption failed",
      });
    }
  }
);

export default router;
