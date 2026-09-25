import mongoose from "mongoose";
import crypto from "crypto";
import Invoice from "../models/Invoice.model.js";
import Project from "../models/Project.model.js";
import razorpay from "../config/razorpay.js";

function getAuthenticatedUserId(req) {
  return (
    req.user?._id ||
    req.user?.userId ||
    req.user?.id ||
    null
  );
}


// export async function createPaymentOrder(req, res) {
//   try {
//     const { invoiceId } = req.params;

//     if (!invoiceId) {
//       return res.status(400).json({
//         success: false,
//         message: "Invoice ID is required",
//       });
//     }

//     // 1. Find exact invoice
//     const invoice = await Invoice.findById(invoiceId);

//     if (!invoice) {
//       return res.status(404).json({
//         success: false,
//         message: "Invoice not found",
//       });
//     }

//     // 2. Find project belonging to this invoice
//     const project = await Project.findById(
//       invoice.project
//     );

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: "Project not found",
//       });
//     }

//     // 3. Verify logged-in business owns project
//     const userId =
//       req.user?.userId ||
//       req.user?._id ||
//       req.user?.id;

//     if (
//       !userId ||
//       project.business.toString() !==
//         userId.toString()
//     ) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "You are not allowed to pay this invoice",
//       });
//     }

//     // 4. Already paid
//     if (invoice.status === "PAID") {
//       return res.status(400).json({
//         success: false,
//         message: "Invoice is already paid",
//       });
//     }

//     const total = Number(invoice.total);

//     if (
//       !Number.isFinite(total) ||
//       total <= 0
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid invoice amount",
//       });
//     }

//     const currency = String(
//       invoice.currency || ""
//     ).toUpperCase();

//     if (currency !== "USD") {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invoice currency must be USD",
//       });
//     }

//     // Razorpay expects smallest currency subunit
//     const amount = Math.round(
//       total * 100
//     );

//     // 5. Create Razorpay order for THIS invoice
//     const order =
//       await razorpay.orders.create({
//         amount,
//         currency: "USD",
//         receipt: invoice.invoiceNumber,

//         notes: {
//           projectId:
//             project._id.toString(),

//           invoiceId:
//             invoice._id.toString(),

//           invoiceNumber:
//             invoice.invoiceNumber,
//         },
//       });

//     // 6. Safe checkout information only
//     return res.status(201).json({
//       success: true,

//       order: {
//         id: order.id,
//         amount: order.amount,
//         currency: order.currency,
//       },

//       keyId:
//         process.env.RAZORPAY_KEY_ID,
//     });

//   } catch (error) {
//     console.error(
//       "CREATE RAZORPAY ORDER ERROR:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Failed to create payment order",
//     });
//   }
// }

export async function createPaymentOrder(req, res) {
  try {
    const { invoiceId } = req.params;

    const userId =
      getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        invoiceId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID",
      });
    }

    // Find invoice
    const invoice =
      await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // SECURITY:
    // The invoice's project MUST belong
    // to the authenticated business.
    const project =
      await Project.findOne({
        _id: invoice.project,
        business: userId,
      }).select("_id business status");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Only payable invoice states
    if (
      !["GENERATED", "PENDING"].includes(
        invoice.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          invoice.status === "PAID"
            ? "Invoice is already paid"
            : "Invoice cannot be paid",
      });
    }

    const total =
      Number(invoice.total);

    if (
      !Number.isFinite(total) ||
      total <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice amount",
      });
    }

    const currency =
      String(
        invoice.currency || ""
      ).toUpperCase();

    if (currency !== "USD") {
      return res.status(400).json({
        success: false,
        message:
          "Invoice currency must be USD",
      });
    }

    const amount =
      Math.round(total * 100);

    // const order =
    //   await razorpay.orders.create({
    //     amount,
    //     currency: "USD",
    //     receipt: invoice.invoiceNumber,

    //     notes: {
    //       projectId:
    //         project._id.toString(),

    //       invoiceId:
    //         invoice._id.toString(),

    //       invoiceNumber:
    //         invoice.invoiceNumber,
    //     },
    //   });
    // =====================================================
// SECURITY:
// REUSE EXISTING RAZORPAY ORDER WHEN POSSIBLE
// =====================================================

// if (invoice.razorpayOrderId) {
//   try {
//     const existingOrder =
//       await razorpay.orders.fetch(
//         invoice.razorpayOrderId
//       );

//     const existingAmount =
//       Number(existingOrder.amount);

//     const existingCurrency =
//       String(
//         existingOrder.currency || ""
//       ).toUpperCase();

//     const existingStatus =
//       String(
//         existingOrder.status || ""
//       ).toLowerCase();

