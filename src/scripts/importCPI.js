// import mongoose from "mongoose";
// import XLSX from "xlsx";
// import CPI from "../models/CPI.model.js";

// mongoose.connect(
//   "mongodb+srv://info_db_user:GlXHcbogJUZCSz0y@cluster0.dplbuzq.mongodb.net/surveyDB"

// );

// const workbook = XLSX.readFile(
//   "results.csv"
// );

// const sheetName =
//   workbook.SheetNames[0];

// const sheet =
//   workbook.Sheets[sheetName];

// const data =
//   XLSX.utils.sheet_to_json(sheet);

// async function importData() {

//   try {

//     await CPI.deleteMany();

//     await CPI.insertMany(data);

//     console.log(
//       "CPI Imported"
//     );

//     process.exit();

//   } catch(err){

//     console.log(err);

//     process.exit(1);
//   }
// }

// importData();