# Project Brief: Grade Book

## Project Overview

The Grade Book is a TypeScript-based automation system designed to streamline the grade management workflow for university instructors. It processes student grades from Gradescope, aggregates them according to course-specific weightings, and prepares formatted exports for Canvas LMS and Student Information System (SIS).

## Core Requirements

### Primary Goals

1. **Automate Grade Processing**: Transform raw Gradescope exports into structured, processable data
2. **Flexible Grade Aggregation**: Support configurable assignment categories with custom weights and grading schemes
3. **Multi-Platform Export**: Generate properly formatted files for Canvas LMS and SIS import
4. **Statistical Analysis**: Provide comprehensive grade distribution metrics and visualizations
5. **Individual Reporting**: Generate detailed grade reports for individual students

### Key Functional Requirements

#### Data Processing Pipeline

- Process raw Gradescope CSV exports into clean, structured data
- Handle missing assignments, late submissions, and data inconsistencies
- Support custom post-processing scripts for grade adjustments

#### Grade Aggregation System

- Configure assignment categories with custom weights
- Calculate weighted scores across multiple assignment types
- Apply configurable grade cutoffs for letter grade assignment
- Generate statistical metrics (mean, median, standard deviation)

#### Export Capabilities

- Canvas LMS: Generate import-ready CSV with proper student matching
- SIS: Create Excel files with student IDs and letter grades
- Error tracking for unmatched students between systems

#### Reporting and Visualization

- Individual student grade reports in Markdown format
- Grade distribution charts as PNG images
- Comprehensive class statistics and metrics

### Technical Requirements

- TypeScript/Node.js environment with ES modules
- CSV parsing and Excel file generation
- Chart generation capabilities
- Environment-based configuration management
- Support for multiple class sections and semesters

## Success Criteria

1. **Accuracy**: Zero data loss during processing and export operations
2. **Reliability**: Consistent results across different class configurations
3. **Usability**: Clear documentation and straightforward workflow for instructors
4. **Flexibility**: Easy adaptation to different course structures and grading schemes
5. **Maintainability**: Well-documented code with clear separation of concerns

## Constraints and Assumptions

### Technical Constraints

- Must work with existing Gradescope, Canvas, and SIS data formats
- Limited to CSV and Excel file formats for data exchange
- Node.js/TypeScript technology stack

### Operational Constraints

- Manual data export/import steps required for external systems
- Instructor must manually resolve student matching discrepancies
- Configuration files must be created for each new class

### Assumptions

- Gradescope data structure remains consistent
- Canvas and SIS import formats are stable
- Instructors have basic command-line familiarity
- Class structures follow standard academic patterns (assignments, quizzes, projects, etc.)
