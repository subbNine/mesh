# Typography System

## Font Family: Geist

**Geist** is a modern, carefully crafted sans-serif typeface by Vercel. It's built for interfaces with excellent readability at all sizes.

### Installation

Geist is included in the project via Next.js Google Fonts:

```tsx
// app/layout.tsx
import { Geist, Geist_Mono } from 'next/font/google'

const geist = Geist({ subsets: ['latin'] })
const geistMono = Geist_Mono({ subsets: ['latin'] })
```

### Font Weights Available

- **300** - Light (rarely used, for decorative text)
- **400** - Regular/Normal (default body text)
- **500** - Medium (secondary headings, emphasis)
- **600** - Semibold (primary headings, strong emphasis)
- **700** - Bold (headings, strong emphasis)

**Recommendation**: Use weights 400, 600, and 700 for best results. Use 500 sparingly.

## Type Scale

A carefully balanced hierarchy that scales with screen size.

### Heading Sizes

```
Display (48px / 56px line-height)
  - Hero sections, main page title
  - Font-weight: 600
  - Letter-spacing: -0.02em
  
Heading 1 (36px / 40px line-height)
  - Page headings, major sections
  - Font-weight: 600
  - Letter-spacing: -0.02em

Heading 2 (30px / 36px line-height)
  - Section headings, subsections
  - Font-weight: 600
  - Letter-spacing: -0.02em

Heading 3 (24px / 32px line-height)
  - Card titles, component headings
  - Font-weight: 600
  - Letter-spacing: -0.02em

Heading 4 (20px / 28px line-height)
  - Small component titles
  - Font-weight: 600
  - Letter-spacing: -0.01em

Heading 5 (18px / 28px line-height)
  - Labels, callouts
  - Font-weight: 500
  - Letter-spacing: normal
```

### Body Text Sizes

```
Large (18px / 28px line-height)
  - Introductory paragraphs
  - Feature descriptions
  - Font-weight: 400

Body (16px / 24px line-height)
  - Primary body text
  - Standard paragraph copy
  - Font-weight: 400
  - This is the default size

Small (14px / 20px line-height)
  - Secondary text, metadata
  - Helper text, labels
  - Font-weight: 400

Caption (12px / 16px line-height)
  - Timestamps, fine print
  - Placeholder text
  - Font-weight: 400
  - Minimum readable size
```

## Responsive Type Scale

Text scales responsively with viewport:

```
Mobile (< 640px):
  Display: 36px
  H1: 28px
  H2: 24px
  H3: 20px
  H4: 18px
  Body: 16px

Tablet (640px - 1024px):
  Display: 42px
  H1: 32px
  H2: 26px
  H3: 22px
  H4: 18px
  Body: 16px

Desktop (> 1024px):
  Display: 48px
  H1: 36px
  H2: 30px
  H3: 24px
  H4: 20px
  Body: 16px
```

## Line Height

Proper line height is crucial for readability and visual hierarchy.

### Line Height Values

```
Tight (1.2):       Use for headings, display text
Normal (1.5):      Use for body text, standard paragraphs
Relaxed (1.625):   Use for long-form content
Loose (2):         Rarely used, for very small text
```

### Guidelines

- **Headings**: 1.2 (tight) - creates visual impact and authority
- **Body**: 1.5 (normal) - optimal reading comfort
- **Long text**: 1.625 (relaxed) - easier to scan longer passages
- **Never** use line-height less than 1.2 for body text
- **Never** use line-height more than 2 without reason

## Letter Spacing

Adjust spacing between letters to improve readability and tone.

```
Tight (-0.02em):    Headings (Display, H1, H2, H3)
Normal (0em):       Default, body text
Wide (0.02em):      All caps labels, special text
```

### Examples

**Heading (tight spacing):**
```
font-size: 36px
letter-spacing: -0.02em  (makes it -0.72px)
font-weight: 600
```

**Body (normal):**
```
font-size: 16px
letter-spacing: 0  (normal)
font-weight: 400
```

## Text Hierarchy Example

```
✓ CORRECT HIERARCHY

Display (48px, 600, -0.02em)
Main Heading

Heading 2 (30px, 600, -0.02em)
Section Title

Heading 4 (20px, 500, 0em)
Component Title

Body (16px, 400, normal, 1.5 line-height)
This is the main body text that users will read.
It should be comfortable to read for long periods.

Caption (12px, 400, 0.5 opacity)
Metadata and helper text
```

## Usage Guidelines

### Do's ✓

- **Use text-balance** for headings: `<h1 class="text-balance">Your Heading</h1>`
- **Use text-pretty** for long paragraphs: `<p class="text-pretty">Long text...</p>`
- **Maintain 1.5x line-height** for body text minimum
- **Group related text** with consistent spacing
- **Use bold** (600-700) for emphasis in body text
- **Use 16px base font** for body text
- **Scale with breakpoints** using responsive classes
- **Test readability** at actual screen sizes

### Don'ts ✗

- **Don't use fonts below 12px** - too small, unreadable
- **Don't exceed 75 characters per line** - hard to track
- **Don't use ALL CAPS** - except headings and labels
- **Don't use more than 2 font weights** in a single section
- **Don't use justified text** - creates uneven spacing
- **Don't change line-height** on the fly - stick to scale
- **Don't use decorative fonts** for body copy
- **Don't forget to test** in dark mode

## Tailwind CSS Classes

All typography is managed through Tailwind CSS classes using semantic naming:

