# Patient Discovery — Development Guidelines

## Architecture

- Maintain the existing React, TypeScript, Vite and Tailwind CSS architecture.
- Prioritize reusable components and separation of responsibilities.
- Reuse existing components, utilities and services before creating new ones.
- Avoid unnecessary dependencies and architectural changes.

## UI/UX and Design System

- Read `docs/DESIGN_SYSTEM.md` before implementing any visual or interface changes.
- Treat `src/index.css` as the source of truth for design tokens.
- Preserve the corporate visual identity, including the corporate green and navy blue.
- Reuse existing semantic Tailwind classes and shared component styles.
- Do not hardcode colors or introduce independent color palettes.
- Maintain visual consistency across all views, dialogs, drawers and components.
- Ensure responsive design, accessibility and consistent interaction states.

## Implementation workflow

Before implementing significant changes:

1. Review the existing implementation.
2. Identify the components and files involved.
3. Present alternatives, advantages and limitations.
4. Explicitly identify proposed libraries and dependencies, including documentation links.
5. Justify the recommended approach and request approval.

After implementation:

- Explain the files created or modified.
- Run `npm run lint` and `npm run build`.
- Verify that existing functionality remains operational.
- Avoid unrelated changes.

## Clinical data and security

- Preserve clinical documents in read-only mode.
- Never modify original clinical content.
- Use exclusively synthetic data in public deployments, examples and screenshots.
- Do not expose patient identifiers, clinical information, credentials or internal infrastructure.