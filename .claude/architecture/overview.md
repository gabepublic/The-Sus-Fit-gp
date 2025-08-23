# Three-Layer Architecture Overview

## Philosophy

The application follows a strict three-layer separation of concerns pattern to maximize testability, reusability, and maintainability. Each layer has distinct responsibilities and communicates through well-defined interfaces.

## Layer Structure

```
┌──────────────────────────────────────┐
│          Presentation Layer          │
│    (UI Components, Pages, Layouts)   │
│  • Pure presentation components      │
│  • Consumes business layer hooks     │
│  • Minimal business logic            │
└─────────────────┬────────────────────┘
                  │
┌─────────────────▼────────────────────┐
│            Business Layer            │
│  ┌───────── Bridge Hooks ─────────┐  │
│  │ useBridgeLayer, useImageUpload │  │
│  │ • Orchestrate lower-level hooks│  │
│  │ • Simplify component APIs      │  │
│  │ • Handle complex workflows     │  │
│  └────────────────────────────────┘  │
│  ┌────── Core Business Logic ─────┐  │
│  │ Queries, Mutations, Services   │  │
│  │ • React Query integration      │  │
│  │ • Business rules & validation  │  │
│  │ • State management             │  │
│  └────────────────────────────────┘  │
└─────────────────┬────────────────────┘
                  │
┌─────────────────▼────────────────────┐
│             Data Layer               │
│    (API clients, External Services,  │
│     Database interactions)           │
│  • HTTP requests to backend          │
│  • External API integrations         │
│  • Data fetching & caching           │
└──────────────────────────────────────┘
```

## Directory Structure

```
src/
├── business-layer/          # Smart React Query hooks with business logic
│   ├── queries/            # Read operations (useQuery)
│   ├── mutations/          # Write operations (useMutation)
│   ├── providers/          # React Query configuration
│   └── types/              # Business layer TypeScript types
├── hooks/                  # UI bridge hooks (thin wrappers)
├── components/             # Pure UI components
├── app/                    # Next.js pages and API routes
├── lib/                    # Utilities, schemas, clients
└── utils/                  # Helper functions

.claude/
└── architecture/           # Architecture documentation for prompts
    ├── overview.md         # This file
    ├── business-layer.md   # Business layer patterns
    ├── bridge-layer.md     # Custom hooks patterns
    └── scalability.md      # Growth and customization patterns
```

## Key Principles

1. **Dependency Direction**: Higher layers depend on lower layers, never the reverse
2. **Business Logic Centralization**: All business logic lives in business-layer/
3. **UI Isolation**: Components know nothing about React Query or API details
4. **Testability**: Each layer can be tested independently
5. **Reusability**: Business layer works with any UI implementation

## Communication Flow

```
Page.tsx → useCustomHook() → useBusinessQuery() → API Route → External Service
         ←                 ←                    ←           ←
```

## Benefits for Growth

- **Multi-client Customization**: Swap out presentation layer while keeping business logic
- **Platform Agnostic**: Business layer works with web, mobile, desktop
- **Team Scaling**: Frontend and backend teams work independently
- **Feature Development**: Business logic developed once, used everywhere
