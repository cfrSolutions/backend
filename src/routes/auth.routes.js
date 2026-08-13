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
  const role =
    req.query.role === "BUSINESS"
      ? "BUSINESS"
      : "USER";

  const ref = req.query.ref || "";

  console.log("=================================");
  console.log("GOOGLE LOGIN");
  console.log("Query role:", req.query.role);
  console.log("Selected role:", role);

  // Put role + referral into OAuth state
  const state = Buffer.from(
    JSON.stringify({
      role,
      ref,
    })
  ).toString("base64url");

  console.log("OAuth state:", state);

  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state,
  })(req, res, next);
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

      console.log("OAuth state:", req.query.state);

      let selectedRole = "USER";
      let referralCode = null;

      // Read role from OAuth state
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

      console.log("SELECTED ROLE:", selectedRole);
      console.log("USER BEFORE ROLE UPDATE:", req.user.role);

      // -----------------------------------------
      // UPDATE MONGODB ROLE
      // -----------------------------------------

      req.user.role = selectedRole;

      await req.user.save();

      console.log("USER ROLE AFTER UPDATE:", req.user.role);

      // -----------------------------------------
      // REDIRECT ACCORDING TO TOGGLE
      // -----------------------------------------

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

export default router;
