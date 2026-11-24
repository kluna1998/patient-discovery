# Patient Discovery — Design System

## 1. Design principles

The interface must be clean, professional, clinical, modern and functional.

Prioritize:

- Readability and information hierarchy.
- Consistent visual identity.
- Minimal visual noise.
- Efficient clinical workflows.
- Accessibility and responsive design.

Use white and neutral surfaces, corporate green accents and navy blue typography and controls.

## 2. Color system

The source of truth is the `@theme` block in `src/index.css`.

### Corporate identity

- Brand accent: `#8ECA74`
- Brand accent hover: `#7CBA62`
- Primary: `#375171`
- Primary hover: `#274361`
- Secondary: `#2A7679`

Use corporate green for brand accents, selected documents, active indicators and contextual interactions.

Use navy blue for primary actions, navigation, links and focus indicators.

Use dark text on light corporate green backgrounds to maintain sufficient contrast.

### Surfaces

- Canvas: `#F4F7FA`
- Surface: `#FFFFFF`
- Document surface: `#F8FAFC`
- Border: `#DFE5EB`
- Document content: `#334155`

Avoid large saturated colored surfaces, excessive gradients and strong shadows.

### Semantic states

Preserve the existing review and indicator tokens:

- Green: accepted or favorable.
- Red: rejected or negative.
- Amber: pending or requires review.
- Gray: unknown or unavailable.

Corporate selection states must remain visually distinguishable from clinical validation states.

### Document-specific tokens

Introduce reusable semantic tokens when needed for:

- Document selection.
- Document selection hover.
- Selected document border.
- Search match.
- Active search match.
- Clinical evidence highlighting.

Use soft corporate green for document selection, yellow for search matches and orange for the active search match.

Do not hardcode these colors inside components.

## 3. Typography

Use the existing font stack: Inter, Segoe UI, Arial, sans-serif.

- Page titles: 24–28 px, semibold.
- Panel titles: 16–18 px, semibold.
- Section titles: 14–16 px, semibold.
- Standard interface text: 14 px.
- Clinical document text: 14–16 px.
- Secondary information and metadata: 12 px.

Use generous line height for clinical documents, preferably 1.6–1.8.

Preserve original document content and line breaks.

## 4. Spacing

Follow a consistent 4 px spacing scale.

- Icon and label separation: 8 px.
- Control separation: 8–12 px.
- Component padding: 12–16 px.
- Panel padding: 16–24 px.
- Document padding: 24–32 px.
- Section separation: 24–32 px.

Avoid arbitrary spacing values unless technically justified.

## 5. Buttons and interactions

Reuse the existing `.btn` and `.btn-primary` classes.

### Primary buttons

- Navy blue background.
- White text.
- Darker navy hover.

### Secondary buttons

- White background.
- Subtle neutral border.
- Neutral or soft corporate green hover, depending on context.

### Brand-accent buttons

- Corporate green background.
- Dark text.
- Darker corporate green hover.

### Icon and ghost buttons

- Transparent background.
- Neutral or corporate-colored icon.
- Subtle hover background.
- Accessible labels and tooltips when appropriate.

All equivalent actions must use consistent styles.

Use visible keyboard focus, disabled states and subtle transitions of approximately 150 ms. Respect reduced-motion preferences.

## 6. Borders and elevation

- Default border width: 1 px.
- Buttons and inputs: 6 px border radius.
- Panels and documents: 8 px border radius.
- Use subtle shadows only when necessary to communicate elevation.

## 7. Clinical document workspace

Maintain a two-panel layout:

- Left: independent document viewer.
- Right: clinical documents drawer.

### Document viewer

- Neutral canvas background.
- White document surface.
- Clear document title and metadata.
- Compact toolbar.
- Independent vertical scrolling.
- Comfortable reading width.
- Read-only clinical content.

### Document list

- White background.
- Consistent document icons.
- Document type as the primary label.
- Date and metadata as secondary information.
- Soft corporate green for the selected document.
- Subtle green hover for unselected documents.
- Clear distinction between normal, hover, selected and focus states.

### Search toolbar

- Search icon and descriptive placeholder.
- Match counter.
- Previous and next match controls.
- Clear search action.
- Yellow search highlights.
- Orange active match highlight.

## 8. Component reuse

Prefer existing components and libraries:

- React and TypeScript.
- Tailwind CSS.
- Lucide React.
- Radix UI.
- Existing shared CSS classes and semantic tokens.

Do not introduce new UI libraries without justification.

Keep functionality independent from presentation where possible.

## 9. Accessibility

- Target WCAG AA contrast requirements.
- Support keyboard navigation.
- Provide visible focus indicators.
- Do not communicate information exclusively through color.
- Use accessible names for icon-only controls.
- Preserve appropriate focus management in dialogs and drawers.

## 10. Consistency requirements

Before introducing a new component:

1. Review the existing design tokens.
2. Review equivalent existing components.
3. Reuse shared styles whenever possible.
4. Introduce new semantic tokens only when necessary.
5. Verify visual consistency with the rest of Patient Discovery.