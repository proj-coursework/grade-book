# Combine Section-Specific Assignments

This script demonstrates how to combine section-specific assignments into unified assignments for multi-section classes. This is useful when you have multiple sections of the same class where assignments like quizzes and exams are section-specific, but you want to treat them as a single assignment for grading purposes.

## How it works

- The script reads a `sections.config.ts` file that defines which section-specific assignments should be combined
- It processes both `gradescope_processed.csv` and `gradescope_meta.json` files
- For each student, it takes the best score among all section assignments for that assignment group
- It creates backups of the original files before making changes
- It updates both files to have a single column/entry for each combined assignment

## Usage

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

## What the script does

- **Validates assignments**: Ensures all assignments listed in `sections.config.ts` exist in `gradescope_meta.json` and have the same maximum points
- **Creates backups**: Saves original files as `gradescope_processed_original.csv` and `gradescope_meta_original.json`
- **Combines scores**: For each student, takes the highest score among section-specific assignments
- **Updates metadata**: Removes section-specific assignments and adds the combined assignment with appropriate max points
- **Preserves other assignments**: Assignments not listed in the config remain unchanged

## Example transformation

### Before (gradescope_meta.json)

```json
{
  "assignments": [
    { "name": "Quiz 1 - Section 1", "max_points": 10 },
    { "name": "Quiz 1 - Section 2", "max_points": 10 },
    { "name": "Homework 1", "max_points": 20 }
  ]
}
```

### After (gradescope_meta.json)

```json
{
  "assignments": [
    { "name": "Quiz 1", "max_points": 10 },
    { "name": "Homework 1", "max_points": 20 }
  ]
}
```

### Before (gradescope_processed.csv)

| First Name | Last Name | SID | Email     | Sections  | Quiz 1 - Section 1 | Quiz 1 - Section 2 | Homework 1 |
| ---------- | --------- | --- | --------- | --------- | ------------------ | ------------------ | ---------- |
| Alice      | Smith     | 123 | alice@edu | Section 1 | 8.5                | 0                  | 18         |
| Bob        | Johnson   | 456 | bob@edu   | Section 2 | 0                  | 9.0                | 19         |

### After (gradescope_processed.csv)

| First Name | Last Name | SID | Email     | Sections  | Quiz 1 | Homework 1 |
| ---------- | --------- | --- | --------- | --------- | ------ | ---------- |
| Alice      | Smith     | 123 | alice@edu | Section 1 | 8.5    | 18         |
| Bob        | Johnson   | 456 | bob@edu   | Section 2 | 9.0    | 19         |

## Error handling

- The script will throw an error if assignments in `sections.config.ts` don't exist in `gradescope_meta.json`
- It will also error if assignments in the same section group have different maximum points
- Backup files are only created once to prevent overwriting previous backups

## Important notes

- This script should be run **after** the `process` script but **before** the `aggregate` script
- The downstream scripts (`aggregate`, `canvas`, `sis`) expect single columns for each assignment
- Always keep the backup files in case you need to revert changes
- The script takes the **best score** among section assignments for each student
