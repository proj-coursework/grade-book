import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

// Configuration - adjust these variables to match your class
const CURRENT_CLASS = "fall2024_en_601_226";

// Type definitions
type SectionAssignment = {
  name: string;
  assignments: string[];
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
 * Load the sections configuration file
 */
function loadSectionsConfig(classPath: string): SectionAssignment[] {
  const configPath = path.join(classPath, "sections.config.ts");

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `sections.config.ts not found in ${classPath}. Please create this file first.`,
    );
  }

  // Read and evaluate the TypeScript config file
  const configContent = fs.readFileSync(configPath, "utf-8");

  // Extract the SECTION_ASSIGNMENTS export using regex
  const match = configContent.match(
    /export\s+const\s+SECTION_ASSIGNMENTS\s*=\s*(\[[\s\S]*?\]);/,
  );
  if (!match) {
    throw new Error(
      "Could not find SECTION_ASSIGNMENTS export in sections.config.ts",
    );
  }

  try {
    // Evaluate the JavaScript array literal
    const sectionAssignments = eval(match[1]) as SectionAssignment[];
    return sectionAssignments;
  } catch (error) {
    throw new Error(`Error parsing SECTION_ASSIGNMENTS: ${error}`);
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
 * Validate that section assignments exist in metadata and have consistent max points
 */
function validateSectionAssignments(
  sectionAssignments: SectionAssignment[],
  metadata: GradescopeMetadata,
): void {
  const assignmentMap = new Map<string, number>();
  metadata.assignments.forEach((assignment) => {
    assignmentMap.set(assignment.name, assignment.max_points);
  });

  for (const section of sectionAssignments) {
    const maxPointsSet = new Set<number>();

    for (const assignmentName of section.assignments) {
      if (!assignmentMap.has(assignmentName)) {
        throw new Error(
          `Assignment "${assignmentName}" in section "${section.name}" not found in gradescope_meta.json`,
        );
      }
      maxPointsSet.add(assignmentMap.get(assignmentName)!);
    }

    // Check that all assignments in this section have the same max points
    if (maxPointsSet.size > 1) {
      throw new Error(
        `Assignments in section "${section.name}" have different max points: ${Array.from(maxPointsSet).join(", ")}. ` +
          `All assignments in a section must have the same max points.`,
      );
    }

    if (maxPointsSet.size === 0) {
      throw new Error(`Section "${section.name}" has no valid assignments.`);
    }
  }
}

/**
 * Create backup of original files
 */
function createBackups(classPath: string): void {
  const csvPath = path.join(classPath, "gradescope_processed.csv");
  const metaPath = path.join(classPath, "gradescope_meta.json");

  const csvBackupPath = path.join(
    classPath,
    "gradescope_processed_original.csv",
  );
  const metaBackupPath = path.join(classPath, "gradescope_meta_original.json");

  // Only create backups if they don't already exist
  if (!fs.existsSync(csvBackupPath)) {
    fs.copyFileSync(csvPath, csvBackupPath);
    console.log(`✅ Created backup: gradescope_processed_original.csv`);
  }

  if (!fs.existsSync(metaBackupPath)) {
    fs.copyFileSync(metaPath, metaBackupPath);
    console.log(`✅ Created backup: gradescope_meta_original.json`);
  }
}

/**
 * Combine section assignments in student records
 */
function combineStudentAssignments(
  students: StudentRecord[],
  sectionAssignments: SectionAssignment[],
): StudentRecord[] {
  return students.map((student) => {
    const newStudent = { ...student };

    for (const section of sectionAssignments) {
      // Find the best score among all section assignments
      let bestScore = 0;
      let hasAnyScore = false;

      for (const assignmentName of section.assignments) {
        const score = Number(student[assignmentName]) || 0;
        if (score > 0) {
          hasAnyScore = true;
          bestScore = Math.max(bestScore, score);
        }
      }

      // Set the combined score (use best score if any assignment has a score, otherwise 0)
      newStudent[section.name] = hasAnyScore ? bestScore : 0;

      // Remove the original section-specific assignments
      for (const assignmentName of section.assignments) {
        delete newStudent[assignmentName];
      }
    }

    return newStudent;
  });
}

/**
 * Update metadata to reflect combined assignments
 */
function updateMetadata(
  metadata: GradescopeMetadata,
  sectionAssignments: SectionAssignment[],
): GradescopeMetadata {
  const assignmentMap = new Map<string, Assignment>();
  metadata.assignments.forEach((assignment) => {
    assignmentMap.set(assignment.name, assignment);
  });

  const newAssignments: Assignment[] = [];
  const processedAssignments = new Set<string>();

  // Add combined assignments
  for (const section of sectionAssignments) {
    // Get max points from the first assignment in the section (they should all be the same)
    const firstAssignment = assignmentMap.get(section.assignments[0]);
    if (firstAssignment) {
      newAssignments.push({
        name: section.name,
        max_points: firstAssignment.max_points,
      });
    }

    // Mark all section assignments as processed
    section.assignments.forEach((name) => processedAssignments.add(name));
  }

  // Add remaining assignments that weren't part of any section
  for (const assignment of metadata.assignments) {
    if (!processedAssignments.has(assignment.name)) {
      newAssignments.push(assignment);
    }
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
  console.log(`✅ Updated gradescope_processed.csv`);
}

/**
 * Save updated metadata
 */
function saveUpdatedMetadata(
  classPath: string,
  metadata: GradescopeMetadata,
): void {
  const metaPath = path.join(classPath, "gradescope_meta.json");

  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), "utf-8");
  console.log(`✅ Updated gradescope_meta.json`);
}

