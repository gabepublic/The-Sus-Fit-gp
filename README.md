# The-Sus-Fit
A stealth mode guerilla branding campaign for AI fun

## Environment Variables

This project uses environment variables to securely manage API keys and configuration. **Never commit your `.env.local` file to version control.**

### Required Environment Variables

The following variables are required for the application to function:

- `ANTHROPIC_API_KEY` - Your Claude API key (format: `sk-ant-api03-...`)
- `PINECONE_API_KEY` - Your Pinecone API key
- `PINECONE_ENVIRONMENT` - Your Pinecone environment
- `PINECONE_INDEX_NAME` - Your Pinecone index name

### Optional Environment Variables

- `OPENAI_API_KEY` - OpenAI API key for try-on features (format: `sk-proj-...`)
- `OPENAI_MODEL` - OpenAI model to use (defaults to `gpt-image-1`)
- `LANGCHAIN_API_KEY` - LangChain API key for tracing
- `LANGCHAIN_TRACING_V2` - LangChain tracing version
- `NEXT_PUBLIC_APP_URL` - Public URL for the application
- `NODE_ENV` - Environment mode (`development`, `production`, or `test`)

### Environment File Setup

1. **Copy the example file**: `cp .env.example .env.local`
2. **Add your API keys**: Edit `.env.local` and add your actual API keys
3. **Verify security**: Ensure `.env.local` is in your `.gitignore` and not tracked by Git

> ⚠️ **Security Warning**: Never commit `.env.local` to version control. The `.env.example` file is safe to commit as it contains no real secrets.

## Running in Development

### Prerequisites

- Node.js 18+ and pnpm installed
- API keys configured in `.env.local` or shell environment

### Quick Start

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables** (choose one method):

   **Method A: Using .env.local (Recommended)**
   ```bash
   # Copy example file
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

   **Method B: Using shell environment**
   ```bash
   # Unix/macOS
   export OPENAI_API_KEY="sk-proj-your-key-here"
   export ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"
   
   # Windows (Command Prompt)
   set OPENAI_API_KEY=sk-proj-your-key-here
   set ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   
   # Windows (PowerShell)
   $env:OPENAI_API_KEY="sk-proj-your-key-here"
   $env:ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"
   ```

3. **Start the development server**:
   ```bash
   pnpm run dev
   ```

   The dev script is cross-platform and will automatically handle environment variables from your shell or `.env.local` file.

4. **Open your browser**: Navigate to `http://localhost:3000`

### Getting API Keys

- **OpenAI API Key**: Visit [OpenAI Platform](https://platform.openai.com/api-keys) to create your API key
- **Anthropic API Key**: Visit [Anthropic Console](https://console.anthropic.com/) to create your Claude API key
- **Pinecone API Key**: Visit [Pinecone Console](https://app.pinecone.io/) to create your API key

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