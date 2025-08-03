# The-Sus-Fit
A stealth mode guerilla branding campaign for AI fun

## SETUP

- Setup taskmaster; also see [taskmaster docs](https://github.com/eyaltoledano/claude-task-master/tree/main)
```
# Install Taskmaster
pnpm install task-master-ai

# Initialize with Cursor rules ONLY
npx task-master init --rules cursor

# Create environment file
copy .env.example .env
# Add your API key to .env
```

## PRD

### Wiring OpenAI Vision API

- Create `.taskmaster/docs/feature-prd-tryon-phase01.txt`
- Generate tasks
```
npx task-master parse-prd .taskmaster/docs/feature-prd-tryon-phase01.txt
npx task-master expand --all
```