```tsx
// Headings
<h1 className="text-4xl font-bold">Display</h1>
<h2 className="text-3xl font-semibold">Heading 1</h2>
<h3 className="text-2xl font-semibold">Heading 2</h3>
<h4 className="text-xl font-semibold">Heading 3</h4>
<h5 className="text-lg font-medium">Heading 4</h5>

// Body
<p className="text-base font-normal leading-relaxed">Body text</p>
<p className="text-sm">Small text</p>
<p className="text-xs">Caption</p>

// Combinations
<h2 className="text-2xl font-semibold leading-tight text-balance">
  Section Heading
</h2>

<p className="text-base leading-relaxed text-foreground/80 text-pretty">
  Long paragraph with optimized line breaking
</p>
```

## Dark Mode Text Colors

Text colors automatically adjust for dark mode using CSS custom properties:

```css
/* Light Mode (automatic) */
color: var(--foreground);  /* #0a0e27 navy */

/* Dark Mode (automatic) */
.dark {
  color: var(--foreground);  /* #f8f9fa off-white */
}
```

### Secondary Text

For secondary or muted text, reduce opacity:

```tsx
<p className="text-foreground/60">Secondary text</p>
<p className="text-foreground/40">Tertiary text</p>
```

## Code/Monospace Text

Use Geist Mono for code, technical content, and user inputs.

```tsx
import { Geist_Mono } from 'next/font/google'

<code className="font-mono text-sm">const x = 42;</code>
<pre className="font-mono text-xs bg-slate-100 p-4">
  Code block
</pre>
```

### Monospace Usage

- **Inline code**: `<code>variable</code>`
- **Code blocks**: `<pre><code>...</code></pre>`
- **Technical labels**: User IDs, API keys, tokens
- **Data values**: Numbers, formulas, technical data

## Text Alignment

### Paragraph Alignment

```tsx
<p className="text-left">Left aligned (default)</p>
<p className="text-center">Center aligned</p>
<p className="text-right">Right aligned</p>
<p className="text-justify">Justified (rarely used)</p>
```

**Recommendation**: Use `text-left` for body text, `text-center` for headings and CTAs.

## Text Overflow & Truncation

### Single Line Truncation

```tsx
<p className="truncate">Long text that will be cut off...</p>
```

### Multi-line Truncation

```tsx
<p className="line-clamp-2">
  Text limited to 2 lines with ellipsis at end
</p>
```

### No Wrapping

```tsx
<p className="whitespace-nowrap">Never wraps to next line</p>
```

## Text Transform

```tsx
<p className="uppercase">all caps text</p>
<p className="lowercase">ALL CAPS TEXT</p>
<p className="capitalize">capitalize each word</p>
<p className="normal-case">Normal casing</p>
```

**Use sparingly**: Only for labels, headings, and decorative text.

## Selection & Highlighting

### User Text Selection

```css
/* Good: Highlight important selections */
.text-selectable::selection {
  background-color: var(--primary);
  color: var(--primary-foreground);
}

/* Avoid selecting specific elements */
.text-no-select {
  user-select: none;  /* Only when necessary */
}
```

## Links & Interactive Text

### Link Styling

```tsx
<a href="/" className="text-primary hover:text-primary-600 underline">
  Link text
</a>
```

### Link States

- **Default**: Teal (#279FBD), underlined
- **Hover**: Darker teal (#1f7fa3)
- **Active**: Darkest teal (#195f82)
- **Focus**: Teal outline with offset
- **Visited**: (Optional) Muted teal

## Accessibility

### Readability Standards

1. **Font size**: Never below 12px for body text
2. **Line height**: 1.5x minimum for comfortable reading
3. **Contrast**: 7:1 ratio for WCAG AAA compliance
4. **Line length**: 45-75 characters per line
5. **Word spacing**: Use default unless justified text
6. **Letter spacing**: Only adjust for display text

### Testing

- Test with [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Test with screen reader (VoiceOver, NVDA, Jaws)
- Test at 200% zoom level
- Test with dyslexia-friendly settings
- Test on actual devices at actual distances

## Implementation Patterns

### Standard Paragraph

```tsx
<p className="text-base font-normal leading-relaxed text-foreground">
  This is a standard paragraph with optimal readability settings.
</p>
```

### Long-form Content

```tsx
<article className="prose prose-lg">
  <h2 className="text-3xl font-semibold text-balance">
    Article Title
  </h2>
  <p className="text-lg leading-relaxed text-pretty">
    Long introduction paragraph...
  </p>
</article>
```

### Form Labels

```tsx
<label className="text-sm font-medium text-foreground">
  Label text
</label>
```

### Helper Text

```tsx
<p className="text-sm text-foreground/60">
  Helper or hint text
</p>
```

### Error Message

```tsx
<p className="text-sm font-medium text-destructive">
  Error message explaining the issue
</p>
```

## Troubleshooting

### Text Too Blurry
- Increase font size to 14px minimum
- Increase line-height to 1.5x
- Use font-weight 400 or 600 (avoid 500)

### Text Hard to Read
- Check contrast ratio (should be 7:1+)
- Increase letter-spacing on large text
- Reduce line length to 45-75 characters

### Poor Hierarchy
- Use size, weight, and color to create distinction
- Maintain consistent scaling between sizes
- Test on actual devices at reading distance

### Inconsistent Spacing
- Use predefined line-height values
- Use margin/padding scale (4px, 8px, 16px, etc.)
- Don't manually adjust spacing between specific elements

## Further Reading

- [Geist Font Family](https://vercel.com/font)
- [Web Typography Best Practices](https://www.smashingmagazine.com/2009/03/css-typography-guide-to-techniques-and-tools/)
- [Accessible Typography](https://www.a11y-101.com/design/typography)
- [Tailwind Typography](https://tailwindcss.com/docs/font-size)
