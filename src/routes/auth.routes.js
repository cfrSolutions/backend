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
import { requestDeleteAccount, confirmDeleteAccount } from "../controllers/auth.controller.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
// router.get("/verify-email/:token", verifyEmail);
// router.get(
//   "/google",
//   passport.authenticate("google",{scope: ["profile", "email"]})
// );
// router.get("/google", (req, res, next) => {
//   if (req.query.ref) {
//     req.session.referralCode = req.query.ref;
//   }

//   next();
// },
// passport.authenticate("google", {
//   scope: ["profile", "email"]
// }));


router.get("/google", (req, res, next) => {

  // store referral code in session
  if (req.query.ref) {
    req.session.referralCode = req.query.ref;
  }

  passport.authenticate("google", {
    scope: ["profile", "email"],
  })(req, res, next);
});


router.get(
  "/google/callback",
  passport.authenticate("google", {session:false}),
  async (req, res)=>{
    const userAgent = req.headers["user-agent"] || "";
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    // Simple detection
    let device = /chrome/i.test(userAgent) ? "Chrome" : "Browser";
    let os = /windows/i.test(userAgent) ? "Windows" : "Other";

    // 🔥 CREATE SESSION HERE
    const session = await UserSession.create({
      userId: req.user._id,
      device,
      os,
      ip,
      userAgent,
      isActive: true,
    });
    const token = jwt.sign(
      {userId: req.user._id, role:req.user.role, sessionId: session._id,},
      process.env.JWT_SECRET,
      {expiresIn: "7d"}
    );

   // ✅ store token in HttpOnly cookie
    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "strict",
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });

    res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});


    // ✅ only role in URL (not token)
    res.redirect(
      `${process.env.FRONTEND_URL}/oauth-success?role=${req.user.role}`
    );
  }
);

router.put("/change-password", authMiddleware, changePassword);

router.post("/logout", authMiddleware, logout);
router.post("/request-delete", authMiddleware, requestDeleteAccount);
router.get("/confirm-delete/:token", confirmDeleteAccount);
// router.get("/me", authMiddleware, (req, res) => {
//   res.json(req.user);
// });
router.get("/me", authMiddleware, me);

export default router;
