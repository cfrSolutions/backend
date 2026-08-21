// import express from "express";
// import { authMiddleware } from "../middleware/auth.middleware.js";
// import {
//   registerUser,
//   login,
//   verifyEmail,
// } from "../controllers/auth.controller.js";
// import User from "../models/User.model.js";
// import passport from "passport";
// import jwt from "jsonwebtoken";

// const router = express.Router();

// router.post("/register", registerUser);
// router.post("/login", login);
// router.get("/verify-email/:token", verifyEmail);
// router.get(
//   "/google",
//   passport.authenticate("google",{scope: ["profile", "email"]})
// );

// router.get(
//   "/google/callback",
//   passport.authenticate("google", {session:false}),
//   (req, res)=>{
//     const token = jwt.sign(
//       {userId: req.user._id, role:req.user.role},
//       process.env.JWT_SECRET,
//       {expiresIn: "7d"}
//     );

//     res.redirect(
//       `${process.env.FRONTEND_URL}/oauth-success?token=${token}&role=${req.user.role}`
//     );
//   }
// )

// router.get("/me", authMiddleware, (req, res) => {
//   res.json(req.user);
// });


// export default router;

import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  registerUser,
  login,
} from "../controllers/auth.controller.js";
import User from "../models/User.model.js";
import passport from "passport";
import jwt from "jsonwebtoken";
import { changePassword } from "../controllers/auth.controller.js";
import { me } from "../controllers/auth.controller.js";
import UserSession from "../models/UserSession.js";
import { logout } from "../controllers/auth.controller.js";
import WalletTransaction from "../models/WalletTransaction.model.js";
import { deleteAccount } from "../controllers/auth.controller.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
router.get("/me", authMiddleware, me);
router.post(
  "/logout",
  authMiddleware,
  logout
);
router.delete(
  "/delete-account",
  authMiddleware,
  deleteAccount
);
router.get("/google", (req, res, next) => {
  const role =
    req.query.role === "BUSINESS"
      ? "BUSINESS"
      : "USER";

  const ref = req.query.ref || "";

  // console.log("=================================");
  // console.log("GOOGLE LOGIN");
  // console.log("Query role:", req.query.role);
  // console.log("Selected role:", role);

  // Put role + referral into OAuth state
  const state = Buffer.from(
    JSON.stringify({
      role,
      ref,
    })
  ).toString("base64url");

  // console.log("OAuth state:", state);

  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state,
  })(req, res, next);
});


