import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
  {
    targetGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    targetGroupName: {
      type: String,
      required: true,
    },

    cpi: {
      type: Number,
      required: true,
      min: 0,
    },

    targetCompletes: {
      type: Number,
      required: true,
      min: 0,
    },

    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      // unique: true,
      index: true,
    },

    targetGroups: {
  type: [
    {
      type: mongoose.Schema.Types.ObjectId,
    }
  ],
  default: [],
},

    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "GENERATED",
        "PAID",
        "CANCELLED",
      ],
      default: "GENERATED",
    },

    items: {
      type: [invoiceItemSchema],
      default: [],
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      trim: true,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },
    razorpayOrderId: {
  type: String,
  default: null,
  index: true,
},

razorpayPaymentId: {
  type: String,
  default: null,
},

paidAt: {
  type: Date,
  default: null,
},
  },
  {
    timestamps: true,
  }
);

const Invoice = mongoose.model(
  "Invoice",
  invoiceSchema
);

export default Invoice;