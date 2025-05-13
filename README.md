# Grade Book

This codebase contains the scripts I use to aggregate my students' grades and post it on Canvas and Students Information System (SIS).

## How to use it?

### Project Dependencies

You need to install [Git](https://git-scm.com/downloads) and [Node.js](https://nodejs.org/en/download/) to use this project.

Clone this repository, open a terminal, and navigate to the project's root directory. Then, install the project dependencies by running the following command:

```bash
pnpm install
```

To process the grades and prepare the files for Canvas and SIS, you must do the following: (This is the short version. For a more detailed explanation, skip to the [How does it work?](#how-does-it-work) section.)

1. Create a subfolder in the `data` folder with the name of the class you want to process. For example, if you want to process the grades for EN.601.421 Object-Oriented Software Engineering (Spring 2025), you would create a folder called `spring2025_en_601_421`.
2. Update the `src/config.ts` file to set `CURRENT_CLASS` to the name of the class you created in step 1. For example, if you created a folder called `spring2025_en_601_421`, you would set `CURRENT_CLASS` to `spring2025_en_601_421`.
3. Export the Gradescope raw data from its website and save it as `gradescope_raw.csv` in the class folder.
4. Run the `process` script (`pnpm run process`) to process the gradescope data.
5. Create a `config.ts` file in the class folder. This file will contain the configuration for the class. See the [The Class Config File](#the-class-config-file) section for more details.
6. Run the `aggregate` script (`pnpm run aggregate`) to aggregate the processed data.
7. Export the Canvas gradebook and save it as `canvas_export.csv` in the class folder.
8. Run the `canvas` script (`pnpm run canvas`) to prepare the grades for Canvas.
9. Run the `sis` script (`pnpm run sis`) to prepare the grades for SIS.
10. Post the grades to Canvas and SIS.

## How does it work?

### Data Folder and Config File

The project contains a `data` folder with a `.gitignore` file that prevents grades from being committed to the repository.

Inside this folder, grades are organized in subfolders by class. For instance, grades for EN.601.421 Object-Oriented Software Engineering (Spring 2025) are stored in `data/spring2025_en_601_421`.

The `src/config.ts` file exports a `CURRENT_CLASS` variable that determines which grades to process. To process grades for a specific class, set this variable to match the corresponding subfolder name. For example, to process EN.601.421's Spring 2025 grades, set `CURRENT_CLASS` to `spring2025_en_601_421`.

### Gradescope Raw Data

To download student grades from Gradescope:

- Go to [gradescope.com](http://gradescope.com)
- Navigate to your course
- Select the Assignments tab
- Click the "Download Grades" button at the bottom of the page
- Choose "Download CSV" as the file type
- Save the CSV file as `gradescope_raw.csv` inside the `data/spring2025_en_601_421` folder (or the folder for the class you are interested in)

#### How is the `gradescope_raw.csv` file structured?

- Each row represents one student's data, with the first row being the header.
- The first 5 columns contain: First Name, Last Name, SID, Email, and Sections.
- The remaining columns show assignment data. For each assignment (e.g., "Assignment 1"), there are 4 columns:
    - `Assignment 1` - The student's actual score
    - `Assignment 1 - Max Points` - The maximum possible points (usually the same for all students)
    - `Assignment 1 - Submission Time` - When the student submitted the assignment
    - `Assignment 1 - Lateness (H:M:S)` - How late the submission was
- The final column, `Total Lateness (H:M:S)`, shows the sum of all late submissions for each student.

### Processing the Gradescope Raw Data

> [!NOTE]
> This step is implemented in the `src/process.ts` file. To run it, execute the following command: `npm run process`.

The `gradescope_raw.csv` file needs to be processed into two files: `gradescope_processed.csv` for the processed data and `gradescope_meta.json` for assignment metadata.

#### The `gradescope_meta.json` file

This file will store each assignment's name and maximum points in the following format:

```json
{
  "counts": {
    "assignments": 10,
    "students": 100
  },
  "assignments": [
    {
      "name": "Assignment 1",
      "max_points": 10
    },
    {
      "name": "Assignment 2",
      "max_points": 10
    },
    ...
  ]
}
```

> [!TIP]
> The assignments array will be sorted alphabetically by assignment name to make it easier to find the assignment you need.

#### The `gradescope_processed.csv` file

The `gradescope_raw.csv` file will be simplified as follows:

- Keep the first 5 columns: First Name, Last Name, SID, Email, and Sections.
- For each assignment, retain only the student's score. Remove the following columns: `- Max Points`, `- Submission Time`, and `- Lateness (H:M:S)`.
- Remove the `Total Lateness (H:M:S)` column.

> [!TIP]
> The assignment columns will be sorted alphabetically by assignment name to make it easier to find the assignment you need. Moreover, missing assignments will be filled with `0`s.

#### Extra Processing

You can adjust individual student scores for extra credit, exemptions, etc.

To make these adjustments, either edit the `gradescope_processed.csv` file directly or create a custom script. Run your script with `npx tsx path/to/script.ts`. Store your scripts in the `data/${CURRENT_CLASS}/scripts` folder and document any changes in `data/${CURRENT_CLASS}/README.md` for future reference.

> [!TIP]
> Take a look at the `examples` folder for examples of extra processing scripts.

### Aggregating the Gradescope Processed Data

> [!NOTE]
> This step is implemented in the `src/aggregate.ts` file. To run it, execute the following command: `npm run aggregate`.

The `gradescope_processed.csv` file will be aggregated into two files: `grades.csv` for grade data and `metrics.json` for statistical metrics.

#### The Class Config File

Create a `config.ts` file in the `data/${CURRENT_CLASS}` folder. This file exports these configuration variables:

```tsx
// Adjust these variables to match your class
export const CLASS_CODE: string = "EN.601.421";
export const CLASS_NAME: string = "Object-Oriented Software Engineering";
export const CLASS_SEMESTER: string = "Spring 2025";

export type COURSE_WORK = {
  name: string;
  assignments: string[]; // Should be the same as the assignment names in the `gradescope_meta.json` file
  weight: number;
  max_points?: number; // If not provided, the maximum points will be the sum of all assignment maximum points
}

export const CLASS_COURSE_WORK: COURSE_WORK[] = [
  {
    name: "Homeworks",
    assignments: ["Homework 1", "Homework 2"],
    weight: 10
  },
  {
    name: "Quizzes",
    assignments: ["Quiz 1", "Quiz 2"],
    weight: 10
  },
  {
    name: "Project",
    assignments: ["Planning", "Iteration 1", "Iteration 2", "Iteration 3", "Iteration 4", "Delivery"],
    weight: 65
  },
  {
    name: "Presentation",
    assignments: ["Pitch", "Practice", "Final"],
    weight: 10
  },
  {
    name: "Classwork",
    assignments: ["Classwork 1", "Classwork 2", "Classwork 3", "Classwork 4", "Classwork 5", "Classwork 6"],
    weight: 5,
  }
];

export const CLASS_GRADE_CUTOFFS = {
  "A+": 97,
  "A": 93,
  "A-": 90,
  "B+": 87,
  "B": 83,
  "B-": 80,
  "C+": 77,
  "C": 73,
  "C-": 70,
  "D+": 67,
  "D": 63,
  "F": 0
};
```

Customize these values for your specific class.

#### The `grades.csv` file

The `grades.csv` file will contain:

- The five standard columns: First Name, Last Name, SID, Email, and Sections.
- For each assignment category in `CLASS_COURSE_WORK`, one column containing the student's weighted score, calculated by:
    - Adding up all assignment scores in the category
    - Adding up all maximum possible points in the category
    - Converting to a percentage (total score ÷ total possible points)
    - Multiplying by the category weight to get the final category score
    - The resulting file will have five category columns: `Homeworks`, `Quizzes`, `Project`, `Presentation`, and `Classwork`
- A final score column (sum of all category scores)
- A letter grade column (determined using `CLASS_GRADE_CUTOFFS`)

#### The `metrics.json` file

This file will contain:

- Total student enrollment
- Statistical measures (mean, median, standard deviation) for each assignment category
- Statistical measures (mean, median, standard deviation) for final scores
- Grade distribution data showing the count and percentage of students for each letter grade

#### Further Adjustments

You can modify individual student scores, including assignment category scores, final scores, and letter grades, by editing the `grades.csv` file directly. Be sure to document all changes in `data/${CURRENT_CLASS}/README.md` for tracking purposes. This can also be done by running a custom script.

> [!TIP]
> Take a look at the `examples` folder for examples of further adjustments.

### Posting the Grades to Canvas

We need to prepare a CSV file that can be imported into Canvas. To do this, we need to export the gradebook from Canvas to be able to match students between the two systems.

- Go to [Canvas](https://jhu.instructure.com/courses)
- Navigate to the course you want to post the grades to
- On the left sidebar, select "Grades"
- Select "Export" button on the top right
- Select "Export Entire Gradebook"
- Rename the file to `canvas_export.csv` and save it to the `data/${CURRENT_CLASS}` folder

#### The `canvas_export.csv` file

This file contains:

- Five primary columns: Student, ID, SIS User ID, SIS Login ID, and Section
- Additional columns representing assignment scores and total scores (ignore these)
- A header row as the first row
- A special second row beginning with "Points Possible," showing maximum points for each assignment
- Individual student scores in subsequent rows

#### The `canvas_import.csv` file

> [!NOTE]
> This step is implemented in the `src/canvas.ts` file. To run it, execute the following command: `npm run canvas`.

We'll transform `canvas_export.csv` into `canvas_import.csv`.

- The same five primary columns: Student, ID, SIS User ID, SIS Login ID, and Section
- Assignment category columns matching `CLASS_COURSE_WORK`
- A header row
- Maximum points in the second row (matching `canvas_export.csv` format)
- Student scores matched by "SIS User ID" from `canvas_export.csv` to "SID" in `grades.csv`

Create a `canvas_errors.json` file to track unmatched students between `grades.csv` and `canvas_export.csv`. Here's the format:

```json
{
  "missing_from_grades": [
    {
      "Student": "Student 1",
      "ID": "1234567890",
      "SIS User ID": "SIS User ID 1",
      "SIS Login ID": "SIS Login ID 1",
      "Section": "Section 1"
    },
    ...
  ],
  "missing_from_canvas": [
    {
      "First Name": "First Name 1",
      "Last Name": "Last Name 1",
      "SID": "SID 1",
      "Email": "Email 1",
      "Sections": "Section 1"
    },
    ...
  ]
}
```

Resolve any mismatches manually.

#### Importing Grades to Canvas

- Go to [Canvas](https://jhu.instructure.com/courses)
- Navigate to the course you want to post the grades to
- On the left sidebar, select "Grades"
- Select "Import" button on the top right
- Select "Import Grades"
- Select the `canvas_import.csv` file
- Select "Upload Data"
- Follow the prompts in the dialog box to complete the process. The prompt helps you for each assignment to (1) add it as a new one, or (2) map it to an existing one, or (3) ignore it.

To make grades visible to students, go to "Settings," then the "Navigation" tab. Ensure "Grades" is set to "Enabled" in the sidebar. Remember to save your changes at the bottom of the page.

If you want students to see their grades, you need to make sure that "Grades" are visible to students. To that end, you need to go to the "Settings" page, and then to "Navigation" tab, and make sure that "Grades" are "Enabled" so that they appear in the sidebar. Don't forget to click on the "Save" button at the bottom of the page.

### Posting the Grades to SIS

> [!NOTE]
> This step is implemented in the `src/sis.ts` file. To run it, execute the following command: `pnpm run sis`. 

To upload grades to SIS, we'll transform `grades.csv` into `sis_import.xlsx`. This file requires only two columns: `ID` and `Grade`.

- The `ID` column contains the student's SID
- The `Grade` column contains the student's letter grade

To upload the file, navigate to SIS, select your course, and click "Upload: Grade via Excel Spreadsheet" in the top right. Select `sis_import.xlsx` and follow the dialog prompts to complete the upload.

## Reporting

I frequently need to generate grade reports for students when they are concerned about their grades.

To generate a report, open the `src/report.ts` file, set the `CURRENT_CLASS` and `CURRENT_STUDENT_EMAIL` variables, and run `npx tsx src/report.ts`. This creates a markdown file in the `data/${CURRENT_CLASS}/reports` folder named `${first_name}_${last_name}_${email}.md`. The report provides a detailed breakdown of grades at three levels:

- Final score and letter grade
- Scores for each assignment category
- Scores for each assignment

The report includes assignment category weights and maximum points for each assignment, displaying scores in formats like 85/100 or 12/20.

## Generating Grade Distribution Charts

You can generate a grade distribution bar chart as a PNG image for the current class based on the corresponding `metrics.json` file.

> [!NOTE]
> This feature is implemented in the `src/chart.ts` file. To run it, execute the following command: `pnpm run chart`. 

This will create a `grade_distribution.png` file in the `data/${CURRENT_CLASS}` folder, visualizing the grade distribution for the class.

You can embed this PNG in your reports or share it with students as needed.

> [!TIP]
> You can set the `SHOW_CUTOFF_LABELS` flag to `false` to hide the grade cutoff labels, among other configurable flags.
