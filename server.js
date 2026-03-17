import "./src/config/env.js";
import express from "express";
import cors from "cors";
import passport from "passport";
import helmet from "helmet";
import rateLimit from "express-rate-limit"; 
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import surveyRoutes from "./src/routes/survey.routes.js";
import securityRoutes from "./src/routes/security.routes.js";
import cookieParser from "cookie-parser";

/* 🔑 PASSPORT CONFIG AFTER ENV */
import "./src/config/passport.js";
import userSurveyRoutes from "./src/routes/userSurveys.routes.js";
import surveyResponseRoutes from "./src/routes/surveyResponse.routes.js";
import returnRoutes from "./src/routes/return.routes.js";
import walletRoutes from "./src/routes/wallet.routes.js";
import userDashboardRoutes from "./src/routes/userDashboard.routes.js";
import giftCardRoutes from "./src/routes/giftcard.routes.js";
import referralRoutes from "./src/routes/referral.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import session from "express-session";
import userProfileRoutes from "./src/routes/userProfile.routes.js";
import locationRoutes from "./src/routes/location.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
const app = express();
app.use(cookieParser());
app.use(cors({
  // origin: process.env.FRONTEND_URL
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 300, // 300 requests per IP
  })
);

// 🔐 Login brute-force protection
app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
  })
);

// 🔐 Register spam protection
app.use(
  "/api/auth/register",
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3,
  })
);

// 🔐 Survey submission protection (VERY important for you)
app.use(
  "/api/responses",
  rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
  })
);
// app.use(cookieParser());

/* -------------------- MIDDLEWARE -------------------- */
// app.use(cors());
// app.use(cors({
//   origin: process.env.FRONTEND_URL,
//   credentials: true,
// }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false // true only in HTTPS production
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());
/* -------------------- DATABASE -------------------- */
await connectDB();

/* -------------------- ROUTES -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/surveys", surveyRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/user-surveys", userSurveyRoutes)
app.use("/api/responses", surveyResponseRoutes);
app.use("/api/return", returnRoutes);
app.use("/api/wallet", walletRoutes)
app.use("/api/giftcards", giftCardRoutes);
app.use("/api/user-dashboard", userDashboardRoutes);
app.use("/api/referral", referralRoutes);
app.use("/api/users", userRoutes);
app.use("/api/users/profile", userProfileRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/notifications", notificationRoutes);
/* -------------------- SERVER -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
