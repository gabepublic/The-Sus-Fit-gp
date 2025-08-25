# Project Setup Information

## Environment Variables

### Required Environment Variables
- `OPENAI_API_KEY` - OpenAI API key for image generation
- `OPENAI_MODEL` - OpenAI model to use (default: 'gpt-image-1')

### Optional Environment Variables
- `NODE_ENV` - Node environment (development, production, test)
- `CI` - Set to true in CI environment for test configuration
- `NEXT_PUBLIC_BASE_URL` - Base URL for the application
- `NEXT_PUBLIC_APP_URL` - App URL for development (default: 'http://localhost:3000')

### Environment File Configuration
- `.env.local` - Local environment file (ignored by git)
- `.env.example` - Example environment file (committed to git)
- `.gitignore` configuration: `.env*` ignored, `!.env.example` allowed

## Package Manager & Dependencies

### Package Manager
- **pnpm** (preferred package manager)
- Lock file: `pnpm-lock.yaml`

### Node.js Version
- Check `package.json` engines field (not specified in current version)

### Key Dependencies
- **Next.js**: 15.3.3
- **React**: ^19.0.0
- **TypeScript**: ~5.3.3
- **Tailwind CSS**: ^4.1.11
- **OpenAI**: ^5.11.0
- **Jest**: ^30.0.4
- **Playwright**: ^1.53.2

## NPM Scripts

### Development
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking

### Testing
- `pnpm test` - Run all tests
- `pnpm test:ci` - Run tests with coverage and CI configuration
- `pnpm test:agent` - Run tests in CI mode with silent output
- `pnpm test:unit` - Run unit tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm test:coverage:enforce` - Run tests with coverage enforcement
- `pnpm test:e2e` - Run Playwright E2E tests

## Testing Configuration

### Jest Configuration
- **Coverage Threshold**: 80% for branches, functions, lines, statements
- **Coverage Reporters**: text, lcov, html
- **Coverage Directory**: `/coverage`
- **Test Environment**: jest-environment-jsdom
- **Setup Files**: jest.setup.js, jest-canvas-mock

### Playwright Configuration
- **CI Mode**: Configured for CI environment
- **Retries**: 2 in CI, 0 in development
- **Workers**: 1 in CI, undefined in development
- **Server Reuse**: Disabled in CI

## CI/CD Configuration

### GitHub Actions
- **Workflow File**: `.github/workflows/ci.yml`
- **Coverage Upload**: Uploads to Codecov
- **Coverage Artifacts**: Uploads coverage reports as artifacts
- **Coverage File**: `./coverage/lcov.info`

### Coverage Badge
- **Provider**: Codecov
- **Badge Location**: To be added to README.md
- **Coverage Reports**: Available in CI artifacts

## Development Tools

### Code Quality
- **ESLint**: Configured with Next.js and TypeScript rules
- **TypeScript**: Strict mode enabled
- **Husky**: Git hooks for pre-commit linting
- **lint-staged**: Run linters on staged files

### Build Tools
- **Next.js**: App Router with TypeScript
- **Tailwind CSS**: v4 with PostCSS
- **SWC**: Fast compilation

## File Structure

### Key Directories
- `src/` - Source code
- `src/app/` - Next.js App Router pages
- `src/components/` - React components
- `src/lib/` - Utility libraries
- `__tests__/` - Test files
- `tests/e2e/` - E2E test files
- `public/` - Static assets
- `docs/` - Documentation

### Configuration Files
- `next.config.js` - Next.js configuration
- `jest.config.js` - Jest testing configuration
- `playwright.config.ts` - Playwright E2E testing configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration

## Notes for Subsequent Tasks

### Environment Variables to Document
- Create `.env.example` with all identified variables
- Add comments explaining each variable's purpose
- Include default values where applicable

### Coverage Badge Integration
- Get Codecov badge URL from CI configuration
- Add badge to README.md header
- Verify badge displays correctly in GitHub

### Documentation Updates
- Update README.md with setup instructions
- Include environment variable setup steps
- Add development workflow documentation
- Link to coverage reports and badges
