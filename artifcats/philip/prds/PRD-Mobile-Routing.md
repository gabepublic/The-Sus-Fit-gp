# PRD: Mobile Routing (Separate Mobile Version)

## Overview
Create an isolated "Mobile Version" of the application, accessible under its own parent route and reached automatically when a phone device is detected. The existing experience remains the "Main Version" for iPad, laptop, and desktop. This PRD is strictly about routing, navigation header, and device detection/redirect. Content and features inside views are out of scope and will be handled by future PRDs.

## Goals
- Provide a fully separate Mobile routing surface with a transparent Mobile Header and hamburger menu.
- Auto-switch phone users to the Mobile Version; non-phone devices stay on the Main Version.
- Offer five top-level mobile views navigable via an accessible hamburger menu.

## Non‑Goals
- Implementing page content, data fetching, business logic, or try-on flows.
- Styling of view bodies beyond the header/navigation requirements.
- Service worker configuration or performance tuning.

## Design References
- Mobile Header design matches `@HomeView.png` (logo left, hamburger on the right). The header background is transparent so the view background shows through.

## Routing Architecture (Next.js App Router)
- Parent route group: `/m` (alias: "Mobile Version").
  - Reason: short URL, easy to recognize and map from desktop routes.
- Five child routes:
  1. `/m/home` — Home
  2. `/m/upload-angle` — UploadAngle
  3. `/m/upload-fit` — UploadFit
  4. `/m/tryon` — TryOn
  5. `/m/share` — Share

Directory structure (target):
```
src/app/(mobile)/m/layout.tsx            # Mobile shell with header and menu
src/app/(mobile)/m/home/page.tsx         # Placeholder only
src/app/(mobile)/m/upload-angle/page.tsx
src/app/(mobile)/m/upload-fit/page.tsx
src/app/(mobile)/m/tryon/page.tsx
src/app/(mobile)/m/share/page.tsx

src/mobile/components/MobileHeader.tsx    # Transparent header (logo + hamburger)
src/mobile/components/MobileMenu.tsx      # Overlay/drawer menu with 5 links
src/mobile/styles/mobile.css              # Scoped mobile-specific styles (if needed)
```

## Navigation & Header Requirements
- Mobile Header
  - Transparent background (no opaque fill) so underlying view background color is visible.
  - Left: tappable logo button linking to `/m/home`.
  - Right: hamburger button that toggles an accessible navigation menu.
- Hamburger Menu
  - Contains links to the five routes above.
  - Closes when a link is tapped, on Escape, or when backdrop is tapped.
  - Trap focus when open; return focus to hamburger on close.
  - Current route receives an accessible selected state.

## Device Detection & Switching
- Only phones are redirected to the Mobile Version.
  - Phone examples: iPhone, Android Mobile.
  - Tablets (including iPad), laptops, and desktops MUST remain on the Main Version.
- Server‑side first: Next.js `middleware.ts` inspects the User‑Agent to detect phone devices and redirects:
  - From `/` → `/m/home` (preserve query string)
  - From any non-mobile route → mapped mobile route where applicable (see Deep‑Link Mapping).
- Client‑side safety net: a lightweight check duplicates the rule after hydration if the SSR decision was inconclusive.
- Prevent redirect loops with a short‑lived cookie (e.g., `view=mobile` or `view=main`).
- Provide an optional query override for developers: `?view=mobile` or `?view=main` to force one view for debugging; set corresponding cookie.

## Deep‑Link Mapping (Initial)
- Desktop/Main → Mobile mappings (initial set):
  - `/` → `/m/home`
  - Future desktop routes can be mapped 1:1 later. If no mapping exists, remain on desktop.
- Mobile direct access (e.g., sharing `/m/tryon`) should load as mobile without extra redirects.

## Accessibility & UX
- All header controls are keyboard and screen‑reader accessible.
- Hamburger button has `aria-expanded`, `aria-controls`, and an accessible label.
- Overlay menu uses focus trapping and restores focus on close.

## Theming & Styling Constraints
- Header background: transparent at all times; underlying view sets the visible color.
- Layout must adapt to common phone widths (min 320px) and support both portrait and landscape.

## SEO & Analytics
- Maintain canonical tags where applicable (can be added later with content PRDs).
- Fire a simple analytics event on route change within `/m/*` (hook point only; implementation in later PRDs).

## Testing & Acceptance Criteria
Functional
1. Visiting the site on a phone UA redirects to `/m/home` on first load.
2. Visiting any non-mobile route on a phone UA redirects to its mapped mobile route when mapping exists.
3. Refreshing on any `/m/*` route stays on mobile without errors (no loops, no stale chunks).
4. Tapping logo navigates to `/m/home`.
5. Tapping hamburger opens the menu; selecting a link navigates and closes the menu.
6. Escape closes the menu; backdrop tap closes the menu.

Accessibility
7. Menu and controls are operable by keyboard and announced correctly by screen readers.

Non‑Regression
8. iPad/tablet, laptop, and desktop users stay on the Main Version (no redirect to `/m`).

## Technical Notes
- Use the Next.js App Router (current project standard).
- Prefer Server Components for pages; header/menu can be Client Components as needed.
- Add `src/middleware.ts` for UA detection and redirect/cookie handling.
- Avoid coupling with existing desktop components; keep mobile shell self‑contained.
- No service worker changes in this PRD.

## Development Isolation Requirements
**CRITICAL: This mobile routing development MUST be done separately from the main app codebase as much as possible.**

### Scope Boundaries
- **Mobile-only code**: All code under `src/app/(mobile)/`, `src/mobile/`, and mobile-specific utilities are fair game for implementation without approval.
- **Shared/main codebase changes**: Any modifications to existing files outside the mobile scope REQUIRE explicit user verification before implementation.

### User Verification Required For
- Changes to `src/middleware.ts` (new file affecting main app routing)
- Modifications to existing layout files, components, or utilities outside `src/mobile/`
- Updates to `next.config.js`, `package.json`, or other configuration files
- Changes to existing TypeScript types, interfaces, or shared constants
- Any modifications to the current main app routes or components

### Implementation Strategy
1. **Start with mobile-isolated code**: Implement all mobile routes, components, and styling first.
2. **Identify integration points**: Clearly list what changes are needed to shared/main codebase.
3. **Request approval**: Present the minimal required changes to the user for verification before proceeding.
4. **Implement only after approval**: Make shared codebase changes only after explicit user consent.

### Exception Handling
- If the implementation discovers that complete isolation is impossible, pause development and present the blocking issue to the user with proposed minimal-impact solutions.
- Document any temporary workarounds that maintain isolation until user approval is obtained.

## Deliverables
1. Mobile route group `/m` with five child routes and placeholders.
2. Transparent Mobile Header with logo + hamburger; accessible Mobile Menu with five links.
3. `middleware.ts` implementing phone detection, redirects, and anti‑loop cookie.
4. Basic unit tests for redirect logic and header/menu behavior; a quick e2e happy‑path on `/m/home`.

## Open Questions (to be handled later or in follow‑up PRDs)
- Exact colors/spacing/typography beyond the provided header reference.
- Deep‑link mappings for additional desktop routes as they emerge.


