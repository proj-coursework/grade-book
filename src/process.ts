import { CURRENT_CLASS } from "./config";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as csvParse from "csv-parse/sync";
import * as csvStringify from "csv-stringify/sync";

// Paths
const dataDir = path.join(__dirname, "..", "data", CURRENT_CLASS);
const rawCsvPath = path.join(dataDir, "gradescope_raw.csv");
const processedCsvPath = path.join(dataDir, "gradescope_processed.csv");
const metaJsonPath = path.join(dataDir, "gradescope_meta.json");

// Read and parse CSV
const rawCsv = fs.readFileSync(rawCsvPath, "utf8");
const records = csvParse.parse(rawCsv, { columns: true });
const header = Object.keys(records[0]);

// Identify columns
const firstFiveCols = header.slice(0, 5);
const assignmentCols: { name: string; scoreIdx: number; maxIdx: number }[] = [];
for (let i = 5; i < header.length; ) {
  const col = header[i];
  if (col.endsWith("- Max Points")) {
    i++;
    continue;
  }
  if (col.endsWith("- Submission Time") || col.endsWith("- Lateness (H:M:S)")) {
    i++;
    continue;
  }
  if (col === "Total Lateness (H:M:S)") {
    break;
  }
  // Find the corresponding max points column
  const baseName = col;
  const maxCol = `${baseName} - Max Points`;
  const maxIdx = header.indexOf(maxCol);
  assignmentCols.push({ name: baseName, scoreIdx: i, maxIdx });
  i++;
  // skip the next 3 columns (max, submission, lateness)
  i += 3;
}

// Sort assignments alphabetically by name
const sortedAssignmentCols = [...assignmentCols].sort((a, b) =>
  a.name.localeCompare(b.name),
);

// Build meta.json
const assignments = sortedAssignmentCols.map(({ name, maxIdx }) => {
  // Find the first non-empty max points value
  let max_points = null;
  for (const row of records) {
    const val = row[header[maxIdx]];
    if (val !== undefined && val !== "") {
      max_points = parseFloat(val);
      break;
    }
  }
  return { name, max_points };
});
const meta = {
  counts: {
    assignments: assignments.length,
    students: records.length,
  },
  assignments,
};
fs.writeFileSync(metaJsonPath, JSON.stringify(meta, null, 2));

// Build processed.csv
const processedHeader = [
  ...firstFiveCols,
  ...sortedAssignmentCols.map((a) => a.name),
];
const processedRows = records.map((row) => {
  const base = firstFiveCols.map((col) => row[col]);
  const scores = sortedAssignmentCols.map((a) => {
    const val = row[header[a.scoreIdx]];
    return val === undefined || val === "" ? "0" : val;
  });
  return [...base, ...scores];
});
const processedCsv = csvStringify.stringify([
  processedHeader,
  ...processedRows,
]);
fs.writeFileSync(processedCsvPath, processedCsv);

console.log("Processing complete:");
console.log("- Processed CSV:", processedCsvPath);
console.log("- Meta JSON:", metaJsonPath);