//     // Reuse only if the existing order still
//     // represents this exact invoice amount/currency
//     // and has not already been paid.
//     if (
//       existingAmount === amount &&
//       existingCurrency === "USD" &&
//       existingStatus !== "paid"
//     ) {
//       return res.status(200).json({
//         success: true,

//         order: {
//           id: existingOrder.id,
//           amount: existingOrder.amount,
//           currency: existingOrder.currency,
//         },

//         keyId:
//           process.env.RAZORPAY_KEY_ID,
//       });
//     }

//   } catch (error) {
//     console.error(
//       "FETCH EXISTING RAZORPAY ORDER ERROR:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Failed to validate existing payment order",
//     });
//   }
// }

if (invoice.razorpayOrderId) {
  try {
    const existingOrder =
      await razorpay.orders.fetch(
        invoice.razorpayOrderId
      );

    const existingAmount =
      Number(existingOrder.amount);

    const existingCurrency =
      String(
        existingOrder.currency || ""
      ).toUpperCase();

    const existingStatus =
      String(
        existingOrder.status || ""
      ).toLowerCase();

    // ==========================================
    // SECURITY:
    // NEVER create another order when Razorpay
    // says this invoice's order is already paid.
    // ==========================================

    if (existingStatus === "paid") {
      return res.status(409).json({
        success: false,
        code: "PAYMENT_ALREADY_RECEIVED",
        message:
          "Payment has already been received and is being verified.",
      });
    }

    if (
  existingAmount !== amount ||
  existingCurrency !== "USD"
) {
  console.error(
    "PAYMENT ORDER INTEGRITY ERROR:",
    {
      invoiceId:
        invoice._id.toString(),
      orderId:
        invoice.razorpayOrderId,
    }
  );

  return res.status(409).json({
    success: false,
    code: "PAYMENT_ORDER_MISMATCH",
    message:
      "The payment order no longer matches this invoice. Please contact support.",
  });
}

    // ==========================================
    // REUSE EXISTING UNPAID ORDER
    // ==========================================

    if (
      existingAmount === amount &&
      existingCurrency === "USD"
    ) {
      return res.status(200).json({
        success: true,

        order: {
          id: existingOrder.id,
          amount:
            existingOrder.amount,
          currency:
            existingOrder.currency,
        },

        keyId:
          process.env.RAZORPAY_KEY_ID,
      });
    }

    // Do NOT return here.
    //
    // If amount/currency changed because another
    // target group was added to this still-unpaid
    // invoice, Step 4 will handle the lifecycle
    // of the stale order safely.

  } catch (error) {
    console.error(
      "FETCH EXISTING RAZORPAY ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to validate existing payment order",
    });
  }
}


// =====================================================
// SECURITY:
// ATOMIC PAYMENT ORDER CREATION LOCK
// =====================================================

const lockTime = new Date();

const lockedInvoice =
  await Invoice.findOneAndUpdate(
    {
      _id: invoice._id,

      status: "GENERATED",

      razorpayOrderId: null,

      $or: [
        {
          paymentOrderCreating: false,
        },
        {
          paymentOrderCreating: {
            $exists: false,
          },
        },
        {
          paymentOrderLockAt: {
            $lt: new Date(
              Date.now() - 2 * 60 * 1000
            ),
          },
        },
      ],
    },

    {
      $set: {
        paymentOrderCreating: true,
        paymentOrderLockAt: lockTime,
      },
    },

    {
      new: true,
    }
  );

if (!lockedInvoice) {
  return res.status(409).json({
    success: false,
    code: "PAYMENT_ORDER_IN_PROGRESS",
    message:
      "Payment order is already being created. Please try again.",
  });
}

// =====================================================
// CREATE NEW ORDER
// =====================================================

let order;
try {
order =
  await razorpay.orders.create({
    amount,
    currency: "USD",
    receipt: invoice.invoiceNumber,

    notes: {
      projectId:
        project._id.toString(),

      invoiceId:
        invoice._id.toString(),

      invoiceNumber:
        invoice.invoiceNumber,
    },
  });
  } catch (error) {
  await Invoice.updateOne(
    {
      _id: lockedInvoice._id,
      paymentOrderCreating: true,
      paymentOrderLockAt: lockTime,
      razorpayOrderId: null,
    },
    {
      $set: {
        paymentOrderCreating: false,
        paymentOrderLockAt: null,
      },
    }
  );

  throw error;
}

// =====================================================
// BIND ORDER TO INVOICE
// =====================================================

// invoice.razorpayOrderId =
//   order.id;

// invoice.status = "PENDING";

