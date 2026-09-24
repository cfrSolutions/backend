import puppeteer from "puppeteer";

/* =====================================================
   ESCAPE HTML
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

function formatMoney(value) {
  const amount = Number(value) || 0;

  return `$${amount.toFixed(2)}`;
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
  project,
  businessProfile
) {
  let browser;

  try {
    /* =================================================
       BUSINESS INFORMATION
    ================================================= */

    const business =
  project?.business &&
  typeof project.business === "object"
    ? project.business
    : {};


/* =========================================
   BUSINESS NAME
========================================= */

const businessName =
  businessProfile?.company ||
  businessProfile?.name ||
  "Business Name";


/* =========================================
   EMAIL COMES FROM USER
========================================= */

const businessEmail =
  business?.email ||
  "-";


/* =========================================
   PHONE COMES FROM BUSINESS PROFILE
========================================= */

const businessPhone =
  businessProfile?.phone ||
  "-";


/* =========================================
   ADDRESS COMES FROM BUSINESS PROFILE
========================================= */

const businessAddress =
  [
    businessProfile?.location,
    businessProfile?.country,
    businessProfile?.postalCode,
  ]
    .filter(Boolean)
    .join(", ") ||
  "-";
  
    /* =================================================
       CALCULATIONS
    ================================================= */

    const subtotal =
      Number(invoice?.subtotal) || 0;

    const gstRate =
      Number(invoice?.gstRate) || 0;

    const gstAmount =
      invoice?.gstAmount !== undefined
        ? Number(invoice.gstAmount) || 0
        : subtotal * (gstRate / 100);

    const total =
      invoice?.total !== undefined
        ? Number(invoice.total) || 0
        : subtotal + gstAmount;

    const invoiceDate =
      formatDate(invoice?.issuedAt);

    /* =================================================
       ITEMS
    ================================================= */

    const items = Array.isArray(invoice?.items)
      ? invoice.items
      : [];

    const itemRows = items
      .map((item) => {
        const quantity =
          Number(item?.targetCompletes) || 0;

        const rate =
          Number(item?.cpi) || 0;

        const itemTotal =
          Number(item?.totalCost) || 0;

        return `
          <tr>
            <td class="description-cell">
              <div class="item-name">
                ${escapeHtml(
                  item?.targetGroupName ||
                    "Target Group"
                )}
              </div>

              <div class="item-type">
                Target Group
              </div>
            </td>

            <td class="quantity-cell">
              ${quantity}
            </td>

            <td class="money-cell">
              ${formatMoney(rate)}
            </td>

            <td class="money-cell total-cell">
              ${formatMoney(itemTotal)}
            </td>
          </tr>
        `;
      })
      .join("");

    /* =================================================
       HTML
    ================================================= */

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

    width: 100%;

    font-family:
      Arial,
      Helvetica,
      sans-serif;

    color: #1e293b;

    background: #ffffff;
  }

  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* =========================================
     PAGE
  ========================================= */

  .invoice {
    width: 210mm;
    min-height: 297mm;

    margin: 0 auto;

    background: #ffffff;

    display: flex;
    flex-direction: column;
  }

  /* =========================================
     BLUE BARS
  ========================================= */

  .top-bar,
  .bottom-bar {
    height: 10mm;

    background: #164B84;

    flex-shrink: 0;
  }

  /* =========================================
     CONTENT
  ========================================= */

  .content {
    flex: 1;

    min-height: 277mm;

    padding:
      9mm
      12mm
      8mm;

    display: flex;
    flex-direction: column;
  }

  /* =========================================
     HEADER
  ========================================= */

  .header {
    display: flex;

    justify-content: space-between;
    align-items: flex-start;

    gap: 20px;
  }

  .brand {
    margin: 0;

    color: #164B84;

    font-size: 23px;
    line-height: 1;

    font-weight: 800;

    letter-spacing: -0.7px;
  }

  .brand-description {
    margin-top: 7px;

    color: #64748B;

    font-size: 10px;

    font-weight: 500;
  }

  .invoice-heading {
    text-align: right;
  }

  .invoice-title {
    margin: 0;

    color: #164B84;

    font-size: 29px;

    font-weight: 800;

    letter-spacing: -0.7px;
  }

  .gstin {
    margin-top: 5px;

    color: #64748B;

    font-size: 10px;
  }

  /* =========================================
     TWO COLUMN SECTIONS
  ========================================= */

  .two-column {
    display: grid;

    grid-template-columns:
      1fr
      1fr;

    gap: 35px;
  }

  .billing-section {
    margin-top: 12mm;
  }

  .contact-section {
    margin-top: 9mm;
  }

  .section-title {
    margin: 0;

    color: #164B84;

    font-size: 12px;

    font-weight: 600;
  }

  .business-name {
    margin-top: 5px;

    color: #1E293B;

    font-size: 12px;

    font-weight: 600;
  }

  .business-address {
    margin-top: 4px;

    color: #64748B;

    font-size: 11px;

    line-height: 1.45;
  }

  /* =========================================
     INVOICE DETAILS
  ========================================= */

  .invoice-details {
    display: grid;

    grid-template-columns:
      auto
      auto;

    justify-content: end;

    column-gap: 18px;
    row-gap: 5px;

    font-size: 11px;
  }

  .detail-label {
    color: #64748B;

    text-align: right;
  }

  .detail-value {
    color: #64748B;

    font-weight: 600;

    text-align: right;
  }

  /* =========================================
     CONTACT + PAYMENT
  ========================================= */

  .info-line {
    margin-top: 5px;

    color: #475569;

    font-size: 11px;
  }

  .info-line + .info-line {
    margin-top: 4px;
  }

  /* =========================================
     TABLE
  ========================================= */

  .table-wrapper {
    margin-top: 10mm;
  }

  table {
    width: 100%;

    border-collapse: collapse;

    table-layout: fixed;
  }

  thead {
    display: table-header-group;
  }

  tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  thead tr {
    border-top:
      1.5px solid #164B84;

    border-bottom:
      1.5px solid #164B84;
  }

  th {
    padding:
      8px
      0;

    color: #334155;

    font-size: 10px;

    font-weight: 600;
  }

  th:nth-child(1) {
    width: 48%;

    text-align: left;
  }

  th:nth-child(2) {
    width: 14%;

    text-align: center;
  }

  th:nth-child(3) {
    width: 19%;

    text-align: right;
  }

  th:nth-child(4) {
    width: 19%;

    text-align: right;
  }

  tbody tr {
    border-bottom:
      1px solid #F1F5F9;
  }

  td {
    padding:
      11px
      0;

    font-size: 11px;

    vertical-align: top;
  }

  .description-cell {
    text-align: left;
  }

  .item-name {
    color: #1E293B;

    font-size: 12px;

    font-weight: 500;
  }

  .item-type {
    margin-top: 4px;

    color: #94A3B8;

    font-size: 10px;
  }

  .quantity-cell {
    color: #475569;

    text-align: center;
  }

  .money-cell {
    color: #475569;

    text-align: right;
  }

  .total-cell {
    color: #1E293B;

    font-weight: 600;
  }

  /* =========================================
     PUSH BOTTOM CONTENT DOWN
  ========================================= */

  .bottom-content {
    margin-top: auto;
  }

  /* =========================================
     TOTALS
  ========================================= */

  .totals-wrapper {
    display: flex;

    justify-content: flex-end;
  }

  .totals {
    width: 82mm;
  }

  .total-row {
    display: flex;

    justify-content: space-between;

    gap: 20px;

    color: #475569;

    font-size: 11px;
  }

  .total-row + .total-row {
    margin-top: 7px;
  }

  .total-value {
    color: #1E293B;

    font-weight: 500;
  }

  .grand-total {
    margin-top: 10px;

    padding:
      8px
      0;

    display: flex;

    justify-content: space-between;
    align-items: center;

    gap: 20px;

    border-top:
      1.5px solid #164B84;

    border-bottom:
      1.5px solid #164B84;

    color: #1E293B;

    font-size: 13px;

    font-weight: 600;
  }

  .grand-total-value {
    color: #0F172A;

    font-size: 17px;

    font-weight: 700;
  }

  /* =========================================
     TERMS + SIGNATURE
  ========================================= */

  .terms-signature {
    margin-top: 9mm;

    display: grid;

    grid-template-columns:
      1fr
      1fr;

    gap: 35px;
  }

  .terms-title {
    color: #334155;

    font-size: 11px;

    font-weight: 600;
  }

  .terms-text {
    margin-top: 5px;

    max-width: 320px;

    color: #64748B;

    font-size: 9px;

    line-height: 1.7;
  }

  .signature {
    text-align: right;
  }

  .signature-label {
    color: #64748B;

    font-size: 9px;
  }

  .signature-name {
    margin-top: 7px;

    color: #164B84;

    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-size: 20px;

    font-style: italic;
  }

  /* =========================================
     FOOTER
  ========================================= */

  .footer {
    margin-top: 8mm;

    padding:
      7px
      0;

    display: flex;

    justify-content: space-between;
    align-items: center;

    gap: 20px;

    border-top:
      1.5px solid #164B84;

    border-bottom:
      1.5px solid #164B84;

    color: #164B84;

    font-size: 9px;
  }

