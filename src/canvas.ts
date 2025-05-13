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
const canvasExportPath = path.join(dataDir, "canvas_export.csv");
const gradesCsvPath = path.join(dataDir, "grades.csv");
const classConfigPath = path.join(dataDir, "config.ts");
const canvasImportPath = path.join(dataDir, "canvas_import.csv");
const canvasErrorsPath = path.join(dataDir, "canvas_errors.json");

// Read and parse Canvas export CSV
const canvasCsv = fs.readFileSync(canvasExportPath, "utf8");
const canvasRows = csvParse.parse(canvasCsv, { columns: false });
const canvasHeader = canvasRows[0];
const pointsRow = canvasRows[1];
const canvasStudents = canvasRows.slice(2);

// Read and parse grades.csv
const gradesCsv = fs.readFileSync(gradesCsvPath, "utf8");
const gradesRows = csvParse.parse(gradesCsv, { columns: true });
const gradesHeader = Object.keys(gradesRows[0]);

// Dynamic import of class config
async function loadClassConfig() {
  const configModule = await import(classConfigPath + `?ts=${Date.now()}`);
  return configModule;
}

(async () => {
  const { CLASS_COURSE_WORK } = await loadClassConfig();
  const categoryNames = CLASS_COURSE_WORK.map((c: any) => c.name);

  // Canvas primary columns
  const primaryCols = [
    "Student",
    "ID",
    "SIS User ID",
    "SIS Login ID",
    "Section",
  ];

  // Build header for import
  const importHeader = [...primaryCols, ...categoryNames];

  // Build Points Possible row: first cell is 'Points Possible', next four are blank, then category weights
  const importPointsRow = ["    Points Possible", ...Array(4).fill("")];
  for (const cat of CLASS_COURSE_WORK) {
    importPointsRow.push(cat.weight.toString());
  }

  // Build lookup for grades by SID
  const gradesBySID = Object.fromEntries(
    gradesRows.map((row) => [row["SID"], row])
  );
  const matchedSIDs = new Set<string>();

  // Prepare import rows and error tracking
  const importRows: any[] = [];
  const missingFromGrades: any[] = [];

  for (const row of canvasStudents) {
    const [Student, ID, SIS_User_ID, SIS_Login_ID, Section] = row;
    const gradeRow = gradesBySID[SIS_User_ID];
    if (gradeRow) {
      matchedSIDs.add(SIS_User_ID);
      // Fill in category columns from grades.csv
      const catScores = categoryNames.map((cat) => gradeRow[cat] ?? "");
      importRows.push([
        Student,
        ID,
        SIS_User_ID,
        SIS_Login_ID,
        Section,
        ...catScores,
      ]);
    } else {
      // Not found in grades.csv
      missingFromGrades.push({
        Student,
        ID,
        "SIS User ID": SIS_User_ID,
        "SIS Login ID": SIS_Login_ID,
        Section,
      });
    }
  }

  // Find students in grades.csv missing from Canvas export
  const missingFromCanvas = gradesRows
    .filter((row) => !matchedSIDs.has(row["SID"]))
    .map((row) => ({
      "First Name": row["First Name"],
      "Last Name": row["Last Name"],
      SID: row["SID"],
      Email: row["Email"],
      Sections: row["Sections"],
    }));

  // Write canvas_import.csv
  const importCsv = csvStringify.stringify([
    importHeader,
    importPointsRow,
    ...importRows,
  ]);
  fs.writeFileSync(canvasImportPath, importCsv);

  // Write canvas_errors.json
  const errors = {
    missing_from_grades: missingFromGrades,
    missing_from_canvas: missingFromCanvas,
  };
  fs.writeFileSync(canvasErrorsPath, JSON.stringify(errors, null, 2));

  console.log("Canvas import/export complete:");
  console.log("- Canvas Import CSV:", canvasImportPath);
  console.log("- Canvas Errors JSON:", canvasErrorsPath);
})();
