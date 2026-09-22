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

  // 3. Prevent duplicate invoice
  const existingInvoice = await Invoice.findOne({
    project: project._id,
  });

  if (existingInvoice) {
    return existingInvoice;
  }

  // 4. Build invoice items from target groups
  const items = [];

  for (const targetGroup of project.targetGroups || []) {
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

  // 5. Calculate invoice subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + item.totalCost,
    0
  );

  // 6. Create invoice
  const invoice = await Invoice.create({
    project: project._id,

    invoiceNumber: generateInvoiceNumber(),

    status: "GENERATED",

    items,

    subtotal,

    total: subtotal,

    currency: "INR",

    issuedAt: new Date(),
  });

  return invoice;
}