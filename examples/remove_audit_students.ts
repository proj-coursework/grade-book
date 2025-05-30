import * as fs from "fs";
import * as path from "path";
import * as csvParse from "csv-parse/sync";
import * as csvStringify from "csv-stringify/sync";

// Configuration - adjust these variables to match your class
const CURRENT_CLASS = "fall2024_en_601_226";

// Type definitions
type StudentRecord = Record<string, string | number>;

type GradescopeMetadata = {
  counts: {
    assignments: number;
    students: number;
  };
  assignments: Array<{
    name: string;
    max_points: number;
  }>;
};

/**
 * Load gradescope processed CSV data
 */
function loadGradescopeProcessed(classPath: string): StudentRecord[] {
  const csvPath = path.join(classPath, "gradescope_processed.csv");

  if (!fs.existsSync(csvPath)) {
    throw new Error(`gradescope_processed.csv not found in ${classPath}`);
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const rawData = csvParse.parse(csvContent, {
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
 * Load audit students CSV data
 */
function loadAuditStudents(classPath: string): Set<string> {
  const auditPath = path.join(classPath, "audit.csv");

  if (!fs.existsSync(auditPath)) {
    throw new Error(
      `audit.csv not found in ${classPath}. Please create this file with audit student data.`
    );
  }

  const csvContent = fs.readFileSync(auditPath, "utf-8");
  const auditData = csvParse.parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  }) as Record<string, string>[];

  // Extract SIDs from audit students and create a Set for fast lookup
  const auditSIDs = new Set<string>();
  auditData.forEach((row) => {
    const sid = row.SID?.trim();
    if (sid) {
      auditSIDs.add(sid);
    }
  });

  return auditSIDs;
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
 * Create backup of original files
 */
function createBackups(classPath: string): void {
  const csvPath = path.join(classPath, "gradescope_processed.csv");
  const metaPath = path.join(classPath, "gradescope_meta.json");

  const csvBackupPath = path.join(
    classPath,
    "gradescope_processed_with_audit.csv"
  );
  const metaBackupPath = path.join(
    classPath,
    "gradescope_meta_with_audit.json"
  );

  // Only create backups if they don't already exist
  if (!fs.existsSync(csvBackupPath)) {
    fs.copyFileSync(csvPath, csvBackupPath);
    console.log(`✅ Created backup: gradescope_processed_with_audit.csv`);
  }

  if (!fs.existsSync(metaBackupPath)) {
    fs.copyFileSync(metaPath, metaBackupPath);
    console.log(`✅ Created backup: gradescope_meta_with_audit.json`);
  }
}

/**
 * Remove audit students from student records
 */
function removeAuditStudents(
  students: StudentRecord[],
  auditSIDs: Set<string>
): { filteredStudents: StudentRecord[]; removedStudents: StudentRecord[] } {
  const filteredStudents: StudentRecord[] = [];
  const removedStudents: StudentRecord[] = [];

  students.forEach((student) => {
    const sid = String(student.SID).trim();
    if (auditSIDs.has(sid)) {
      removedStudents.push(student);
    } else {
      filteredStudents.push(student);
    }
  });

  return { filteredStudents, removedStudents };
}

/**
 * Update metadata to reflect new student count
 */
function updateMetadata(
  metadata: GradescopeMetadata,
  newStudentCount: number
): GradescopeMetadata {
  return {
    ...metadata,
    counts: {
      ...metadata.counts,
      students: newStudentCount,
    },
  };
}

/**
 * Save updated CSV data
 */
function saveUpdatedCSV(classPath: string, students: StudentRecord[]): void {
  const csvPath = path.join(classPath, "gradescope_processed.csv");

  if (students.length === 0) {
    console.warn(
      "⚠️  Warning: No students remaining after removing audit students"
    );
  }

  // Get headers from the first student record (or use empty array if no students)
  const headers = students.length > 0 ? Object.keys(students[0]) : [];

  // Convert back to CSV format
  const csvContent = csvStringify.stringify(students, {
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
  metadata: GradescopeMetadata
): void {
  const metaPath = path.join(classPath, "gradescope_meta.json");

  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), "utf-8");
  console.log(`✅ Updated gradescope_meta.json`);
}

/**
 * Save removal report
 */
function saveRemovalReport(
  classPath: string,
  removedStudents: StudentRecord[],
  auditSIDs: Set<string>
): void {
  const reportPath = path.join(classPath, "audit_removal_report.json");

  // Find audit students that were not found in the processed data
  const processedSIDs = new Set(
    removedStudents.map((student) => String(student.SID).trim())
  );
  const notFoundAuditSIDs = Array.from(auditSIDs).filter(
    (sid) => !processedSIDs.has(sid)
  );

  const report = {
    summary: {
      audit_students_in_file: auditSIDs.size,
      students_removed: removedStudents.length,
      audit_students_not_found: notFoundAuditSIDs.length,
    },
    removed_students: removedStudents.map((student) => ({
      name: `${student["First Name"]} ${student["Last Name"]}`,
      sid: student.SID,
      email: student.Email,
    })),
    audit_students_not_found: notFoundAuditSIDs,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`✅ Created removal report: audit_removal_report.json`);
}

/**
 * Main function
 */
function main(): void {
  try {
    console.log(`🚀 Starting audit student removal for ${CURRENT_CLASS}`);

    const classPath = path.join("data", CURRENT_CLASS);

    if (!fs.existsSync(classPath)) {
      throw new Error(`Class folder not found: ${classPath}`);
    }

    // Load data
    console.log("📖 Loading gradescope processed data...");
    const students = loadGradescopeProcessed(classPath);
    console.log(`   Loaded ${students.length} student records`);

    console.log("📖 Loading audit students list...");
    const auditSIDs = loadAuditStudents(classPath);
    console.log(`   Found ${auditSIDs.size} audit students to remove`);

    console.log("📖 Loading gradescope metadata...");
    const metadata = loadGradescopeMetadata(classPath);

    // Create backups
    console.log("💾 Creating backups of original files...");
    createBackups(classPath);

    // Process data
    console.log("🔄 Removing audit students...");
    const { filteredStudents, removedStudents } = removeAuditStudents(
      students,
      auditSIDs
    );

    console.log(`   Removed ${removedStudents.length} audit students`);
    console.log(`   Remaining students: ${filteredStudents.length}`);

    // Update metadata
    const updatedMetadata = updateMetadata(metadata, filteredStudents.length);

    // Save updated data
    console.log("💾 Saving updated files...");
    saveUpdatedCSV(classPath, filteredStudents);
    saveUpdatedMetadata(classPath, updatedMetadata);

    // Save removal report
    console.log("📋 Generating removal report...");
    saveRemovalReport(classPath, removedStudents, auditSIDs);

    console.log("🎉 Audit student removal completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   • Original student count: ${students.length}`);
    console.log(`   • Audit students to remove: ${auditSIDs.size}`);
    console.log(`   • Students actually removed: ${removedStudents.length}`);
    console.log(`   • Final student count: ${filteredStudents.length}`);

    if (removedStudents.length !== auditSIDs.size) {
      console.log(
        "\n⚠️  Note: Some audit students were not found in the processed data."
      );
      console.log("   Check audit_removal_report.json for details.");
    }
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
