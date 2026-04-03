# Component Library

Complete documentation for Mesh design system components with variants, states, and usage patterns.

## Button

The most common interactive element. Mesh buttons come in 4 variants with consistent behavior.

### Button Variants

#### Primary Button
Main call-to-action. Use for the most important action on a page.

```tsx
<button className="bg-primary hover:bg-primary-600 active:bg-primary-700 
                   text-primary-foreground px-4 py-2 rounded-lg 
                   font-medium transition-colors">
  Primary Action
</button>
```

**States:**
- Default: Teal background (#279FBD), white text
- Hover: Teal 600 (#1f7fa3)
- Active: Teal 700 (#195f82)
- Focus: Teal outline (3px, 2px offset)
- Disabled: Gray text on gray background (50% opacity)

**Usage:**
- Submit forms
- Save changes
- Create new items
- Primary navigation actions

#### Secondary Button
Alternative action. Use for secondary or less important actions.

```tsx
<button className="bg-secondary hover:bg-secondary-100 border border-border
                   text-foreground px-4 py-2 rounded-lg 
                   font-medium transition-colors">
  Secondary Action
</button>
```

**States:**
- Default: Light gray background (#f0f2f5), dark text
- Hover: Light gray (#e9ecef) with teal border
- Active: Light gray (#e9ecef)
- Focus: Teal outline (3px)
- Disabled: Gray text on light gray (50% opacity)

**Usage:**
- Cancel dialogs
- Reset forms
- Alternative navigation
- Less important actions

#### Tertiary Button
Minimal action. Use for low-priority or text-only actions.

```tsx
<button className="text-primary hover:bg-primary-50 active:bg-primary-100
                   px-4 py-2 rounded-lg font-medium transition-colors">
  Tertiary Action
</button>
```

**States:**
- Default: Teal text, transparent background
- Hover: Teal 50 background (#e8f5fa)
- Active: Teal 100 background (#c9eaf5)
- Focus: Teal outline
- Disabled: Gray text (50% opacity)

**Usage:**
- Learn more links
- View details
- Optional actions
- Inline text actions

#### Destructive Button
Warning action. Use only for destructive actions that cannot be undone.

```tsx
<button className="bg-destructive hover:bg-red-600 active:bg-red-700
                   text-white px-4 py-2 rounded-lg 
                   font-medium transition-colors">
  Delete
</button>
```

**States:**
- Default: Red background (#EA3E37), white text
- Hover: Darker red
- Active: Much darker red
- Focus: Red outline (3px)
- Disabled: Gray with white text (50% opacity)

**Usage:**
- Delete items
- Remove users
- Cancel memberships
- Irreversible actions

### Button Sizes

```tsx
// Small (24px height)
<button className="px-3 py-1 text-sm rounded-md">Small</button>

// Medium (40px height) - DEFAULT
<button className="px-4 py-2 text-base rounded-lg">Medium</button>

// Large (48px height)
<button className="px-6 py-3 text-lg rounded-xl">Large</button>

// Icon only
<button className="p-2 rounded-lg" aria-label="Action">
  <Icon className="w-5 h-5" />
</button>
```

### Button with Icon

```tsx
<button className="inline-flex items-center gap-2 bg-primary text-white 
                   px-4 py-2 rounded-lg">
  <Icon className="w-4 h-4" />
  <span>Action with icon</span>
</button>
```

### Button States

```tsx
// Loading state - show spinner
<button disabled className="opacity-75">
  <Spinner className="w-4 h-4 mr-2" />
  Loading...
</button>

// Disabled state
<button disabled className="opacity-50 cursor-not-allowed">
  Disabled
</button>

// Active/Selected state
<button className="ring-2 ring-primary bg-primary-50">
  Active
</button>
```

### Button Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | primary \| secondary \| tertiary \| destructive | primary | Visual style variant |
| size | sm \| md \| lg | md | Button size |
| disabled | boolean | false | Disable interaction |
| fullWidth | boolean | false | Stretch to container width |
| icon | ReactNode | undefined | Optional left icon |
| loading | boolean | false | Show loading spinner |
| onClick | function | undefined | Click handler |

### Do's & Don'ts

✓ **Do:**
- Use primary for main CTAs
- Group related buttons (cancel + save)
- Use descriptive labels ("Save Changes" not "OK")
- Disable buttons when action unavailable
- Show loading state during async operations

✗ **Don't:**
- Stack more than 3 buttons vertically
- Use all primary buttons on one page
- Make button text all caps
- Use without clear labels
- Mix button styles randomly

---

## Card

Container for grouped content. The foundational component for layouts.

### Basic Card

```tsx
<div className="bg-card border border-border rounded-lg p-4 shadow-sm">
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-sm text-foreground/70">Card content</p>
</div>
```

**Anatomy:**
- Background: White (light) / #131829 (dark)
- Border: 1px, subtle gray
- Padding: 16px (standard)
- Border radius: 8px
- Shadow: Subtle (0 1px 3px)

### Elevated Card

Use for cards that need to stand out or appear above other content.

```tsx
<div className="bg-card border border-border rounded-lg p-4 shadow-md 
                hover:shadow-lg transition-shadow">
  Card content
</div>
```

**Shadow:** 0 4px 6px rgba(0,0,0,0.1)
**Hover:** Increases to 0 10px 15px for depth

### Interactive Card

Clickable card with hover and active states.

```tsx
<button className="w-full text-left bg-card border border-border rounded-lg 
                   p-4 hover:bg-secondary hover:border-primary 
                   active:ring-2 active:ring-primary
                   transition-all">
  <h3 className="font-semibold mb-1">Item</h3>
  <p className="text-sm text-foreground/70">Description</p>
</button>
```

### Card Variants

#### Filled Card
More prominent, for featured content.

```tsx
<div className="bg-secondary rounded-lg p-4">
  Featured content
</div>
```

#### Outlined Card
Minimal style, for subtle content grouping.

```tsx
<div className="border border-border rounded-lg p-4">
  Outlined content
</div>
```

#### Flush Card
No padding/border, for seamless content.

```tsx
<div className="rounded-lg overflow-hidden">
  Content without padding
</div>
```

### Card States

| State | Style | Usage |
|-------|-------|-------|
| Default | Neutral gray border, white background | Standard content grouping |
| Hover | Teal border, shadow increase | Interactive cards only |
| Active | Teal ring (2px), teal border | Selected/expanded cards |
| Disabled | Gray border, muted background (50%) | Unavailable content |
| Error | Red border, light red background | Invalid/problematic content |

### Do's & Don'ts

✓ **Do:**
- Use consistent padding (16px standard)
- Leave space between cards (gap-4)
- Use shadow for hierarchy
- Group related content in cards
- Make interactive cards obvious with hover states

✗ **Don't:**
- Nest too many cards
- Use different padding values
- Make non-interactive cards look clickable
- Overcrowd cards with content
- Use shadow on all cards equally

---

## Input

Text field for user data entry.

### Basic Input

```tsx
<input 
  type="text"
  placeholder="Enter text..."
  className="w-full px-3 py-2 border border-border rounded-lg 
             text-base bg-white text-foreground
             focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
             placeholder:text-foreground/50
             disabled:bg-muted disabled:text-foreground/50 disabled:cursor-not-allowed"
/>
```

### With Label

```tsx
<div className="space-y-2">
  <label className="text-sm font-medium text-foreground">
    Email Address
  </label>
  <input 
    type="email"
    className="w-full px-3 py-2 border border-border rounded-lg..."
  />
</div>
```

### Input States

#### Default
Clean, ready for input

```tsx
<input placeholder="Type here..." />
```

#### Focus
Blue ring around input, teal border

```tsx
<input className="ring-2 ring-primary border-primary" />
```

#### Error
Red border, error message below

```tsx
<div className="space-y-1">
  <input className="border-destructive ring-destructive/10" />
  <p className="text-sm text-destructive">Error message</p>
</div>
```

#### Disabled
Grayed out, not interactive

```tsx
<input disabled className="bg-muted text-foreground/50 cursor-not-allowed" />
```

#### Loading/Validating
Spinner indicates ongoing validation

```tsx
<div className="relative">
  <input />
  <Spinner className="absolute right-3 top-1/2 -translate-y-1/2" />
</div>
```

### Input Sizes

```tsx
// Small (32px)
<input className="px-2 py-1 text-sm" />

// Medium (40px) - DEFAULT
<input className="px-3 py-2 text-base" />

// Large (48px)
<input className="px-4 py-3 text-lg" />
```

### Input with Icon

```tsx
<div className="relative">
  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
  <input className="pl-10 pr-3 py-2" />
</div>
```

### Input Types

Supported types with appropriate styling:

```tsx
<input type="text" />         // Standard text
<input type="email" />        // Email with validation
<input type="password" />     // Hidden characters
<input type="number" />       // Numbers only
<input type="date" />         // Date picker
<input type="time" />         // Time picker
<input type="search" />       // Search field
<input type="url" />          // URL validation
<input type="tel" />          // Phone number
<input type="color" />        // Color picker
```

### Textarea

Multi-line text input.

```tsx
<textarea 
  className="w-full px-3 py-2 border border-border rounded-lg 
             text-base bg-white text-foreground
             focus:ring-2 focus:ring-primary focus:border-transparent
             resize-vertical"
  rows={4}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | string | text | Input type |
| value | string | undefined | Controlled value |
| onChange | function | undefined | Change handler |
| placeholder | string | undefined | Placeholder text |
| disabled | boolean | false | Disable input |
| error | string | undefined | Error message |
| icon | ReactNode | undefined | Left icon |
| size | sm \| md \| lg | md | Input size |

### Do's & Don'ts

✓ **Do:**
- Always have associated labels
- Provide helpful placeholder text
- Show validation errors clearly
- Disable when data unavailable
- Use appropriate input types

✗ **Don't:**
- Use placeholder as label
- Make inputs too wide (max 400px)
- Use multiple errors at once
- Remove focus outline
- Make typing uncomfortable (too small font)

---

## Dialog / Modal

Focused overlay for critical interactions.

### Basic Dialog

```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center 
                z-50 p-4">
  <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
    <h2 className="text-2xl font-semibold mb-4">Dialog Title</h2>
    <p className="text-foreground/70 mb-6">Dialog content</p>
    <div className="flex gap-3 justify-end">
      <button className="text-primary">Cancel</button>
      <button className="bg-primary text-white px-4 py-2 rounded-lg">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### Dialog Variants

#### Confirmation
Asks user to confirm action.

```tsx
<Dialog title="Delete Project?">
  <p>This cannot be undone.</p>
  <div className="flex gap-3 justify-end mt-6">
    <Button variant="secondary">Cancel</Button>
    <Button variant="destructive">Delete</Button>
  </div>
</Dialog>
```

#### Alert
Informs user of important information.

```tsx
<Dialog title="Warning" icon={<AlertIcon />}>
  <p>Something important happened.</p>
  <div className="flex gap-3 justify-end mt-6">
    <Button>Got it</Button>
  </div>
</Dialog>
```

#### Form Dialog
Contains form inputs.

```tsx
<Dialog title="New Project">
  <form className="space-y-4">
    <Input label="Project name" />
    <Input label="Description" />
    <div className="flex gap-3 justify-end mt-6">
      <Button variant="secondary">Cancel</Button>
      <Button type="submit">Create</Button>
    </div>
  </form>
</Dialog>
```

### Dialog States

| State | Usage |
|-------|-------|
| Default | Dialog appears, focus on first input |
| Escape pressed | Close (unless prevented) |
| Click overlay | Close (unless prevented) |
| Form invalid | Disable confirm button, show errors |
| Loading | Show spinner, disable buttons |

### Do's & Don'ts

✓ **Do:**
- Use for critical confirmations only
- Keep content focused and brief
- Always provide cancel option
- Use semantic button arrangement
- Support Escape key to close

✗ **Don't:**
- Stack multiple dialogs
- Use for simple confirmations
- Hide close button
- Auto-close on action (let user confirm)
- Use for information that fits on page

---

## Tabs

Switch between related content sections.

### Basic Tabs

```tsx
<div>
  <div className="flex gap-1 border-b border-border">
    <button className="px-4 py-2 text-sm font-medium border-b-2 
                      border-primary text-primary">
      Active Tab
    </button>
    <button className="px-4 py-2 text-sm font-medium border-b-2 
                      border-transparent text-foreground/60
                      hover:text-foreground">
      Inactive Tab
    </button>
  </div>
  <div className="p-4">
    Tab content
  </div>
</div>
```

### Tab States

- **Active**: Teal underline, teal text
- **Inactive**: Gray text, transparent underline
- **Hover**: Gray text becomes darker
- **Focus**: Teal outline on tab

### Do's & Don'ts

✓ **Do:**
- Use for related content sections
- Show 2-5 tabs maximum
- Use short, descriptive labels
- Preserve scroll position when switching
- Support keyboard navigation (arrow keys)

✗ **Don't:**
- Hide important content in tabs
- Use more than 5 tabs
- Make tab labels too long
- Use for unrelated content
- Forget about keyboard users

---

## Badge / Tag

Small label or status indicator.

### Basic Badge

```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full 
                 text-xs font-medium bg-primary/10 text-primary">
  Badge
</span>
```

### Badge Variants

#### Status Badges

```tsx
<span className="px-2.5 py-0.5 rounded-full text-xs font-medium 
                 bg-green-100 text-green-800">
  Active
</span>

<span className="px-2.5 py-0.5 rounded-full text-xs font-medium 
                 bg-yellow-100 text-yellow-800">
  Pending
</span>

<span className="px-2.5 py-0.5 rounded-full text-xs font-medium 
                 bg-red-100 text-red-800">
  Inactive
</span>
```

#### Color Variants

- **Teal**: Primary status
- **Blue**: Secondary status
- **Purple**: Special/unique status
- **Gold**: High importance
- **Gray**: Neutral/default

### Badge with Icon

```tsx
<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full 
                 text-xs font-medium bg-primary/10 text-primary">
  <Icon className="w-3 h-3" />
  Badge with icon
</span>
```

### Do's & Don'ts

✓ **Do:**
- Use for status, categories, tags
- Keep text short (1-3 words)
- Use consistent colors for status
- Make easily scannable
- Combine with icons for clarity

✗ **Don't:**
- Use excessive badges
- Make badges interactive unless necessary
- Use confusing color combinations
- Forget contrast (AAA standard)
- Use too many color variants

---

## Alert / Toast

Temporary or persistent feedback messages.

### Alert

Persistent message in context.

```tsx
<div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
  <div className="flex gap-3">
    <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
    <div>
      <h3 className="font-semibold text-primary">Info Title</h3>
      <p className="text-sm text-primary/80">Alert message</p>
    </div>
  </div>
</div>
```

### Alert Variants

#### Success
```tsx
<div className="bg-green-50 border border-green-200 text-green-800">
  Success message
</div>
```

#### Error
```tsx
<div className="bg-red-50 border border-red-200 text-red-800">
  Error message
</div>
```

#### Warning
```tsx
<div className="bg-yellow-50 border border-yellow-200 text-yellow-800">
  Warning message
</div>
```

#### Info
```tsx
<div className="bg-blue-50 border border-blue-200 text-blue-800">
  Info message
</div>
```

### Toast

Temporary notification that auto-dismisses.

```tsx
<div className="fixed bottom-4 right-4 bg-foreground text-white 
                px-4 py-3 rounded-lg shadow-lg animate-in 
                slide-in-from-bottom-4 fade-in
                z-50">
  <p className="text-sm">Action completed successfully</p>
</div>
```

### Toast States

- Appears with animation
- Visible for 3-5 seconds
- Auto-dismisses with fade-out animation
- Can be manually dismissed
- Stack multiple toasts

### Do's & Don'ts

✓ **Do:**
- Use appropriate type (info, success, error, warning)
- Keep messages brief and actionable
- Auto-dismiss only non-critical messages
- Stack toasts (max 3)
- Test message readability

✗ **Don't:**
- Use for trivial information
- Keep critical messages brief (too brief)
- Auto-dismiss errors
- Cover important content
- Use multiple alert types simultaneously

---

## Spacing & Layout Patterns

Standard layout components using the spacing scale.

### Page Container

```tsx
<div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
  Content
</div>
```

### Grid Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</div>
```

### Flex Layout

```tsx
<div className="flex items-center justify-between gap-4">
  <h1>Title</h1>
  <Button>Action</Button>
</div>
```

### Stack Layout

```tsx
<div className="space-y-4">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</div>
```

---

## Component Documentation

Each component includes:

1. **Basic Usage** - Simple, clear examples
2. **Variants** - Style options and when to use each
3. **States** - Default, hover, focus, disabled, error
4. **Accessibility** - WCAG compliance, keyboard nav
5. **Props** - Complete prop documentation
6. **Do's & Don'ts** - Best practices and anti-patterns
7. **Troubleshooting** - Common issues and solutions

## Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| Button | ✅ Done | All variants implemented |
| Card | ✅ Done | All variants available |
| Input | ✅ Done | All types supported |
| Dialog | ✅ Done | Accessible focus management |
| Tabs | ✅ Done | Keyboard navigation included |
| Badge | ✅ Done | Status variants ready |
| Alert | ✅ Done | All severity levels |
| Toast | ✅ Done | Animation smooth |
| Sidebar | ✅ In Progress | Navigation structure |
| Dropdown | 🚧 Planned | Accessibility testing |
| Datepicker | 🚧 Planned | Range selection |
| Tooltip | 🚧 Planned | Positioning logic |
| Popover | 🚧 Planned | Collision detection |

## Extending Components

To create new components:

1. Follow the anatomy patterns established here
2. Use design tokens for all colors, spacing, sizes
3. Test accessibility (keyboard, screen reader)
4. Support dark mode automatically
5. Document props, variants, and states
6. Add to component library status table

See CONTRIBUTING.md for detailed guidelines.
