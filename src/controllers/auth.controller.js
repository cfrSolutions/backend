import User from "../models/User.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
// import { generateEmailToken } from "../utils/generateToken.js";
import UserSession from "../models/UserSession.js";
import Wallet from "../models/Wallet.model.js";
import WalletTransaction from "../models/WalletTransaction.model.js";

/* ======================
   REGISTER
====================== */
const generateReferralCode = (name) => {
  const clean = name.replace(/\s/g, "").toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${clean}${random}`;
};

export const registerUser = async (req, res) => {
  const generateWalletNumber = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString(); // 8 digits
};

  try {
    const { name, email, password, referralCode, role, captcha } = req.body;
    const allowedRoles = ["USER", "BUSINESS"];

if (!["USER", "BUSINESS"].includes(role)) {
  return res.status(400).json({
    message: "Invalid account type",
  });
} 
      if (!captcha) {
        return res.status(400).json({
          message: "Please complete the CAPTCHA",
        });
      }

      const captchaResponse =
        await axios.post(
          "https://www.google.com/recaptcha/api/siteverify",
          null,
          {
            params: {
              secret: process.env.RECAPTCHA_SECRET,
              response: captcha,
            },
          }
        );

      if (!captchaResponse.data.success) {
        return res.status(400).json({
          message: "CAPTCHA verification failed",
        });
      }
    

    if (!password || password.trim() === "") {
      return res.status(400).json({ message: "Password is required" });
    }
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

if (!passwordRegex.test(password)) {
  return res.status(400).json({
    message:
      "Password must be at least 8 characters and contain at least one letter and one number.",
  });
}

    if (email.endsWith("@cfr.solutions")) {
      return res.status(403).json({
        message: "CFR emails must be created by admin",
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // const { token, hashedToken } = generateEmailToken();
const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "USER",
      walletNumber: generateWalletNumber(),
      referralCode: generateReferralCode(name),
      isEmailVerified: true,
      status: "ACTIVE",
      // emailVerificationToken: hashedToken,
      // emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
    });
    // await User.create({
    //   name,
    //   email,
    //   password: hashedPassword,
    //   walletNumber: generateWalletNumber(),
    //   isEmailVerified: false,
    //   status: "PENDING",
    //   emailVerificationToken: hashedToken,
    //   emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
    //   referralCode: generateReferralCode(name),
    // });

    let refUser = null;

if (referralCode) {
  refUser = await User.findOne({ referralCode });

  if (refUser) {
    newUser.referredBy = refUser._id;
  }
}


    await newUser.save();
    
    /* ================= REFERRAL REWARD ================= */

if (refUser) {

  const REFERRAL_POINTS = 50;

  await WalletTransaction.create({
    user: refUser._id,
    type: "EARN",
    points: REFERRAL_POINTS,
    description: "Referral bonus"
  });

  await Wallet.findOneAndUpdate(
    { user: refUser._id },
    {
      $inc: {
        balance: REFERRAL_POINTS,
        totalEarned: REFERRAL_POINTS
      }
    },
    { upsert: true, new: true }
  );
}

//     const verifyURL = `${process.env.FRONTEND_URL}/verify-email/${token}`;
// if (process.env.NODE_ENV !== "development") {
//    await sendEmail({
//         to: email,
//         subject: "Verify your email",
//         html: `<h2>Email Verification</h2>
//   <p>Please click the link below to verify your account:</p>
//   <a href="${verifyURL}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; display: inline-block;">Verify Email</a>`,
//       });
// } else {
//   console.log("📩 EMAIL VERIFICATION LINK:", verifyURL);
// }
      // return res.status(201).json({
      //   message: "Signup successful. Please check your email.",
      // });
      return res.status(201).json({
  message: "Signup successful",
});

  } catch (err) {
    // console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


/* ======================
   LOGIN (WITH SESSIONS)
====================== */
export const login = async (req, res) => {
  try {
       console.log("LOGIN BODY:", req.body);
    const { email, password, role } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof role !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid login input",
      });
    }
    
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

     if (!["USER", "BUSINESS"].includes(role)) {
      return res.status(400).json({
        message: "Invalid account type",
      });
    }

    // 1. Find user
    const user = await User.findOne({ email: cleanEmail, role: role });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (["ADMIN", "SUPERADMIN"].includes(user.role)) {
      return res.status(403).json({
        message: "Please use the administrator login.",
      });
    }

    if (user.role !== role) {
    return res.status(403).json({
        message: "Please use the correct login."
    });
}
 //console.log("Creating session for:", user._id.toString());
    // 2. Check password
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) {
    //   return res.status(401).json({ message: "Invalid credentials" });
    // }

    // 2. Check password
if (!user.password) {
  return res.status(401).json({
    message: "This account was created with Google. Please continue with Google.",
  });
}

if (!password || typeof password !== "string") {
  return res.status(400).json({
    message: "Password is required",
  });
}

const isMatch = await bcrypt.compare(password, user.password);

if (!isMatch) {
  return res.status(401).json({
    message: "Invalid credentials",
  });
}

    // // 3. Email + status check
    // if (!user.isEmailVerified) {
    //   return res.status(403).json({ message: "Please verify your email first" });
    // }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: "Account not active" });
    }

    /* ---------------- DEVICE DETECTION ---------------- */
    const userAgent = req.headers["user-agent"] || "";
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    let device = "Unknown";
    let os = "Unknown";

    if (/android/i.test(userAgent)) os = "Android";
    else if (/iphone|ipad/i.test(userAgent)) os = "iOS";
    else if (/windows/i.test(userAgent)) os = "Windows";
    else if (/mac/i.test(userAgent)) os = "Mac";

    if (/chrome/i.test(userAgent) && !/edge|opr/i.test(userAgent))
      device = "Chrome";
    else if (/firefox/i.test(userAgent))
      device = "Firefox";
    else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent))
      device = "Safari";

    /* ---------------- SESSION UPSERT ---------------- */
    // console.log("Creating session for:", user._id.toString());
    const session = await UserSession.findOneAndUpdate(
      {
        userId: user._id,
        userAgent,
      },
      {
        device,
        os,
        ip,
        isActive: true,
        lastActiveAt: new Date(),
      },
      { upsert: true, new: true }
    );

    /* ---------------- JWT WITH SESSION ---------------- */
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        sessionId: session._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );


