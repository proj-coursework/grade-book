import { select, confirm, input } from "@inquirer/prompts";
import chalk from "chalk";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STEPS = {
  PROCESS: "process",
  AGGREGATE: "aggregate",
  CANVAS: "canvas",
  SIS: "sis",
  CHART: "chart",
  REPORT: "report",
  EXIT: "exit",
};

function displayHeader() {
  console.clear();
  console.log(chalk.cyan.bold("\n╔════════════════════════════════════════════════════════╗"));
  console.log(chalk.cyan.bold("║           📚 Grade Book Management System             ║"));
  console.log(chalk.cyan.bold("╚════════════════════════════════════════════════════════╝\n"));
}

function getCurrentClass(): string | null {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    return null;
  }
  const envContent = fs.readFileSync(envPath, "utf8");
  const match = envContent.match(/CURRENT_CLASS=(.+)/);
  return match ? match[1].trim() : null;
}

function checkFileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function getDataDir(className: string): string {
  return path.join(__dirname, "..", "data", className);
}

async function runScript(scriptName: string, command: string) {
  console.log(chalk.yellow(`\n▶ Running ${scriptName}...\n`));
  try {
    execSync(command, { stdio: "inherit", cwd: path.join(__dirname, "..") });
    console.log(chalk.green(`\n✓ ${scriptName} completed successfully!\n`));
    return true;
  } catch (error) {
    console.log(chalk.red(`\n✗ ${scriptName} failed!\n`));
    return false;
  }
}

async function processGradescope(currentClass: string) {
  const dataDir = getDataDir(currentClass);
  const rawFile = path.join(dataDir, "gradescope_raw.csv");

  if (!checkFileExists(rawFile)) {
    console.log(chalk.red(`\n✗ Missing file: gradescope_raw.csv`));
    console.log(chalk.yellow(`  Please export grades from Gradescope and save as:\n  ${rawFile}\n`));
    return false;
  }

  const shouldRun = await confirm({
    message: "Process Gradescope data?",
    default: true,
  });

  if (shouldRun) {
    return await runScript("Process", "pnpm run process");
  }
  return false;
}

async function aggregateGrades(currentClass: string) {
  const dataDir = getDataDir(currentClass);
  const processedFile = path.join(dataDir, "gradescope_processed.csv");
  const configFile = path.join(dataDir, "config.ts");

  if (!checkFileExists(processedFile)) {
    console.log(chalk.red(`\n✗ Missing file: gradescope_processed.csv`));
    console.log(chalk.yellow(`  Run the 'Process Gradescope Data' step first.\n`));
    return false;
  }

  if (!checkFileExists(configFile)) {
    console.log(chalk.red(`\n✗ Missing file: config.ts`));
    console.log(chalk.yellow(`  Please create a config.ts file in:\n  ${dataDir}\n`));
    return false;
  }

  const shouldRun = await confirm({
    message: "Aggregate grades?",
    default: true,
  });

  if (shouldRun) {
    return await runScript("Aggregate", "pnpm run aggregate");
  }
  return false;
}

async function prepareCanvas(currentClass: string) {
  const dataDir = getDataDir(currentClass);
  const gradesFile = path.join(dataDir, "grades.csv");
  const canvasExportFile = path.join(dataDir, "canvas_export.csv");

  if (!checkFileExists(gradesFile)) {
    console.log(chalk.red(`\n✗ Missing file: grades.csv`));
    console.log(chalk.yellow(`  Run the 'Aggregate Grades' step first.\n`));
    return false;
  }

  if (!checkFileExists(canvasExportFile)) {
    console.log(chalk.red(`\n✗ Missing file: canvas_export.csv`));
    console.log(chalk.yellow(`  Please export gradebook from Canvas and save as:\n  ${canvasExportFile}\n`));
    return false;
  }

  const shouldRun = await confirm({
    message: "Prepare Canvas import file?",
    default: true,
  });

  if (shouldRun) {
    return await runScript("Canvas", "pnpm run canvas");
  }
  return false;
}

async function prepareSIS(currentClass: string) {
  const dataDir = getDataDir(currentClass);
  const gradesFile = path.join(dataDir, "grades.csv");

  if (!checkFileExists(gradesFile)) {
    console.log(chalk.red(`\n✗ Missing file: grades.csv`));
    console.log(chalk.yellow(`  Run the 'Aggregate Grades' step first.\n`));
    return false;
  }

  const shouldRun = await confirm({
    message: "Prepare SIS import file?",
    default: true,
  });

  if (shouldRun) {
    return await runScript("SIS", "pnpm run sis");
  }
  return false;
}

