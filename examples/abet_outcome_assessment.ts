// Script to generate ABET outcome assessment summary for a class

// Set these variables before running the script
const CURRENT_CLASS = "fall2024_en_601_226"; // e.g., "spring2025_en_601_264"

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as csvParse from "csv-parse/sync";
import * as csvStringify from "csv-stringify/sync";

// Paths
const dataDir = path.join(__dirname, "..", "data", CURRENT_CLASS);
const gradesPath = path.join(dataDir, "gradescope_processed.csv");
const metaJsonPath = path.join(dataDir, "gradescope_meta.json");
const abetConfigPath = path.join(dataDir, "abet.config.ts");
const abetAggPath = path.join(dataDir, "abet_aggregate.csv");
const abetMetaPath = path.join(dataDir, "abet_meta.json");

// Helper: mean and stddev
function mean(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
function stddev(arr: number[]) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(
    arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / (arr.length - 1),
  );
}

// Helper: load abet.config.ts dynamically (ESM import)
async function loadAbetConfig(configPath: string) {
  const configModule = await import(configPath + `?ts=${Date.now()}`);
  return configModule;
}

// Helper: find column name (case-insensitive, trimmed)
function findColName(header: string[], target: string) {
  target = target.trim().toLowerCase();
  return header.find((col) => col.trim().toLowerCase() === target);
}

(async () => {
  try {
    // 1. Load config and meta
    const abetConfig = await loadAbetConfig(abetConfigPath);
    const { CLASS_COURSE_WORK, CLASS_GRADE_CUTOFFS } = abetConfig;
    const meta = JSON.parse(fs.readFileSync(metaJsonPath, "utf8"));
    const assignmentMeta = Object.fromEntries(
      meta.assignments.map((a: any) => [a.name, a.max_points]),
    );

    // 2. Load grades
    const gradesCsv = fs.readFileSync(gradesPath, "utf8");
    const grades = csvParse.parse(gradesCsv, {
      columns: true,
      skip_empty_lines: true,
    });
    const header = Object.keys(grades[0]);

    // 3. Aggregate per-student SO scores (normalized)
    const soCodes = CLASS_COURSE_WORK.map((so: any) => so.code);
    const abetAggHeader = [
      "First Name",
      "Last Name",
      "SID",
      "Email",
      "Sections",
      ...soCodes,
    ];
    const abetAggRows: any[] = [];
    const soStudentScores: Record<string, number[]> = {};
    soCodes.forEach((code) => (soStudentScores[code] = []));

    for (const row of grades) {
      const base = [
        row["First Name"],
        row["Last Name"],
        row["SID"],
        row["Email"],
        row["Sections"],
      ];
      const soScores: number[] = [];
      for (const so of CLASS_COURSE_WORK) {
        let sum = 0,
          maxPts = 0;
        for (const assign of so.assignments) {
          const colName = findColName(header, assign);
          const score = parseFloat(row[colName] ?? "0");
          const maxPoints = assignmentMeta[colName ?? assign] ?? 0;
          sum += score;
          maxPts += maxPoints;
        }
        const percent = maxPts > 0 ? (sum / maxPts) * 100 : 0;
        soScores.push(Number(percent.toFixed(2)));
        soStudentScores[so.code].push(percent);
      }
      abetAggRows.push([...base, ...soScores]);
    }
    // Write abet_aggregate.csv
    const abetAggCsv = csvStringify.stringify(abetAggRows, {
      header: true,
      columns: abetAggHeader,
    });
    fs.writeFileSync(abetAggPath, abetAggCsv);

    // 4. Compute stats for abet_meta.json
    const abetMeta: any = {};
    for (const so of CLASS_COURSE_WORK) {
      const scores = soStudentScores[so.code];
      const avg = mean(scores);
      const sd = stddev(scores);
      const gradeCounts = { A: 0, B: 0, C: 0, D: 0 };
      for (const s of scores) {
        if (s >= CLASS_GRADE_CUTOFFS.A) gradeCounts.A++;
        else if (s >= CLASS_GRADE_CUTOFFS.B) gradeCounts.B++;
        else if (s >= CLASS_GRADE_CUTOFFS.C) gradeCounts.C++;
        else if (s >= CLASS_GRADE_CUTOFFS.D) gradeCounts.D++;
      }
      abetMeta[so.code] = {
        average: Number(avg.toFixed(2)),
        stddev: Number(sd.toFixed(2)),
        count: scores.length,
        grade_counts: gradeCounts,
      };
    }
    fs.writeFileSync(abetMetaPath, JSON.stringify(abetMeta, null, 2));
    console.log("ABET outcome assessment complete:");
    console.log("- Aggregate CSV:", abetAggPath);
    console.log("- Meta JSON:", abetMetaPath);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
