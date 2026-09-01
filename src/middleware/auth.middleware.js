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


import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
export const authMiddleware = async (req, res, next) => {
  // const authHeader = req.headers.authorization;

  // if (!authHeader || !authHeader.startsWith("Bearer ")) {
  //   return res.status(401).json({ message: "No token provided" });
  // }

  // const token = req.cookies.token;
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
      if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      sessionId: decoded.sessionId, // 🔥 REQUIRED FOR SECURITY PAGE
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
