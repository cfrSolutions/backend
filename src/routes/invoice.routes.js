import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { generateInvoiceForProject, getProjectInvoice } from "../controllers/invoice.controller.js";
import { businessOnly } from "../middleware/business.middleware.js";

const router = express.Router();

/*
=====================================================
GENERATE PROJECT INVOICE
POST /api/invoices/project/:projectId/generate

Invoice can only be generated when project is CLOSED.
=====================================================
*/

router.post(
  "/project/:projectId/generate",
  authMiddleware,
  businessOnly,
  generateInvoiceForProject,

);

export default router;