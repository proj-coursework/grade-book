# Grade Gap Analysis

This script compares student performance between two configurable groups of assignments. It calculates normalized scores (0-100%) for each group and outputs the gap between them. This is useful for identifying students whose performance varies significantly across different types of coursework.

## How it works

- The script reads a `grade_gap_analysis.config.ts` file that defines two groups of assignments to compare
- It processes `gradescope_processed.csv` and `gradescope_meta.json` files
- For each student, it calculates a normalized percentage score for each group
- It outputs a CSV with both scores and the gap between them

## Usage

1. Create a `grade_gap_analysis.config.ts` file in your class data folder (e.g., `data/fall2024_en_601_226/grade_gap_analysis.config.ts`) with the following structure:

   ```typescript
   export const ANALYSIS_CONFIG = {
     group1: {
       name: "Exams",
       assignments: ["Midterm", "Quiz 1", "Quiz 2", "Quiz 3", "Quiz 4"],
     },
     group2: {
       name: "Homeworks",
       assignments: ["Homework 1", "Homework 2", "Homework 3", "Homework 4"],
     },
   };
   ```

2. Edit the script to set the correct `CURRENT_CLASS` variable at the top of the file.

3. Run the script with:

   ```bash
   npx tsx examples/grade_gap_analysis.ts
   ```

## Configuration options

The config file exports an `ANALYSIS_CONFIG` object with two groups:

- **group1**: The first group of assignments
  - `name`: Display name for this group (used in CSV headers and filename)
  - `assignments`: Array of assignment names (must match names in `gradescope_meta.json`)
- **group2**: The second group of assignments
  - Same structure as group1

## Score calculation

For each group, the normalized score is calculated as:

```plaintext
(sum of student's scores in group) / (sum of max points in group) × 100
```

This ensures fair comparison even when groups have different total possible points.

## Gap calculation

```plaintext
Gap = Group1 Score - Group2 Score
```

- **Positive gap**: Student performs better on Group1
- **Negative gap**: Student performs better on Group2
- **Zero gap**: Equal performance on both groups

## Output

The script generates a CSV file named `grade_gap_[group1]_vs_[group2].csv` in the class data folder.

### Output columns

| Column            | Description                                   |
| ----------------- | --------------------------------------------- |
| First Name        | Student's first name                          |
| Last Name         | Student's last name                           |
| Email             | Student's email                               |
| SID               | Student ID                                    |
| [Group1 Name] (%) | Normalized score for group 1                  |
| [Group2 Name] (%) | Normalized score for group 2                  |
| Gap               | Difference between group 1 and group 2 scores |

### Example output

| First Name | Last Name | Email     | SID | Exams (%) | Homeworks (%) | Gap   |
| ---------- | --------- | --------- | --- | --------- | ------------- | ----- |
| Alice      | Smith     | alice@edu | 123 | 85.5      | 72.3          | 13.2  |
| Bob        | Jones     | bob@edu   | 456 | 68.0      | 89.5          | -21.5 |
| Carol      | Davis     | carol@edu | 789 | 75.0      | 75.0          | 0     |

## Use cases

This script supports various comparisons:

- **Exams vs Homeworks**: Identify students who may struggle with test-taking or time-limited assessments
- **Midterm vs Final**: Track improvement or decline over the semester
- **Quizzes vs Project**: Compare performance on individual vs collaborative work
- **First half vs Second half**: Analyze performance trends throughout the semester
- **In-class vs Take-home**: Compare performance across different assessment formats

## Running multiple comparisons

To run multiple comparisons, create different config files and modify the script to load each one:

1. Create `grade_gap_analysis.config.ts` for your first comparison
2. Run the script
3. Rename or backup the config file
4. Create a new config for your second comparison
5. Run the script again

Each run produces a uniquely named output file based on the group names.

## Error handling

The script will throw an error if:

- `grade_gap_analysis.config.ts` is not found in the class folder
- Any assignment listed in the config doesn't exist in `gradescope_meta.json`
- `gradescope_processed.csv` or `gradescope_meta.json` are missing

## Summary statistics

After generating the CSV, the script prints summary statistics:

- Average gap across all students
- Number of students with positive gap (better at group 1)
- Number of students with negative gap (better at group 2)
- Number of students with zero gap

## Important notes

- This script should be run **after** the `process` script (and any other processing like `combine_sections_assignments`)
- The output CSV can be opened in Excel, Google Sheets, or any spreadsheet application for further filtering and sorting
- Assignment names in the config must exactly match the names in `gradescope_meta.json`
