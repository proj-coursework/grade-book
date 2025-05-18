// This script adds a "Team" column to a CSV file (TARGET_FILENAME) based on team information from another CSV file (TEAMS_FILENAME).

// Set these variables before running the script
const CURRENT_CLASS = "spring2025_en_601_264"; 
const TEAMS_FILENAME = "teams.csv"; // The file with team info
const TARGET_FILENAME = "grades.csv"; // The file to add the team column to

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as csvParse from "csv-parse/sync";
import * as csvStringify from "csv-stringify/sync";

// Helper to normalize Hopkins emails (treat username@jhu.edu and username@jh.edu as equivalent)
function normalizeEmail(email: string) {
  return email.trim().toLowerCase().replace(/@(jhu|jh|jhmi)\.edu$/, "@jh.edu");
}

// Paths
const dataDir = path.join(__dirname, "..", "data", CURRENT_CLASS);
const teamsPath = path.join(dataDir, TEAMS_FILENAME);
const targetPath = path.join(dataDir, TARGET_FILENAME);
const errorsPath = path.join(dataDir, "teams_errors.json");

// Read and parse teams.csv
const teamsCsv = fs.readFileSync(teamsPath, "utf8");
const teamsRows = csvParse.parse(teamsCsv, { columns: true });
const teamsByEmail = Object.fromEntries(teamsRows.map(row => [normalizeEmail(row.email), row]));

// Read and parse target file
const targetCsv = fs.readFileSync(targetPath, "utf8");
const targetRows = csvParse.parse(targetCsv, { columns: true });

// Add Team column to targetRows
const updatedRows = targetRows.map(row => {
  const email = normalizeEmail(row["Email"] || "");
  const Team = teamsByEmail[email]?.team || "";
  // Insert Team after Sections
  const newRow: any = {};
  for (const key of Object.keys(row)) {
    newRow[key] = row[key];
    if (key === "Sections") {
      newRow["Team"] = Team;
    }
  }
  // If Sections column is missing, just add Team at the end
  if (!("Sections" in row)) newRow["Team"] = Team;
  return newRow;
});

// Build new header: insert Team after Sections
const origHeader = Object.keys(targetRows[0]);
let header: string[];
if (origHeader.includes("Sections")) {
  const idx = origHeader.indexOf("Sections") + 1;
  header = [...origHeader.slice(0, idx), "Team", ...origHeader.slice(idx)];
} else {
  header = [...origHeader, "Team"];
}

const outCsv = csvStringify.stringify(updatedRows, { header: true, columns: header });
fs.writeFileSync(targetPath, outCsv);

// Error reporting
const emailsInTarget = new Set(targetRows.map(row => normalizeEmail(row["Email"] || "")));
const emailsInTeams = new Set(teamsRows.map(row => normalizeEmail(row.email)));
const missingFromTarget = teamsRows.filter(row => !emailsInTarget.has(normalizeEmail(row.email)));
const missingFromTeams = targetRows.filter(row => !emailsInTeams.has(normalizeEmail(row["Email"] || "")));
const errors = {
  missing_from_target: missingFromTarget,
  missing_from_teams: missingFromTeams,
};
fs.writeFileSync(errorsPath, JSON.stringify(errors, null, 2));

console.log("Team attribute added to", TARGET_FILENAME);
console.log("Errors written to", errorsPath); 