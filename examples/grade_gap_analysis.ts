import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

// Configuration - adjust this variable to match your class
const CURRENT_CLASS = "fall2025_en_601_226";

// Type definitions
type AnalysisGroup = {
  name: string;
  assignments: string[];
};

type AnalysisConfig = {
  group1: AnalysisGroup;
  group2: AnalysisGroup;
};

type Assignment = {
  name: string;
  max_points: number;
};

type GradescopeMetadata = {
  counts: {
    assignments: number;
    students: number;
  };
  assignments: Assignment[];
};

type StudentRecord = Record<string, string | number>;

type AnalysisResult = {
  "First Name": string;
  "Last Name": string;
  Email: string;
  SID: string;
  [key: string]: string | number; // For dynamic group columns
};

/**
 * Load the analysis configuration file
 */
function loadAnalysisConfig(classPath: string): AnalysisConfig {
  const configPath = path.join(classPath, "grade_gap_analysis.config.ts");

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `grade_gap_analysis.config.ts not found in ${classPath}. Please create this file first.`
    );
  }

  // Read and evaluate the TypeScript config file
  const configContent = fs.readFileSync(configPath, "utf-8");

  // Extract the ANALYSIS_CONFIG export using regex
  const match = configContent.match(
    /export\s+const\s+ANALYSIS_CONFIG\s*=\s*(\{[\s\S]*?\});/
  );
  if (!match) {
    throw new Error(
      "Could not find ANALYSIS_CONFIG export in grade_gap_analysis.config.ts"
    );
  }

  try {
    // Evaluate the JavaScript object literal
    const analysisConfig = eval(`(${match[1]})`) as AnalysisConfig;
    return analysisConfig;
  } catch (error) {
    throw new Error(`Error parsing ANALYSIS_CONFIG: ${error}`);
  }
}

/**
 * Load gradescope metadata
 */
function loadGradescopeMetadata(classPath: string): GradescopeMetadata {
  const metaPath = path.join(classPath, "gradescope_meta.json");

  if (!fs.existsSync(metaPath)) {
    throw new Error(`gradescope_meta.json not found in ${classPath}`);
  }

  const metaContent = fs.readFileSync(metaPath, "utf-8");
  return JSON.parse(metaContent) as GradescopeMetadata;
}

/**
 * Load gradescope processed CSV data
 */
function loadGradescopeProcessed(classPath: string): StudentRecord[] {
  const csvPath = path.join(classPath, "gradescope_processed.csv");

  if (!fs.existsSync(csvPath)) {
    throw new Error(`gradescope_processed.csv not found in ${classPath}`);
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const rawData = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  }) as Record<string, string>[];

  // Convert assignment scores to numbers while keeping first 5 columns as strings
  return rawData.map((row) => {
    const newRow: StudentRecord = {};
    const keys = Object.keys(row);

    keys.forEach((key, index) => {
      if (index < 5) {
        // Keep first 5 columns as strings
        newRow[key] = row[key];
      } else {
        // Convert assignment scores to numbers
        const numValue = parseFloat(row[key]);
        newRow[key] = isNaN(numValue) ? 0 : numValue;
      }
    });

    return newRow;
  });
}

/**
 * Validate that all assignments in the config exist in metadata
 */
function validateAssignments(
  config: AnalysisConfig,
  metadata: GradescopeMetadata
): void {
  const assignmentNames = new Set(
    metadata.assignments.map((a) => a.name)
  );

  const allConfigAssignments = [
    ...config.group1.assignments,
    ...config.group2.assignments,
  ];

  for (const assignmentName of allConfigAssignments) {
    if (!assignmentNames.has(assignmentName)) {
      throw new Error(
        `Assignment "${assignmentName}" not found in gradescope_meta.json`
      );
    }
  }
}

/**
 * Calculate normalized score (0-100) for a group of assignments
 */
function calculateGroupScore(
  student: StudentRecord,
  group: AnalysisGroup,
  metadata: GradescopeMetadata
): number {
  const assignmentMap = new Map<string, number>();
  metadata.assignments.forEach((a) => {
    assignmentMap.set(a.name, a.max_points);
  });

  let totalScore = 0;
  let totalMaxPoints = 0;

  for (const assignmentName of group.assignments) {
    const score = Number(student[assignmentName]) || 0;
    const maxPoints = assignmentMap.get(assignmentName) || 0;

    totalScore += score;
    totalMaxPoints += maxPoints;
  }

  if (totalMaxPoints === 0) {
    return 0;
  }

  return (totalScore / totalMaxPoints) * 100;
}

