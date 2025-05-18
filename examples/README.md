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
