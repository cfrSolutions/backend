import { generateProjectInvoice } from "../services/invoice.service.js";
import Invoice from "../models/Invoice.model.js";

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

    const invoice = await Invoice.findOne({
      project: projectId,
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Get invoice error:", error);

    return res.status(500).json({
      message: "Failed to fetch invoice",
    });
  }
}