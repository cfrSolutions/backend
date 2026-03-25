// import GiftCard from "../models/GiftCard.model.js";
// import { fetchTremendousProducts } from "../services/tremendous.service.js";

// export const syncGiftCards = async (req, res) => {
//   const products = await fetchTremendousProducts();

//   for (const p of products) {
//     if (!p.denominations) continue;

//     await GiftCard.findOneAndUpdate(
//       { tremendousProductId: p.id },
//       {
//         title: p.name,
//         description: p.description,
//         tremendousProductId: p.id,
//         pointsRequired: p.denominations[0], // map later
//         isActive: true,
//       },
//       { upsert: true }
//     );
//   }

//   res.json({ success: true, count: products.length });
// };
// import GiftCard from "../models/GiftCard.model.js";
// import axios from "axios";

// const tremendous = axios.create({
//   baseURL: "https://testflight.tremendous.com/api/v2",
//   headers: {
//     Authorization: `Bearer ${process.env.TREMENDOUS_API_KEY}`,
//     "Content-Type": "application/json",
//   },
// });

// export const syncGiftCards = async (req, res) => {
//     // 🔍 TEMP DEBUG — SAFE
//   const broken = await GiftCard.find({
//     $or: [
//       { skuId: { $exists: false } },
//       { skuId: null },
//       { skuId: "" }
//     ]
//   });

//   console.log("BROKEN CARDS:", broken.length);
//   const { data } = await tremendous.get("/products");

//   console.log("TOTAL PRODUCTS FROM TREMENDOUS:", data.products.length);

//   let saved = 0;

//   for (const p of data.products) {
//     // ❌ skip products without skus
//     if (!Array.isArray(p.skus) || p.skus.length === 0) continue;

//     // OPTIONAL: filter by country (example: India only)
//     // const allowed = p.countries?.some(c => c.abbr === "IN");
//     // if (!allowed) continue;

//     for (const sku of p.skus) {
//   if (!sku.id) continue; // 🔴 REQUIRED

//   await GiftCard.findOneAndUpdate(
//     {
//       tremendousProductId: p.id,
//       skuId: sku.id,
//     },
//     {
//       title: `${p.name} ${sku.min} ${p.currency_codes?.[0]}`,
//       tremendousProductId: p.id,
//       skuId: sku.id,                 // ✅ REAL SKU ID
//       value: sku.min,
//       currency: p.currency_codes?.[0],
//       pointsRequired: sku.min * 100,
//       isActive: true,
//     },
//     { upsert: true }
//   );
// }

//   }

//   console.log("SYNCED GIFTCARDS:", saved);
//   res.json({ success: true, saved });
// };

// import GiftCard from "../models/GiftCard.model.js";
// import axios from "axios";

// const tremendous = axios.create({
//   baseURL: "https://testflight.tremendous.com/api/v2",
//   headers: {
//     Authorization: `Bearer ${process.env.TREMENDOUS_API_KEY}`,
//     "Content-Type": "application/json",
//   },
// });

// export const syncGiftCards = async (req, res) => {
//     await GiftCard.updateMany(
//     {
//       $or: [
//         { skuId: { $exists: false } },
//         { skuId: null },
//         { skuId: "" }
//       ]
//     },
//     {
//       $set: { isActive: false }
//     }
//   );
//   const { data } = await tremendous.get("/products");

//   let repaired = 0;

//   for (const p of data.products) {
//   if (!Array.isArray(p.skus)) continue;

//   for (const sku of p.skus) {
//     if (!sku.id || !sku.min) continue;

//     await GiftCard.findOneAndUpdate(
//       {
//         tremendousProductId: p.id,
//         skuId: sku.id,
//       },
//       {
//         title: `${p.name} ${sku.min} ${p.currency_codes?.[0]}`,
//         tremendousProductId: p.id,
//         skuId: sku.id,
//         value: sku.min,
//         currency: p.currency_codes?.[0],
//         pointsRequired: sku.min * 100,
//         isActive: true,
//       },
//       { upsert: true, new:true }
//     );
//     repaired++;
//   }
// }


//   res.json({ success: true, repaired });
// };

import GiftCardV2 from "../models/GiftCardV2.model.js";
import axios from "axios";

const tremendous = axios.create({
  baseURL: "https://testflight.tremendous.com/api/v2",
  headers: {
    Authorization: `Bearer ${process.env.TREMENDOUS_API_KEY}`,
    "Content-Type": "application/json",
  },
});

export const syncGiftCards = async (req, res) => {
  const { data } = await tremendous.get("/products");

  console.log("TOTAL PRODUCTS:", data.products.length);
  console.log("FIRST PRODUCT SAMPLE:", JSON.stringify(data.products[0], null, 2));

  let created = 0;

for (const p of data.products) {
  if (!Array.isArray(p.skus)) continue;
const logo = `https://testflight.tremendous.com/product_images/${p.id}/logo`;

  const cardImg = p.images?.find(i => i.type === "card")?.src || "";

  for (const sku of p.skus) {
    if (!sku.min) continue;

    // 🔑 Generate stable internal SKU ID
    const generatedSkuId = `${p.id}_${sku.min}`;
    const type =
  p.category === "paypal"
    ? "PAYPAL"
    : p.category === "prepaid_card"
    ? "PREPAID"
    : "GIFT_CARD";

    // await GiftCardV2.findOneAndUpdate(
    //   { skuId: generatedSkuId },
    //   {
    //     title: `${p.name} ${sku.min} ${p.currency_codes?.[0]}`,
    //     tremendousProductId: p.id,
    //     skuId: generatedSkuId, // ✅ internal
    //     value: sku.min,
    //     logo,
    //     cardImg,
    //     currency: p.currency_codes?.[0],
    //     type,                    
    //     countries: p.countries || [],  
    //     pointsRequired: sku.min * 10,
    //     isActive: true,
    //   },
    //   { upsert: true, new: true }
    // );
// ⭐ PROFIT MARGIN ENGINE
let margin = 1.12;

if (type === "PREPAID") margin = 1.25;
if (type === "PAYPAL") margin = 1.30;

// ⭐ INTERNAL POINT ECONOMY
const pointsRequired = Math.ceil(sku.min * 100 * margin);

    await GiftCardV2.findOneAndUpdate(
  { skuId: generatedSkuId },
  {
    $set: {
      title: `${p.name} ${sku.min} ${p.currency_codes?.[0]}`,
      tremendousProductId: p.id,
      skuId: generatedSkuId,
      value: sku.min,
      logo,
      cardImg,
      currency: p.currency_codes?.[0],
      type,
      countries: p.countries?.map(c => c.abbr) || [],
      pointsRequired: pointsRequired,
      isActive: true,
    },
  },
  { upsert: true, new: true }
);
  }
}


  // CASE 2: denomination-based products (SANDBOX)
//   else if (p.denomination_options?.min) {
//     const value = p.denomination_options.min;

//     await GiftCardV2.findOneAndUpdate(
//       { tremendousProductId: p.id, value },
//       {
//         title: `${p.name} ${value} ${p.currency_codes?.[0]}`,
//         tremendousProductId: p.id,
//         value,
//         currency: p.currency_codes?.[0],
//         pointsRequired: value * 100,
//         isActive: true,
//       },
//       { upsert: true }
//     );

//     created++;
//   }
// }


  res.json({ success: true, created });
};
