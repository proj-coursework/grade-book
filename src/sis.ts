import { CURRENT_CLASS } from "./config";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as csvParse from "csv-parse/sync";
import * as XLSX from "xlsx";

// Paths
const dataDir = path.join(__dirname, "..", "data", CURRENT_CLASS);
const gradesCsvPath = path.join(dataDir, "grades.csv");
const sisImportPath = path.join(dataDir, "sis_import.xlsx");

// Read and parse grades.csv
const gradesCsv = fs.readFileSync(gradesCsvPath, "utf8");
const gradesRows = csvParse.parse(gradesCsv, { columns: true });

// Prepare SIS import rows: header, then [SID, Grade] for each student
const sisRows = [
  ["ID", "Grade"],
  ...gradesRows.map((row) => [row["SID"], row["Letter Grade"]]),
];

// Create worksheet and workbook
const ws = XLSX.utils.aoa_to_sheet(sisRows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Grades");

// Write as a real Excel file
XLSX.writeFile(wb, sisImportPath);

console.log("SIS import file created:", sisImportPath);
