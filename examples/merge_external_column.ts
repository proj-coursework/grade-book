import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

// Configuration - adjust this variable to match your class
const CURRENT_CLASS = "fall2025_en_601_226";

// Type definitions
type MergeConfig = {
  sourceFile: string; // External CSV file to merge from
  sourceMatchColumn: string; // Column in source file to match on
  sourceDataColumn: string; // Column in source file to copy
  targetMatchColumn: string; // Column in gradescope_processed.csv to match
  newColumnName: string; // New column name in target
  maxPoints: number; // Max points for gradescope_meta.json
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

/**
 * Load the merge configuration file
 */
function loadMergeConfig(classPath: string): MergeConfig {
  const configPath = path.join(classPath, "merge_external.config.ts");

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `merge_external.config.ts not found in ${classPath}. Please create this file first.`
    );
  }

  // Read and evaluate the TypeScript config file
  const configContent = fs.readFileSync(configPath, "utf-8");

  // Extract the MERGE_CONFIG export using regex
  const match = configContent.match(
    /export\s+const\s+MERGE_CONFIG\s*=\s*(\{[\s\S]*?\});/
  );
  if (!match) {
    throw new Error(
      "Could not find MERGE_CONFIG export in merge_external.config.ts"
    );
  }

  try {
    // Evaluate the JavaScript object literal
    const mergeConfig = eval(`(${match[1]})`) as MergeConfig;
    return mergeConfig;
  } catch (error) {
    throw new Error(`Error parsing MERGE_CONFIG: ${error}`);
  }
}

/**
 * Load gradescope processed CSV data
 */