/**
 * Perform the gap analysis
 */
function analyzeGaps(
  students: StudentRecord[],
  config: AnalysisConfig,
  metadata: GradescopeMetadata
): AnalysisResult[] {
  const group1Header = `${config.group1.name} (%)`;
  const group2Header = `${config.group2.name} (%)`;

  return students.map((student) => {
    const group1Score = calculateGroupScore(student, config.group1, metadata);
    const group2Score = calculateGroupScore(student, config.group2, metadata);
    const gap = group1Score - group2Score;

    return {
      "First Name": String(student["First Name"]),
      "Last Name": String(student["Last Name"]),
      Email: String(student["Email"]),
      SID: String(student["SID"]),
      [group1Header]: Math.round(group1Score * 100) / 100,
      [group2Header]: Math.round(group2Score * 100) / 100,
      Gap: Math.round(gap * 100) / 100,
    };
  });
}

/**
 * Save the analysis results to CSV
 */
function saveAnalysisCSV(
  classPath: string,
  results: AnalysisResult[],
  config: AnalysisConfig
): string {
  if (results.length === 0) {
    throw new Error("No results to save");
  }

  // Generate filename from group names
  const group1Name = config.group1.name.toLowerCase().replace(/\s+/g, "_");
  const group2Name = config.group2.name.toLowerCase().replace(/\s+/g, "_");
  const filename = `grade_gap_${group1Name}_vs_${group2Name}.csv`;
  const csvPath = path.join(classPath, filename);

  // Get headers from the first result
  const headers = Object.keys(results[0]);

  const csvContent = stringify(results, {
    header: true,
    columns: headers,
  });

  fs.writeFileSync(csvPath, csvContent, "utf-8");
  return filename;
}

/**
 * Main function
 */
function main(): void {
  try {
    console.log(`🚀 Starting grade gap analysis for ${CURRENT_CLASS}`);

    const classPath = path.join("data", CURRENT_CLASS);

    if (!fs.existsSync(classPath)) {
      throw new Error(`Class folder not found: ${classPath}`);
    }

    // Load configuration and data
    console.log("📖 Loading analysis configuration...");
    const config = loadAnalysisConfig(classPath);
    console.log(`   Group 1: ${config.group1.name} (${config.group1.assignments.length} assignments)`);
    console.log(`   Group 2: ${config.group2.name} (${config.group2.assignments.length} assignments)`);

    console.log("📖 Loading gradescope metadata...");
    const metadata = loadGradescopeMetadata(classPath);
    console.log(`   Found ${metadata.assignments.length} assignments`);

    console.log("📖 Loading gradescope processed data...");
    const students = loadGradescopeProcessed(classPath);
    console.log(`   Loaded ${students.length} student records`);

    // Validate configuration
    console.log("🔍 Validating assignments...");
    validateAssignments(config, metadata);
    console.log("   ✅ All assignments are valid");

    // Perform analysis
    console.log("📊 Analyzing grade gaps...");
    const results = analyzeGaps(students, config, metadata);

    // Save results
    console.log("💾 Saving analysis results...");
    const filename = saveAnalysisCSV(classPath, results, config);
    console.log(`   ✅ Saved to ${filename}`);

    console.log("🎉 Grade gap analysis completed successfully!");

    // Print summary statistics
    const gaps = results.map((r) => r.Gap as number);
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const positiveGaps = gaps.filter((g) => g > 0).length;
    const negativeGaps = gaps.filter((g) => g < 0).length;
    const zeroGaps = gaps.filter((g) => g === 0).length;

    console.log("\n📋 Summary:");
    console.log(`   Average gap: ${avgGap.toFixed(2)}%`);
    console.log(`   Students with positive gap (better at ${config.group1.name}): ${positiveGaps}`);
    console.log(`   Students with negative gap (better at ${config.group2.name}): ${negativeGaps}`);
    console.log(`   Students with zero gap: ${zeroGaps}`);
  } catch (error) {
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

// Run the script
main();