router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  async (req, res) => {
    try {
      // console.log("=================================");
      // console.log("GOOGLE CALLBACK");

      // console.log("OAuth state:", req.query.state);

      // =====================================================
      // 1. GET SELECTED ROLE FROM OAUTH STATE
      // =====================================================

      let selectedRole = "USER";
      let referralCode = null;

      if (req.query.state) {
        try {
          const decoded = JSON.parse(
            Buffer.from(req.query.state, "base64url").toString("utf8")
          );

          selectedRole =
            decoded.role === "BUSINESS"
              ? "BUSINESS"
              : "USER";

          referralCode = decoded.ref || null;
        } catch (stateError) {
          console.error("STATE DECODE ERROR:", stateError);

          return res.redirect(
            `${process.env.FRONTEND_URL}/login?error=invalid_oauth_state`
          );
        }
      }

      // =====================================================
// GOOGLE REFERRAL
// Only apply referral to a user who does not already
// have a referrer.
// =====================================================

if (
  referralCode &&
  req.user.role !== "ADMIN" &&
  req.user.role !== "SUPERADMIN" &&
  !req.user.referredBy
) {
  const refUser = await User.findOne({
    referralCode: referralCode.trim(),
  });

  // Prevent self-referral
  if (
    refUser &&
    refUser._id.toString() !== req.user._id.toString()
  ) {
    req.user.referredBy = refUser._id;

    await req.user.save();

    const REFERRAL_POINTS = 1;

    await WalletTransaction.create({
      user: refUser._id,
      type: "EARN",
      points: REFERRAL_POINTS,
      description: "Referral bonus",
    });

    await Wallet.findOneAndUpdate(
      { user: refUser._id },
      {
        $inc: {
          balance: REFERRAL_POINTS,
          totalEarned: REFERRAL_POINTS,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );
  }
}

      // console.log("SELECTED ROLE FROM LOGIN:", selectedRole);

      // =====================================================
      // 2. IMPORTANT:
      //    NEVER CHANGE ADMIN / SUPERADMIN ROLE
      // =====================================================

      const databaseRole = req.user.role;

      // console.log("DATABASE ROLE:", databaseRole);

      let finalRole;

      if (
        databaseRole === "ADMIN" ||
        databaseRole === "SUPERADMIN"
      ) {
        // ---------------------------------------------
        // ADMIN / SUPERADMIN MUST NEVER BE CHANGED
        // ---------------------------------------------

        finalRole = databaseRole;

        // console.log(
        //   "ADMINISTRATOR ACCOUNT DETECTED."
        // );
        // console.log(
        //   "Keeping original role:",
        //   finalRole
        // );
      } else {
        // ---------------------------------------------
        // NORMAL USER / BUSINESS ACCOUNT
        // ---------------------------------------------

        finalRole = selectedRole;

        if (req.user.role !== finalRole) {
          req.user.role = finalRole;
          await req.user.save();
        }

        // console.log(
        //   "USER/BUSINESS ROLE UPDATED TO:",
        //   finalRole
        // );
      }

      // console.log("FINAL ROLE:", finalRole);

      // =====================================================
      // 3. DEVICE INFORMATION
      // =====================================================

      const userAgent = req.headers["user-agent"] || "";

      const ip =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket.remoteAddress ||
        "";

      let device = "Unknown";
      let os = "Unknown";

      if (/android/i.test(userAgent)) {
        os = "Android";
      } else if (/iphone|ipad/i.test(userAgent)) {
        os = "iOS";
      } else if (/windows/i.test(userAgent)) {
        os = "Windows";
      } else if (/mac/i.test(userAgent)) {
        os = "Mac";
      }

      if (/chrome/i.test(userAgent) && !/edge|opr/i.test(userAgent)) {
        device = "Chrome";
      } else if (/firefox/i.test(userAgent)) {
        device = "Firefox";
      } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
        device = "Safari";
      }

      // =====================================================
      // 4. CREATE / UPDATE SESSION
      // =====================================================

      const userSession = await UserSession.findOneAndUpdate(
        {
          userId: req.user._id,
          userAgent,
        },
        {
          device,
          os,
          ip,
          userAgent,
          isActive: true,
          lastActiveAt: new Date(),
        },
        {
          upsert: true,
          new: true,
        }
      );

      // =====================================================
      // 5. CREATE JWT USING FINAL ROLE
      // =====================================================

      const token = jwt.sign(
        {
          userId: req.user._id.toString(),
          role: finalRole,
          sessionId: userSession._id.toString(),
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      // console.log("JWT CREATED");
      // console.log("JWT ROLE:", finalRole);

      // =====================================================
      // 6. SET COOKIE
      // =====================================================

      res.cookie("token", token, {
        httpOnly: true,

        secure: process.env.NODE_ENV === "production",

        domain:
          process.env.NODE_ENV === "production"
            ? ".inputify.io"
            : undefined,

        sameSite: "lax",

        path: "/",

        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // console.log("AUTH COOKIE SET");
      // console.log("REDIRECT ROLE:", finalRole);

      // =====================================================
      // 7. REDIRECT TO OAUTH SUCCESS
      // =====================================================

      return res.redirect(
        `${process.env.FRONTEND_URL}/oauth-success?role=${finalRole}`
      );

    } catch (error) {
      console.error("GOOGLE CALLBACK ERROR:", error);

      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=google_login_failed`
      );
    }
  }
);

// router.get(
//   "/google/callback",
//   passport.authenticate("google", {
//     failureRedirect: "/login",
//     session: false,
//   }),
//   async (req, res) => {
//     try {
//       console.log("=================================");
//       console.log("GOOGLE CALLBACK");

//       console.log("OAuth state:", req.query.state);

//       let selectedRole = "USER";
//       let referralCode = null;

//       // -----------------------------------------
//       // READ ROLE FROM OAUTH STATE
//       // -----------------------------------------

//       if (req.query.state) {
//         try {
//           const decoded = JSON.parse(
//             Buffer.from(req.query.state, "base64url").toString("utf8")
//           );

//           selectedRole =
//             decoded.role === "BUSINESS"
//               ? "BUSINESS"
//               : "USER";

//           referralCode = decoded.ref || null;

//         } catch (stateError) {
//           console.error("STATE DECODE ERROR:", stateError);

//           return res.redirect(
//             `${process.env.FRONTEND_URL}/login?error=invalid_oauth_state`
//           );
//         }
//       }

//       console.log("SELECTED ROLE:", selectedRole);
//       console.log("USER BEFORE ROLE UPDATE:", req.user.role);

//       // -----------------------------------------
//       // UPDATE USER ROLE
//       // -----------------------------------------

//       req.user.role = selectedRole;

//       await req.user.save();

//       console.log("USER ROLE AFTER UPDATE:", req.user.role);

//       // -----------------------------------------
//       // DEVICE INFORMATION
//       // -----------------------------------------

//       const userAgent = req.headers["user-agent"] || "";

//       const ip =
//         req.headers["x-forwarded-for"]?.split(",")[0] ||
//         req.socket.remoteAddress ||
//         "";

//       let device = "Unknown";
//       let os = "Unknown";

//       if (/android/i.test(userAgent)) {
//         os = "Android";
//       } else if (/iphone|ipad/i.test(userAgent)) {
//         os = "iOS";
//       } else if (/windows/i.test(userAgent)) {
//         os = "Windows";
//       } else if (/mac/i.test(userAgent)) {
//         os = "Mac";
//       }

//       if (/chrome/i.test(userAgent) && !/edge|opr/i.test(userAgent)) {
//         device = "Chrome";
//       } else if (/firefox/i.test(userAgent)) {
//         device = "Firefox";
//       } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
//         device = "Safari";
//       }

//       // -----------------------------------------
//       // CREATE / UPDATE USER SESSION
//       // -----------------------------------------

//       const userSession = await UserSession.findOneAndUpdate(
//         {
//           userId: req.user._id,
//           userAgent,
//         },
//         {
//           device,
//           os,
//           ip,
//           userAgent,
//           isActive: true,
//           lastActiveAt: new Date(),
//         },
//         {
//           upsert: true,
//           new: true,
//         }
//       );

//       // -----------------------------------------
//       // CREATE JWT
//       // -----------------------------------------

//       const token = jwt.sign(
//         {
//           userId: req.user._id.toString(),
//           role: req.user.role,
//           sessionId: userSession._id.toString(),
//         },
//         process.env.JWT_SECRET,
//         {
//           expiresIn: "7d",
//         }
//       );

//       console.log("JWT CREATED");
//       console.log("JWT ROLE:", req.user.role);

//       // -----------------------------------------
//       // SET AUTH COOKIE
//       // -----------------------------------------

//       res.cookie("token", token, {
//         httpOnly: true,

//         // IMPORTANT for production
//         secure: process.env.NODE_ENV === "production",

//         // Frontend = inputify.io
//         // Backend = api.inputify.io
//         domain:
//           process.env.NODE_ENV === "production"
//             ? ".inputify.io"
//             : undefined,

//         sameSite: "lax",

//         path: "/",

//         maxAge: 7 * 24 * 60 * 60 * 1000,
//       });

//       console.log("AUTH COOKIE SET");
//       console.log("REDIRECT ROLE:", req.user.role);

//       // -----------------------------------------
//       // REDIRECT TO FRONTEND
//       // -----------------------------------------

//       return res.redirect(
//         `${process.env.FRONTEND_URL}/oauth-success?role=${req.user.role}`
//       );

//     } catch (error) {
//       console.error("GOOGLE CALLBACK ERROR:", error);

//       return res.redirect(
//         `${process.env.FRONTEND_URL}/login?error=google_login_failed`
//       );
//     }
//   }
// );

export default router;
