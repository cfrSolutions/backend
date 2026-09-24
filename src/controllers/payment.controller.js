import crypto from "crypto";
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

    const currency = String(
  invoice.currency || ""
).toUpperCase();

if (currency !== "USD") {
  return res.status(400).json({
    success: false,
    message: "Invoice currency must be USD",
  });
}

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

export async function verifyPayment(req, res) {
  try {
    const { projectId } = req.params;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // 1. Validate input
    if (
      !projectId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification data is missing",
      });
    }

    // 2. Find project
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // 3. Verify project ownership
    const userId =
      req.user?.userId ||
      req.user?._id ||
      req.user?.id;

    if (
      !userId ||
      project.business.toString() !==
        userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to verify this payment",
      });
    }

    // 4. Find invoice
    const invoice = await Invoice.findOne({
      project: projectId,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (invoice.status === "PAID") {
      return res.status(200).json({
        success: true,
        message: "Invoice is already paid",
        invoice,
      });
    }

    // 5. Generate expected Razorpay signature
    const body =
      `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(body)
      .digest("hex");

    // 6. Timing-safe signature comparison
    const expectedBuffer = Buffer.from(
      expectedSignature,
      "utf8"
    );

    const receivedBuffer = Buffer.from(
      String(razorpay_signature),
      "utf8"
    );

    if (
      expectedBuffer.length !==
        receivedBuffer.length ||
      !crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // 7. Verify payment directly with Razorpay
    const payment =
      await razorpay.payments.fetch(
        razorpay_payment_id
      );

    if (!payment) {
      return res.status(400).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Payment must belong to this exact order
    if (payment.order_id !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Payment order mismatch",
      });
    }

    // 8. Verify amount and currency
    const expectedAmount = Math.round(
      Number(invoice.total) * 100
    );

    if (
      Number(payment.amount) !== expectedAmount ||
      String(payment.currency).toUpperCase() !==
        "USD"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount or currency mismatch",
      });
    }

    // 9. Require successful payment state
    if (
      !["captured", "authorized"].includes(
        String(payment.status).toLowerCase()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment is not successful",
      });
    }

    // 10. Mark invoice paid only after verification
    invoice.status = "PAID";

    await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      invoice,
    });

  } catch (error) {
    console.error(
      "VERIFY RAZORPAY PAYMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
}