# Extra Processing Examples

This folder contains examples of extra processing scripts that can be run to adjust student grades. Each script addresses specific use cases that may arise during grade processing workflows.

## Available Scripts

### 1. Add Extra Attribute (Team)

**Script:** `add_team_attribute.ts`  
**Documentation:** [add_team_attribute.md](./add_team_attribute.md)

Adds team information to grade files by matching students via email. Useful for classes with team-based assignments that require team-specific analysis or reporting.

### 2. ABET Outcome Assessment

**Script:** `abet_outcome_assessment.ts`  
**Documentation:** [abet_outcome_assessment.md](./abet_outcome_assessment.md)

Generates summary statistics for ABET accreditation outcome assessment. Creates detailed reports mapping student outcomes to assignments with grade distribution analysis.

### 3. Combine Section-Specific Assignments

**Script:** `combine_sections_assignments.ts`  
**Documentation:** [combine_sections_assignments.md](./combine_sections_assignments.md)

Combines section-specific assignments into unified assignments for multi-section classes. Takes the best score among section variants for each student.

### 4. Remove Audit Students

**Script:** `remove_audit_students.ts`  
**Documentation:** [remove_audit_students.md](./remove_audit_students.md)

Removes audit students from processed grade data. Filters out students who should not be included in final grade calculations or Canvas/SIS exports.

## General Usage Pattern

All scripts follow a similar pattern:

1. **Configuration**: Edit the `CURRENT_CLASS` variable at the top of each script
2. **Setup**: Ensure required configuration files and data are in the class folder
3. **Execution**: Run with `npx tsx examples/[script-name].ts`
4. **Output**: Scripts generate processed files and detailed reports

## Integration with Main Workflow

These scripts are designed to be run at specific points in the grade processing pipeline:

- **After `process` script**: Most examples work with `gradescope_processed.csv`
- **Before `aggregate` script**: Ensure all adjustments are made before final aggregation
- **Backup creation**: Scripts create backups before making changes

## Getting Help

For detailed information about each script, including:

- Configuration requirements
- Input/output file formats
- Example transformations
- Error handling

Refer to the individual documentation files linked above.
