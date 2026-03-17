import bcrypt from "bcrypt";
import User from "../models/User.model.js";

const createAdmin = async () => {
  const exists = await User.findOne({ email: "admin@survey.com" });

  if (!exists) {
    const hashed = await bcrypt.hash("Admin@123", 10);

    await User.create({
      name: "Admin",
      email: "admin@survey.com",
      password: hashed,
      role: "ADMIN",
      status: "ACTIVE",
      isEmailVerified: true,
    });

    console.log("✅ Admin created");
  } else {
    console.log("ℹ️ Admin already exists");
  }
};

export default createAdmin;
