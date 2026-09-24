import Invoice from "../models/Invoice.model.js";
import Project from "../models/Project.model.js";
import razorpay from "../config/razorpay.js";

export async function createPaymentOrder(req, res) {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    // 1. Find project
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // 2. Make sure logged-in business owns this project
    const userId =
      req.user?.userId ||
      req.user?._id ||
      req.user?.id;

    if (
      !userId ||
      project.business.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to pay this invoice",
      });
    }

    // 3. Find invoice from DB
    const invoice = await Invoice.findOne({
      project: projectId,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // 4. Don't create payment for already-paid invoice
    if (invoice.status === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Invoice is already paid",
      });
    }

    const total = Number(invoice.total);

    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice amount",
      });
    }

    const currency = (
      invoice.currency || "USD"
    ).toUpperCase();

    // Razorpay expects smallest currency subunit.
    const amount = Math.round(total * 100);

    // 5. Create Razorpay order
    const order = await razorpay.orders.create({
  amount,
  currency: "USD",
  receipt: invoice.invoiceNumber,

  notes: {
    projectId: project._id.toString(),
    invoiceId: invoice._id.toString(),
    invoiceNumber: invoice.invoiceNumber,
  },
});

    // 6. Return ONLY safe checkout information
    return res.status(201).json({
      success: true,

      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },

      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error(
      "CREATE RAZORPAY ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
}