// await invoice.save();
const boundInvoice =
  await Invoice.findOneAndUpdate(
    {
      _id: lockedInvoice._id,
      paymentOrderCreating: true,
      paymentOrderLockAt: lockTime,
      razorpayOrderId: null,
      status: "GENERATED",
    },
    {
      $set: {
        razorpayOrderId: order.id,
        status: "PENDING",

        paymentOrderCreating: false,
        paymentOrderLockAt: null,
      },
    },
    {
      new: true,
    }
  );

if (!boundInvoice) {
  console.error(
    "RAZORPAY ORDER CREATED BUT INVOICE BIND FAILED:",
    {
      invoiceId:
        lockedInvoice._id.toString(),
      orderId: order.id,
    }
  );

  return res.status(409).json({
    success: false,
    code: "PAYMENT_ORDER_BIND_FAILED",
    message:
      "Payment order could not be safely attached to the invoice.",
  });
}


return res.status(201).json({
  success: true,

  order: {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
  },

  keyId:
    process.env.RAZORPAY_KEY_ID,
});

//       invoice.razorpayOrderId =
//   order.id;

// await invoice.save();

//     return res.status(201).json({
//       success: true,

//       order: {
//         id: order.id,
//         amount: order.amount,
//         currency: order.currency,
//       },

//       // Public Razorpay key.
//       // Secret is NEVER returned.
//       keyId:
//         process.env.RAZORPAY_KEY_ID,
//     });
  } catch (error) {
    

    return res.status(500).json({
      success: false,
      message:
        "Failed to create payment order",
    });
  }
}

export async function verifyPayment(req, res) {
  try {
    const { invoiceId } = req.params;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // 1. Validate input
    if (
      !invoiceId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment verification data is missing",
      });
    }

    if (
  !mongoose.Types.ObjectId.isValid(
    invoiceId
  )
) {
  return res.status(400).json({
    success: false,
    message: "Invalid invoice ID",
  });
}

    // 2. Find exact invoice
    const invoice =
      await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    
if (!invoice.razorpayOrderId) {
  return res.status(400).json({
    success: false,
    message:
      "No payment order exists for this invoice",
  });
}


if (
  invoice.razorpayOrderId !==
  razorpay_order_id
) {
  return res.status(400).json({
    success: false,
    message:
      "Payment order does not belong to this invoice",
  });
}

    // 3. Find project belonging to invoice
    // const project =
    //   await Project.findById(
    //     invoice.project
    //   );

    // if (!project) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Project not found",
    //   });
    // }

    // // 4. Verify ownership
    // const userId =
    //   req.user?.userId ||
    //   req.user?._id ||
    //   req.user?.id;

    // if (
    //   !userId ||
    //   project.business.toString() !==
    //     userId.toString()
    // ) {
    //   return res.status(403).json({
    //     success: false,
    //     message:
    //       "You are not allowed to verify this payment",
    //   });
    // }

    // =====================================================
// SECURITY:
// VERIFY AUTHENTICATED USER OWNS THIS INVOICE'S PROJECT
// =====================================================

const userId =
  getAuthenticatedUserId(req);

if (!userId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized",
  });
}

const project =
  await Project.findOne({
    _id: invoice.project,
    business: userId,
  }).select("_id business");

if (!project) {
  return res.status(404).json({
    success: false,
    message: "Invoice not found",
  });
}

    // if (invoice.status === "PAID") {
    //   return res.status(200).json({
    //     success: true,
    //     message:
    //       "Invoice is already paid",
    //     invoice,
    //   });
    // }
    // =====================================================
// SECURITY:
// IDEMPOTENT PAYMENT VERIFICATION
// =====================================================