async function generateChart(currentClass: string) {
  const dataDir = getDataDir(currentClass);
  const metricsFile = path.join(dataDir, "metrics.json");

  if (!checkFileExists(metricsFile)) {
    console.log(chalk.red(`\n✗ Missing file: metrics.json`));
    console.log(chalk.yellow(`  Run the 'Aggregate Grades' step first.\n`));
    return false;
  }

  const shouldRun = await confirm({
    message: "Generate grade distribution chart?",
    default: true,
  });

  if (shouldRun) {
    return await runScript("Chart", "pnpm run chart");
  }
  return false;
}

async function generateReport() {
  const email = await input({
    message: "Enter student email:",
    validate: (value) => {
      if (!value || !value.includes("@")) {
        return "Please enter a valid email address";
      }
      return true;
    },
  });

  console.log(chalk.yellow(`\n▶ Generating report for ${email}...\n`));
  console.log(chalk.yellow(`  Note: You may need to update CURRENT_STUDENT_EMAIL in src/report.ts\n`));
  
  const shouldContinue = await confirm({
    message: "Continue with report generation?",
    default: false,
  });

  if (shouldContinue) {
    return await runScript("Report", "pnpm run report");
  }
  return false;
}

async function showWorkflowStatus(currentClass: string) {
  const dataDir = getDataDir(currentClass);
  
  console.log(chalk.cyan("\n📋 Current Workflow Status:\n"));
  
  const checks = [
    { file: "gradescope_raw.csv", label: "Gradescope Raw Data" },
    { file: "gradescope_processed.csv", label: "Processed Data" },
    { file: "config.ts", label: "Class Configuration" },
    { file: "grades.csv", label: "Aggregated Grades" },
    { file: "metrics.json", label: "Grade Metrics" },
    { file: "canvas_export.csv", label: "Canvas Export" },
    { file: "canvas_import.csv", label: "Canvas Import Ready" },
    { file: "sis_import.xlsx", label: "SIS Import Ready" },
    { file: "grade_distribution.png", label: "Grade Distribution Chart" },
  ];

  for (const check of checks) {
    const exists = checkFileExists(path.join(dataDir, check.file));
    const icon = exists ? chalk.green("✓") : chalk.gray("○");
    const status = exists ? chalk.green("Ready") : chalk.gray("Missing");
    console.log(`  ${icon} ${check.label.padEnd(30)} ${status}`);
  }
  console.log();
}

async function main() {
  while (true) {
    displayHeader();

    const currentClass = getCurrentClass();
    
    if (!currentClass) {
      console.log(chalk.red("⚠️  No CURRENT_CLASS set in .env file\n"));
      console.log(chalk.yellow("Please create a .env file and set CURRENT_CLASS variable.\n"));
      process.exit(1);
    }

    console.log(chalk.gray(`Current Class: ${chalk.white(currentClass)}\n`));

    await showWorkflowStatus(currentClass);

    const action = await select({
      message: "What would you like to do?",
      choices: [
        { name: "🔄 Process Gradescope Data", value: STEPS.PROCESS },
        { name: "📊 Aggregate Grades", value: STEPS.AGGREGATE },
        { name: "🎨 Prepare Canvas Import", value: STEPS.CANVAS },
        { name: "🏫 Prepare SIS Import", value: STEPS.SIS },
        { name: "📈 Generate Grade Distribution Chart", value: STEPS.CHART },
        { name: "📄 Generate Student Report", value: STEPS.REPORT },
        { name: "❌ Exit", value: STEPS.EXIT },
      ],
    });

    if (action === STEPS.EXIT) {
      console.log(chalk.cyan("\n👋 Goodbye!\n"));
      process.exit(0);
    }

    let success = false;
    switch (action) {
      case STEPS.PROCESS:
        success = await processGradescope(currentClass);
        break;
      case STEPS.AGGREGATE:
        success = await aggregateGrades(currentClass);
        break;
      case STEPS.CANVAS:
        success = await prepareCanvas(currentClass);
        break;
      case STEPS.SIS:
        success = await prepareSIS(currentClass);
        break;
      case STEPS.CHART:
        success = await generateChart(currentClass);
        break;
      case STEPS.REPORT:
        success = await generateReport();
        break;
    }

    if (success) {
      const continueWorking = await confirm({
        message: "Continue with another task?",
        default: true,
      });
      if (!continueWorking) {
        console.log(chalk.cyan("\n👋 Goodbye!\n"));
        process.exit(0);
      }
    } else {
      await confirm({
        message: "Press Enter to continue...",
        default: true,
      });
    }
  }
}

main().catch((error) => {
  if (error.name === "ExitPromptError") {
    console.log(chalk.cyan("\n👋 Goodbye!\n"));
    process.exit(0);
  }
  console.error(chalk.red("\n✗ An error occurred:"), error);
  process.exit(1);
});
