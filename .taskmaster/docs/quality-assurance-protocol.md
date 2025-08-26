# Quality Assurance Protocol for MyShifu Development

This document defines the mandatory quality assurance protocol that ALL development tasks must follow before completion.

## Overview

Every task or subtask that involves writing, modifying, or refactoring code must pass through a rigorous quality assurance process. This ensures code reliability, maintainability, and consistency across the entire MyShifu codebase.

## Mandatory Quality Gates

All quality gates must pass **before** marking any development task as complete:

### 1. Test Assessment & Creation
- **Evaluate test needs**: Assess whether new functions, methods, classes, or interfaces require test coverage
- **Create comprehensive tests** when needed:
  - Unit tests for individual functions/methods
  - Integration tests for module interactions  
  - Edge case testing (error conditions, boundary values)
  - Mock testing for external dependencies

### 2. Type Checking
```bash
pnpm type-check
```
- **Zero TypeScript errors** allowed
- All type issues must be resolved properly
- No suppression of type errors with `@ts-ignore` unless absolutely necessary and documented

### 3. Linting
```bash
pnpm lint
```
- **Zero linting errors or warnings** allowed
- Follow established code style guidelines
- Fix all ESLint rule violations

### 4. Test Execution
```bash
pnpm test
```
- **All tests must pass** (100% green)
- No skipped tests without documented justification
- Tests must run in both mock and live modes where applicable

### 5. Build Verification
```bash
pnpm build
```
- Build must complete successfully
- No compilation errors or warnings
- All imports and dependencies must resolve correctly

## Code Standards (Non-Negotiable)

### TypeScript Requirements
- **NO `any` types**: Use proper interfaces, generics, union types, or unknown
- **Explicit return types**: All functions must declare their return type
- **Strict type checking**: Follow TypeScript strict mode requirements
- **Type imports**: Use `import type` for type-only imports

### Documentation Requirements
- **JSDoc comments**: Required for all public APIs and complex functions
- **Parameter documentation**: Document all function parameters
- **Return value documentation**: Document what functions return
- **Example usage**: Include examples for complex APIs

### Error Handling Requirements
- **Proper error handling**: Use try-catch blocks appropriately
- **Typed errors**: Create custom error classes with proper typing
- **Error propagation**: Handle or properly propagate all errors
- **User-friendly messages**: Provide meaningful error messages

### Input Validation
- **Parameter validation**: Validate all function inputs
- **Type guards**: Use type guards for runtime type checking
- **Boundary checking**: Validate array indices, object properties
- **Sanitization**: Sanitize user inputs appropriately

## Testing Strategy by Component Type

### Database Helpers
- **Mock testing**: Use in-memory database for fast iteration
- **Live testing**: Integration tests against real Supabase
- **Edge cases**: Test error conditions, connection failures
- **Data integrity**: Verify RLS policies and data isolation

### API Routes
- **Request validation**: Test with valid/invalid payloads
- **Response format**: Verify response structure and types
- **Authentication**: Test protected routes with/without auth
- **Error handling**: Test error responses and status codes

### React Components
- **Render testing**: Verify component renders without errors
- **Props testing**: Test with various prop combinations
- **Interaction testing**: Test user interactions and events
- **Accessibility**: Verify ARIA attributes and keyboard navigation

### Utility Functions
- **Pure function testing**: Test inputs → outputs with no side effects
- **Edge cases**: Test boundary conditions and error inputs
- **Performance**: Test with large datasets where applicable
- **Type safety**: Verify TypeScript types work correctly

### Classes and Services
- **Constructor testing**: Test object initialization
- **Method testing**: Test all public methods thoroughly
- **State management**: Test state changes and consistency
- **Dependencies**: Mock external dependencies appropriately

## Task Completion Checklist

Before marking any development task as complete, verify:

```
□ New functionality implemented and working correctly
□ Tests created for new code (if applicable)
□ `pnpm type-check` passes with 0 errors
□ `pnpm lint` passes with 0 errors/warnings  
□ `pnpm test` passes with all tests green
□ `pnpm build` completes successfully
□ No `any` types used anywhere in new code
□ Proper error handling implemented throughout
□ JSDoc documentation added for public APIs
□ Code follows established project patterns
□ Input validation added where appropriate
□ Performance considerations addressed
```

## Error Resolution Protocol

When quality gates fail:

1. **Fix TypeScript errors first** - Never use `any` as a quick fix
2. **Resolve linting issues** - Follow project style guidelines exactly  
3. **Fix failing tests** - Update tests only if behavior changed intentionally
4. **Address build failures** - Resolve import/dependency issues
5. **Re-run all quality gates** - Ensure everything passes before proceeding

## Integration with Task Master

This protocol is automatically integrated into all Task Master tasks. When using Task Master:

- Each task description includes quality gate requirements
- Subtasks include specific testing and validation steps
- Completion criteria explicitly require passing all quality gates
- Updates to tasks preserve quality requirements

## Enforcement

**Tasks are considered INCOMPLETE until all quality gates pass.** 

This is non-negotiable and applies to:
- All main tasks and subtasks
- Code reviews and pull requests  
- Feature implementations
- Bug fixes and refactoring
- Performance optimizations

## Tools and Commands

### Quality Gate Commands
```bash
# Run all quality gates in sequence
pnpm ci

# Individual quality gates
pnpm type-check    # TypeScript type checking
pnpm lint          # ESLint code style checking  
pnpm test          # Jest test execution
pnpm build         # Next.js build verification
```

### Test Commands
```bash
# Mock testing (default, fast)
pnpm test
pnpm test:watch
pnpm test:coverage

# Live testing (integration)  
pnpm test:live
pnpm test:helpers:live

# Specific test suites
pnpm test:helpers      # Database helpers
pnpm test:embeddings   # Pinecone integration
```

### Development Workflow Commands
```bash
# Development with hot reload
pnpm dev

# Clean development restart
rm -rf .next/ && pnpm dev

# Full verification before commit
pnpm ci
```

## Conclusion

This quality assurance protocol ensures that MyShifu maintains high code quality, reliability, and maintainability as it grows. By following these standards consistently, we minimize bugs, improve developer experience, and create a robust foundation for advanced AI-powered learning features.

Remember: **Quality is not negotiable. Tasks are incomplete until all gates pass.**