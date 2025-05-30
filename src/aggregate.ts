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
const processedCsvPath = path.join(dataDir, "gradescope_processed.csv");
const metaJsonPath = path.join(dataDir, "gradescope_meta.json");
const classConfigPath = path.join(dataDir, "config.ts");
const gradesCsvPath = path.join(dataDir, "grades.csv");
const metricsJsonPath = path.join(dataDir, "metrics.json");

// Read and parse processed CSV
const processedCsv = fs.readFileSync(processedCsvPath, "utf8");
const students = csvParse.parse(processedCsv, { columns: true });
const studentHeader = Object.keys(students[0]);
const firstFiveCols = studentHeader.slice(0, 5);

// Read meta.json
const meta = JSON.parse(fs.readFileSync(metaJsonPath, "utf8"));
const assignmentMeta = Object.fromEntries(
  meta.assignments.map((a: any) => [a.name, a.max_points]),
);

// Dynamic import of class config
async function loadClassConfig() {
  const configModule = await import(classConfigPath + `?ts=${Date.now()}`);
  return configModule;
}

function mean(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
function median(arr: number[]) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}
function stddev(arr: number[]) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(
    arr.reduce((acc, v) => acc + (v - m) ** 2, 0) / (arr.length - 1),
  );
}
function min(arr: number[]) {
  return arr.length ? Math.min(...arr) : 0;
}
function max(arr: number[]) {
  return arr.length ? Math.max(...arr) : 0;
}

(async () => {
  const { CLASS_COURSE_WORK, CLASS_GRADE_CUTOFFS } = await loadClassConfig();

  // Prepare output headers
  const categoryNames = CLASS_COURSE_WORK.map((c: any) => c.name);
  const gradesHeader = [
    ...firstFiveCols,
    ...categoryNames,
    "Final Score",
    "Letter Grade",
  ];

  // For metrics
  const categoryScores: Record<string, number[]> = {};
  categoryNames.forEach((cat) => (categoryScores[cat] = []));
  const finalScores: number[] = [];
  const letterGrades: string[] = [];

  // Helper: map assignment names in processed CSV to their actual column names (case-insensitive, trimmed)
  const processedAssignmentCols = studentHeader.slice(5);
  function findColName(target: string) {
    target = target.trim().toLowerCase();
    return processedAssignmentCols.find(
      (col) => col.trim().toLowerCase() === target,
    );
  }

  // Process each student
  const gradesRows = students.map((student) => {
    const base = firstFiveCols.map((col) => student[col]);
    let totalScore = 0;
    const catScores: number[] = [];
    for (const cat of CLASS_COURSE_WORK) {
      let sum = 0,
        maxPts = 0;
      for (const assign of cat.assignments) {
        const colName = findColName(assign);
        const score = parseFloat(student[colName] ?? "0");
        const maxPoints = assignmentMeta[colName ?? assign] ?? 0;
        sum += score;
        maxPts += maxPoints;
      }
      // Use cat.max_points if provided, otherwise sum of assignment max points
      const denom = cat.max_points !== undefined ? cat.max_points : maxPts;
      // Avoid division by zero
      const percent = denom > 0 ? sum / denom : 0;
      const weighted = percent * cat.weight;
      // Clamp weighted score to [0, cat.weight]
      const clampedWeighted = Math.max(0, Math.min(weighted, cat.weight));
      catScores.push(clampedWeighted);
      categoryScores[cat.name].push(clampedWeighted);
      totalScore += clampedWeighted;
    }
    finalScores.push(totalScore);
    // Determine letter grade
    let letter = "F";
    for (const grade of Object.keys(CLASS_GRADE_CUTOFFS)) {
      const cutoff = CLASS_GRADE_CUTOFFS[grade];
      if (totalScore >= cutoff) {
        letter = grade;
        break;
      }
    }
    letterGrades.push(letter);
    return [
      ...base,
      ...catScores.map((v) => v.toFixed(2)),
      totalScore.toFixed(2),
      letter,
    ];
  });

  // Write grades.csv
  const gradesCsv = csvStringify.stringify([gradesHeader, ...gradesRows]);
  fs.writeFileSync(gradesCsvPath, gradesCsv);

  // Compute metrics (all as percent, two decimals)
  function percent(v: number) {
    return (v * 100).toFixed(2);
  }
  const metrics: any = {
    total_students: students.length,
    categories: {},
    final_score: {
      mean: percent(mean(finalScores) / 100),
      median: percent(median(finalScores) / 100),
      stddev: percent(stddev(finalScores) / 100),
      min: percent(min(finalScores) / 100),
      max: percent(max(finalScores) / 100),
    },
    grade_distribution: {},
  };
  for (const cat of categoryNames) {
    // Find the category config to get its weight
    const catConfig = CLASS_COURSE_WORK.find((c: any) => c.name === cat);
    metrics.categories[cat] = {
      mean: percent(mean(categoryScores[cat]) / 100),
      median: percent(median(categoryScores[cat]) / 100),
      stddev: percent(stddev(categoryScores[cat]) / 100),
      min: percent(min(categoryScores[cat]) / 100),
      max: percent(max(categoryScores[cat]) / 100),
      max_possible: catConfig ? catConfig.weight : null,
    };
  }
  // Grade distribution (ordered as in CLASS_GRADE_CUTOFFS)
  const gradeCounts: Record<string, number> = {};
  for (const grade of letterGrades) {
    gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
  }
  metrics.grade_distribution = {};
  for (const grade of Object.keys(CLASS_GRADE_CUTOFFS)) {
    const count = gradeCounts[grade] || 0;
    metrics.grade_distribution[grade] = {
      count,
      percent: ((count / students.length) * 100).toFixed(2),
    };
  }

  fs.writeFileSync(metricsJsonPath, JSON.stringify(metrics, null, 2));

  console.log("Aggregation complete:");
  console.log("- Grades CSV:", gradesCsvPath);
  console.log("- Metrics JSON:", metricsJsonPath);
})();
