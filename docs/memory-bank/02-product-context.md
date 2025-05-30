# Product Context: Grade Book

## Why This Project Exists

### The Problem

University instructors face a complex, time-consuming grade management workflow that involves multiple disconnected systems:

1. **Gradescope**: Where assignments are graded and raw scores are stored
2. **Canvas LMS**: Where students access course materials and view grades
3. **SIS (Student Information System)**: Where official final grades are recorded

Each system has different data formats, student identification methods, and import/export requirements. Manually transferring grades between these systems is:

- **Error-prone**: Manual data entry leads to transcription mistakes
- **Time-consuming**: Hours spent on repetitive data manipulation tasks
- **Inconsistent**: Different instructors use different approaches, leading to workflow variations
- **Difficult to audit**: No clear trail of grade calculations and adjustments

### The Solution

The Grade Book automates the entire grade management pipeline, providing:

- **Automated data transformation** between system formats
- **Configurable grade aggregation** with custom weights and categories
- **Error detection and reporting** for data inconsistencies
- **Audit trail** through generated files and documentation
- **Statistical analysis** for grade distribution insights

## Problems It Solves

### For Instructors

1. **Eliminates Manual Data Entry**: No more copying grades between systems
2. **Reduces Calculation Errors**: Automated weighted grade calculations
3. **Saves Time**: What took hours now takes minutes
4. **Provides Transparency**: Clear documentation of grade calculations
5. **Enables Consistency**: Standardized workflow across different courses
6. **Supports Flexibility**: Easy adjustments for extra credit, exemptions, etc.

### For Students

1. **Faster Grade Updates**: Automated posting means quicker feedback
2. **Detailed Grade Reports**: Individual breakdowns available on request
3. **Consistent Grading**: Standardized calculations across all students
4. **Transparency**: Clear understanding of how final grades are calculated

### For Academic Administration

1. **Audit Trail**: Complete documentation of grade processing
2. **Standardization**: Consistent grading practices across instructors
3. **Error Reduction**: Fewer grade disputes due to calculation errors
4. **Efficiency**: Instructors can focus on teaching rather than administrative tasks

## How It Should Work

### User Experience Goals

#### Primary Workflow (Happy Path)

1. **Setup**: Instructor creates class folder and configuration file (one-time setup)
2. **Data Export**: Download raw grades from Gradescope (1 click)
3. **Processing**: Run automated scripts to process and aggregate grades (1 command each)
4. **Review**: Examine generated statistics and error reports
5. **Adjustments**: Make any necessary grade adjustments using provided scripts
6. **Export**: Generate Canvas and SIS import files (1 command each)
7. **Import**: Upload files to Canvas and SIS (manual step)

#### Key Principles

- **Minimal Manual Steps**: Automate everything that can be automated
- **Clear Error Reporting**: When something goes wrong, make it obvious what and why
- **Flexible Configuration**: Support different course structures without code changes
- **Safe Operations**: Never modify original data files
- **Transparent Calculations**: Every grade calculation should be traceable and verifiable

### Expected User Journey

#### First-Time Setup (Per Course)

1. Create course folder in `data/` directory
2. Set environment variable for current class
3. Create course configuration file with weights and categories
4. Export initial data from Gradescope
5. Run processing pipeline
6. Review and adjust configuration as needed

#### Regular Use (Per Grading Period)

1. Export updated grades from Gradescope
2. Run processing and aggregation scripts
3. Review error reports and statistics
4. Make any necessary adjustments
5. Export to Canvas and SIS
6. Upload to external systems

#### Advanced Use Cases

- **Grade Adjustments**: Custom scripts for extra credit, exemptions, etc.
- **Individual Reports**: Generate detailed breakdowns for student inquiries
- **Statistical Analysis**: Create grade distribution charts and metrics
- **Multi-Section Handling**: Process courses with multiple sections (future roadmap)

### Success Metrics

#### Efficiency Gains

- **Time Reduction**: 90%+ reduction in grade processing time
- **Error Reduction**: Near-zero calculation errors
- **Consistency**: Standardized workflow across all courses

#### User Satisfaction

- **Ease of Use**: Instructors can complete workflow with minimal training
- **Reliability**: Consistent results across different course configurations
- **Transparency**: Students and administrators can understand grade calculations

#### Technical Performance

- **Data Integrity**: Zero data loss during processing
- **Error Handling**: Clear reporting of any data inconsistencies
- **Maintainability**: Easy to adapt to new course structures or system changes
