import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as csvParse from "csv-parse/sync";
import dotenv from "dotenv";

dotenv.config();

const CURRENT_CLASS = process.env.CURRENT_CLASS;
const CURRENT_STUDENT_EMAIL = process.env.CURRENT_STUDENT_EMAIL;

if (!CURRENT_CLASS) {
  console.error("Error: CURRENT_CLASS is not set in .env file");
  process.exit(1);
}

if (!CURRENT_STUDENT_EMAIL) {
  console.error("Error: CURRENT_STUDENT_EMAIL is not set in .env file");
  process.exit(1);
}

// Paths
const dataDir = path.join(__dirname, "..", "data", CURRENT_CLASS);
const processedCsvPath = path.join(dataDir, "gradescope_processed.csv");
const metaJsonPath = path.join(dataDir, "gradescope_meta.json");
const gradesCsvPath = path.join(dataDir, "grades.csv");
const classConfigPath = path.join(dataDir, "config.ts");
const reportsDir = path.join(dataDir, "reports");

// Ensure reports directory exists
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

// Read and parse files
const processedCsv = fs.readFileSync(processedCsvPath, "utf8");
const processedRows = csvParse.parse(processedCsv, { columns: true });
const meta = JSON.parse(fs.readFileSync(metaJsonPath, "utf8"));
const gradesCsv = fs.readFileSync(gradesCsvPath, "utf8");
const gradesRows = csvParse.parse(gradesCsv, { columns: true });

// Dynamic import of class config
async function loadClassConfig() {
  const configModule = await import(classConfigPath + `?ts=${Date.now()}`);
  return configModule;
}

(async () => {
  const { CLASS_COURSE_WORK } = await loadClassConfig();

  // Find student in processedRows by email (case-insensitive, trimmed)
  const student = processedRows.find(
    (row) =>
      row["Email"].trim().toLowerCase() ===
      CURRENT_STUDENT_EMAIL.trim().toLowerCase()
  );
  if (!student) {
    console.error("Student not found in processed CSV");
    process.exit(1);
  }
  const gradesRow = gradesRows.find(
    (row) =>
      row["Email"].trim().toLowerCase() ===
      CURRENT_STUDENT_EMAIL.trim().toLowerCase()
  );
  if (!gradesRow) {
    console.error("Student not found in grades CSV");
    process.exit(1);
  }

  // Prepare report filename
  const firstName = student["First Name"];
  const lastName = student["Last Name"];
  const email = student["Email"];
  const reportFile = path.join(
    reportsDir,
    `${firstName}_${lastName}_${email}.md`
  );

  // Final score and letter grade
  const finalScore = gradesRow["Final Score"];
  const letterGrade = gradesRow["Letter Grade"];

  // Assignment meta lookup
  const assignmentMeta = Object.fromEntries(
    meta.assignments.map((a: any) => [a.name, a.max_points])
  );

  // Assignment category breakdown
  let report = `# Grade Report for ${firstName} ${lastName} (${email})\n\n`;
  report += `**Final Score:** ${finalScore}\n\n`;
  report += `**Letter Grade:** ${letterGrade}\n\n`;
  report += `## Assignment Categories\n`;
  for (const cat of CLASS_COURSE_WORK) {
    const catScore = gradesRow[cat.name];
    report += `- **${cat.name}** (Weight: ${cat.weight}): ${catScore}\n`;
  }
  report += `\n## Assignments\n`;
  for (const cat of CLASS_COURSE_WORK) {
    report += `\n### ${cat.name}\n`;
    for (const assignment of cat.assignments) {
      // Find the assignment column in processedRows (case-insensitive, trimmed)
      const colName = Object.keys(student).find(
        (k) => k.trim().toLowerCase() === assignment.trim().toLowerCase()
      );
      if (colName) {
        const score = student[colName];
        const max = assignmentMeta[assignment];
        report += `- ${assignment}: ${score}/${max}\n`;
      }
    }
  }
  // Write report
  fs.writeFileSync(reportFile, report);
  console.log("Report written to:", reportFile);
})();