//    res.cookie("token", token, {
//   httpOnly: true,
//   secure: process.env.NODE_ENV === "production",
//   sameSite: "strict",
//   maxAge: 7 * 24 * 60 * 60 * 1000,
// });


res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

res.json({ token, role: user.role });

  } catch (err) {
    // console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================
   VERIFY EMAIL
====================== */
// export const verifyEmail = async (req, res) => {
//   try {
//     const hashedToken = crypto
//       .createHash("sha256")
//       .update(req.params.token)
//       .digest("hex");

//     const user = await User.findOne({
//       emailVerificationToken: hashedToken,
//       emailVerificationExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({ message: "Invalid or expired token" });
//     }

//     user.isEmailVerified = true;
//     user.status = "ACTIVE";
//     user.emailVerificationToken = undefined;
//     user.emailVerificationExpires = undefined;

//     await user.save();

//     res.json({ message: "Email verified successfully" });

//   } catch (err) {
//     console.error("VERIFY EMAIL ERROR:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


/* ======================
   CHANGE PASSWORD
====================== */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    /* OPTIONAL BUT STRONGLY RECOMMENDED */
    // Logout all other sessions except current one
    await UserSession.updateMany(
      {
        userId: user._id,
        _id: { $ne: req.user.sessionId },
      },
      { isActive: false }
    );

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    // console.error("CHANGE PASSWORD ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};



export const logout = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // Deactivate current session
    if (req.user.sessionId) {
      await UserSession.findByIdAndUpdate(
        req.user.sessionId,
        {
          isActive: false,
          lastActiveAt: new Date(),
        }
      );
    }

    // Clear authentication cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain:
        process.env.NODE_ENV === "production"
          ? ".inputify.io"
          : undefined,
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });

  } catch (err) {
    console.error("LOGOUT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// export const logout = async (req, res)=>{
//   try{
//     if(!req.user.userId){
//       return res.status(401).json({message: "unauthorize"});
//     }
//     if(req.user.sessionId){
//       await UserSession.findByIdAndUpdate(req.user.session,{
//         isActive: false,
//         lastActive: new Date(),
//       });
//     }

//     res.clearCookie("token",{
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//     });
//     return res.json({message: "Logiut successfully"});
//   }
//   catch(err){
   
//     return res.status(500).json({message: "server error"});
//   }
// };

/* ======================
   REQUEST DELETE ACCOUNT
====================== */
// export const requestDeleteAccount = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const rawToken = crypto.randomBytes(32).toString("hex");
//     const hashedToken = crypto
//       .createHash("sha256")
//       .update(rawToken)
//       .digest("hex");

//     user.deleteAccountToken = hashedToken;
//     user.deleteAccountExpires = Date.now() + 15 * 60 * 1000; // 15 min expiry

//     await user.save();

//     const deleteURL = `${process.env.FRONTEND_URL}/confirm-delete/${rawToken}`;

//     await sendEmail({
//       to: user.email,
//       subject: "Confirm Account Deletion",
//       html: `
//         <h2>Confirm Account Deletion</h2>
//         <p>This action is permanent.</p>
//         <a href="${deleteURL}" 
//            style="background:red;color:white;padding:10px 20px;text-decoration:none;">
//            Confirm Delete
//         </a>
//         <p>This link expires in 15 minutes.</p>
//       `,
//     });

//     res.json({ message: "Confirmation email sent" });

//   } catch (err) {
//     console.error("REQUEST DELETE ERROR:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// /* ======================
//    CONFIRM DELETE ACCOUNT
// ====================== */
// export const confirmDeleteAccount = async (req, res) => {
//   try {
//     const hashedToken = crypto
//       .createHash("sha256")
//       .update(req.params.token)
//       .digest("hex");

//     const user = await User.findOne({
//       deleteAccountToken: hashedToken,
//       deleteAccountExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({ message: "Invalid or expired token" });
//     }

//     const userId = user._id;

//     // delete related data
//     await UserSession.deleteMany({ userId });
//     await Wallet.deleteOne({ user: userId });
//     await WalletTransaction.deleteMany({ user: userId });

//     await User.findByIdAndDelete(userId);

//     res.json({ message: "Account deleted permanently" });

//   } catch (err) {
//     console.error("CONFIRM DELETE ERROR:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reason, feedback } = req.body;

    // console.log("Delete Reason:", reason);
    // console.log("Feedback:", feedback);

    await UserSession.deleteMany({ userId });
    await Wallet.deleteOne({ user: userId });
    await WalletTransaction.deleteMany({ user: userId });

    await User.findByIdAndDelete(userId);

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.json({ message: "Account deleted successfully" });

  } catch (err) {
    // console.error("DELETE ACCOUNT ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const me = async (req, res) => {
   try {
  const user = await User.findById(req.user.userId).select(
    "_id name email role walletNumber referralCode profileImage createdAt"
  );

//   const user = await User.findById(req.user.userId).select(
//   "-password"
// );


  // res.json({ user });
  if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("ME ERROR:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// import User from "../models/User.model.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import axios from "axios";
// import crypto from "crypto";
// import { sendEmail } from "../utils/sendEmail.js";
// // import { generateEmailToken } from "../utils/generateToken.js";
// import UserSession from "../models/UserSession.js";
// import Wallet from "../models/Wallet.model.js";
// import WalletTransaction from "../models/WalletTransaction.model.js";

// /* ======================
//    REGISTER
// ====================== */
// const generateReferralCode = (name) => {
//   const clean = name.replace(/\s/g, "").toUpperCase();
//   const random = Math.floor(1000 + Math.random() * 9000);
//   return `${clean}${random}`;
// };

// export const registerUser = async (req, res) => {
//   const generateWalletNumber = () => {
//   return Math.floor(10000000 + Math.random() * 90000000).toString(); // 8 digits
// };

//   try {
//     const { name, email, password, referralCode, role, captcha } = req.body;
//     if (role === "USER") {
//       if (!captcha) {
//         return res.status(400).json({
//           message: "Please complete the CAPTCHA",
//         });
//       }

//       const captchaResponse =
//         await axios.post(
//           "https://www.google.com/recaptcha/api/siteverify",
//           null,
//           {
//             params: {
//               secret: process.env.RECAPTCHA_SECRET,
//               response: captcha,
//             },
//           }
//         );

//       if (!captchaResponse.data.success) {
//         return res.status(400).json({
//           message: "CAPTCHA verification failed",
//         });
//       }
//     }

//     if (!password || password.trim() === "") {
//       return res.status(400).json({ message: "Password is required" });
//     }
//     if (!name || !email || !password) {
//       return res.status(400).json({ message: "All fields required" });
//     }

//     const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

// if (!passwordRegex.test(password)) {
//   return res.status(400).json({
//     message:
//       "Password must be at least 8 characters and contain at least one letter and one number.",
//   });
// }

//     if (email.endsWith("@cfr.solutions")) {
//       return res.status(403).json({
//         message: "CFR emails must be created by admin",
//       });
//     }

//     const exists = await User.findOne({ email });
//     if (exists) {
//       return res.status(400).json({ message: "Email already registered" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     // const { token, hashedToken } = generateEmailToken();
// const newUser = new User({
//       name,
//       email,
//       password: hashedPassword,
//       role: role || "USER",
//       walletNumber: generateWalletNumber(),
//       referralCode: generateReferralCode(name),
//       isEmailVerified: true,
//       status: "ACTIVE",
//       // emailVerificationToken: hashedToken,
//       // emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
//     });
//     // await User.create({
//     //   name,
//     //   email,
//     //   password: hashedPassword,
//     //   walletNumber: generateWalletNumber(),
//     //   isEmailVerified: false,
//     //   status: "PENDING",
//     //   emailVerificationToken: hashedToken,
//     //   emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
//     //   referralCode: generateReferralCode(name),
//     // });

//     let refUser = null;

// if (referralCode) {
//   refUser = await User.findOne({ referralCode });

//   if (refUser) {
//     newUser.referredBy = refUser._id;
//   }
// }


//     await newUser.save();
    
//     /* ================= REFERRAL REWARD ================= */

// if (refUser) {

//   const REFERRAL_POINTS = 50;

//   await WalletTransaction.create({
//     user: refUser._id,
//     type: "EARN",
//     points: REFERRAL_POINTS,
//     description: "Referral bonus"
//   });

//   await Wallet.findOneAndUpdate(
//     { user: refUser._id },
//     {
//       $inc: {
//         balance: REFERRAL_POINTS,
//         totalEarned: REFERRAL_POINTS
//       }
//     },
//     { upsert: true, new: true }
//   );
// }

// //     const verifyURL = `${process.env.FRONTEND_URL}/verify-email/${token}`;
// // if (process.env.NODE_ENV !== "development") {
// //    await sendEmail({
// //         to: email,
// //         subject: "Verify your email",
// //         html: `<h2>Email Verification</h2>
// //   <p>Please click the link below to verify your account:</p>
// //   <a href="${verifyURL}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; display: inline-block;">Verify Email</a>`,
// //       });
// // } else {
// //   console.log("📩 EMAIL VERIFICATION LINK:", verifyURL);
// // }
//       // return res.status(201).json({
//       //   message: "Signup successful. Please check your email.",
//       // });
//       return res.status(201).json({
//   message: "Signup successful",
// });

//   } catch (err) {
//     // console.error("REGISTER ERROR:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };


// /* ======================
//    LOGIN (WITH SESSIONS)
// ====================== */
// export const login = async (req, res) => {
//   try {
       
//     const { email, password, role } = req.body;

//     if (
//       typeof email !== "string" ||
//       typeof password !== "string" ||
//       typeof role !== "string"
//     ) {
//       return res.status(400).json({
//         message: "Invalid login input",
//       });
//     }

//     const cleanEmail = email.trim().toLowerCase();

//     if (!cleanEmail || !password) {
//       return res.status(400).json({
//         message: "Email and password are required",
//       });
//     }

//     // 1. Find user
//     const user = await User.findOne({ email: cleanEmail, });
//     if (!user) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }
//     if (user.role !== role) {
//     return res.status(403).json({
//         message: "Please use the correct login."
//     });
// }
//  //console.log("Creating session for:", user._id.toString());
//     // 2. Check password
//     // const isMatch = await bcrypt.compare(password, user.password);
//     // if (!isMatch) {
//     //   return res.status(401).json({ message: "Invalid credentials" });
//     // }

//     // 2. Check password
// if (!user.password) {
//   return res.status(401).json({
//     message: "This account was created with Google. Please continue with Google.",
//   });
// }

// if (!password || typeof password !== "string") {
//   return res.status(400).json({
//     message: "Password is required",
//   });
// }

// const isMatch = await bcrypt.compare(password, user.password);

// if (!isMatch) {
//   return res.status(401).json({
//     message: "Invalid credentials",
//   });
// }

//     // // 3. Email + status check
//     // if (!user.isEmailVerified) {
//     //   return res.status(403).json({ message: "Please verify your email first" });
//     // }

//     if (user.status !== "ACTIVE") {
//       return res.status(403).json({ message: "Account not active" });
//     }

//     /* ---------------- DEVICE DETECTION ---------------- */
//     const userAgent = req.headers["user-agent"] || "";
//     const ip =
//       req.headers["x-forwarded-for"]?.split(",")[0] ||
//       req.socket.remoteAddress;

//     let device = "Unknown";
//     let os = "Unknown";

//     if (/android/i.test(userAgent)) os = "Android";
//     else if (/iphone|ipad/i.test(userAgent)) os = "iOS";
//     else if (/windows/i.test(userAgent)) os = "Windows";
//     else if (/mac/i.test(userAgent)) os = "Mac";

//     if (/chrome/i.test(userAgent) && !/edge|opr/i.test(userAgent))
//       device = "Chrome";
//     else if (/firefox/i.test(userAgent))
//       device = "Firefox";
//     else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent))
//       device = "Safari";

//     /* ---------------- SESSION UPSERT ---------------- */
//     // console.log("Creating session for:", user._id.toString());
//     const session = await UserSession.findOneAndUpdate(
//       {
//         userId: user._id,
//         userAgent,
//       },
//       {
//         device,
//         os,
//         ip,
//         isActive: true,
//         lastActiveAt: new Date(),
//       },
//       { upsert: true, new: true }
//     );

//     /* ---------------- JWT WITH SESSION ---------------- */
//     const token = jwt.sign(
//       {
//         userId: user._id,
//         role: user.role,
//         sessionId: session._id,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );


// //    res.cookie("token", token, {
// //   httpOnly: true,
// //   secure: process.env.NODE_ENV === "production",
// //   sameSite: "strict",
// //   maxAge: 7 * 24 * 60 * 60 * 1000,
// // });


// res.cookie("token", token, {
//   httpOnly: true,
//   secure: process.env.NODE_ENV === "production",
//   sameSite: "lax",
//   maxAge: 7 * 24 * 60 * 60 * 1000,
// });

// res.json({ token, role: user.role });

//   } catch (err) {
//     // console.error("LOGIN ERROR:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// /* ======================
//    VERIFY EMAIL
// ====================== */
// // export const verifyEmail = async (req, res) => {
// //   try {
// //     const hashedToken = crypto
// //       .createHash("sha256")
// //       .update(req.params.token)
// //       .digest("hex");

// //     const user = await User.findOne({
// //       emailVerificationToken: hashedToken,
// //       emailVerificationExpires: { $gt: Date.now() },
// //     });

// //     if (!user) {
// //       return res.status(400).json({ message: "Invalid or expired token" });
// //     }

// //     user.isEmailVerified = true;
// //     user.status = "ACTIVE";
// //     user.emailVerificationToken = undefined;
// //     user.emailVerificationExpires = undefined;

// //     await user.save();

// //     res.json({ message: "Email verified successfully" });

// //   } catch (err) {
// //     console.error("VERIFY EMAIL ERROR:", err);
// //     res.status(500).json({ message: "Server error" });
// //   }
// // };


// /* ======================
//    CHANGE PASSWORD
// ====================== */
// export const changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({ message: "All fields required" });
//     }

//     if (newPassword.length < 6) {
//       return res.status(400).json({ message: "Password must be at least 6 characters" });
//     }

//     const user = await User.findById(req.user.userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const isMatch = await bcrypt.compare(currentPassword, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: "Current password incorrect" });
//     }

//     const hashedPassword = await bcrypt.hash(newPassword, 10);
//     user.password = hashedPassword;

//     await user.save();

//     /* OPTIONAL BUT STRONGLY RECOMMENDED */
//     // Logout all other sessions except current one
//     await UserSession.updateMany(
//       {
//         userId: user._id,
//         _id: { $ne: req.user.sessionId },
//       },
//       { isActive: false }
//     );

//     res.json({ message: "Password updated successfully" });

//   } catch (err) {
//     // console.error("CHANGE PASSWORD ERROR:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// export const logout = async (req, res)=>{
//   try{
//     if(!req.user.userId){
//       return res.status(401).json({message: "unauthorize"});
//     }
//     if(req.user.sessionId){
//       await UserSession.findByIdAndUpdate(req.user.session,{
//         isActive: false,
//         lastActive: new Date(),
//       });
//     }

//     res.clearCookie("token",{
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//     });
//     return res.json({message: "Logiut successfully"});
//   }
//   catch(err){
   
//     return res.status(500).json({message: "server error"});
//   }
// };

// /* ======================
//    REQUEST DELETE ACCOUNT
// ====================== */
// // export const requestDeleteAccount = async (req, res) => {
// //   try {
// //     const user = await User.findById(req.user.userId);
// //     if (!user) return res.status(404).json({ message: "User not found" });

// //     const rawToken = crypto.randomBytes(32).toString("hex");
// //     const hashedToken = crypto
// //       .createHash("sha256")
// //       .update(rawToken)
// //       .digest("hex");

// //     user.deleteAccountToken = hashedToken;
// //     user.deleteAccountExpires = Date.now() + 15 * 60 * 1000; // 15 min expiry

// //     await user.save();

// //     const deleteURL = `${process.env.FRONTEND_URL}/confirm-delete/${rawToken}`;

// //     await sendEmail({
// //       to: user.email,
// //       subject: "Confirm Account Deletion",
// //       html: `
// //         <h2>Confirm Account Deletion</h2>
// //         <p>This action is permanent.</p>
// //         <a href="${deleteURL}" 
// //            style="background:red;color:white;padding:10px 20px;text-decoration:none;">
// //            Confirm Delete
// //         </a>
// //         <p>This link expires in 15 minutes.</p>
// //       `,
// //     });

// //     res.json({ message: "Confirmation email sent" });

// //   } catch (err) {
// //     console.error("REQUEST DELETE ERROR:", err);
// //     res.status(500).json({ message: "Server error" });
// //   }
// // };

// // /* ======================
// //    CONFIRM DELETE ACCOUNT
// // ====================== */
// // export const confirmDeleteAccount = async (req, res) => {
// //   try {
// //     const hashedToken = crypto
// //       .createHash("sha256")
// //       .update(req.params.token)
// //       .digest("hex");

// //     const user = await User.findOne({
// //       deleteAccountToken: hashedToken,
// //       deleteAccountExpires: { $gt: Date.now() },
// //     });

// //     if (!user) {
// //       return res.status(400).json({ message: "Invalid or expired token" });
// //     }

// //     const userId = user._id;

// //     // delete related data
// //     await UserSession.deleteMany({ userId });
// //     await Wallet.deleteOne({ user: userId });
// //     await WalletTransaction.deleteMany({ user: userId });

// //     await User.findByIdAndDelete(userId);

// //     res.json({ message: "Account deleted permanently" });

// //   } catch (err) {
// //     console.error("CONFIRM DELETE ERROR:", err);
// //     res.status(500).json({ message: "Server error" });
// //   }
// // };

// export const deleteAccount = async (req, res) => {
//   try {
//     const userId = req.user.userId;
//     const { reason, feedback } = req.body;

//     // console.log("Delete Reason:", reason);
//     // console.log("Feedback:", feedback);

//     await UserSession.deleteMany({ userId });
//     await Wallet.deleteOne({ user: userId });
//     await WalletTransaction.deleteMany({ user: userId });

//     await User.findByIdAndDelete(userId);

//     res.clearCookie("token", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//     });

//     return res.json({ message: "Account deleted successfully" });

//   } catch (err) {
//     // console.error("DELETE ACCOUNT ERROR:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// export const me = async (req, res) => {
//   const user = await User.findById(req.user.userId).select(
//     "_id name email role walletNumber referralCode profileImage createdAt"
//   );

// //   const user = await User.findById(req.user.userId).select(
// //   "-password"
// // );


//   res.json({ user });
// };
