# Task Master AI System Prompts for MyShifu Project

This document contains the system prompts and instructions that Task Master AI should use when generating new tasks for the MyShifu project.

## Core System Prompt

When generating tasks for the MyShifu project, always include the following context and requirements:

### Project Context
```
MyShifu is an AI-powered learning companion built with:
- Next.js 15.3.3 + React 19
- Supabase database with RLS policies
- Claude 3.5 Sonnet AI integration
- Pinecone vector database (planned)
- TypeScript with strict mode
- Jest testing framework
- 4-persona development approach (Larry, Carol, Dave, Sam)
```

### Mandatory Quality Requirements

Every generated task and subtask MUST include these quality gates:

```
QUALITY GATES (ALL MUST PASS BEFORE COMPLETION):
1. Test Assessment: Evaluate if new code needs tests - create if required
2. Type Checking: pnpm type-check must pass with 0 errors
3. Linting: pnpm lint must pass with 0 errors/warnings
4. Testing: pnpm test must pass with all tests green
5. Build: pnpm build must complete successfully

CODE STANDARDS:
- NO 'any' types - use proper TypeScript interfaces/generics
- Explicit return types for all functions
- Proper error handling with try-catch blocks
- JSDoc comments for public APIs
- Input validation for all parameters

COMPLETION CHECKLIST:
□ Functionality implemented and working
□ Tests created (if applicable)
□ pnpm type-check passes (0 errors)
□ pnpm lint passes (0 errors/warnings)
□ pnpm test passes (all green)
□ pnpm build succeeds
□ No 'any' types used
□ Error handling implemented
□ JSDoc documentation added
□ Project conventions followed
```

## Task Generation Guidelines

### When Creating New Tasks:
1. **Always assess testing needs** - Include specific testing requirements
2. **Include quality gates** - Every task must reference the QA protocol
3. **Specify component type** - Database helper, API route, component, utility, etc.
4. **Define completion criteria** - Explicit checklist including all quality gates
5. **Consider dependencies** - Link to prerequisite tasks appropriately

### Test Strategy by Component Type:
- **Database helpers**: Mock + live integration tests required
- **API routes**: Request/response validation + error handling tests  
- **React components**: Render + interaction + accessibility tests
- **Utility functions**: Pure function + edge case coverage
- **Classes/Services**: Constructor + method + state management tests

### Standard Task Structure:
```
# Task Title
Description of what needs to be implemented.

## Implementation Details
Specific technical requirements and approach.

## Test Strategy  
- Unit tests for [specific functions/methods]
- Integration tests for [specific interactions]
- Edge cases: [list specific scenarios]

## Quality Gates
All standard quality gates must pass before completion:
- Test assessment and creation ✓
- Type checking (0 errors) ✓
- Linting (0 errors/warnings) ✓  
- All tests passing ✓
- Build successful ✓

## Completion Criteria
[Specific criteria with quality gate checklist]
```

## PRD Processing Instructions

When processing Product Requirements Documents (PRDs):

### Extract These Elements:
1. **Core functionality** - Break into atomic tasks
2. **Dependencies** - Identify prerequisite relationships
3. **Technical components** - Database, API, UI, utilities
4. **Testing scope** - Determine test coverage needs
5. **Quality requirements** - Apply standard QA protocol

### Task Breakdown Strategy:
1. **Foundation first** - Database schema, core utilities
2. **API layer** - Backend services and routes
3. **UI components** - Frontend implementation
4. **Integration** - End-to-end functionality
5. **Testing & QA** - Comprehensive validation

### Always Include:
- Quality gate requirements in every task
- Testing strategy appropriate to component type
- Specific completion criteria with QA checklist
- Project context and architectural constraints

## Subtask Generation

### Subtask Standards:
- Each subtask should be completable in 1-4 hours
- Include specific quality gate requirements
- Define testing needs clearly
- Specify expected deliverables
- Include relevant project context

### Subtask Quality Requirements:
```
Every subtask involving code must include:
- Test assessment: "Does this need tests?" 
- Quality gates: All 5 gates must pass
- Completion criteria: Specific checklist
- Project context: MyShifu-specific requirements
```

## Error Handling Instructions

### When Tasks Don't Meet Standards:
Tasks are considered INCOMPLETE if they lack:
- Quality gate requirements
- Testing strategy (when applicable)
- Completion criteria checklist
- Proper TypeScript standards
- Project context awareness

### Automatic Regeneration Triggers:
Regenerate tasks that don't include:
- QA protocol references
- Testing requirements for code tasks
- Completion checklist with quality gates
- Component-appropriate testing strategy

## Integration with Development Workflow

### Commands to Reference:
```bash
pnpm type-check    # TypeScript validation
pnpm lint          # Code style checking
pnpm test          # Test execution
pnpm build         # Production build
pnpm ci            # Full quality pipeline
```

### MyShifu-Specific Context:
- 4-persona seed data system
- Context compression at 3500+ tokens
- Sequential memory architecture
- Sub-500ms performance targets
- Supabase RLS policy compliance

## Conclusion

These system prompts ensure that every task generated by Task Master AI for the MyShifu project includes comprehensive quality requirements, appropriate testing strategies, and specific completion criteria that align with project standards.

Tasks without these elements should be considered incomplete and regenerated with proper quality gate integration.