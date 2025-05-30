# Extra Processing Examples

This folder contains examples of extra processing scripts that can be run to adjust student grades.

## Example 1: Add Extra Attribute (Team)

> [!NOTE]
> This example is implemented in `examples/add_team_attribute.ts`.

This example shows how to add an extra attribute (such as `team`) to a grade file (e.g., `grades.csv` or `gradescope_processed.csv`). This is helpful for classes with teams, enabling further processing, analysis, or reporting by team.

### How it works

- The script allows you to set:
  - `CURRENT_CLASS`: the class folder to process
  - `TEAMS_FILENAME`: the CSV file containing team information (must have columns: `email` and `team`, among others)
  - `TARGET_FILENAME`: the file to which the team column will be added (e.g., `grades.csv`)
- The script matches students by email (case-insensitive, trimmed)
- It adds a new column `team` to the target file, writing the result back to the same file
- It generates a `teams_errors.json` file listing students in `teams.csv` not found in the target file, and vice versa

### Usage

1. Place your `teams.csv` file in the class data folder (e.g., `data/spring2025_en_601_421/teams.csv`).
2. Edit the script to set the correct `CURRENT_CLASS`, `TEAMS_FILENAME`, and `TARGET_FILENAME`.
3. Run the script with:

   ```bash
   npx tsx examples/add_team_attribute.ts
   ```

4. The script will update the target file (e.g., `grades.csv`) and create `teams_errors.json` in the same folder.

### Input: teams.csv

| name        | email         | github     | team |
| ----------- | ------------- | ---------- | ---- |
| Alice Smith | alice@uni.edu | alicegit   | 1    |
| Bob Johnson | bob@uni.edu   | bobjohnson | 2    |

### Output: grades.csv (with new `team` column)

| First Name | Last Name | Email         | ... | team |
| ---------- | --------- | ------------- | --- | ---- |
| Alice      | Smith     | alice@uni.edu | ... | 1    |
| Bob        | Johnson   | bob@uni.edu   | ... | 2    |

### Output: teams_errors.json

Lists students in `teams.csv` not found in the target file, and students in the target file not found in `teams.csv`.

## Example 2: Prepare Outcome Assessment for ABET Accreditation

> [!NOTE]
> This example is implemented in `examples/abet_outcome_assessment.ts`.

This example demonstrates how to generate summary statistics for ABET (Accreditation Board for Engineering and Technology) outcome assessment, supporting accreditation requirements.

### How it works

- Set the `CURRENT_CLASS` variable at the top of the script to select the class folder to process.
- By default, the script will use the `gradescope_processed.csv` file in that folder.
- The folder must also contain an `abet.config.ts` file, which defines the mapping of student outcomes to assignments and grade cutoffs.

#### Example `abet.config.ts` structure

```ts
// Adjust these variables to match your class
export const CLASS_CODE: string = "EN.601.264";
export const CLASS_NAME: string = "Practical Generative AI";
export const CLASS_SEMESTER: string = "Spring 2025";

export type STUDENT_OUTCOME = {
  code: string;
  assignments: string[]; // Should be the same as the assignment names in the `gradescope_meta.json` file
};

export const CLASS_COURSE_WORK: STUDENT_OUTCOME[] = [
  {
    code: "SO3",
    assignments: ["Project (Final Presentation)"],
  },
  {
    code: "SO5",
    assignments: [
      "Team Formation",
      "Project Proposal",
      "Project Plan",
      "Project (Hello World)",
      "Project (Sprint 1)",
      "Project (Sprint 2)",
    ],
  },
  {
    code: "SO6",
    assignments: [
      "Classwork 01",
      "Classwork 02",
      "Classwork 03",
      "Classwork 04",
      "Classwork 05",
      "Classwork 06",
      "Classwork 07",
      "Classwork 08",
      "Classwork 09",
      "Classwork 10",
      "Classwork 11",
      "Classwork 12",
      "Classwork 13",
      "Classwork 14",
      "Classwork 15",
      "Classwork 16",
      "Classwork 17",
      "Classwork 18",
      "Classwork 19",
      "Classwork 20",
      "HW1: Simple Grammarly",
      "HW2: Simple ChatGPT",
      "HW3: Ask BlueJay",
      "HW4: WebChat",
    ],
  },
];

export const CLASS_GRADE_CUTOFFS = {
  A: 93, // Very good
  B: 83, // Satisfactory
  C: 73, // Fair
  D: 63, // Poor
};
```

