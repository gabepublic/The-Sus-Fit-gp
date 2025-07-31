
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
# No need to expand because it's a small PRD
```
- Use the AI Chat to guide AI-coding