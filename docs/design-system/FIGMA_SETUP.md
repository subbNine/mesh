# Figma Design System Setup

Complete guide for setting up and maintaining the Mesh design system in Figma.

## Quick Start

1. Create new Figma file: "Mesh Design System"
2. Install plugins: Design Tokens, Color Styles, Typography Manager
3. Import `tokens.json` using Design Tokens plugin
4. Create component library file
5. Build shared components with variants
6. Publish to team library

## Design Tokens Setup

### Option 1: Design Tokens Plugin (Recommended)

The Design Tokens plugin auto-generates styles from JSON.

**Installation:**
1. Open Figma → Plugins → Browse all plugins
2. Search for "Design Tokens"
3. Install by Lukas Oppermann
4. Restart Figma

**Import Tokens:**
1. Open Design Tokens plugin
2. Click "Import" → "Upload JSON file"
3. Select `/design-system/tokens.json`
4. Click "Auto-generate styles"
5. Review generated token groups

**Generated Styles:**
- Colors/Primary/500 → design token style
- Colors/Accent/Purple → design token style
- Typography/Headings/H1 → text style
- Spacing/4 → grid token
- All shadows as fill/effect styles

**Management:**
- Update `tokens.json` in code
- Re-import in Figma when tokens change
- Plugin preserves existing components
- Sync with team libraries

### Option 2: Manual Styles (Alternative)

If Design Tokens plugin unavailable:

**Color Styles:**
1. File menu → Styles & Variables → Create new color style
2. Name: `colors/primary` → Set to #279FBD
3. Name: `colors/secondary` → Set to #266BD4
4. Repeat for all colors in tokens.json
5. Organize in folders: colors, semantic, neutral

**Typography Styles:**
1. Create text style for each size/weight combination
2. Name: `typography/heading-1` (36px, 600, -0.02em)
3. Name: `typography/body-base` (16px, 400, 1.5 line height)
4. Name: `typography/body-small` (14px, 400, 1.5 line height)
5. Organize by category: headings, body, labels

**Grid Styles:**
1. File menu → Create grid style
2. Standard grid: 8px base, 4 columns per style
3. Name: `grid/spacing-8`
4. Use for aligning elements consistently

## Creating Component Library

### File Structure

```
Figma Team
├── Mesh Design System (Shared Library)
│   ├── 🎨 Colors & Tokens
│   ├── 📝 Typography
│   ├── 🧩 Components
│   │   ├── Buttons
│   │   ├── Inputs
│   │   ├── Cards
│   │   └── ...
│   └── 📋 Patterns
├── Mesh Products (Main file)
└── Mesh Prototype (Flows & interactions)
```

### Component Setup

#### Button Component

Create a master component with all variants.

**Main component:** `Button`

**Variants:**
- Property: variant (primary, secondary, tertiary, destructive)
- Property: size (sm, md, lg)
- Property: state (default, hover, active, disabled)
- Property: icon (false, true)

**Structure:**
```
Button
├── primary
│   ├── sm
│   │   ├── default
│   │   ├── hover
│   │   ├── active
│   │   └── disabled
│   ├── md
│   ├── lg
│   └── icon: true
├── secondary
│   └── ...
├── tertiary
│   └── ...
└── destructive
    └── ...
```

**Component Properties:**
- Text content (editable)
- Background color (can be swapped)
- Stroke color (for secondary)
- Icon replacement (swap icon layer)
- Label color (follows variant)

#### Card Component

Flexible container for content.

**Main component:** `Card`

**Variants:**
- Property: variant (default, elevated, outlined, filled)
- Property: interactive (false, true)
- Property: error (false, true)

**Content layers:**
- Background shape (rectangle, fill color)
- Border (stroke, optional)
- Shadow (effect, none/subtle/medium/strong)
- Content area (nested group, flexible height)

**Tips:**
- Use auto-layout for flexible content
- Set content area to "fill container"
- Add 16px padding by default
- Make background color swappable

#### Input Component

Text field with all states.

**Main component:** `Input`

**Variants:**
- Property: state (default, focus, error, disabled)
- Property: size (sm, md, lg)
- Property: icon (none, left, right)

