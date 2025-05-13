# Extra Processing Examples

This folder contains examples of extra processing scripts that can be run to adjust student grades.

## Example 1: Add Extra Attribute (Team)

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
   ```
   npx tsx examples/add_team_attribute.ts
   ```
4. The script will update the target file (e.g., `grades.csv`) and create `teams_errors.json` in the same folder.

### Input: teams.csv

| name         | email              | github      | team |
|--------------|--------------------|-------------|------|
| Alice Smith  | alice@uni.edu      | alicegit    | 1    |
| Bob Johnson  | bob@uni.edu        | bobjohnson  | 2    |

### Output: grades.csv (with new `team` column)

| First Name | Last Name | Email           | ... | team |
|------------|-----------|-----------------|-----|------|
| Alice      | Smith     | alice@uni.edu   | ... | 1    |
| Bob        | Johnson   | bob@uni.edu     | ... | 2    |

### Output: teams_errors.json

Lists students in `teams.csv` not found in the target file, and students in the target file not found in `teams.csv`.
