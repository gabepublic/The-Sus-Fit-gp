# The-Sus-Fit
A stealth mode guerilla branding campaign for AI fun

## Quick Start

### Prerequisites
- **Node.js 22+** ([Download LTS](https://nodejs.org/en/download))
- **pnpm** ([Install guide](https://pnpm.io/installation))

### Setup (Windows cmd supported)
```sh
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Main Scripts
```sh
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # TypeScript check
pnpm test         # Run unit tests
pnpm test:e2e     # Run Playwright E2E tests
```

### Architecture
- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS 4** for utility-first styling
- **shadcn/ui** for headless, themeable UI components
- **Jest** for unit tests, **Playwright** for E2E

### Windows Setup Notes
- All commands work in Windows cmd
- If you hit permission issues, run terminal as Administrator

For full contribution, troubleshooting, and workflow details, see [CONTRIBUTING.md](./CONTRIBUTING.md)