### Output

The script generates an `abet_meta.json` file in the class folder. For each student outcome listed in `CLASS_COURSE_WORK`, the output includes:

- Average grade (normalized to 100-point scale)
- Standard deviation of grades
- Count of students who received A, B, C, or D (based on `CLASS_GRADE_CUTOFFS`)

### Usage

1. Ensure your class folder (e.g., `data/spring2025_en_601_264/`) contains:
   - `gradescope_processed.csv`
   - `abet.config.ts` (see structure above)
2. Edit the script to set the correct `CURRENT_CLASS`.
3. Run the script with:

   ```bash
   npx tsx examples/abet_outcome_assessment.ts
   ```

4. The script will create or update `abet_meta.json` in the class folder, summarizing outcome assessment statistics. It also generates `abet_aggregate.csv` as an intermediate file for further processing.

## Example 3: Combine Section-Specific Assignments

> [!NOTE]
> This example is implemented in `examples/combine_sections_assignments.ts`.

This example demonstrates how to combine section-specific assignments into unified assignments for multi-section classes. This is useful when you have multiple sections of the same class where assignments like quizzes and exams are section-specific, but you want to treat them as a single assignment for grading purposes.

### How it works

- The script reads a `sections.config.ts` file that defines which section-specific assignments should be combined
- It processes both `gradescope_processed.csv` and `gradescope_meta.json` files
- For each student, it takes the best score among all section assignments for that assignment group
- It creates backups of the original files before making changes
- It updates both files to have a single column/entry for each combined assignment

### Usage

1. Create a `sections.config.ts` file in your class data folder (e.g., `data/fall2024_en_601_226/sections.config.ts`) with the following structure:

   ```typescript
   export const SECTION_ASSIGNMENTS = [
     {
       name: "Midterm",
       assignments: ["Midterm (Section 1)", "Midterm (Section 2)"],
     },
     {
       name: "Quiz 1",
       assignments: ["Quiz 1 - Section 1", "Quiz 1 - Section 2"],
     },
     {
       name: "Quiz 2",
       assignments: ["Quiz 2 Version A", "Quiz 2 Version B", "Quiz 2 - Makeup"],
     },
   ];
   ```

2. Edit the script to set the correct `CURRENT_CLASS` variable at the top of the file.

3. Run the script with:

   ```bash
   npx tsx examples/combine_sections_assignments.ts
   ```

### What the script does

- **Validates assignments**: Ensures all assignments listed in `sections.config.ts` exist in `gradescope_meta.json` and have the same maximum points
- **Creates backups**: Saves original files as `gradescope_processed_original.csv` and `gradescope_meta_original.json`
- **Combines scores**: For each student, takes the highest score among section-specific assignments
- **Updates metadata**: Removes section-specific assignments and adds the combined assignment with appropriate max points
- **Preserves other assignments**: Assignments not listed in the config remain unchanged

### Example transformation

#### Before (gradescope_meta.json)

```json
{
  "assignments": [
    { "name": "Quiz 1 - Section 1", "max_points": 10 },
    { "name": "Quiz 1 - Section 2", "max_points": 10 },
    { "name": "Homework 1", "max_points": 20 }
  ]
}
```

#### After (gradescope_meta.json)

```json
{
  "assignments": [
    { "name": "Quiz 1", "max_points": 10 },
    { "name": "Homework 1", "max_points": 20 }
  ]
}
```

#### Before (gradescope_processed.csv)

| First Name | Last Name | SID | Email     | Sections  | Quiz 1 - Section 1 | Quiz 1 - Section 2 | Homework 1 |
| ---------- | --------- | --- | --------- | --------- | ------------------ | ------------------ | ---------- |
| Alice      | Smith     | 123 | alice@edu | Section 1 | 8.5                | 0                  | 18         |
| Bob        | Johnson   | 456 | bob@edu   | Section 2 | 0                  | 9.0                | 19         |

#### After (gradescope_processed.csv)

