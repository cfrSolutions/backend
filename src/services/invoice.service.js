import crypto from "crypto";
import Project from "../models/Project.model.js";
import Invoice from "../models/Invoice.model.js";

function generateInvoiceNumber() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `INV-${timestamp}-${random}`;
}

export async function generateProjectInvoice(projectId) {
  // 1. Find project
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  // 2. Invoice can only be generated for CLOSED projects
  if (project.status !== "CLOSED") {
    throw new Error(
      "Invoice can only be generated for a closed project"
    );
  }

  // 3. Find all previous invoices for this project
  const previousInvoices = await Invoice.find({
    project: project._id,
  }).select("targetGroups items status");

  // 4. Collect every target group that has already been invoiced
  const invoicedTargetGroupIds = new Set();

  for (const invoice of previousInvoices) {
    // New invoice structure
    for (const targetGroupId of invoice.targetGroups || []) {
      invoicedTargetGroupIds.add(
        targetGroupId.toString()
      );
    }

    // Backward compatibility for old invoices
    for (const item of invoice.items || []) {
      if (item.targetGroupId) {
        invoicedTargetGroupIds.add(
          item.targetGroupId.toString()
        );
      }
    }
  }

  // 5. Find target groups that have NOT been invoiced yet
  const newTargetGroups = (
    project.targetGroups || []
  ).filter((targetGroup) => {
    return !invoicedTargetGroupIds.has(
      targetGroup._id.toString()
    );
  });

  // Nothing new to invoice
  if (newTargetGroups.length === 0) {
    return null;
  }

  // 6. Build invoice items ONLY from new target groups
  const items = [];

  for (const targetGroup of newTargetGroups) {
    const targetCompletes =
      Number(targetGroup.targetCompletes) || 0;

    const cpi =
      Number(targetGroup.cpi) || 0;

    const totalCost =
      Number(targetGroup.totalCost) || 0;

    items.push({
      targetGroupId: targetGroup._id,
      targetGroupName: targetGroup.name,
      cpi,
      targetCompletes,
      totalCost,
    });
  }

  // 7. Calculate only the new invoice subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + item.totalCost,
    0
  );

  // 8. Create a NEW invoice
  const invoice = await Invoice.create({
    project: project._id,

    targetGroups: newTargetGroups.map(
      (targetGroup) => targetGroup._id
    ),

    invoiceNumber: generateInvoiceNumber(),

    status: "GENERATED",

    items,

    subtotal,

    total: subtotal,

    currency: "USD",

    issuedAt: new Date(),
  });

  return invoice;
}

// export async function generateProjectInvoice(projectId) {
//   // 1. Find project
//   const project = await Project.findById(projectId);

//   if (!project) {
//     throw new Error("Project not found");
//   }

//   // 2. Invoice can only be generated for CLOSED projects
//   if (project.status !== "CLOSED") {
//     throw new Error(
//       "Invoice can only be generated for a closed project"
//     );
//   }

//   // 3. Prevent duplicate invoice
//   const existingInvoice = await Invoice.findOne({
//     project: project._id,
//   });

//   if (existingInvoice) {
//     return existingInvoice;
//   }

//   // 4. Build invoice items from target groups
//   const items = [];

//   for (const targetGroup of project.targetGroups || []) {
//     const targetCompletes =
//       Number(targetGroup.targetCompletes) || 0;

//     const cpi =
//       Number(targetGroup.cpi) || 0;

//     const totalCost =
//       Number(targetGroup.totalCost) || 0;

//     items.push({
//       targetGroupId: targetGroup._id,
//       targetGroupName: targetGroup.name,
//       cpi,
//       targetCompletes,
//       totalCost,
//     });
//   }

//   // 5. Calculate invoice subtotal
//   const subtotal = items.reduce(
//     (sum, item) => sum + item.totalCost,
//     0
//   );

//   // 6. Create invoice
//   const invoice = await Invoice.create({
//     project: project._id,

//     invoiceNumber: generateInvoiceNumber(),

//     status: "GENERATED",

//     items,

//     subtotal,

//     total: subtotal,

//     currency: "USD",

//     issuedAt: new Date(),
//   });

//   return invoice;
// }