**Content:**
- Background rectangle (filled)
- Border (stroke, changes with state)
- Placeholder text (gray, input-only)
- Input text (dark, editable)
- Left icon (optional, swappable)
- Right icon (optional, validation/clear)
- Error text (below, red)

**Component Properties:**
- Label text (editable)
- Placeholder text (editable)
- Error message (editable)
- Icon swap (left/right)

### Publishing Components

**In Figma:**
1. Right-click component → "Publish component"
2. Write description: "Brief usage description"
3. Fill in component documentation
4. Click "Publish"

**In code:**
Publish creates a shareable link. Add to README:

```markdown
### [Button]
(Figma link to Button component)
```

## Design Tokens Variables (Figma V3+)

Figma Variables allow dynamic token management.

### Setup

1. File menu → Variables
2. Create collection: "Mesh Design Tokens"
3. Add color variables:
   - Name: colors/primary/500
   - Value: #279FBD
   - Scopes: Color fill, Color stroke

4. Add typography variables:
   - Font family: Geist
   - Font size: 16px
   - Font weight: 400
   - Line height: 24px

5. Link styles to variables:
   - Select style
   - In design panel, click binding icon
   - Select corresponding variable

### Light/Dark Mode Variables

Create modes for theme switching:

1. Variables panel → Add mode: "Dark"
2. Update color values for dark mode
3. In components, use variable instead of fixed color
4. Figma automatically switches when mode changes

**Example:**
- Variable: `colors/foreground`
- Light mode: #0a0e27
- Dark mode: #f8f9fa
- Component uses this variable → auto-switches

## Style Guide Page

Create documentation page in design file.

**Page layout:**

```
Cover
├── Logo
├── Project name: Mesh
└── Subtitle: Design System

Getting Started
├── Quick links
├── File structure
└── How to use

Colors
├── Primary color with variants
├── Secondary color with variants
├── Semantic colors table
└── Neutral scale

Typography
├── Font family introduction
├── Type scale with sizes
├── Font weights
└── Examples in use

Components
├── Button showcase with variants
├── Card variants
├── Input states
├── Other components...

Patterns
├── Common layouts
├── Form patterns
├── Data table examples
└── Navigation patterns

Accessibility
├── Color contrast guide
├── Focus state examples
├── WCAG checklist
└── Testing tools
```

**Best Practices:**
- Keep guide updated with design changes
- Include live examples of components
- Add before/after screenshots
- Provide usage tips and anti-patterns
- Link to component main file

## Team Collaboration

### File Permissions

**Design System file (shared library):**
- Lead designer: Full edit
- Team members: View only
- Comments enabled: Yes

**Product files:**
- Product lead: Full edit
- Designers: Full edit
- PM/Stakeholders: View only

### Review Process

1. **Designer** creates new component in branch file
2. **Lead designer** reviews against design system
3. **Team** comments with feedback
4. **Designer** implements changes
5. **Lead designer** approves and publishes

### Communication

- Use Figma comments for feedback
- Link to design system standards
- Reference specific tokens/components
- Pin important comments for visibility

## Maintenance

### Weekly Checklist

- [ ] Review pending comments
- [ ] Check for orphaned components
- [ ] Verify color usage consistency
- [ ] Audit unused styles

### Monthly Checklist

- [ ] Update design tokens from code
- [ ] Review new components
- [ ] Identify design debt
- [ ] Plan component improvements
- [ ] Update team on changes

### Quarterly Checklist

- [ ] Comprehensive design audit
- [ ] Performance optimization
- [ ] Accessibility review (WCAG update)
- [ ] Plan next quarter enhancements
- [ ] Gather team feedback

## Plugin Recommendations

### Essential Plugins

| Plugin | Purpose | Why Use |
|--------|---------|---------|
| Design Tokens | Token management | Auto-generate styles from JSON |
| Figma Tokens | Alternative token tool | Variable-based workflows |
| Color Styles | Color organization | Manage large color systems |
| Typescale | Typography management | Maintain type scales |
| Stark | Accessibility testing | WCAG compliance checking |

### Productivity Plugins

| Plugin | Purpose |
|--------|---------|
| Content Reel | Design realistic mockups |
| Unsplash | Get free placeholder images |
| Lorem ipsum | Generate placeholder text |
| Icons | Insert icons from various sets |
| A11y - Color Contrast Checker | Test contrast ratios |

