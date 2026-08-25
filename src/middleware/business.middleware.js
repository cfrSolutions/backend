// // middleware/business.middleware.js
// export const businessOnly = (req, res, next) => {
//   if (req.user.role !== "BUSINESS") {
//     return res.status(403).json({ message: "Access denied" });
//   }
//   next();
// };

export const businessOnly = (req, res, next) => {
  const role = String(req.user?.role || "")
    .trim()
    .toUpperCase();

  // console.log("BUSINESS AUTH:", {
  //   user: req.user,
  //   role,
  // });

  if (role !== "BUSINESS") {
    return res.status(403).json({
      message: "Access denied",
      role,
    });
  }

  next();
};