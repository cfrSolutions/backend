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

//     req.user = decoded;
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// };


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

export const authMiddleware = async (req, res, next) => {
  try {
    // Prefer Authorization header if frontend sends it.
    // Fall back to cookie.
    const authToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

    const token = authToken || req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded.userId) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    // Always get the CURRENT user from database
    const user = await User.findById(decoded.userId)
      .select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // IMPORTANT:
    // Use database user ID + database role
    req.user = {
      _id: user._id,
      userId: user._id,
      id: user._id,
      role: String(user.role || "").toUpperCase(),
      sessionId: decoded.sessionId,
    };

    console.log("=================================");
    console.log("AUTH USER");
    console.log("USER ID:", user._id.toString());
    console.log("ROLE:", user.role);
    console.log("TOKEN USER ID:", decoded.userId);
    console.log("=================================");

    next();

  } catch (err) {
    console.error("AUTH ERROR:", err.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
