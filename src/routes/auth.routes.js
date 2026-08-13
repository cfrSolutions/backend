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
import { deleteAccount } from "../controllers/auth.controller.js";
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


// router.get("/google", (req, res, next) => {

//   // store referral code in session
//   if (req.query.ref) {
//     req.session.referralCode = req.query.ref;
//   }

//  if (req.query.role) {
//     req.session.role = req.query.role; // USER or BUSINESS
//   }
//   passport.authenticate("google", {
//     scope: ["profile", "email"],
//   })(req, res, next);
// });

router.get("/google", (req, res, next) => {
  const selectedRole =
    req.query.role === "BUSINESS"
      ? "BUSINESS"
      : "USER";

  const referralCode = req.query.ref || null;

  // Store the role selected on the frontend
  req.session.role = selectedRole;
  req.session.referralCode = referralCode;

  console.log("=================================");
  console.log("GOOGLE LOGIN");
  console.log("Query role:", req.query.role);
  console.log("Selected role:", selectedRole);
  console.log("Session role:", req.session.role);
  console.log("=================================");

  // IMPORTANT: save session before redirecting to Google
  req.session.save((err) => {
    if (err) {
      console.error("SESSION SAVE ERROR:", err);
      return next(err);
    }

    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
    })(req, res, next);
  });
});


// router.get(
//   "/google/callback",
//   passport.authenticate("google", {session:false}),
//   async (req, res)=>{
// //     console.log("EMAIL:", req.user.email);
// // console.log("ROLE FROM DB:", req.user.role);
// // console.log("SESSION ROLE:", req.session.role);
//      const roleFromFrontend =
//       req.session.role === "BUSINESS" ? "BUSINESS" : "USER";

//    // 🔥 ALWAYS update role from frontend
//       // req.user.role = roleFromFrontend;
//       // await req.user.save();
//       // Only set role if user is NEW (no role yet)
// // Only assign role if user is NEW (no role set)
// // const selectedRole =
// //   req.session.role === "BUSINESS"
// //     ? "BUSINESS"
// //     : "USER";

// // if (req.user.role !== selectedRole) {
// //   req.user.role = selectedRole;
// //   await req.user.save();
// // }

// // console.log("UPDATED ROLE:", req.user.role);

//     const userAgent = req.headers["user-agent"] || "";
//     const ip =
//       req.headers["x-forwarded-for"]?.split(",")[0] ||
//       req.socket.remoteAddress;

//     // Simple detection
//     let device = /chrome/i.test(userAgent) ? "Chrome" : "Browser";
//     let os = /windows/i.test(userAgent) ? "Windows" : "Other";

//     // 🔥 CREATE SESSION HERE
//     const session = await UserSession.create({
//       userId: req.user._id,
//       device,
//       os,
//       ip,
//       userAgent,
//       isActive: true,
//     });
//     const token = jwt.sign(
//       {userId: req.user._id, role:req.user.role, sessionId: session._id,},
//       process.env.JWT_SECRET,
//       {expiresIn: "7d"}
//     );

//    // ✅ store token in HttpOnly cookie
//     // res.cookie("token", token, {
//     //   httpOnly: true,
//     //   secure: process.env.NODE_ENV === "production",
//     //   sameSite: "strict",
//     //   maxAge: 7 * 24 * 60 * 60 * 1000,
//     // });

//     res.cookie("token", token, {
//   httpOnly: true,
//   secure: process.env.NODE_ENV === "production",
//   sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
//   path: "/",
//   maxAge: 7 * 24 * 60 * 60 * 1000,
// });


//     // ✅ only role in URL (not token) i Need to change thiss
//     res.redirect(
//       `${process.env.FRONTEND_URL}/oauth-success?role=${roleFromFrontend}`
//     );

//     // res.redirect(
//     //   `http://localhost:5173/oauth-success?role=${req.user.role}`
//     // );
    
//   }
// );

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  async (req, res) => {
    try {
      console.log("=================================");
      console.log("GOOGLE CALLBACK");
      console.log("Session role:", req.session.role);
      console.log("User before role update:", req.user.role);

      // Get role selected on login page
      const selectedRole =
        req.session.role === "BUSINESS"
          ? "BUSINESS"
          : "USER";

      console.log("SELECTED ROLE:", selectedRole);

      // IMPORTANT:
      // Change MongoDB role according to the toggle
      req.user.role = selectedRole;

      await req.user.save();

      console.log("USER ROLE AFTER UPDATE:", req.user.role);

      // Get referral if required
      const referralCode = req.session.referralCode;

      // Clear temporary session values
      req.session.role = null;
      req.session.referralCode = null;

      // IMPORTANT: redirect according to selected toggle
      return res.redirect(
        `${process.env.FRONTEND_URL}/oauth-success?role=${selectedRole}`
      );

    } catch (error) {
      console.error("GOOGLE CALLBACK ERROR:", error);

      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=google_login_failed`
      );
    }
  }
);

router.put("/change-password", authMiddleware, changePassword);

router.post("/logout", authMiddleware, logout);
// router.post("/request-delete", authMiddleware, requestDeleteAccount);
// router.get("/confirm-delete/:token", confirmDeleteAccount);
router.delete("/delete-account", authMiddleware, deleteAccount);
// router.get("/me", authMiddleware, (req, res) => {
//   res.json(req.user);
// });
router.get("/me", authMiddleware, me);

router.put("/update-role", authMiddleware, async (req, res) => {
  try {
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { role },
      { new: true }
    );

    res.json({
      message: "Role updated",
      role: user.role
    });
  } catch (err) {
    // console.log("UPDATE ROLE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;