function loadGradescopeProcessed(classPath: string): StudentRecord[] {
  const csvPath = path.join(classPath, "gradescope_processed.csv");

  if (!fs.existsSync(csvPath)) {
    throw new Error(
      `gradescope_processed.csv not found in ${classPath}. Run 'pnpm run process' first.`
    );
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
        // Keep first 5 columns as strings (First Name, Last Name, SID, Email, Sections)
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
 * Load external source CSV data
 */
function loadSourceData(
  classPath: string,
  sourceFile: string
): Record<string, string>[] {
  const csvPath = path.join(classPath, sourceFile);

  if (!fs.existsSync(csvPath)) {
    throw new Error(`${sourceFile} not found in ${classPath}.`);
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  return parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  }) as Record<string, string>[];
}

/**
 * Load gradescope metadata
 */
function loadGradescopeMetadata(classPath: string): GradescopeMetadata {
  const metaPath = path.join(classPath, "gradescope_meta.json");

  if (!fs.existsSync(metaPath)) {
    throw new Error(
      `gradescope_meta.json not found in ${classPath}. Run 'pnpm run process' first.`
    );
  }

  const metaContent = fs.readFileSync(metaPath, "utf-8");
  return JSON.parse(metaContent) as GradescopeMetadata;
}

/**
 * Check if column already exists in processed data
 */
function columnExists(students: StudentRecord[], columnName: string): boolean {
  if (students.length === 0) return false;
  return columnName in students[0];
}

/**
 * Create backup of original files
 */
function createBackups(classPath: string): void {
  const csvPath = path.join(classPath, "gradescope_processed.csv");
  const metaPath = path.join(classPath, "gradescope_meta.json");

  const csvBackupPath = path.join(
    classPath,
    "gradescope_processed_pre_merge.csv"
  );
  const metaBackupPath = path.join(classPath, "gradescope_meta_pre_merge.json");

  // Only create backups if they don't already exist
  if (!fs.existsSync(csvBackupPath)) {
    fs.copyFileSync(csvPath, csvBackupPath);
    console.log(`  Created backup: gradescope_processed_pre_merge.csv`);
  } else {
    console.log(`  Backup already exists: gradescope_processed_pre_merge.csv`);
  }

  if (!fs.existsSync(metaBackupPath)) {
    fs.copyFileSync(metaPath, metaBackupPath);
    console.log(`  Created backup: gradescope_meta_pre_merge.json`);
  } else {
    console.log(`  Backup already exists: gradescope_meta_pre_merge.json`);
  }
}

/**
 * Build lookup map from source data
 */
function buildSourceLookup(
  sourceData: Record<string, string>[],
  matchColumn: string,
  dataColumn: string
): Map<string, number> {
  const lookup = new Map<string, number>();

  for (const row of sourceData) {
    const matchValue = String(row[matchColumn] || "").trim();
    const dataValue = row[dataColumn];

    if (matchValue) {
      const numValue = parseFloat(dataValue);
      lookup.set(matchValue, isNaN(numValue) ? 0 : numValue);
    }
  }

  return lookup;
}

/**
 * Merge external column into student records
 */
function mergeColumn(
  students: StudentRecord[],
  sourceLookup: Map<string, number>,
  targetMatchColumn: string,
  newColumnName: string
): {
  updatedStudents: StudentRecord[];
  matchedCount: number;
  unmatchedStudents: StudentRecord[];
} {
  const unmatchedStudents: StudentRecord[] = [];
  let matchedCount = 0;

  const updatedStudents = students.map((student) => {
    const matchValue = String(student[targetMatchColumn] || "").trim();
    const newStudent = { ...student };

    if (sourceLookup.has(matchValue)) {
      newStudent[newColumnName] = sourceLookup.get(matchValue)!;
      matchedCount++;
    } else {
      newStudent[newColumnName] = 0;
      unmatchedStudents.push(student);
    }

    return newStudent;
  });

  return { updatedStudents, matchedCount, unmatchedStudents };
}

/**
 * Update metadata to include new assignment
 */
function updateMetadata(
  metadata: GradescopeMetadata,
  newColumnName: string,
  maxPoints: number
): GradescopeMetadata {
  // Check if assignment already exists
  const existingIndex = metadata.assignments.findIndex(
    (a) => a.name === newColumnName
  );

  let newAssignments: Assignment[];
  if (existingIndex >= 0) {
    // Update existing assignment
    newAssignments = [...metadata.assignments];
    newAssignments[existingIndex] = {
      name: newColumnName,
      max_points: maxPoints,
    };
  } else {
    // Add new assignment
    newAssignments = [
      ...metadata.assignments,
      { name: newColumnName, max_points: maxPoints },
    ];
  }

  // Sort assignments alphabetically
  newAssignments.sort((a, b) => a.name.localeCompare(b.name));

  return {
    counts: {
      assignments: newAssignments.length,
      students: metadata.counts.students,
    },
    assignments: newAssignments,
  };
}

/**
 * Save updated CSV data
 */
function saveUpdatedCSV(classPath: string, students: StudentRecord[]): void {
  const csvPath = path.join(classPath, "gradescope_processed.csv");

  if (students.length === 0) {
    throw new Error("No student data to save");
  }

  // Get headers from the first student record
  const headers = Object.keys(students[0]);

  // Convert back to CSV format
  const csvContent = stringify(students, {
    header: true,
    columns: headers,
  });

  fs.writeFileSync(csvPath, csvContent, "utf-8");
  console.log(`  Updated gradescope_processed.csv`);
}

/**
 * Save updated metadata
 */
function saveUpdatedMetadata(
  classPath: string,
  metadata: GradescopeMetadata
): void {
  const metaPath = path.join(classPath, "gradescope_meta.json");

  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), "utf-8");
  console.log(`  Updated gradescope_meta.json`);
}

/**
 * Save merge report
 */
function saveMergeReport(
  classPath: string,
  config: MergeConfig,
  students: StudentRecord[],
  sourceData: Record<string, string>[],
  matchedCount: number,
  unmatchedStudents: StudentRecord[]
): void {
  const reportPath = path.join(classPath, "merge_external_report.json");

  // Find source records that weren't matched to any student
  const matchedSourceKeys = new Set<string>();
  students.forEach((student) => {
    const matchValue = String(student[config.targetMatchColumn] || "").trim();
    matchedSourceKeys.add(matchValue);
  });

  const unmatchedSourceRecords = sourceData.filter((row) => {
    const matchValue = String(row[config.sourceMatchColumn] || "").trim();
    return !matchedSourceKeys.has(matchValue);
  });

  const report = {
    config: {
      sourceFile: config.sourceFile,
      sourceMatchColumn: config.sourceMatchColumn,
      sourceDataColumn: config.sourceDataColumn,
      targetMatchColumn: config.targetMatchColumn,
      newColumnName: config.newColumnName,
      maxPoints: config.maxPoints,
    },
    summary: {
      total_students: students.length,
      total_source_records: sourceData.length,
      students_matched: matchedCount,
      students_not_matched: unmatchedStudents.length,
      source_records_not_matched: unmatchedSourceRecords.length,
    },
    unmatched_students: unmatchedStudents.map((student) => ({
      name: `${student["First Name"]} ${student["Last Name"]}`,
      sid: student.SID,
      email: student.Email,
    })),
    unmatched_source_records: unmatchedSourceRecords.map((row) => ({
      match_value: row[config.sourceMatchColumn],
      data_value: row[config.sourceDataColumn],
    })),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`  Created merge report: merge_external_report.json`);
}

