// import express from "express";
// import { authMiddleware } from "../middleware/auth.middleware.js";
// import UserSession from "../models/UserSession.js";

// const router = express.Router();

// /* GET ACTIVE SESSIONS */
// router.get("/sessions", authMiddleware, async (req, res) => {
//   console.log("Fetching sessions for:", req.user.userId);

//   const sessions = await UserSession.find({
//     userId: req.user.userId,
//     isActive: true,
//   }).sort({ lastActiveAt: -1 });

//   res.json({
//     sessions: sessions.map((s) => ({
//       id: s._id,
//       device: s.device,
//       os: s.os,
//       lastActiveAt: s.lastActiveAt,
//       isCurrent: s._id.toString() === req.user.sessionId,
//     })),
//   });
// });


// /* LOGOUT DEVICE */
// router.delete("/sessions/:id", authMiddleware, async (req, res) => {
//   if (req.params.id === req.user.sessionId) {
//     return res.status(400).json({
//       message: "Cannot log out current device",
//     });
//   }

//   await UserSession.findOneAndUpdate(
//     { _id: req.params.id, userId: req.user.userId },
//     { isActive: false }
//   );

//   res.json({ message: "Device logged out" });
// });

// export default router;


import express from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/auth.middleware.js";
import UserSession from "../models/UserSession.js";

const router = express.Router();

/*
=====================================================
GET ACTIVE SESSIONS
Authenticated user can ONLY see their own sessions
=====================================================
*/
router.get(
  "/sessions",
  authMiddleware,
  async (req, res) => {
    try {
      const userId =
        req.user._id ||
        req.user.userId ||
        req.user.id;

      const currentSessionId = req.user.sessionId;

      // ---------------------------------------------
      // Validate authenticated user
      // ---------------------------------------------

      if (
        !userId ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return res.status(401).json({
          success: false,
          message: "Invalid authentication",
        });
      }

      // ---------------------------------------------
      // Find ONLY this user's active sessions
      // ---------------------------------------------

      const sessions = await UserSession.find({
        userId: new mongoose.Types.ObjectId(userId),
        isActive: true,
      })
        .select(
          "_id device os lastActiveAt createdAt"
        )
        .sort({
          lastActiveAt: -1,
        })
        .lean();

      return res.status(200).json({
        success: true,

        sessions: sessions.map((session) => ({
          id: session._id,

          device: session.device || "Unknown",

          os: session.os || "Unknown",

          lastActiveAt: session.lastActiveAt,

          isCurrent:
            currentSessionId &&
            session._id.toString() ===
              currentSessionId.toString(),
        })),
      });

    } catch (error) {
      console.error(
        "GET ACTIVE SESSIONS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to load sessions",
      });
    }
  }
);


/*
=====================================================
LOGOUT DEVICE
Authenticated user can ONLY logout their own device
=====================================================
*/
router.delete(
  "/sessions/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const userId =
        req.user._id ||
        req.user.userId ||
        req.user.id;

      const currentSessionId =
        req.user.sessionId;

      const sessionId = req.params.id;

      // ---------------------------------------------
      // Validate authentication
      // ---------------------------------------------

      if (
        !userId ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return res.status(401).json({
          success: false,
          message: "Invalid authentication",
        });
      }

      // ---------------------------------------------
      // Validate session ID
      // ---------------------------------------------

      if (
        !sessionId ||
        !mongoose.Types.ObjectId.isValid(sessionId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid session ID",
        });
      }

      // ---------------------------------------------
      // Prevent logging out current device
      // ---------------------------------------------

      if (
        currentSessionId &&
        sessionId === currentSessionId.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot log out current device",
        });
      }

      // ---------------------------------------------
      // IMPORTANT SECURITY:
      //
      // The query contains BOTH:
      //   _id = requested session
      //   userId = authenticated user
      //
      // Therefore another user's session cannot
      // be logged out by changing the URL ID.
      // ---------------------------------------------

      const session =
        await UserSession.findOneAndUpdate(
          {
            _id: new mongoose.Types.ObjectId(
              sessionId
            ),

            userId:
              new mongoose.Types.ObjectId(userId),

            isActive: true,
          },
          {
            $set: {
              isActive: false,
            },
          },
          {
            new: true,
          }
        );

      // ---------------------------------------------
      // Session does not belong to this user
      // or is already inactive
      // ---------------------------------------------

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Session not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Device logged out successfully",
      });

    } catch (error) {
      console.error(
        "LOGOUT DEVICE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to logout device",
      });
    }
  }
);

export default router;