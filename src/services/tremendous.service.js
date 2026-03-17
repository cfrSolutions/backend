// import axios from "axios";

// const tremendous = axios.create({
//   baseURL: "https://testflight.tremendous.com/api/v2",
//   headers: {
//     Authorization: `Bearer ${process.env.TREMENDOUS_API_KEY}`,
//     "Content-Type": "application/json",
//   },
// });

// export const fetchTremendousProducts = async () => {
//   const { data } = await tremendous.get("/products");
//   return data.products;
// };

// export const sendTremendousReward = async ({
//   email,
//   name,
//   productId,
//   amount,
// }) => {
//   const { data } = await tremendous.post("/orders", {
//     order: {
//       rewards: [
//         {
//           recipient: { email, name },
//           products: [productId],
//           value: {
//             denomination: amount,
//             currency_code: "USD",
//           },
//         },
//       ],
//     },
//   });

//   return data;
// };

// import axios from "axios";

// const tremendous = axios.create({
//   baseURL: "https://testflight.tremendous.com/api/v2",
//   headers: {
//     Authorization: `Bearer ${process.env.TREMENDOUS_API_KEY}`,
//     "Content-Type": "application/json",
//   },
// });

// export const fetchTremendousProducts = async () => {
//   const { data } = await tremendous.get("/products");
//   return data.products;
// };

// export const sendTremendousReward = async ({
//   email,
//   name,
//   productId,
//   skuId,
// }) => {
//   if (!skuId) throw new Error("skuId missing");

//   const { data } = await tremendous.post("/orders", {
//     order: {
//       payment: {
//         funding_source_id: process.env.TREMENDOUS_FUNDING_SOURCE_ID,
//       },
//       rewards: [
//         {
//           recipient: {
//             email,
//             name,
//           },
//           delivery: {
//             method: "email",
//           },
//           products: [
//             {
//               id: productId,
//               sku: skuId,
//             },
//           ],
//         },
//       ],
//     },
//   });

//   return data;
// };


import axios from "axios";

const tremendous = axios.create({
  baseURL: "https://testflight.tremendous.com/api/v2",
  headers: {
    Authorization: `Bearer ${process.env.TREMENDOUS_API_KEY}`,
    "Content-Type": "application/json",
  },
});

export const fetchTremendousProducts = async () => {
  const { data } = await tremendous.get("/products");
  return data.products;
};

export const sendTremendousReward = async ({
  email,
  name,
  productId,
  value,
  currency,
}) => {
  const payload = {
    payment: {
      funding_source_id: process.env.TREMENDOUS_FUNDING_SOURCE_ID,
    },

    rewards: [
      {
        recipient: { name, email },
        delivery: { method: "email" },

        products: [productId],

        value: {
          denomination: Number(value),   // 🔥 REQUIRED
          currency_code: currency,       // 🔥 REQUIRED
        },
      },
    ],
  };

  console.log("FINAL PAYLOAD:", JSON.stringify(payload, null, 2));

  const { data } = await tremendous.post("/orders", payload);

  return data;
};
