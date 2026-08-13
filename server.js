import "./src/config/env.js";
import express from "express";
import cors from "cors";
import passport from "passport";
import http from "http";
import { Server } from "socket.io";
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
import projectRoutes from "./src/routes/project.routes.js";
import businessRedirects from "./src/routes/businessRedirects.routes.js";
import profileRoutes from "./src/routes/profile.routes.js";
import surveyBuilderRoutes  from "./src/routes/surveyBuilder.routes.js";
import postbackRoutes from "./src/routes/postback.routes.js";
//import businessRoutes from "./src/routes/business.routes.js";

const app = express();
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(cors({
  // origin: process.env.FRONTEND_URL
  origin: [
    "https://inputify.io",
    "https://www.inputify.io",
    "https://frontend-eld6db4vs-cfrsolutions-projects.vercel.app",
    "http://localhost:5173",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  }));
// app.use(
//   rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 min
//     max: 300, // 300 requests per IP
//   })
// );
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use((req, res, next) => {

  // SKIP SOCKET.IO
  if (req.path.startsWith("/socket.io/")) {
    return next();
  }

  globalLimiter(req, res, next);

});
// 🔐 Login brute-force protection
app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// 🔐 Register spam protection
app.use(
  "/api/auth/register",
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
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
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
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
// app.use("/api/business", businessRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/redirect", businessRedirects);
app.use("/api/profiles", profileRoutes);
app.use("/api/survey-builder", surveyBuilderRoutes );
app.use("/api/postback", postbackRoutes);

/* -------------------- SOCKET SERVER -------------------- */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "https://inputify.io",
    "https://www.inputify.io",
    "https://frontend-eld6db4vs-cfrsolutions-projects.vercel.app",
    "http://localhost:5173",
    ],
    credentials: true,
  },
});

io.on("connection", (socket) => {

  console.log("User Connected:", socket.id);

  // JOIN PROJECT ROOM
  socket.on("join_project", (projectId) => {

    socket.join(projectId);

    console.log(`Joined Project Room: ${projectId}`);
  });

  // SEND MESSAGE
  socket.on("send_message", (data) => {

    io.to(data.projectId).emit(
      "receive_message",
      data
    );

    console.log("📩 Message Sent");
  });

  // DISCONNECT
  socket.on("disconnect", () => {

    console.log("User Disconnected");
  });

});


/* -------------------- SERVER -------------------- */
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// const PORT = process.env.PORT || 5000;

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
