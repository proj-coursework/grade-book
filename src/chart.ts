import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import * as fs from "fs";
import * as path from "path";
import { CURRENT_CLASS } from "./config";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Chart, registerables } from "chart.js";
import { fileURLToPath } from "url";

// ---- CONFIGURABLE FLAGS ----
// Label mode: "cutoffs" shows grade cutoff thresholds (e.g., ≥97%), "counts" shows number of students, "none" hides labels
const LABEL_MODE: "cutoffs" | "counts" | "none" = "counts";
const BG_COLOR = "white"; // Set to 'white' for white background, or 'transparent' for transparent background
const WIDTH = 800; // Chart width in pixels
const HEIGHT = 600; // Chart height in pixels
const RESOLUTION = 2; // Chart resolution (pixel ratio)
// ----------------------------

// Register Chart.js components and plugins
Chart.register(...registerables, ChartDataLabels);

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to metrics.json
const metricsPath = path.join(
  __dirname,
  "..",
  "data",
  CURRENT_CLASS,
  "metrics.json"
);
const metrics = JSON.parse(fs.readFileSync(metricsPath, "utf-8"));

// Path to class config for cutoffs
const classConfigPath = path.join(
  __dirname,
  "..",
  "data",
  CURRENT_CLASS,
  "config.ts"
);

// Chart output path
const outputPath = path.join(
  __dirname,
  "..",
  "data",
  CURRENT_CLASS,
  "grade_distribution.png"
);

// Chart config
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width: WIDTH,
  height: HEIGHT,
  backgroundColour: BG_COLOR,
  plugins: { modern: ["chartjs-plugin-datalabels"] },
  chartCallback: undefined,
  type: "image/png",
  devicePixelRatio: RESOLUTION,
});

const grades = Object.keys(metrics.grade_distribution);
const counts = grades.map((g) => metrics.grade_distribution[g].count);

async function main() {
  // Dynamically import CLASS_GRADE_CUTOFFS from class config
  const { CLASS_GRADE_CUTOFFS } = await import(
    classConfigPath + `?ts=${Date.now()}`
  );
  // Format as '≥97%' for each grade
  const cutoffs = grades.map((g) =>
    CLASS_GRADE_CUTOFFS[g] !== undefined ? `≥${CLASS_GRADE_CUTOFFS[g]}%` : ""
  );

  const configuration = {
    type: "bar",
    data: {
      labels: grades,
      datasets: [
        {
          label: "Grade Distribution",
          data: counts,
          backgroundColor: "rgba(54, 162, 235, 0.5)",
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Grade Distribution",
        },
        datalabels:
          LABEL_MODE === "none"
            ? { display: false }
            : {
                anchor: "end",
                align: "end", // Place label above the bar
                formatter: (_: any, context: any) =>
                  LABEL_MODE === "cutoffs"
                    ? cutoffs[context.dataIndex]
                    : counts[context.dataIndex],
                font: { weight: "bold" },
                color: "#333",
              },
      },
    },
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration as any);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Chart saved as ${outputPath}`);

  // Print grade distribution as markdown table
  console.log("\nGrade Distribution:\n");
  console.log("| Grade | Cutoff | Count |");
  console.log("|-------|--------|-------|");
  grades.forEach((grade, index) => {
    const cutoff = CLASS_GRADE_CUTOFFS[grade] !== undefined ? `≥${CLASS_GRADE_CUTOFFS[grade]}%` : "N/A";
    console.log(`| ${grade.padEnd(5)} | ${cutoff.padEnd(6)} | ${String(counts[index]).padEnd(5)} |`);
  });
}

main();
