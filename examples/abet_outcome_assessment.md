# Prepare Outcome Assessment for ABET Accreditation

This script demonstrates how to generate summary statistics for ABET (Accreditation Board for Engineering and Technology) outcome assessment, supporting accreditation requirements.

## How it works

- Set the `CURRENT_CLASS` variable at the top of the script to select the class folder to process.
- By default, the script will use the `gradescope_processed.csv` file in that folder.
- The folder must also contain an `abet.config.ts` file, which defines the mapping of student outcomes to assignments and grade cutoffs.

## Example `abet.config.ts` structure

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

## Output

The script generates an `abet_meta.json` file in the class folder. For each student outcome listed in `CLASS_COURSE_WORK`, the output includes:

- Average grade (normalized to 100-point scale)
- Standard deviation of grades
- Count of students who received A, B, C, or D (based on `CLASS_GRADE_CUTOFFS`)

## Usage

1. Ensure your class folder (e.g., `data/spring2025_en_601_264/`) contains:
   - `gradescope_processed.csv`
   - `abet.config.ts` (see structure above)
2. Edit the script to set the correct `CURRENT_CLASS`.
3. Run the script with:

   ```bash
   npx tsx examples/abet_outcome_assessment.ts
   ```

4. The script will create or update `abet_meta.json` in the class folder, summarizing outcome assessment statistics. It also generates `abet_aggregate.csv` as an intermediate file for further processing.