if (invoice.status === "PAID") {

  // Same payment being verified again.
  // Safe to return success.
  if (
    invoice.razorpayPaymentId &&
    invoice.razorpayPaymentId ===
      razorpay_payment_id
  ) {
    return res.status(200).json({
      success: true,
      message:
        "Payment already verified",
      invoice,
    });
  }

  // Invoice is already paid using another payment.
  // Do not allow another payment to modify it.
  return res.status(409).json({
    success: false,
    message:
      "Invoice has already been paid",
  });
}

    // 5. Generate expected Razorpay signature
    const body =
      `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(body)
        .digest("hex");

    // 6. Timing-safe comparison
    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        "utf8"
      );

    const receivedBuffer =
      Buffer.from(
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
        message:
          "Payment verification failed",
      });
    }

    // 7. Fetch payment from Razorpay
    const payment =
      await razorpay.payments.fetch(
        razorpay_payment_id
      );

    if (!payment) {
      return res.status(400).json({
        success: false,
        message:
          "Payment not found",
      });
    }

    // Must belong to submitted order
    if (
      payment.order_id !==
      razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment order mismatch",
      });
    }

    // 8. Verify amount + currency
    const expectedAmount =
      Math.round(
        Number(invoice.total) * 100
      );

    if (
      Number(payment.amount) !==
        expectedAmount ||
      String(
        payment.currency
      ).toUpperCase() !== "USD"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment amount or currency mismatch",
      });
    }

    // 9. Successful payment only
    // if (
    //   ![
    //     "captured",
    //     "authorized",
    //   ].includes(
    //     String(
    //       payment.status
    //     ).toLowerCase()
    //   )
    // ) {
    //   return res.status(400).json({
    //     success: false,
    //     message:
    //       "Payment is not successful",
    //   });
    // }

    // 9. SECURITY:
// Invoice becomes PAID only after Razorpay
// confirms that the payment is CAPTURED.
const paymentStatus =
  String(
    payment.status || ""
  ).toLowerCase();

if (paymentStatus !== "captured") {
  return res.status(400).json({
    success: false,
    message:
      "Payment has not been captured",
  });
}
    // 10. Mark ONLY this invoice as paid
    invoice.status = "PAID";
    invoice.razorpayPaymentId =
  razorpay_payment_id;

invoice.paidAt =
  new Date();

    await invoice.save();

    return res.status(200).json({
      success: true,
      message:
        "Payment verified successfully",
      invoice,
    });

  } catch (error) {
    console.error(
      "VERIFY RAZORPAY PAYMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to verify payment",
    });
  }
}

// export async function verifyPayment(req, res) {
//   try {
//     const { projectId } = req.params;

//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//     } = req.body;

//     // 1. Validate input
//     if (
//       !projectId ||
//       !razorpay_order_id ||
//       !razorpay_payment_id ||
//       !razorpay_signature
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment verification data is missing",
//       });
//     }

//     // 2. Find project
//     const project = await Project.findById(projectId);

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: "Project not found",
//       });
//     }

//     // 3. Verify project ownership
//     const userId =
//       req.user?.userId ||
//       req.user?._id ||
//       req.user?.id;

//     if (
//       !userId ||
//       project.business.toString() !==
//         userId.toString()
//     ) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "You are not allowed to verify this payment",
//       });
//     }

//     // 4. Find invoice
//     const invoice = await Invoice.findOne({
//       project: projectId,
//     });

//     if (!invoice) {
//       return res.status(404).json({
//         success: false,
//         message: "Invoice not found",
//       });
//     }

//     if (invoice.status === "PAID") {
//       return res.status(200).json({
//         success: true,
//         message: "Invoice is already paid",
//         invoice,
//       });
//     }

//     // 5. Generate expected Razorpay signature
//     const body =
//       `${razorpay_order_id}|${razorpay_payment_id}`;

//     const expectedSignature = crypto
//       .createHmac(
//         "sha256",
//         process.env.RAZORPAY_KEY_SECRET
//       )
//       .update(body)
//       .digest("hex");

//     // 6. Timing-safe signature comparison
//     const expectedBuffer = Buffer.from(
//       expectedSignature,
//       "utf8"
//     );

//     const receivedBuffer = Buffer.from(
//       String(razorpay_signature),
//       "utf8"
//     );

//     if (
//       expectedBuffer.length !==
//         receivedBuffer.length ||
//       !crypto.timingSafeEqual(
//         expectedBuffer,
//         receivedBuffer
//       )
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment verification failed",
//       });
//     }

//     // 7. Verify payment directly with Razorpay
//     const payment =
//       await razorpay.payments.fetch(
//         razorpay_payment_id
//       );

//     if (!payment) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment not found",
//       });
//     }

//     // Payment must belong to this exact order
//     if (payment.order_id !== razorpay_order_id) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment order mismatch",
//       });
//     }

//     // 8. Verify amount and currency
//     const expectedAmount = Math.round(
//       Number(invoice.total) * 100
//     );

//     if (
//       Number(payment.amount) !== expectedAmount ||
//       String(payment.currency).toUpperCase() !==
//         "USD"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment amount or currency mismatch",
//       });
//     }

//     // 9. Require successful payment state
//     if (
//       !["captured", "authorized"].includes(
//         String(payment.status).toLowerCase()
//       )
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment is not successful",
//       });
//     }

//     // 10. Mark invoice paid only after verification
//     invoice.status = "PAID";

//     await invoice.save();

//     return res.status(200).json({
//       success: true,
//       message: "Payment verified successfully",
//       invoice,
//     });

//   } catch (error) {
//     console.error(
//       "VERIFY RAZORPAY PAYMENT ERROR:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message: "Failed to verify payment",
//     });
//   }
// }