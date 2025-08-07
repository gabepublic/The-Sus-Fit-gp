# The-Sus-Fit

A stealth mode guerilla branding campaign for AI fun

[![Coverage](https://codecov.io/gh/your-username/The-Sus-Fit-gp/branch/main/graph/badge.svg)](https://codecov.io/gh/your-username/The-Sus-Fit-gp)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ 
- **pnpm** (preferred package manager)
- **Git**

### Installing pnpm

If you don't have pnpm installed:

```bash
# Using npm
npm install -g pnpm

# Using Homebrew (macOS)
brew install pnpm

# Using Windows (PowerShell)
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

## Environment Variables

This project uses environment variables to securely manage API keys and configuration. **Never commit your `.env.local` file to version control.**

### Required Environment Variables

| Variable | Description | Format | Default |
|----------|-------------|--------|---------|
| `OPENAI_API_KEY` | OpenAI API key for image generation | `sk-proj-...` | Required |
| `OPENAI_MODEL` | OpenAI model to use | Model name | `gpt-image-1` |

### Optional Environment Variables

| Variable | Description | Format | Default |
|----------|-------------|--------|---------|
| `NODE_ENV` | Node environment | `development`, `production`, `test` | `development` |
| `CI` | CI environment flag | `true`/`false` | `false` |
| `NEXT_PUBLIC_BASE_URL` | Base URL for the application | URL | None |
| `NEXT_PUBLIC_APP_URL` | App URL for development | URL | `http://localhost:3000` |

### Environment File Setup

1. **Copy the example file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Add your API keys**: Edit `.env.local` and add your actual API keys

3. **Verify security**: Ensure `.env.local` is in your `.gitignore` and not tracked by Git

> ⚠️ **Security Warning**: Never commit `.env.local` to version control. The `.env.example` file is safe to commit as it contains no real secrets.

### Getting API Keys

- **OpenAI API Key**: Visit [OpenAI Platform](https://platform.openai.com/api-keys) to create your API key

## Running Dev

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/The-Sus-Fit-gp.git
   cd The-Sus-Fit-gp
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables** (choose one method):

   **Method A: Using .env.local (Recommended)**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

   **Method B: Using shell environment**
   ```bash
   # Unix/macOS
   export OPENAI_API_KEY="sk-proj-your-key-here"
   
   # Windows (Command Prompt)
   set OPENAI_API_KEY=sk-proj-your-key-here
   
   # Windows (PowerShell)
   $env:OPENAI_API_KEY="sk-proj-your-key-here"
   ```

4. **Start the development server**:
   ```bash
   pnpm dev
   ```

5. **Open your browser**: Navigate to `http://localhost:3000`

### Development Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | Run TypeScript type checking |

## Running Tests

### Unit Tests

Run all unit tests:
```bash
pnpm test
```

Run tests with coverage:
```bash
pnpm test:coverage
```

Run tests in watch mode:
```bash
pnpm test:watch
```

### End-to-End Tests

Run Playwright E2E tests:
```bash
pnpm test:e2e
```

### Test Scripts

| Command | Description |
|---------|-------------|
| `pnpm test` | Run all tests |
| `pnpm test:ci` | Run tests with coverage and CI configuration |
| `pnpm test:unit` | Run unit tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm test:coverage:enforce` | Run tests with coverage enforcement |
| `pnpm test:e2e` | Run Playwright E2E tests |

### Test Coverage

The project maintains a **80% coverage threshold** for:
- Branches
- Functions  
- Lines
- Statements

Coverage reports are available in the `/coverage` directory and uploaded to Codecov in CI.

## OpenAI Service Wrapper

The project includes a comprehensive OpenAI service wrapper for virtual try-on functionality using the OpenAI Images Edit API. This wrapper provides type-safe, validated interactions with OpenAI's image generation capabilities.

### Features

- **Type-safe API**: Full TypeScript support with Zod validation schemas
- **Input validation**: Automatic validation of base64 image data
- **Error handling**: Comprehensive error handling with custom error context
- **Clean API**: Simple, intuitive function interface

### Usage

```typescript
import { generateTryOn, TryOnParams } from '@/lib';

// Example usage
const tryOnParams: TryOnParams = {
  modelImage: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  apparelImages: ["iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="]
};

try {
  const generatedImage = await generateTryOn(tryOnParams);
  console.log('Generated image:', generatedImage);
} catch (error) {
  console.error('Try-on failed:', error.message);
}
```

### API Reference

#### `generateTryOn(params: TryOnParams): Promise<string>`

Generates a try-on image by combining a model image with apparel images.

**Parameters:**
- `params.modelImage` (string): Base64-encoded model image
- `params.apparelImages` (string[]): Array of base64-encoded apparel images (minimum 1)

**Returns:**
- `Promise<string>`: Base64-encoded generated image

**Throws:**
- `Error`: When validation fails, API call fails, or response is invalid

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration:
- **Unit Tests**: Runs on Ubuntu with Node.js 18.x and 20.x
- **E2E Tests**: Runs on Ubuntu and Windows with comprehensive artifact uploads
- **Build Verification**: Ensures the application builds successfully
- **Coverage Reports**: Uploaded to Codecov and available as artifacts

## SETUP

- Setup taskmaster; also see [taskmaster docs](https://github.com/eyaltoledano/claude-task-master/tree/main)
```bash
# Install Taskmaster
pnpm install task-master-ai

# Initialize with Cursor rules ONLY
npx task-master init --rules cursor

# Create environment file
cp .env.example .env.local
# Add your API key to .env.local
```

## PRD

### Wiring OpenAI Vision API

- Create `.taskmaster/docs/feature-prd-tryon-phase01.txt`
- Generate tasks
```bash
npx task-master parse-prd .taskmaster/docs/feature-prd-tryon-phase01.txt
npx task-master expand --all
```