/**
 * Main function
 */
function main(): void {
  try {
    console.log(`\nStarting external column merge for ${CURRENT_CLASS}\n`);

    const classPath = path.join("data", CURRENT_CLASS);

    if (!fs.existsSync(classPath)) {
      throw new Error(`Class folder not found: ${classPath}`);
    }

    // Load configuration
    console.log("Loading configuration...");
    const config = loadMergeConfig(classPath);
    console.log(`  Source file: ${config.sourceFile}`);
    console.log(
      `  Match: ${config.targetMatchColumn} <-> ${config.sourceMatchColumn}`
    );
    console.log(
      `  Copy: ${config.sourceDataColumn} -> ${config.newColumnName}`
    );
    console.log(`  Max points: ${config.maxPoints}`);

    // Load data
    console.log("\nLoading data...");
    const students = loadGradescopeProcessed(classPath);
    console.log(
      `  Loaded ${students.length} students from gradescope_processed.csv`
    );

    const sourceData = loadSourceData(classPath, config.sourceFile);
    console.log(
      `  Loaded ${sourceData.length} records from ${config.sourceFile}`
    );

    const metadata = loadGradescopeMetadata(classPath);
    console.log(
      `  Loaded metadata with ${metadata.assignments.length} assignments`
    );

    // Validate source columns exist
    if (sourceData.length > 0) {
      const sourceHeaders = Object.keys(sourceData[0]);
      if (!sourceHeaders.includes(config.sourceMatchColumn)) {
        throw new Error(
          `Column "${config.sourceMatchColumn}" not found in ${config.sourceFile}. ` +
            `Available columns: ${sourceHeaders.join(", ")}`
        );
      }
      if (!sourceHeaders.includes(config.sourceDataColumn)) {
        throw new Error(
          `Column "${config.sourceDataColumn}" not found in ${config.sourceFile}. ` +
            `Available columns: ${sourceHeaders.join(", ")}`
        );
      }
    }

    // Check if column already exists
    if (columnExists(students, config.newColumnName)) {
      console.log(
        `\nColumn "${config.newColumnName}" already exists in gradescope_processed.csv.`
      );
      console.log(
        "The existing values will be replaced with new values from the source file."
      );
    }

    // Create backups
    console.log("\nCreating backups...");
    createBackups(classPath);

    // Build lookup and merge
    console.log("\nMerging data...");
    const sourceLookup = buildSourceLookup(
      sourceData,
      config.sourceMatchColumn,
      config.sourceDataColumn
    );
    console.log(`  Built lookup with ${sourceLookup.size} unique match values`);

    const { updatedStudents, matchedCount, unmatchedStudents } = mergeColumn(
      students,
      sourceLookup,
      config.targetMatchColumn,
      config.newColumnName
    );
    console.log(`  Matched ${matchedCount} of ${students.length} students`);

    if (unmatchedStudents.length > 0) {
      console.log(
        `  Warning: ${unmatchedStudents.length} students not found in source (assigned 0)`
      );
    }

    // Update metadata
    const updatedMetadata = updateMetadata(
      metadata,
      config.newColumnName,
      config.maxPoints
    );

    // Save files
    console.log("\nSaving files...");
    saveUpdatedCSV(classPath, updatedStudents);
    saveUpdatedMetadata(classPath, updatedMetadata);

    // Save report
    console.log("\nGenerating report...");
    saveMergeReport(
      classPath,
      config,
      students,
      sourceData,
      matchedCount,
      unmatchedStudents
    );

    console.log("\nMerge completed successfully!");
    console.log("\nSummary:");
    console.log(`  - Added/updated column: "${config.newColumnName}"`);
    console.log(`  - Students matched: ${matchedCount}/${students.length}`);
    console.log(
      `  - New assignment count: ${updatedMetadata.assignments.length}`
    );

    if (unmatchedStudents.length > 0) {
      console.log(
        `\nNote: ${unmatchedStudents.length} students were not found in the source file.`
      );
      console.log("Check merge_external_report.json for details.");
    }
  } catch (error) {
    console.error(
      "\nError:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

// Run the script
main();
