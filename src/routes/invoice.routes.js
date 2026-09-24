import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { generateInvoiceForProject, getProjectInvoice, downloadProjectInvoicePdf, getBusinessInvoices } from "../controllers/invoice.controller.js";
import { businessOnly } from "../middleware/business.middleware.js";

const router = express.Router();

/*
=====================================================
GENERATE PROJECT INVOICE
POST /api/invoices/project/:projectId/generate

Invoice can only be generated when project is CLOSED.
=====================================================
*/

router.get(
  "/business",
  authMiddleware,
  businessOnly,
  getBusinessInvoices
);

router.post(
  "/project/:projectId/generate",
  authMiddleware,
  businessOnly,
  generateInvoiceForProject,

);

router.get(
  "/project/:projectId",
  authMiddleware,
  businessOnly,
  getProjectInvoice
);

router.get(
  "/project/:projectId/pdf",
  authMiddleware,
  businessOnly,
  downloadProjectInvoicePdf
);

export default router;