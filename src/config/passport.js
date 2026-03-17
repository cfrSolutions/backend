// import passport from "passport";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// import User from "../models/User.model.js";

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "/api/auth/google/callback",
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         const email = profile.emails[0].value;

//         let user = await User.findOne({ email });

//         if (!user) {
//           // ❌ block admin auto signup
//           if (email.endsWith("@cfr.solutions")) {
//             return done(null, false, {
//               message: "Admin must be created by SuperAdmin",
//             });
//           }

//           user = await User.create({
//             name: profile.displayName,
//             email,
//             isEmailVerified: true,
//             status: "ACTIVE",
//             role: "USER",
//           });
//         }
// console.log("GOOGLE_CLIENT_ID =", process.env.GOOGLE_CLIENT_ID);
// console.log(
//   "GOOGLE_CLIENT_SECRET =",
//   process.env.GOOGLE_CLIENT_SECRET ? "LOADED" : "MISSING"
// );

//         return done(null, user);
//       } catch (err) {
//         return done(err, null);
//       }
//     }
    
//   )
// );

// export default passport;

// import passport from "passport";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// import User from "../models/User.model.js";
// import { generateReferralCode } from "../utils/referral.js";
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "/api/auth/google/callback",
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         const email = profile.emails[0].value;
//         const googleId = profile.id;
//          const referralCode = req.session?.referralCode;
//         // 1. Try to find user by googleId FIRST, then by email
//         let user = await User.findOne({ 
//           $or: [{ googleId: googleId }, { email: email }] 
//         });

//         if (!user) {
//           // 2. ❌ Block admin auto-signup based on domain
//           if (email.endsWith("@cfr.solutions")) {
//             return done(null, false, {
//               message: "Admin must be created by SuperAdmin",
//             });
//           }

//           // 3. Create new user (Mongoose will skip password because googleId is present)
//           user = await User.create({
//             googleId: googleId,
//             name: profile.displayName,
//             googleId: profile.id,
//             email,
//             isEmailVerified: true, 
//             status: "ACTIVE",
//             role: "USER",
//             walletNumber: Math.floor(10000000 + Math.random() * 90000000).toString(),
//             referralCode: generateReferralCode(profile.displayName),
//           });
//         } else if (!user.googleId) {
//           // 4. Link googleId if user exists but registered via email before
//           user.googleId = googleId;
//           user.isEmailVerified = true; // Trust Google's verification
//           await user.save();
//         }

//         // Logs for debugging
//         console.log("GOOGLE_CLIENT_ID =", process.env.GOOGLE_CLIENT_ID);
//         console.log("GOOGLE_CLIENT_SECRET =", process.env.GOOGLE_CLIENT_SECRET ? "LOADED" : "MISSING");

//         return done(null, user);
//       } catch (err) {
//         console.error("Passport Google Error:", err);
//         return done(err, null);
//       }
//     }
//   )
// );

// export default passport;


import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.model.js";
import { generateReferralCode } from "../utils/referral.js";
import WalletTransaction from "../models/WalletTransaction.model.js";
import Wallet from "../models/Wallet.model.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://api.inputify.io/api/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        
        // 1. Try to find user by googleId FIRST, then by email
        let user = await User.findOne({ 
          $or: [{ googleId: googleId }, { email: email }] 
        });

        if (!user) {

  // get referral from session or query
  const referralCode = req.session?.referralCode;

  user = new User({
    name: profile.displayName,
    email: profile.emails[0].value,
    googleId: profile.id,
    isEmailVerified: true,
    status: "ACTIVE",
    walletNumber: Math.floor(10000000 + Math.random() * 90000000).toString(),
    referralCode: generateReferralCode(profile.displayName)
  });

  // attach referrer
  if (referralCode) {
    const refUser = await User.findOne({ referralCode });
    if (refUser) {
      user.referredBy = refUser._id;
    }
  }
console.log("Referral from session:", referralCode);

  await user.save();

  /* ===== REFERRAL REWARD ===== */

  if (user.referredBy) {

  // prevent duplicate rewards
  const exists = await WalletTransaction.findOne({
    user: user.referredBy,
    description: "Referral bonus",
    referredUser: user._id
  });

  if (!exists) {

    const REFERRAL_POINTS = 30;

    await WalletTransaction.create({
      user: user.referredBy,
      type: "EARN",
      points: REFERRAL_POINTS,
      description: "Referral bonus",
      source: "SURVEY",
      referredUser: user._id
    });

    await Wallet.findOneAndUpdate(
      { user: user.referredBy },
      {
        $inc: {
          balance: REFERRAL_POINTS,
          totalEarned: REFERRAL_POINTS
        }
      },
      { upsert: true }
    );
  }
}

}
 else if (!user.googleId) {
          // 4. Link googleId if user exists but registered via email before
          user.googleId = googleId;
          user.isEmailVerified = true; // Trust Google's verification
          await user.save();
        }

        // Logs for debugging
        console.log("GOOGLE_CLIENT_ID =", process.env.GOOGLE_CLIENT_ID);
        console.log("GOOGLE_CLIENT_SECRET =", process.env.GOOGLE_CLIENT_SECRET ? "LOADED" : "MISSING");

        return done(null, user);
      } catch (err) {
        console.error("Passport Google Error:", err);
        return done(err, null);
      }
    }
  )
);

export default passport;