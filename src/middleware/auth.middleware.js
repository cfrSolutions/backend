// import jwt from "jsonwebtoken";
// import User from "../models/User.model.js";
// export const authMiddleware = async (req, res, next) => {
//   // const authHeader = req.headers.authorization;

//   // if (!authHeader || !authHeader.startsWith("Bearer ")) {
//   //   return res.status(401).json({ message: "No token provided" });
//   // }

//   // const token = req.cookies.token;
//   const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.userId).select("-password");
//       if (!user) {
//       return res.status(401).json({ message: "User not found" });
//     }

//     req.user = {
//       userId: decoded.userId,
//       role: decoded.role,
//       sessionId: decoded.sessionId, // 🔥 REQUIRED FOR SECURITY PAGE
//     };

//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// };


import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

export const authMiddleware = async (
  req,
  res,
  next
) => {
  try {
    // ==========================================
    // SERVER CONFIG CHECK
    // ==========================================

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is not configured"
      );

      return res.status(500).json({
        message: "Server configuration error",
      });
    }

    // ==========================================
    // GET TOKEN
    // Cookie first, then Authorization header
    // ==========================================

    let token = req.cookies?.token;

    if (!token) {
      const authHeader =
        req.headers.authorization;

      if (
        authHeader &&
        authHeader.startsWith("Bearer ")
      ) {
        token =
          authHeader
            .slice(7)
            .trim();
      }
    }

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // ==========================================
    // VERIFY JWT
    // ==========================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    // ==========================================
    // VALIDATE REQUIRED TOKEN DATA
    // ==========================================

    if (
      !decoded ||
      typeof decoded !== "object" ||
      !decoded.userId ||
      !decoded.role
    ) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    // ==========================================
    // CHECK USER STILL EXISTS
    // ==========================================

    const user =
      await User.findById(
        decoded.userId
      ).select("_id");

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // ==========================================
    // NORMALIZE LOGIN/PANEL ROLE
    // Role intentionally comes from signed JWT
    // because it represents selected login panel.
    // ==========================================

    const role = String(
      decoded.role
    )
      .trim()
      .toUpperCase();

    // Only accept roles your application supports.
    if (
      ![
        "USER",
        "BUSINESS",
      ].includes(role)
    ) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    // ==========================================
    // SET AUTHENTICATED REQUEST USER
    // ==========================================

    req.user = {
      userId:
        user._id.toString(),

      role,

      sessionId:
        decoded.sessionId || null,
    };

    return next();

  } catch (error) {
    if (
      error?.name ===
        "TokenExpiredError" ||
      error?.name ===
        "JsonWebTokenError" ||
      error?.name ===
        "NotBeforeError"
    ) {
      return res.status(401).json({
        message:
          "Invalid or expired token",
      });
    }

    console.error(
      "AUTH MIDDLEWARE ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Authentication failed",
    });
  }
};