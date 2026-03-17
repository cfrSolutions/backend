// export const adminDashboard = (req, res) => {
//   res.json({
//     message: "Welcome to Admin Dashboard",
//     adminId: req.user.userId,
//     role: req.user.role,
//   });
// };


import User from "../models/User.model.js";
import bcrypt from "bcryptjs";

export const adminDashboard = async (req, res) => {
  try {
    // Only SUPERADMIN allowed
    if (req.user.role !== "SUPERADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { name, email, password } = req.body;

   const allowedAdminDomains = [
  "@cfr.solutions",
  "@competentfieldwork.com",
];

const isAllowedDomain = allowedAdminDomains.some(domain =>
  email.toLowerCase().endsWith(domain)
);

if (!isAllowedDomain) {
  return res.status(403).json({
    message: "Admin access restricted to company domains",
  });
}


    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
      isEmailVerified: true,
    });

    res.status(201).json({
      message: "Admin created successfully",
      admin,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
