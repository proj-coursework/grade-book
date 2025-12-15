# Merge External Column

This script merges a column from an external CSV file into `gradescope_processed.csv`. This is useful when you have grade data from sources outside Gradescope (such as attendance systems, external quizzes, or participation tracking) that you want to include in the grade calculation.

## How it works

- The script reads a configuration file that specifies which external file to merge and how to match students
- It matches students between `gradescope_processed.csv` and the external file using configurable columns (e.g., SID to SIS User ID)
- It copies a specified column from the external file as a new assignment column
- It updates `gradescope_meta.json` with the new assignment information
- It creates backups before making changes and generates a detailed report

## Usage

1. Run `pnpm run process` first to generate `gradescope_processed.csv` and `gradescope_meta.json` from the raw Gradescope data.

2. Create a `merge_external.config.ts` file in your class data folder (e.g., `data/fall2025_en_601_425/merge_external.config.ts`) with the following structure:

   ```typescript
   export const MERGE_CONFIG = {
     sourceFile: "attendance.csv", // External CSV file to merge from
     sourceMatchColumn: "SIS User ID", // Column in source file to match on
     sourceDataColumn: "Weighted Points", // Column in source file to copy
     targetMatchColumn: "SID", // Column in gradescope_processed.csv to match
     newColumnName: "Classwork", // New column name in target
     maxPoints: 100, // Max points for gradescope_meta.json
   };
   ```

3. Edit the script to set the correct `CURRENT_CLASS` variable at the top of the file.

4. Run the script with:

   ```bash
   npx tsx examples/merge_external_column.ts
   ```

5. Continue with the normal workflow:

   ```bash
   pnpm run aggregate
   pnpm run canvas
   pnpm run sis
   ```

## Configuration Options

| Option              | Description                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `sourceFile`        | Name of the external CSV file in the class data folder                                        |
| `sourceMatchColumn` | Column name in the source file used to match students                                         |
| `sourceDataColumn`  | Column name in the source file containing the data to copy                                    |
| `targetMatchColumn` | Column name in `gradescope_processed.csv` used to match students (typically `SID` or `Email`) |
| `newColumnName`     | Name for the new column in `gradescope_processed.csv`                                         |
| `maxPoints`         | Maximum points for this assignment (used in `gradescope_meta.json`)                           |

## What the script does

- **Validates configuration**: Ensures the source file exists and contains the specified columns
- **Creates backups**: Saves original files as `gradescope_processed_pre_merge.csv` and `gradescope_meta_pre_merge.json`
- **Merges data**: Copies values from the source file to matching students in the target file
- **Handles missing matches**: Students not found in the source file are assigned a score of 0
- **Updates metadata**: Adds the new assignment to `gradescope_meta.json` with the specified max points
- **Generates report**: Creates `merge_external_report.json` with detailed matching information

## Output files

### Updated files

- `gradescope_processed.csv` - Original file with the new column added
- `gradescope_meta.json` - Updated metadata with the new assignment

### Backup files

- `gradescope_processed_pre_merge.csv` - Backup of processed data before merge
- `gradescope_meta_pre_merge.json` - Backup of metadata before merge

### Report file

- `merge_external_report.json` - Detailed report including:
  - Configuration used
  - Summary statistics (students matched, not matched)
  - List of students not found in source file
  - List of source records not matched to any student

## Example transformation

### Source file (attendance.csv)

| SIS User ID | Name            | Weighted Points |
| ----------- | --------------- | --------------- |
| 111111111   | Alice Smith     | 95              |
| 222222222   | Bob Johnson     | 88              |
| 333333333   | Unknown Student | 100             |

### Before merge (gradescope_processed.csv)

| First Name | Last Name | SID       | Email         | Sections  | Homework 1 |
| ---------- | --------- | --------- | ------------- | --------- | ---------- |
| Alice      | Smith     | 111111111 | alice@uni.edu | Section 1 | 85         |
| Bob        | Johnson   | 222222222 | bob@uni.edu   | Section 2 | 78         |
| Carol      | Williams  | 444444444 | carol@uni.edu | Section 1 | 92         |

### After merge (gradescope_processed.csv)

| First Name | Last Name | SID       | Email         | Sections  | Classwork | Homework 1 |
| ---------- | --------- | --------- | ------------- | --------- | --------- | ---------- |
| Alice      | Smith     | 111111111 | alice@uni.edu | Section 1 | 95        | 85         |
| Bob        | Johnson   | 222222222 | bob@uni.edu   | Section 2 | 88        | 78         |
| Carol      | Williams  | 444444444 | carol@uni.edu | Section 1 | 0         | 92         |

### Report (merge_external_report.json)

```json
{
  "config": {
    "sourceFile": "attendance.csv",
    "sourceMatchColumn": "SIS User ID",
    "sourceDataColumn": "Weighted Points",
    "targetMatchColumn": "SID",
    "newColumnName": "Classwork",
    "maxPoints": 100
  },
  "summary": {
    "total_students": 3,
    "total_source_records": 3,
    "students_matched": 2,
    "students_not_matched": 1,
    "source_records_not_matched": 1
  },
  "unmatched_students": [
    {
      "name": "Carol Williams",
      "sid": "444444444",
      "email": "carol@uni.edu"
    }
  ],
  "unmatched_source_records": [
    {
      "match_value": "333333333",
      "data_value": "100"
    }
  ]
}
```

## Idempotency

The script is designed to be safely re-run:

- **Column existence check**: If the target column already exists, the script will replace its values with fresh data from the source file (with a warning message)
- **One-time backups**: Backup files are only created if they don't already exist, preserving the original pre-merge state
- **Clean re-runs**: To start fresh, re-run `pnpm run process` to regenerate `gradescope_processed.csv`, then run the merge script again

## Error handling

- The script will throw an error if the source file is not found
- It will throw an error if the specified columns don't exist in the source file
- Students not found in the source file are assigned 0 (not an error)
- All discrepancies are documented in `merge_external_report.json`

## Important notes

- This script should be run **after** the `process` script but **before** the `aggregate` script
- The raw Gradescope file (`gradescope_raw.csv`) is never modified
- Make sure the `newColumnName` matches the assignment name in your `config.ts` for proper aggregation
- The matching is case-sensitive and uses exact string comparison (after trimming whitespace)
- Always review `merge_external_report.json` to ensure all students were matched correctly
