# Contributing to The-Sus-Fit

Thank you for your interest in contributing to The-Sus-Fit! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Branch Strategy](#branch-strategy)
- [Commit Message Convention](#commit-message-convention)
- [Pre-commit Checks](#pre-commit-checks)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/The-Sus-Fit-gp.git
   cd The-Sus-Fit-gp
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/Neural-Chill/The-Sus-Fit-gp.git
   ```

## Development Setup

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Git

### Local Environment Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Verify setup**:
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   ```

4. **Start development server**:
   ```bash
   pnpm dev
   ```

### IDE Setup (Cursor Recommended)

- Install Cursor IDE version 1.2.4+
- Add project rules in Cursor Settings:
  - `clean-code.mdc`
  - `code-quality.mdc`
  - `nextjs.mdc`
  - `typescript.mdc`
  - `tailwind.mdc`

## Branch Strategy

We follow a structured branching strategy. See [BRANCH_STRATEGY.md](BRANCH_STRATEGY.md) for detailed information.

### Quick Reference

- **`main`** - Production branch (protected)
- **`develop`** - Staging/Development branch (protected)
- **`feature/*`** - Feature development branches
- **`fix/*`** - Bug fix branches
- **`hotfix/*`** - Critical production fixes

### Creating a Feature Branch

```bash
# Ensure you're on develop and it's up to date
git checkout develop
git pull origin develop

# Create your feature branch
git checkout -b feature/your-feature-name

# Start developing!
```

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Examples
```bash
git commit -m "feat: add user authentication system"
git commit -m "fix: resolve navigation menu overflow issue"
git commit -m "docs: update API documentation"
git commit -m "test: add unit tests for user service"
```

## Pre-commit Checks

We use Husky to run automated checks before commits. These checks ensure code quality and consistency.

### What Runs on Pre-commit
- **Linting**: `next lint` - Checks code style and potential issues
- **Type Checking**: `tsc --noEmit` - Validates TypeScript types

### If Pre-commit Fails
1. Fix the issues identified by the checks
2. Stage your fixes: `git add .`
3. Try committing again: `git commit -m "your message"`

### Bypassing Pre-commit (Emergency Only)
```bash
git commit --no-verify -m "emergency: critical fix"
```
⚠️ Only use `--no-verify` for critical emergency fixes!

## Pull Request Process

1. **Complete your feature** on your feature branch
2. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
3. **Create a Pull Request** from your fork to the main repository
4. **Fill out the PR template** completely
5. **Request review** from maintainers
6. **Address feedback** and make requested changes
7. **Merge** after approval

### PR Requirements
- ✅ All pre-commit checks pass
- ✅ Tests pass
- ✅ Code follows style guidelines
- ✅ Documentation updated (if needed)
- ✅ PR template completed
- ✅ At least one review approval

## Code Style

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow strict TypeScript configuration
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### React/Next.js
- Use functional components with hooks
- Follow Next.js 13+ App Router conventions
- Use TypeScript for all components
- Implement proper error boundaries

### CSS/Styling
- Use Tailwind CSS for styling
- Follow utility-first approach
- Use CSS modules for complex component styles
- Maintain responsive design principles

## Testing

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run end-to-end tests
pnpm test:e2e
```

### Writing Tests
- Write unit tests for utility functions
- Write integration tests for API routes
- Write component tests for React components
- Maintain good test coverage (>80%)

### Test Structure
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation
  });

  it('should handle user interactions', () => {
    // Test implementation
  });
});
```

## Getting Help

- **Issues**: Create an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check existing docs first
- **Code Review**: Ask questions in PR reviews

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow the project's coding standards

## License

By contributing to The-Sus-Fit, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to The-Sus-Fit! 🚀 