### Installation

1. File menu → Plugins → Browse all plugins
2. Search plugin name
3. Click "Install"
4. Close browser
5. Plugin available in Figma

## Export & Handoff

### For Developers

1. Select component → Right-click → "Copy as code"
2. Or use Figma Dev Mode for live inspection
3. Developers can measure, inspect properties
4. Copy style values directly from Figma

### For Product Teams

1. Export component library as PDF
2. Include design tokens spreadsheet
3. Provide Figma link with view access
4. Create usage guidelines document

### For Stakeholders

1. Create shareable prototype
2. Include interactive states
3. Add design rationale
4. Link to design system docs

## Version Control

### Naming Conventions

**Files:**
- Mesh Design System v1.0
- Mesh Products - Q2 2024
- Mesh Prototype - Feature X

**Components:**
- Button / Primary / Medium / Default
- Card / Elevated / Interactive
- Input / Error / With Icon

**Pages:**
- 🎨 Colors & Tokens
- 📝 Typography
- 🧩 Components
- 📋 Patterns
- 📖 Documentation

### Change Documentation

When updating design system:

1. Update `tokens.json` in code
2. Update Figma file
3. Write changelog entry
4. Publish updated components
5. Notify team of changes

**Changelog format:**
```
## Version 2.0 (2024-Q3)

### New
- Added dark mode support
- New Card variants

### Changed
- Updated primary color to #279FBD
- Improved spacing scale

### Fixed
- Button focus states
- Input error styling

### Deprecated
- Old Button secondary variant
```

## Migration Guide

### From Previous Design System

If migrating from existing system:

1. Audit current components
2. Create mapping: old → new design system
3. Update production files incrementally
4. Archive old library with date
5. Link new library in all files
6. Schedule team training

**Timeline:**
- Week 1: Set up new library
- Week 2: Create core components
- Week 3: Migrate product files (batch 1)
- Week 4: Migrate remaining files
- Week 5: Remove old library access
- Week 6: Archive and document

## Training Materials

### For Designers

- Video: Component variants tutorial
- Video: Using design tokens
- Guide: Creating new components
- Checklist: Design review

### For Developers

- Video: Implementing components
- Video: Using CSS custom properties
- Guide: Responsive design patterns
- Checklist: Code review

### For PMs/Stakeholders

- Video: Design system overview (5 min)
- PDF: Component showcase
- Link: Live component examples
- PDF: Design principles

## Troubleshooting

### Component Issues

**Problem:** Components showing old values after update
- Solution: Right-click component → "Update main component"
- Check: Are instances syncing properly?
- Rebuild: Export and reimport tokens.json

**Problem:** Text overflowing in components
- Solution: Adjust component width/height constraints
- Use: Auto-layout with flexible sizing
- Check: Content layer constraints

**Problem:** Colors changing unexpectedly
- Solution: Check if color variable mode switched
- Verify: Style is linked to correct variable
- Update: Color variable in Variables panel

### Publishing Issues

**Problem:** "Could not publish component"
- Check: File is team file (not personal)
- Check: Library sharing enabled
- Check: Component has valid name
- Try: Rename component, republish

**Problem:** Instances not updating after publish
- Solution: Click "Update main component" on instance
- Check: File has latest library version
- Refresh: Close and reopen file

### Token Import Issues

**Problem:** "Invalid JSON"
- Check: JSON is properly formatted (jsonlint.com)
- Check: All color values are valid hex
- Verify: No trailing commas or syntax errors

**Problem:** Styles not generating
- Check: Token names follow convention
- Verify: Plugin has file edit permissions
- Try: Manually create 1 style, then re-import

## Useful Resources

- [Figma Design Systems](https://www.figma.com/design-systems/)
- [Design Tokens Community](https://www.designtokens.org/)
- [Figma Plugins Directory](https://www.figma.com/plugins)
- [Typography Best Practices](https://www.smashingmagazine.com/)
- [WCAG Accessibility](https://www.w3.org/WAI/WCAG21/quickref/)

## Contact & Support

- **Design System Lead:** [Name] (@slack)
- **Questions:** Post in #design-system Slack
- **Issues:** Open issue in design-system repo
- **Feedback:** Monthly design reviews

---

Last updated: April 2024
Next review: July 2024
