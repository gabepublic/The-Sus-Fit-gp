#!/bin/bash

# Test CI workflow locally
set -e

echo "🧪 Testing CI workflow locally..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install pnpm first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
print_status "Using Node.js $NODE_VERSION"

# Step 1: Install dependencies
print_status "Installing dependencies..."
pnpm install

# Step 2: Run unit tests with coverage (Test job)
print_status "Running unit tests with coverage..."
if pnpm test:ci; then
    print_status "Unit tests passed!"
else
    print_error "Unit tests failed!"
    exit 1
fi

# Step 3: Install Playwright browsers (E2E job)
print_status "Installing Playwright browsers..."
npx playwright install --with-deps

# Step 4: Build application
print_status "Building application..."
if pnpm build; then
    print_status "Build successful!"
else
    print_error "Build failed!"
    exit 1
fi

# Step 5: Run E2E tests
print_status "Running E2E tests..."
if pnpm test:e2e; then
    print_status "E2E tests passed!"
else
    print_error "E2E tests failed!"
    exit 1
fi

# Step 6: Type checking
print_status "Running type check..."
if pnpm type-check; then
    print_status "Type check passed!"
else
    print_error "Type check failed!"
    exit 1
fi

# Step 7: Linting
print_status "Running linter..."
if pnpm lint; then
    print_status "Linting passed!"
else
    print_error "Linting failed!"
    exit 1
fi

print_status "🎉 All CI tests passed locally! Ready to push."