</style>

</head>

<body>

<div class="invoice">

  <!-- TOP BLUE BAR -->

  <div class="top-bar"></div>


  <div class="content">

    <!-- =========================================
         HEADER
    ========================================== -->

    <div class="header">

      <div>

       
        <img
          class="brand"
          src={inputifyLogo}
          alt="Inputify"
          className="h-10 w-auto object-contain"
        />

        <div class="brand-description">
          Survey &amp; Research Platform
        </div>

      </div>


      <div class="invoice-heading">

        <h2 class="invoice-title">
          INVOICE
        </h2>

        <div class="gstin">
          GSTIN:
          ${escapeHtml(
            invoice?.gstin || "—"
          )}
        </div>

      </div>

    </div>


    <!-- =========================================
         BILLING
    ========================================== -->

    <div class="two-column billing-section">

      <div>

        <div class="section-title">
          Bill To:
        </div>

        <div class="business-name">
          ${escapeHtml(
            businessName
          )}
        </div>

        <div class="business-address">
          ${escapeHtml(
            businessAddress
          )}
        </div>

      </div>


      <div class="invoice-details">

        <div class="detail-label">
          Invoice Number
        </div>

        <div class="detail-value">
          ${escapeHtml(
            invoice?.invoiceNumber ||
              "-"
          )}
        </div>


        <div class="detail-label">
          Invoice Date
        </div>

        <div class="detail-value">
          ${escapeHtml(
            invoiceDate
          )}
        </div>

      </div>

    </div>


    <!-- =========================================
         CONTACT + PAYMENT
    ========================================== -->

    <div class="two-column contact-section">

      <div>

        <div class="section-title">
          Contact information
        </div>

        <div class="info-line">
          Email:
          ${escapeHtml(
            businessEmail
          )}
        </div>

        <div class="info-line">
          Phone:
          ${escapeHtml(
            businessPhone
          )}
        </div>

      </div>


      <div>

        <div class="section-title">
          Payment information
        </div>

        <div class="info-line">
          Bank Name:
          ${escapeHtml(
            invoice?.bankName ||
              "—"
          )}
        </div>

        <div class="info-line">
          Account Number:
          ${escapeHtml(
            invoice?.accountNumber ||
              "—"
          )}
        </div>

      </div>

    </div>


    <!-- =========================================
         ITEMS
    ========================================== -->

    <div class="table-wrapper">

      <table>

        <thead>

          <tr>

            <th>
              Item Description
            </th>

            <th>
              Quantity
            </th>

            <th>
              Rate
            </th>

            <th>
              Total
            </th>

          </tr>

        </thead>


        <tbody>

          ${
            itemRows ||
            `
              <tr>

                <td
                  colspan="4"
                  style="
                    text-align:center;
                    color:#64748B;
                  "
                >
                  No invoice items
                </td>

              </tr>
            `
          }

        </tbody>

      </table>

    </div>


    <!-- =========================================
         BOTTOM CONTENT
    ========================================== -->

    <div class="bottom-content">


      <!-- TOTALS -->

      <div class="totals-wrapper">

        <div class="totals">

          <div class="total-row">

            <span>
              Subtotal:
            </span>

            <span class="total-value">
              ${formatMoney(
                subtotal
              )}
            </span>

          </div>


          <div class="total-row">

            <span>
              GST (${gstRate}%):
            </span>

            <span class="total-value">
              ${formatMoney(
                gstAmount
              )}
            </span>

          </div>


          <div class="grand-total">

            <span>
              Total Amount Due:
            </span>

            <span class="grand-total-value">
              ${formatMoney(
                total
              )}
            </span>

          </div>

        </div>

      </div>


      <!-- TERMS + SIGNATURE -->

      <div class="terms-signature">

        <div>

          <div class="terms-title">
            Terms and Conditions
          </div>

          <div class="terms-text">
            Payment is due as per the agreed project
            terms. Please contact Inputify for any
            questions regarding this invoice.
          </div>

        </div>


        <div class="signature">

          <div class="signature-label">
            Authorized Signatory
          </div>

          <div class="signature-name">
            Inputify
          </div>

        </div>

      </div>


      <!-- FOOTER -->

      <div class="footer">

        <span>
          hello@inputify.io
        </span>

        <span>
          inputify.io
        </span>

        <span>
          Phone:
          7506966099
        </span>

      </div>

    </div>

  </div>


  <!-- BOTTOM BLUE BAR -->

  <div class="bottom-bar"></div>

</div>


</body>

</html>
    `;

    /* =================================================
       START CHROME
    ================================================= */

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

    /* =================================================
       LOAD HTML
    ================================================= */

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

    /* =================================================
       GENERATE PDF
    ================================================= */

    const pdfBuffer =
      await page.pdf({
        format: "A4",

        printBackground: true,

        preferCSSPageSize: true,

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