/**
 * Main function
 */
function main(): void {
  try {
    console.log(
      `🚀 Starting section assignment combination for ${CURRENT_CLASS}`,
    );

    const classPath = path.join("data", CURRENT_CLASS);

    if (!fs.existsSync(classPath)) {
      throw new Error(`Class folder not found: ${classPath}`);
    }

    // Load configuration and data
    console.log("📖 Loading sections configuration...");
    const sectionAssignments = loadSectionsConfig(classPath);
    console.log(
      `   Found ${sectionAssignments.length} section groups to combine`,
    );

    console.log("📖 Loading gradescope metadata...");
    const metadata = loadGradescopeMetadata(classPath);
    console.log(
      `   Found ${metadata.assignments.length} assignments for ${metadata.counts.students} students`,
    );

    console.log("📖 Loading gradescope processed data...");
    const students = loadGradescopeProcessed(classPath);
    console.log(`   Loaded ${students.length} student records`);

    // Validate configuration
    console.log("🔍 Validating section assignments...");
    validateSectionAssignments(sectionAssignments, metadata);
    console.log("   ✅ All section assignments are valid");

    // Create backups
    console.log("💾 Creating backups of original files...");
    createBackups(classPath);

    // Process data
    console.log("🔄 Combining section assignments...");
    const updatedStudents = combineStudentAssignments(
      students,
      sectionAssignments,
    );
    const updatedMetadata = updateMetadata(metadata, sectionAssignments);

    console.log(`   Combined ${sectionAssignments.length} section groups`);
    console.log(
      `   New assignment count: ${updatedMetadata.assignments.length} (was ${metadata.assignments.length})`,
    );

    // Save updated data
    console.log("💾 Saving updated files...");
    saveUpdatedCSV(classPath, updatedStudents);
    saveUpdatedMetadata(classPath, updatedMetadata);

    console.log("🎉 Section assignment combination completed successfully!");
    console.log("\n📋 Summary:");
    sectionAssignments.forEach((section) => {
      console.log(
        `   • Combined "${section.assignments.join('", "')}" → "${section.name}"`,
      );
    });
  } catch (error) {
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

// Run the script
main();
