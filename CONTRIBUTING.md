# Contributing to The Sus Fit

Thank you for your interest in contributing to The Sus Fit project! This document provides guidelines and setup instructions for contributors.

## Windows Setup Notes
- All commands and scripts work in Windows cmd (Command Prompt)
- If you encounter permission issues, run your terminal as Administrator
- Use pnpm for best compatibility

## Prerequisites

### Node.js Installation

This project requires **Node.js version 22 or higher**. To install Node.js:

1. **Download from official website**: Visit [nodejs.org](https://nodejs.org/) and download the LTS version (22.x)
2. **Verify installation**: Run `node --version` and `npm --version` to confirm installation
3. **Alternative package managers**: You can also use `pnpm` (recommended) or `yarn`

### Git Setup

Ensure you have Git installed and configured:
- **Install Git**: Download from [git-scm.com](https://git-scm.com/)
- **Configure Git**: Set up your name and email:
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  ```

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/gabepublic/The-Sus-Fit-gp.git
cd The-Sus-Fit-gp
```

### 2. Install Dependencies

We recommend using `pnpm` for faster and more efficient package management:

```bash
# Install pnpm (if not already installed)
npm install -g pnpm

# Install project dependencies
pnpm install
```

**Alternative package managers:**
```bash
# Using npm
npm ci

# Using yarn
yarn install
```

### 3. Husky Git Hooks (Auto-Install)

This project uses Husky to manage Git hooks that ensure code quality. The hooks are automatically installed when you run `pnpm install` due to the `postinstall` script in `package.json`.

**What happens automatically:**
- Pre-commit hooks are installed to run TypeScript type checking
- Commits with type errors will be blocked
- The system automatically reverts changes if validation fails

**Manual installation (if needed):**
```bash
npx husky install
```

### 4. Verify Setup

Run these commands to verify everything is working:

```bash
# Check TypeScript compilation
pnpm run type-check

# Run linting
pnpm run lint

# Run tests
pnpm test
```

## Development Workflow

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and save files

3. **Stage your changes**:
   ```bash
   git add .
   ```

4. **Commit your changes**:
   ```bash
   git commit -m "feat: add your feature description"
   ```
   
   **Note**: The pre-commit hook will automatically run TypeScript type checking. If there are errors, the commit will be blocked.

5. **Push your changes**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Quality Checks

The project includes several automated quality checks:

- **TypeScript Type Checking**: Ensures type safety across the codebase
- **ESLint**: Enforces code style and catches potential issues
- **Pre-commit Hooks**: Automatically run checks before each commit

## Available Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server

# Code Quality
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript type checking

# Testing
pnpm test         # Run unit tests
pnpm test:watch   # Run tests in watch mode
pnpm test:coverage # Run tests with coverage
pnpm test:e2e     # Run end-to-end tests
```

## Troubleshooting

### Common Issues

#### 1. Husky Hooks Not Working

**Problem**: Git hooks aren't running on commit

**Solutions**:
```bash
# Reinstall Husky
npx husky install

# Check if hooks are properly configured
ls -la .husky/

# Verify Git hook path
git config core.hooksPath
```

#### 2. TypeScript Errors Blocking Commits

**Problem**: Commits are being blocked due to TypeScript errors

**Solutions**:
```bash
# Run type checking manually to see errors
pnpm run type-check

# Fix the errors in your code
# Then try committing again
```

#### 3. Dependency Issues

**Problem**: `pnpm install` fails or shows peer dependency warnings

**Solutions**:
```bash
# Clear cache and reinstall
pnpm store prune
pnpm install

# Or use npm as fallback
npm ci
```

#### 4. ESLint Configuration Issues

**Problem**: ESLint errors or configuration not found

**Solutions**:
```bash
# Check ESLint configuration
npx eslint --print-config src/

# Run ESLint manually
pnpm run lint
```

### Getting Help

If you encounter issues not covered in this guide:

1. **Check existing issues**: Search the [GitHub Issues](https://github.com/gabepublic/The-Sus-Fit-gp/issues) page
2. **Create a new issue**: Provide detailed information about your problem
3. **Include system information**: Node.js version, package manager, operating system

## Code Style Guidelines

- Follow the existing code style in the project
- Use TypeScript for all new code
- Write meaningful commit messages
- Include tests for new features
- Update documentation when adding new features

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass
5. Update documentation if needed
6. Submit a pull request with a clear description

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to The Sus Fit! 🚀 