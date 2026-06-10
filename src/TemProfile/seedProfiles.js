// import dotenv from "dotenv";

// dotenv.config({
//   path: "../../.env"
// });

// import mongoose from "mongoose";
// import Profile from "../models/Profile.model.js";
// import fs from "fs";

// const profiles = JSON.parse(
//   fs.readFileSync(
//     new URL("./profiles.json", import.meta.url),
//     "utf8"
//   )
// );

// console.log(process.env.MONGO_URI);
// await mongoose.connect(process.env.MONGO_URI);

// await Profile.deleteMany({});

// await Profile.insertMany(profiles);

// console.log(
//   `${profiles.length} profiles inserted`
// );

// process.exit();