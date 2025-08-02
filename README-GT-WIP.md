
# SETUP - TASKMASTER AI COMPLETED:
- Setup "task-master-ai"
```
pnpm install task-master-ai
npx task-master init --rules cursor
copy .env.example .env
# Add your API key to .env
```
- Update `.gitigore` with the following
```
# Cursor & taskmaster
# `.cursorignore` specifies files/directories to exclude from AI features 
# like autocomplete and code analysis. Recommended for sensitive data
# refer to https://docs.cursor.com/context/ignore-files
.cursorignore
.cursorindexingignore
.cursor/mcp.json
```
- Setup your local taskmaster MCP, `mcp.json`
```
cp mcp-example.json mcp.json

# Enter your API key to one of the following:
"env": {
  "ANTHROPIC_API_KEY": "YOUR_ANTHROPIC_API_KEY_HERE",
  "PERPLEXITY_API_KEY": "YOUR_PERPLEXITY_API_KEY_HERE",
  "OPENAI_API_KEY": "YOUR_OPENAI_KEY_HERE",
  "GOOGLE_API_KEY": "YOUR_GOOGLE_KEY_HERE",
  "XAI_API_KEY": "YOUR_XAI_KEY_HERE",
  "OPENROUTER_API_KEY": "YOUR_OPENROUTER_KEY_HERE",
  "MISTRAL_API_KEY": "YOUR_MISTRAL_KEY_HERE",
  "AZURE_OPENAI_API_KEY": "YOUR_AZURE_KEY_HERE",
  "OLLAMA_API_KEY": "YOUR_OLLAMA_API_KEY_HERE"
}
```
- Add these project rules in Cursor IDE (File > Preferences > Cursor Settings - Rules & Memories),
  or copy to `.cursor/rules`:
  - clean-code.mdc
  - codequality.mdc
  - nextjs.mdc
  - typescript.mdc
  - tailwind.mdc

# SETUP - Git Hooks with Husky and lint-staged
- Add `taskmaster/docs/blueprint-prd-gh-setup-01.txt`
- Create tasks
```
npx task-master parse-prd .taskmaster/docs/blueprint-prd-gh-setup-01.txt
# No need to expand because it's a small PRD
```
- Use the AI Chat to guide AI-coding
```
what's next?
...
start task 1
...
```
- Completed `tasks.json` is copied to `chat-history/tasks-gh-setup-01.json`
- The chats are also exported to `chat-history/task-gh-setup-01-chat.md`

- CLEANUP `page.tsx` into a black canvas.

# SETUP - Responsive UI Single Page Application
- Add `taskmaster/docs/blueprint-prd-ui-setup-01.txt`
- Create tasks
```
npx task-master parse-prd .taskmaster/docs/blueprint-prd-ui-setup-01.txt
```
- Use the AI Chat to guide AI-coding

## DEVELOP FEATURE - Camera selfie page
- Add `taskmaster/docs/feature-prd-selfie-phase-01.txt`
- Create tasks
```
npx task-master parse-prd .taskmaster/docs/feature-prd-selfie-phase-01.txt
npx task-master expand --all
```
- Use the AI Chat to guide AI-coding

- Playwright test
```
npx playwright test --project=chromium-desktop
npx playwright test --project=chromium-desktop,chromium-mobile,webkit,iphone
npx playwright test e2e/anime-transformation.spec.ts --project=chromium-desktop
npx playwright test e2e/retake-flow.spec.ts --project=chromium-desktop
npx playwright test e2e/selfie-anime.spec.ts --project=chromium-desktop

```

### Change from PRD

- Refactor from OpenAI chat.completion API to Responses API
```
refactor the `generateAnime` function to use OpenAI responses API described in https://platform.openai.com/docs/api-reference/images/createEdit?lang=node.js
```


Implementation Plan
I'll apply these changes systematically:
Replace button readiness waits with proper state checks
Replace animation completion waits with spinner visibility checks
Replace camera initialization waits with video element visibility checks
Replace component mounting waits with alert/error visibility checks
Replace retry logic waits with proper retry mechanisms
Would you like me to proceed with implementing these changes?