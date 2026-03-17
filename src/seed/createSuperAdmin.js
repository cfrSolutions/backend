import User from "../models/User.model.js";
import bcrypt from "bcryptjs";

const createSuperAdmin = async () => {
  const email = "info@competentfieldwork.com";

  const user = await User.findOne({ email });

  if (user) {
    // 🔥 FORCE UPGRADE ROLE
    user.role = "SUPERADMIN";
    user.status = "ACTIVE";
    user.isEmailVerified = true;
    await user.save();

    console.log("🔁 SuperAdmin role UPDATED");
    return;
  }

  const hashedPassword = await bcrypt.hash("Info#CFR*!1968&MR", 10);

  await User.create({
    name: "Super Admin",
    email,
    password: hashedPassword,
    role: "SUPERADMIN",
    status: "ACTIVE",
    isEmailVerified: true,
  });

  console.log("🔥 SUPERADMIN CREATED");
};

export default createSuperAdmin;
