# The-Sus-Fit
A stealth mode guerilla branding campaign for AI fun

## SETUP

### Cursor for Nextjs development

- Cursor IDE version: 1.2.4
- Add these project rules in Cursor IDE (File > Preferences > Cursor Settings - Rules & Memories):
  - clean-code.mdc
  - code-quality.mdc
  - nextjs.mdc
  - typescript.mdc
  - tailwind.mdc

- NOTE: rules has been refined based on multiple sources and using ChatGPT.
- See [awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules/blob/main/rules-new/codequality.mdc)
  for more rules;

### TaskMaster

- Setup taskmaster; also see [taskmaster docs](https://github.com/eyaltoledano/claude-task-master/tree/main)
```
# Install Taskmaster
npm install task-master-ai

# Initialize with Cursor rules ONLY
npx task-master init --rules cursor

# Create environment file
copy .env.example .env
# Add your API key to .env
```
- **NOTE:** `.env` file is "ignored" by default in the `.gitignore` file.

- **NOTE:** taskmaster setup mcp in `.cursor/rules/mcp.json` and it stores
the LLM API keys; so the file has been EXPLICITLY "ignored" in the `.gitignore`

## TASK MANAGEMENT WORKFLOW

### BLUEPRINT - one time only
- Parse a PRD file and generate tasks
```
# Parse Product Requirements Document
npx task-master parse-prd PRDs/blueprint-prd.txt

# [Optional] Generate individual task files
npx task-master generate

# [Recommended] Expand tasks into subtasks
npx task-master expand --all
```

- List tasks
```
npx task-master list

# List tasks with a specific status
npx task-master list --status=<status>

# List tasks with subtasks
npx task-master list --with-subtasks
```

- Add a new task
```
# Add a new task using AI (main role)
npx task-master add-task --prompt="Description of the new task"

# Add a new task using AI (research role)
npx task-master add-task --prompt="Description of the new task" --research

# Add a task with dependencies
npx task-master add-task --prompt="Description" --dependencies=1,2,3

# Add a task with priority
npx task-master add-task --prompt="Description" --priority=high
```


### FEATURE - incremental

- Major feature development
  - Create Github feature branch
  - Prepare the feature PRD, `PRDs/prd-selfie-p1.txt`
  - Create TaskMaster tasks
```
npx task-master add-tag selfie --description="Enable user to take Selfie."
npx task-master use-tag selfie
npx task-master parse-prd PRDs/prd-selfie-p1.txt --tag=selfie
```
  - Iterations:
    - review `./taskmaster/tasks/task.json`
    - Not good -> revise the feature PRD, `PRDs/prd-selfie-p1.txt`
    - OPTIONAL, versioned the PRD file for now.
    - Delete & start all the above again
```
npx task-master delete-tag selfie
```
  - Optional, update task
```
npx task-master update-task --id=8 --prompt="Revise the task description to remove local browser persistence"
```

  - Add a new task
```
npx task-master add-task --prompt="Apply a basic image filtering after capturing the image AND before shwoing it to user."
npx task-master add-task --prompt="Apply a basic image filtering after capturing the image AND before shwoing it to user." --research
npx task-master validate-dependencies
npx task-master fix-dependencies
npx task-master add-dependency --id=7 --depends-on=11
```

## AI CODING WORKFLOW

- also see : [AI-Driven Development Workflow](https://docs.task-master.dev/docs/best-practices/advanced-tasks#ai-driven-development-workflow)

- At this point the PRD has been translated into tasks; see `.taskmaster/tasks/tasks.json`

- Also recommended, to "expand" (break down the task) especially when it's big and complicated.
```
npx task-master expand --all
# or
npx task-master expand --id=<id>
``` 
- Now, let's start the AI-Coding; This is done with the AI chat, NOT with the command line anymore.
  In thsi case, cursor or claude-code.
```AI Chat
what is the next task?

AI:
The next task to work on is Task 1: Verify and Harden Git Repository.
[...]

Let's start with task 1.1
```
"# Test comment" 
