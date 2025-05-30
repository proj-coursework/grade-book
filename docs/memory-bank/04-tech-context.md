# Tech Context: Grade Book

## Technology Stack

### Core Technologies

- **Runtime**: Node.js (ES Modules)
- **Language**: TypeScript 5.0+
- **Package Manager**: pnpm (with workspace support)
- **Build Tool**: tsx (TypeScript execution) + tsc (type checking)

### Key Dependencies

#### Data Processing

- **csv-parse** (^5.6.0): CSV parsing with header support
- **csv-stringify** (^6.5.2): CSV generation with proper formatting
- **xlsx** (^0.18.5): Excel file generation for SIS exports

#### Visualization

- **chart.js** (^4.4.9): Chart generation engine
- **chartjs-node-canvas** (^5.0.0): Server-side chart rendering
- **chartjs-plugin-datalabels** (^2.2.0): Chart data labels

#### Configuration & Environment

- **dotenv** (^16.5.0): Environment variable management

#### Development Tools

- **prettier** (^3.5.3): Code formatting
- **@types/node** (^22.15.3): Node.js type definitions

## Development Setup

### Project Structure

```plaintext
grade-book/
├── src/                    # Source code
│   ├── process.ts         # Gradescope data processing
│   ├── aggregate.ts       # Grade aggregation
│   ├── canvas.ts          # Canvas export generation
│   ├── sis.ts            # SIS export generation
│   ├── report.ts         # Individual reports
│   ├── chart.ts          # Grade distribution charts
│   └── config.ts         # Environment configuration
├── data/                  # Grade data (gitignored)
│   └── .gitignore        # Prevents grade data commits
├── docs/                  # Documentation
│   ├── memory-bank/      # AI context documentation
│   └── guides/           # User guides
├── examples/             # Example scripts
└── package.json          # Project configuration
```

### Environment Configuration

#### Required Environment Variables

```bash
# .env file
CURRENT_CLASS=spring2025_en_601_421  # Current class folder name
```

#### Class-Specific Configuration

Each class requires a `config.ts` file in `data/${CURRENT_CLASS}/`:

```typescript
export const CLASS_CODE: string = "EN.601.421";
export const CLASS_NAME: string = "Object-Oriented Software Engineering";
export const CLASS_SEMESTER: string = "Spring 2025";

export type COURSE_WORK = {
  name: string;
  assignments: string[];
  weight: number;
  max_points?: number;
};

export const CLASS_COURSE_WORK: COURSE_WORK[] = [
  // Course work definitions
];

export const CLASS_GRADE_CUTOFFS = {
  "A+": 97,
  A: 93,
  "A-": 90,
  "B+": 87,
  B: 83,
  "B-": 80,
  "C+": 77,
  C: 73,
  "C-": 70,
  "D+": 67,
  D: 63,
  F: 0,
};
```

## Build Processes

### Available Scripts

```json
{
  "process": "tsx --no-warnings ./src/process.ts",
  "aggregate": "tsx --no-warnings ./src/aggregate.ts",
  "canvas": "tsx --no-warnings ./src/canvas.ts",
  "sis": "tsx --no-warnings ./src/sis.ts",
  "chart": "tsx --no-warnings ./src/chart.ts",
  "build": "tsc",
  "type-check": "tsc --noEmit",
  "format": "prettier --write ."
}
```

### Execution Pattern

```bash
# Standard workflow
pnpm run process    # Process Gradescope data
pnpm run aggregate  # Aggregate grades
pnpm run canvas     # Generate Canvas import
pnpm run sis        # Generate SIS import
pnpm run chart      # Generate grade distribution

# Development
pnpm run type-check # Verify TypeScript
pnpm run format     # Format code
```

## Technical Constraints

### File Format Requirements

#### Input Formats

- **Gradescope**: CSV with specific column structure
  - First 5 columns: First Name, Last Name, SID, Email, Sections
  - Assignment columns: Score, Max Points, Submission Time, Lateness
- **Canvas**: CSV export with student identification columns
  - Student, ID, SIS User ID, SIS Login ID, Section

#### Output Formats

- **Canvas Import**: CSV matching Canvas export structure
- **SIS Import**: Excel (.xlsx) with ID and Grade columns
- **Reports**: Markdown (.md) files
- **Charts**: PNG images

### System Integration Constraints

#### External System Dependencies

- **Gradescope**: Manual CSV export required
- **Canvas**: Manual export/import process
- **SIS**: Manual Excel file upload

#### Data Matching Requirements

- **Student Identification**: Must match SID between systems
- **Assignment Names**: Must match between Gradescope and config
- **Grade Formats**: Must conform to system-specific requirements

## Tool Usage Patterns

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Package Management

- **pnpm**: Chosen for workspace support and efficiency
- **Workspace Configuration**: `pnpm-workspace.yaml` for potential multi-package setup
- **Lock File**: `pnpm-lock.yaml` ensures consistent dependencies

### Code Quality Tools

#### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2
}
```

#### Git Configuration

- **Ignored Files**: Data folder, node_modules, build artifacts
- **Tracked Files**: Source code, documentation, configuration

## Development Dependencies

### Type Definitions

- **@types/chart.js**: Chart.js TypeScript support
- **@types/node**: Node.js API types

### Build Tools

- **tsx**: Direct TypeScript execution without compilation step
- **typescript**: Type checking and compilation

### Runtime Dependencies

- **Node.js**: ES Module support required
- **File System**: Local file operations for data processing

## Performance Considerations

### Memory Usage

- **CSV Processing**: Loads entire files into memory
- **Chart Generation**: Canvas rendering requires memory allocation
- **Excel Generation**: XLSX library memory overhead

### Processing Speed

- **File I/O**: Synchronous operations for simplicity
- **Data Transformation**: In-memory processing for small datasets
- **Chart Rendering**: Server-side canvas generation

### Scalability Limits

- **Student Count**: Tested with ~100-200 students per class
- **Assignment Count**: No specific limits, but affects memory usage
- **File Sizes**: CSV files typically <1MB, manageable in memory

## Security Considerations

### Data Protection

- **Local Processing**: All data remains on instructor's machine
- **Git Exclusion**: Grade data never committed to version control
- **File Permissions**: Standard file system permissions apply

### Environment Variables

- **Sensitive Data**: No passwords or API keys required
- **Configuration**: Only class folder names in environment

## Future Technical Considerations

### Potential Improvements

- **Streaming CSV Processing**: For larger datasets
- **Database Integration**: For persistent storage
- **Web Interface**: Replace command-line scripts
- **API Integration**: Direct system connections

### Technology Evolution

- **Node.js Updates**: ES Module support continues improving
- **TypeScript Evolution**: Type system enhancements
- **Chart.js Updates**: Visualization capabilities expansion
- **External System APIs**: Potential for direct integration
