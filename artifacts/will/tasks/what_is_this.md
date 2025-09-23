
These individual task files serve several important purposes:

📝 What They Are

- Auto-generated markdown files created from tasks.json
- One file per task (task_001.txt = Task 1, task_002.txt = Task 2, etc.)
- Human-readable format of each task's details

🎯 Why They're Useful

1. Easy Reference: Read task details without parsing JSON
2. Documentation: Each task becomes a standalone document
3. Version Control: Track changes to individual tasks in git
4. Sharing: Easy to share specific tasks with team members
5. IDE Integration: Can be opened directly in your editor
6. Context for AI: Claude Code can read these for task context

🔄 How They're Generated

TaskMaster automatically creates these when you run:
task-master generate

Or they're auto-generated when you:
- Parse a PRD
- Add/update tasks
- Expand tasks with subtasks

📋 File Format

Each file contains:
- Task metadata (ID, title, status, dependencies, priority)
- Description and detailed requirements
- Test strategy
- Note: Subtasks are included in the main task file

🔧 Usage in Your Workflow

- For Development: Reference specific task requirements while coding
- For Planning: Review task details without TaskMaster CLI
- For Documentation: Each task is self-contained documentation
- For AI Context: Claude Code can read these for task-specific context

The files are automatically kept in sync with tasks.json - you don't need to manually edit them!
