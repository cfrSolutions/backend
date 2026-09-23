import { generateProjectInvoice } from "../services/invoice.service.js";
import {generateInvoicePdf} from "../services/invoicePdf.service.js";
import BusinessProfile from "../models/BusinessProfile.model.js";
import Invoice from "../models/Invoice.model.js";
import Project from "../models/Project.model.js";

export async function generateInvoiceForProject(req, res) {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        message: "Project ID is required",
      });
    }

    const invoice = await generateProjectInvoice(projectId);

    return res.status(200).json({
      success: true,
      message: "Invoice generated successfully",
      invoice,
    });
  } catch (error) {
    console.error("Generate invoice error:", error);

    if (error.message === "Project not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (
      error.message ===
      "Invoice can only be generated for a closed project"
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to generate invoice",
    });
  }
}

export async function getProjectInvoice(req, res) {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        message: "Project ID is required",
      });
    }

    const project = await Project.findById(projectId)
      .populate("business", "email");

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const invoice = await Invoice.findOne({
      project: projectId,
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    const businessProfile =
      await BusinessProfile.findOne({
        userId: project.business?._id,
      }).select(
        "name company phone country location postalCode"
      );

    return res.status(200).json({
      success: true,
      invoice,

      business: {
        email: project.business?.email || "",
        name: businessProfile?.name || "",
        company: businessProfile?.company || "",
        phone: businessProfile?.phone || "",
        country: businessProfile?.country || "",
        location: businessProfile?.location || "",
        postalCode: businessProfile?.postalCode || "",
      },
    });
  } catch (error) {
    console.error("Get invoice error:", error);

    return res.status(500).json({
      message: "Failed to fetch invoice",
    });
  }
}

export async function downloadProjectInvoicePdf(
  req,
  res
) {
  try {
    const { projectId } =
      req.params;

    if (!projectId) {
      return res.status(400).json({
        message:
          "Project ID is required",
      });
    }


    /* =========================================
       GET PROJECT
    ========================================= */

   const project =
  await Project.findById(
    projectId
  ).populate(
    "business",
    "email"
  );

    if (!project) {
      return res.status(404).json({
        message:
          "Project not found",
      });
    }

    /* =========================================
   GET BUSINESS PROFILE
========================================= */

const businessProfile =
  await BusinessProfile.findOne({
    userId: project.business?._id,
  }).select(
    "name company phone country location postalCode"
  );
    /* =========================================
       CLOSED PROJECT ONLY
    ========================================= */

    if (
      project.status !== "CLOSED"
    ) {
      return res.status(400).json({
        message:
          "Invoice is only available for closed projects",
      });
    }


    /* =========================================
       GET INVOICE
    ========================================= */

    const invoice =
      await Invoice.findOne({
        project: projectId,
      });

    if (!invoice) {
      return res.status(404).json({
        message:
          "Invoice not found",
      });
    }


    /* =========================================
       GENERATE PDF
    ========================================= */

   const pdfBuffer =
  await generateInvoicePdf(
    invoice,
    project,
    businessProfile
  );


    /* =========================================
       SAFE FILE NAME
    ========================================= */

    const invoiceNumber =
      invoice.invoiceNumber ||
      `invoice-${projectId}`;

    const safeInvoiceNumber =
      String(invoiceNumber)
        .replace(
          /[^a-zA-Z0-9-_]/g,
          "_"
        );


    /* =========================================
       RESPONSE HEADERS
    ========================================= */

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeInvoiceNumber}.pdf"`
    );

    res.setHeader(
      "Cache-Control",
      "private, no-store"
    );


    /* =========================================
       SEND PDF
    ========================================= */

    return res.send(
      Buffer.from(pdfBuffer)
    );

  } catch (error) {

    console.error(
      "Download invoice PDF error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to generate invoice PDF",
    });
  }
}