| First Name | Last Name | SID | Email     | Sections  | Quiz 1 | Homework 1 |
| ---------- | --------- | --- | --------- | --------- | ------ | ---------- |
| Alice      | Smith     | 123 | alice@edu | Section 1 | 8.5    | 18         |
| Bob        | Johnson   | 456 | bob@edu   | Section 2 | 9.0    | 19         |

### Error handling

- The script will throw an error if assignments in `sections.config.ts` don't exist in `gradescope_meta.json`
- It will also error if assignments in the same section group have different maximum points
- Backup files are only created once to prevent overwriting previous backups

### Important notes

- This script should be run **after** the `process` script but **before** the `aggregate` script
- The downstream scripts (`aggregate`, `canvas`, `sis`) expect single columns for each assignment
- Always keep the backup files in case you need to revert changes
- The script takes the **best score** among section assignments for each student

## Example 4: Remove Audit Students

> [!NOTE]
> This example is implemented in `examples/remove_audit_students.ts`.

This example demonstrates how to remove audit students from the processed grade data. This is useful for courses that have audit students who should not be included in final grade calculations or exports to Canvas/SIS.

### How it works

- The script reads an `audit.csv` file containing audit student information
- It matches students by SID (Student ID) between the audit list and processed data
- It removes audit students from `gradescope_processed.csv` and updates the metadata
- It creates backups of original files and generates a detailed removal report
- The script preserves the original file structure while filtering out audit students

### Usage

1. Create an `audit.csv` file in your class data folder (e.g., `data/spring2025_en_601_421/audit.csv`) with the same format as Gradescope raw data. At minimum, it must have a `SID` column:

   ```csv
   First Name,Last Name,SID,Email,Sections
   John,Audit,123456789,john.audit@uni.edu,Section 1
   Jane,Observer,987654321,jane.observer@uni.edu,Section 2
   ```

2. Edit the script to set the correct `CURRENT_CLASS` variable at the top of the file.

3. Run the script with:

   ```bash
   npx tsx examples/remove_audit_students.ts
   ```

### What the script does

- **Loads audit data**: Reads `audit.csv` and extracts SIDs of students to remove
- **Creates backups**: Saves original files as `gradescope_processed_with_audit.csv` and `gradescope_meta_with_audit.json`
- **Filters students**: Removes audit students from the processed data based on SID matching
- **Updates metadata**: Adjusts student count in `gradescope_meta.json`
- **Generates report**: Creates `audit_removal_report.json` with detailed information about the removal process

### Output files

#### Updated files

- `gradescope_processed.csv` - Original file with audit students removed
- `gradescope_meta.json` - Updated metadata with correct student count

#### Backup files

- `gradescope_processed_with_audit.csv` - Backup of original processed data
- `gradescope_meta_with_audit.json` - Backup of original metadata

#### Report file

- `audit_removal_report.json` - Detailed report including:
  - Summary statistics (students found, removed, not found)
  - List of removed students with names, SIDs, and emails
  - List of audit students from `audit.csv` that were not found in processed data

### Example transformation

#### Before removal

```csv
First Name,Last Name,SID,Email,Sections,Assignment 1,Assignment 2
Alice,Smith,111111111,alice@uni.edu,Section 1,85,90
John,Audit,123456789,john.audit@uni.edu,Section 1,0,0
Bob,Johnson,222222222,bob@uni.edu,Section 2,78,82
Jane,Observer,987654321,jane.observer@uni.edu,Section 2,0,0
```

#### After removal

```csv
First Name,Last Name,SID,Email,Sections,Assignment 1,Assignment 2
Alice,Smith,111111111,alice@uni.edu,Section 1,85,90
Bob,Johnson,222222222,bob@uni.edu,Section 2,78,82
```

### Error handling

- The script will throw an error if `audit.csv` is not found in the class folder
- It will warn if some audit students listed in `audit.csv` are not found in the processed data
- All discrepancies are documented in the `audit_removal_report.json` file
- Backup files are only created once to prevent overwriting previous backups

### Important notes

- This script should be run **after** the `process` script but **before** the `aggregate` script
- The downstream scripts (`aggregate`, `canvas`, `sis`) will work with the filtered data
- Always keep the backup files in case you need to revert changes
- The `audit.csv` file should have the same format as Gradescope raw data, with at minimum a `SID` column
- Students are matched by SID only - other fields are ignored for matching purposes
