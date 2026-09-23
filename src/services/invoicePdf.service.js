import puppeteer from "puppeteer";

/* =====================================================
   ESCAPE HTML
   Prevent invoice/project data from becoming HTML
===================================================== */
function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =====================================================
   FORMAT MONEY
===================================================== */
function formatCurrency(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/* =====================================================
   FORMAT DATE
===================================================== */
function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* =====================================================
   GENERATE INVOICE PDF
===================================================== */
export async function generateInvoicePdf(
  invoice,
  project
) {
  let browser;

  try {
    /* ===============================================
       INVOICE ITEMS
    =============================================== */

    const items = Array.isArray(invoice?.items)
      ? invoice.items
      : [];

    const itemRows = items
      .map((item, index) => {
        const cpi =
          Number(item?.cpi) || 0;

        const targetCompletes =
          Number(
            item?.targetCompletes
          ) || 0;

        const totalCost =
          Number(
            item?.totalCost
          ) || 0;

        return `
          <tr>
            <td class="center">
              ${index + 1}
            </td>

            <td>
              ${escapeHtml(
                item?.targetGroupName ||
                  "Target Group"
              )}
            </td>

            <td class="right">
              ${targetCompletes}
            </td>

            <td class="right">
              ${formatCurrency(cpi)}
            </td>

            <td class="right">
              ${formatCurrency(
                totalCost
              )}
            </td>
          </tr>
        `;
      })
      .join("");

    /* ===============================================
       TOTALS

       Your Invoice model currently stores:
       subtotal
       total

       No GST is being added here.
    =============================================== */

    const subtotal =
      Number(invoice?.subtotal) || 0;

    const total =
      Number(invoice?.total) ||
      subtotal;

    /* ===============================================
       PROJECT INFORMATION
    =============================================== */

    const projectName =
      project?.projectName ||
      project?.name ||
      project?.title ||
      "Project";

    const projectId =
      project?._id
        ? String(project._id)
        : "-";

    /* ===============================================
       HTML
    =============================================== */

    const html = `
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8" />

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>
  ${escapeHtml(
    invoice?.invoiceNumber ||
      "Invoice"
  )}
</title>

<style>

  @page {
    size: A4;
    margin: 0;
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;

    font-family:
      Arial,
      Helvetica,
      sans-serif;

    color: #111827;

    background: #ffffff;
  }

  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .invoice {
    width: 210mm;
    min-height: 297mm;

    margin: 0 auto;

    background: #ffffff;

    position: relative;
  }

  /* ==============================
     TOP BAR
  ============================== */

  .top-bar {
    height: 14px;
    background: #2563eb;
  }

  /* ==============================
     CONTENT
  ============================== */

  .content {
    padding:
      42px
      48px
      48px;
  }

  /* ==============================
     HEADER
  ============================== */

  .header {
    display: flex;

    justify-content:
      space-between;

    align-items:
      flex-start;

    gap: 40px;

    margin-bottom: 45px;
  }

  .brand-name {
    margin: 0 0 8px;

    font-size: 30px;

    font-weight: 800;

    letter-spacing: -1px;

    color: #111827;
  }

  .brand-accent {
    color: #2563eb;
  }

  .brand-description {
    margin: 0;

    color: #6b7280;

    font-size: 13px;

    line-height: 1.6;
  }

  .invoice-heading {
    text-align: right;
  }

  .invoice-title {
    margin: 0 0 12px;

    font-size: 34px;

    font-weight: 800;

    color: #111827;

    letter-spacing: 1px;
  }

  .invoice-number {
    color: #2563eb;

    font-size: 14px;

    font-weight: 700;
  }

  /* ==============================
     INFO BOXES
  ============================== */

  .info-grid {
    display: grid;

    grid-template-columns:
      1fr
      1fr;

    gap: 20px;

    margin-bottom: 35px;
  }

  .info-box {
    border: 1px solid #e5e7eb;

    border-radius: 10px;

    padding: 18px;

    background: #f9fafb;
  }

  .info-title {
    margin-bottom: 12px;

    color: #6b7280;

    font-size: 11px;

    font-weight: 700;

    text-transform: uppercase;

    letter-spacing: 1px;
  }

  .info-value {
    margin-bottom: 6px;

    font-size: 14px;

    font-weight: 700;

    color: #111827;
  }

  .info-small {
    margin-top: 5px;

    color: #6b7280;

    font-size: 12px;

    line-height: 1.6;
  }

  /* ==============================
     TABLE
  ============================== */

  .table-wrapper {
    margin-top: 10px;
  }

  table {
    width: 100%;

    border-collapse:
      collapse;

    table-layout:
      fixed;
  }

  thead {
    display:
      table-header-group;
  }

  tr {
    break-inside:
      avoid;

    page-break-inside:
      avoid;
  }

  th {
    padding:
      13px
      10px;

    background: #2563eb;

    color: #ffffff;

    font-size: 11px;

    font-weight: 700;

    text-align: left;

    text-transform:
      uppercase;
  }

  td {
    padding:
      15px
      10px;

    border-bottom:
      1px solid #e5e7eb;

    font-size: 12px;

    color: #374151;

    vertical-align:
      middle;

    word-break:
      break-word;
  }

  th:nth-child(1),
  td:nth-child(1) {
    width: 8%;
  }

  th:nth-child(2),
  td:nth-child(2) {
    width: 36%;
  }

  th:nth-child(3),
  td:nth-child(3) {
    width: 18%;
  }

  th:nth-child(4),
  td:nth-child(4) {
    width: 18%;
  }

  th:nth-child(5),
  td:nth-child(5) {
    width: 20%;
  }

  .right {
    text-align: right;
  }

  .center {
    text-align: center;
  }

  /* ==============================
     TOTAL
  ============================== */

  .summary {
    width: 310px;

    margin-left: auto;

    margin-top: 30px;
  }

  .summary-row {
    display: flex;

    justify-content:
      space-between;

    align-items:
      center;

    padding:
      10px
      0;

    font-size: 13px;

    color: #4b5563;
  }

  .summary-total {
    margin-top: 8px;

    padding:
      16px
      14px;

    background: #eff6ff;

    border-radius: 8px;

    color: #111827;

    font-size: 17px;

    font-weight: 800;
  }

  /* ==============================
     FOOTER
  ============================== */

  .footer {
    margin-top: 60px;

    padding-top: 20px;

    border-top:
      1px solid #e5e7eb;

    text-align: center;

    color: #9ca3af;

    font-size: 11px;

    line-height: 1.6;
  }

  .bottom-bar {
    position: absolute;

    left: 0;
    right: 0;
    bottom: 0;

    height: 10px;

    background: #2563eb;
  }

</style>

</head>

<body>

<div class="invoice">

  <div class="top-bar"></div>

  <div class="content">

    <!-- =========================
         HEADER
    ========================== -->

    <div class="header">

      <div>

        <h1 class="brand-name">
          Input<span
            class="brand-accent"
          >ify</span>
        </h1>

        <p class="brand-description">
          Survey & Market Research Platform
        </p>

      </div>


      <div class="invoice-heading">

        <h2 class="invoice-title">
          INVOICE
        </h2>

        <div class="invoice-number">
          ${escapeHtml(
            invoice?.invoiceNumber ||
              "-"
          )}
        </div>

      </div>

    </div>


    <!-- =========================
         INFO
    ========================== -->

    <div class="info-grid">

      <div class="info-box">

        <div class="info-title">
          Project
        </div>

        <div class="info-value">
          ${escapeHtml(
            projectName
          )}
        </div>

        <div class="info-small">
          Project ID:
          ${escapeHtml(
            projectId
          )}
        </div>

      </div>


      <div class="info-box">

        <div class="info-title">
          Invoice Details
        </div>

        <div class="info-value">
          ${escapeHtml(
            invoice?.invoiceNumber ||
              "-"
          )}
        </div>

        <div class="info-small">
          Issued:
          ${escapeHtml(
            formatDate(
              invoice?.issuedAt
            )
          )}
        </div>

        <div class="info-small">
          Status:
          ${escapeHtml(
            invoice?.status ||
              "-"
          )}
        </div>

      </div>

    </div>


    <!-- =========================
         ITEMS
    ========================== -->

    <div class="table-wrapper">

      <table>

        <thead>

          <tr>

            <th class="center">
              #
            </th>

            <th>
              Target Group
            </th>

            <th class="right">
              Target
            </th>

            <th class="right">
              CPI
            </th>

            <th class="right">
              Amount
            </th>

          </tr>

        </thead>

        <tbody>

          ${
            itemRows ||
            `
              <tr>

                <td
                  colspan="5"
                  class="center"
                >
                  No invoice items
                </td>

              </tr>
            `
          }

        </tbody>

      </table>

    </div>


    <!-- =========================
         SUMMARY
    ========================== -->

    <div class="summary">

      <div class="summary-row">

        <span>
          Subtotal
        </span>

        <strong>
          ${formatCurrency(
            subtotal
          )}
        </strong>

      </div>


      <div
        class="
          summary-row
          summary-total
        "
      >

        <span>
          Total
        </span>

        <span>
          ${formatCurrency(
            total
          )}
        </span>

      </div>

    </div>


    <!-- =========================
         FOOTER
    ========================== -->

    <div class="footer">

      This invoice was generated
      electronically by Inputify.

      <br />

      Currency:
      ${escapeHtml(
        invoice?.currency ||
          "USD"
      )}

    </div>

  </div>

  <div class="bottom-bar"></div>

</div>

</body>

</html>
    `;

    /* ===============================================
       START CHROME
    =============================================== */

    browser =
      await puppeteer.launch({
        headless: true,

        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      });

    const page =
      await browser.newPage();

    /* ===============================================
       LOAD HTML
    =============================================== */

    await page.setContent(
      html,
      {
        waitUntil:
          "networkidle0",
      }
    );

    await page.emulateMediaType(
      "print"
    );

    /* ===============================================
       GENERATE PDF
    =============================================== */

    const pdfBuffer =
      await page.pdf({
        format: "A4",

        printBackground:
          true,

        preferCSSPageSize:
          true,

        margin: {
          top: "0mm",
          right: "0mm",
          bottom: "0mm",
          left: "0mm",
        },
      });

    return pdfBuffer;

  } finally {

    if (browser) {
      await browser.close();
    }

  }
}