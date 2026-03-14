# Color Usage Guidelines

## Overview

This project uses a **centralized, semantic color system** with zero hardcoded values. All colors are managed through design tokens that flow through CSS variables to Tailwind utilities.

## Architecture

```
Design Tokens (design-tokens.ts)
    ↓
CSS Variables (index.css)
    ↓
Tailwind Config (tailwind.config.ts)
    ↓
Component Classes
```

---

## 🎨 Available Color Tokens

### 1. Primary (Role-Based)

**Use for**: Brand elements, interactive components, highlights

```tsx
// Text
className = 'text-primary'

// Background
className = 'bg-primary'
className = 'bg-primary/10' // 10% opacity
className = 'bg-primary/20' // 20% opacity

// Border
className = 'border-primary'
className = 'border-primary/20' // subtle borders

// Gradient
className = 'bg-primary-gradient'
```

**Behavior**: Color adapts based on user role

- Hotel Manager → Purple (#9D4EDD)
- Traveller → Rose (#FF385C)
- Tour Operator → Emerald (#10B981)

---

### 2. Semantic Colors

#### ✅ Success (Green)

**Use for**: Confirmations, completed states, positive trends

```tsx
className = 'text-success' // Text
className = 'bg-success-foreground' // Light background
className = 'bg-success/10' // 10% opacity bg
className = 'border-success' // Border
```

#### ⚠️ Warning (Amber)

**Use for**: Alerts, pending states, approaching limits

```tsx
className = 'text-warning'
className = 'bg-warning-foreground'
className = 'bg-warning/10'
className = 'border-warning'
```

#### ❌ Error (Red)

**Use for**: Validation errors, failed states, critical issues

```tsx
className = 'text-error'
className = 'bg-error-foreground'
className = 'bg-error/10'
className = 'border-error'
className = 'focus:border-error' // Form validation
className = 'focus:ring-error'
```

#### ℹ️ Info (Blue)

**Use for**: Helpful hints, informational badges, neutral actions

```tsx
className = 'text-info'
className = 'bg-info-foreground'
className = 'bg-info/10'
className = 'border-info'
```

---

### 3. Neutral Colors (Gray)

**Use for**: Text, backgrounds, borders - NOT role-specific

```tsx
// Text
className = 'text-gray-500' // Secondary text
className = 'text-gray-700' // Primary text
className = 'text-gray-900' // Headings

// Backgrounds
className = 'bg-gray-50' // Subtle backgrounds
className = 'bg-gray-100' // Cards, sections
className = 'bg-white' // Main backgrounds

// Borders
className = 'border-gray-200' // Default borders
className = 'border-gray-300' // Emphasized borders
```

---

## 📋 Common Use Cases

### Form Validation

```tsx
// Valid input
<input
  className={cn(
    "border-gray-200",
    isValid && "border-success focus:ring-success"
  )}
/>

// Invalid input
<input
  className={cn(
    "border-gray-200",
    !isValid && "border-error bg-error/10 focus:border-error focus:ring-error"
  )}
/>

// Error message
<p className="text-sm text-error">Email is required</p>

// Success message
<p className="text-sm text-success">Profile updated!</p>
```

### Status Badges

```tsx
// Booking status
const STATUS_STYLES = {
  confirmed: 'bg-success-foreground text-success border-success/20',
  pending: 'bg-warning-foreground text-warning border-warning/20',
  cancelled: 'bg-error-foreground text-error border-error/20',
}

;<Badge className={STATUS_STYLES[status]}>{status}</Badge>
```

### Interactive Elements

```tsx
// Primary button
<Button className="bg-primary hover:bg-primary/90 text-white">
  Save
</Button>

// Selected card
<Card className={cn(
  "border-gray-200",
  isSelected && "border-primary bg-primary/5 ring-1 ring-primary"
)}>
```

### Stat Cards (Trends)

```tsx
<div className={cn('flex items-center gap-1', isPositive ? 'text-success' : 'text-error')}>
  <TrendIcon className="w-4 h-4" />
  <span>{change}%</span>
</div>
```

---

## 🧊 Glassmorphism (Enterprise Pattern)

Shared glass styles are tokenized and centrally maintained in one place:

- Glass tokens: `src/index.css` in `:root` and `.dark`
- Shared utilities: `src/index.css` under `@layer utilities` (`.glass*` classes)

### Glass Token Contract

Use these variables only when changing global glass look:

- `--glass-light`
- `--glass-strong`
- `--glass-dark`
- `--glass-border`
- `--glass-shadow`
- `--glass-overlay`

### Rule for Contributors

- Keep component code role-agnostic: use `.glass-card`, `.glass-nav`, `.glass-button`, etc.
- Do not hardcode RGBA colors inside components for glass behavior.
- Tune intensity by changing the token values once in `index.css`, not per screen.

### Safe Update Workflow

1. Adjust glass token values in `:root` and `.dark`.
2. Verify key shared utilities: `.glass`, `.glass-card`, `.glass-nav`, `.glass-overlay`, `.glass-search`.
3. Validate in at least one light and one dark screen using the same utility class.

### Example

```tsx
// ✅ Preferred: consume shared utility
<div className="glass-card rounded-2xl border border-border/60 p-6" />

// ❌ Avoid: inline one-off glass color math
<div className="backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.7)' }} />
```

---

## ❌ Forbidden Patterns

### Never Use Hardcoded Colors

```tsx
// ❌ WRONG
<div style={{ color: '#9D4EDD' }} />
<svg fill="#FF385C" />
className="text-blue-600"
className="bg-purple-100"

// ✅ CORRECT
className="text-primary"
className="bg-primary/10"
className="text-success"
className="bg-info-foreground"
```

### Never Use Arbitrary Tailwind Color Classes

```tsx
// ❌ WRONG
className = 'text-red-500'
className = 'bg-green-50'
className = 'border-amber-200'
className = 'hover:bg-blue-100'

// ✅ CORRECT
className = 'text-error'
className = 'bg-success-foreground'
className = 'border-warning/20'
className = 'hover:bg-info/10'
```

---

## 🎯 Quick Reference

| Context        | Color Token            | Example                                 |
| -------------- | ---------------------- | --------------------------------------- |
| Brand elements | `primary`              | `text-primary`, `bg-primary-gradient`   |
| Success states | `success`              | `text-success`, `bg-success-foreground` |
| Warnings       | `warning`              | `text-warning`, `bg-warning/10`         |
| Errors         | `error`                | `border-error`, `text-error`            |
| Info hints     | `info`                 | `text-info`, `bg-info-foreground`       |
| Text content   | `gray-700/800/900`     | `text-gray-700`                         |
| Backgrounds    | `gray-50/100`, `white` | `bg-gray-50`                            |
| Borders        | `gray-200/300`         | `border-gray-200`                       |

---

## 🔍 Verification

Before committing, run these checks:

```bash
# Find hardcoded hex values (should return 0 results)
rg "#[0-9A-Fa-f]{6}" --type tsx --type ts -g '!index.css' -g '!tailwind.config.ts' -g '!design-tokens.ts'

# Find arbitrary color classes (should only find gray-*)
rg "(text|bg|border)-(red|blue|green|yellow|purple|pink|indigo|orange|amber)-(\\d{2,3})" --type tsx
```

---

## 📚 See Also

- Design Tokens: `src/config/design-tokens.ts`
- CSS Variables and Glass Tokens: `src/index.css`
- Tailwind Config: `tailwind.config.ts`
- Implementation Plan: `centralized_color_system_plan.md`
