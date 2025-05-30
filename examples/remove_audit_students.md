# Remove Audit Students

This script demonstrates how to remove audit students from the processed grade data. This is useful for courses that have audit students who should not be included in final grade calculations or exports to Canvas/SIS.

## How it works

- The script reads an `audit.csv` file containing audit student information
- It matches students by SID (Student ID) between the audit list and processed data
- It removes audit students from `gradescope_processed.csv` and updates the metadata
- It creates backups of original files and generates a detailed removal report
- The script preserves the original file structure while filtering out audit students

## Usage

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

## What the script does

- **Loads audit data**: Reads `audit.csv` and extracts SIDs of students to remove
- **Creates backups**: Saves original files as `gradescope_processed_with_audit.csv` and `gradescope_meta_with_audit.json`
- **Filters students**: Removes audit students from the processed data based on SID matching
- **Updates metadata**: Adjusts student count in `gradescope_meta.json`
- **Generates report**: Creates `audit_removal_report.json` with detailed information about the removal process

## Output files

### Updated files

- `gradescope_processed.csv` - Original file with audit students removed
- `gradescope_meta.json` - Updated metadata with correct student count

### Backup files

- `gradescope_processed_with_audit.csv` - Backup of original processed data
- `gradescope_meta_with_audit.json` - Backup of original metadata

### Report file

- `audit_removal_report.json` - Detailed report including:
  - Summary statistics (students found, removed, not found)
  - List of removed students with names, SIDs, and emails
  - List of audit students from `audit.csv` that were not found in processed data

## Example transformation

### Before removal

```csv
First Name,Last Name,SID,Email,Sections,Assignment 1,Assignment 2
Alice,Smith,111111111,alice@uni.edu,Section 1,85,90
John,Audit,123456789,john.audit@uni.edu,Section 1,0,0
Bob,Johnson,222222222,bob@uni.edu,Section 2,78,82
Jane,Observer,987654321,jane.observer@uni.edu,Section 2,0,0
```

### After removal

```csv
First Name,Last Name,SID,Email,Sections,Assignment 1,Assignment 2
Alice,Smith,111111111,alice@uni.edu,Section 1,85,90
Bob,Johnson,222222222,bob@uni.edu,Section 2,78,82
```

## Error handling

- The script will throw an error if `audit.csv` is not found in the class folder
- It will warn if some audit students listed in `audit.csv` are not found in the processed data
- All discrepancies are documented in the `audit_removal_report.json` file
- Backup files are only created once to prevent overwriting previous backups

## Important notes

- This script should be run **after** the `process` script but **before** the `aggregate` script
- The downstream scripts (`aggregate`, `canvas`, `sis`) will work with the filtered data
- Always keep the backup files in case you need to revert changes
- The `audit.csv` file should have the same format as Gradescope raw data, with at minimum a `SID` column
- Students are matched by SID only - other fields are ignored for matching purposes
