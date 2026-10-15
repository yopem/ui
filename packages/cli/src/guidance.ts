export type Guidance = "design" | "agents" | "none"

export function isGuidance(value: string | undefined): value is Guidance {
  return value === "design" || value === "agents" || value === "none"
}

const begin = "<!-- BEGIN:yopem-ui-design -->"

const end = "<!-- END:yopem-ui-design -->"

export function designGuidance(content: string, importPrefix = "@/") {
  const block = `${begin}
## Yopem UI design system

### Source and imports

Yopem UI provides source-owned React components with TypeScript, Base UI, and StyleX.
Init installs only base files. Install each component before you use it.
Use the installed source and component documentation as the API reference.

- Import components from \`${importPrefix}components/ui/<name>\`.
- Import semantic tokens from \`${importPrefix}styles/tokens.stylex\`.
- Import StyleX helpers from \`${importPrefix}lib/stylex\`.
- Keep \`${importPrefix}styles/styles.css\` loaded at the application root.
- Keep the \`@stylex;\` directive and CSS layer order intact.
- Use named function exports for React components.
- Keep \`"use client"\` in client components.
- Preserve public exports, consumer props, refs, \`className\`, and \`data-slot\` values.

### Visual foundations

Use neutral light and dark surfaces with semantic color pairs.
Use background/foreground, primary, secondary, muted, accent, card, and popover tokens.
Use destructive, success, warning, and info tokens for status.
Do not replace semantic tokens with raw palette values when a token exists.

Use Inter for body text and headings.
Use IBM Plex Mono for code and mono text.
Font tokens specify these families. Load both fonts in the application.

Use \`tokens["--spacing"]\` for spacing. Its default is \`0.25rem\`.
Stack, VStack, and HStack use four spacing units by default.
Use radius tokens: sm \`0.375rem\`, md \`0.5rem\`, lg and base \`0.625rem\`, xl \`0.875rem\`.

### Color values

These are Yopem UI defaults from \`tokens.stylex.ts\`.
Use current token and component values when the project has overrides.
Keep the CSS color expressions intact. Transparent colors depend on the surface below them.
Use semantic tokens in styles, not these literal values.

| Token | Light value | Dark value |
| --- | --- | --- |
| \`--accent\` | \`color-mix(in oklab, #000 4%, transparent)\` | \`color-mix(in oklab, #fff 4%, transparent)\` |
| \`--accent-foreground\` | \`oklch(26.9% 0 none)\` | \`oklch(97% 0 none)\` |
| \`--background\` | \`#fff\` | \`color-mix(in srgb, oklch(14.5% 0 none) 96%, #fff)\` |
| \`--border\` | \`color-mix(in oklab, #000 8%, transparent)\` | \`color-mix(in oklab, #fff 6%, transparent)\` |
| \`--card\` | \`#fff\` | \`color-mix( in srgb, color-mix(in srgb, oklch(14.5% 0 none) 96%, #fff) 98%, #fff )\` |
| \`--card-foreground\` | \`oklch(26.9% 0 none)\` | \`oklch(97% 0 none)\` |
| \`--code\` | \`#fff\` | \`color-mix( in srgb, color-mix(in srgb, oklch(14.5% 0 none) 96%, #fff) 98%, #fff )\` |
| \`--code-foreground\` | \`oklch(26.9% 0 none)\` | \`oklch(97% 0 none)\` |
| \`--code-highlight\` | \`color-mix(in oklab, #000 4%, transparent)\` | \`color-mix(in oklab, #fff 4%, transparent)\` |
| \`--destructive\` | \`oklch(63.7% 0.237 25.331)\` | \`color-mix(in srgb, oklch(63.7% 0.237 25.331) 90%, #fff)\` |
| \`--destructive-foreground\` | \`oklch(50.5% 0.213 27.518)\` | \`oklch(70.4% 0.191 22.216)\` |
| \`--foreground\` | \`oklch(26.9% 0 none)\` | \`oklch(97% 0 none)\` |
| \`--info\` | \`oklch(62.3% 0.214 259.815)\` | \`oklch(62.3% 0.214 259.815)\` |
| \`--info-foreground\` | \`oklch(48.8% 0.243 264.376)\` | \`oklch(70.7% 0.165 254.624)\` |
| \`--input\` | \`color-mix(in oklab, #000 10%, transparent)\` | \`color-mix(in oklab, #fff 8%, transparent)\` |
| \`--muted\` | \`color-mix(in oklab, #000 4%, transparent)\` | \`color-mix(in oklab, #fff 4%, transparent)\` |
| \`--muted-foreground\` | \`color-mix(in srgb, oklch(55.6% 0 none) 90%, #000)\` | \`oklch(76% 0 none)\` |
| \`--popover\` | \`#fff\` | \`color-mix( in srgb, color-mix(in srgb, oklch(14.5% 0 none) 96%, #fff) 96%, #fff )\` |
| \`--popover-foreground\` | \`oklch(26.9% 0 none)\` | \`oklch(97% 0 none)\` |
| \`--primary\` | \`oklch(26.9% 0 none)\` | \`oklch(97% 0 none)\` |
| \`--primary-foreground\` | \`oklch(98.5% 0 none)\` | \`oklch(26.9% 0 none)\` |
| \`--ring\` | \`oklch(70.8% 0 none)\` | \`oklch(55.6% 0 none)\` |
| \`--secondary\` | \`color-mix(in oklab, #000 4%, transparent)\` | \`color-mix(in oklab, #fff 4%, transparent)\` |
| \`--secondary-foreground\` | \`oklch(26.9% 0 none)\` | \`oklch(97% 0 none)\` |
| \`--sidebar\` | \`oklch(98.5% 0 none)\` | \`color-mix(in srgb, oklch(14.5% 0 none) 97%, #fff)\` |
| \`--sidebar-accent\` | \`color-mix(in oklab, #000 4%, transparent)\` | \`color-mix(in oklab, #fff 4%, transparent)\` |
| \`--sidebar-accent-foreground\` | \`oklch(26.9% 0 none)\` | \`oklch(97% 0 none)\` |
| \`--sidebar-border\` | \`color-mix(in oklab, #000 6%, transparent)\` | \`color-mix(in oklab, #fff 5%, transparent)\` |
| \`--sidebar-foreground\` | \`color-mix( in srgb, oklch(26.9% 0 none) 64%, oklch(98.5% 0 none) )\` | \`color-mix( in srgb, oklch(97% 0 none) 64%, color-mix(in srgb, oklch(14.5% 0 none) 97%, #fff) )\` |
| \`--sidebar-primary\` | \`oklch(26.9% 0 none)\` | \`oklch(97% 0 none)\` |
| \`--sidebar-primary-foreground\` | \`oklch(98.5% 0 none)\` | \`oklch(26.9% 0 none)\` |
| \`--sidebar-ring\` | \`oklch(70.8% 0 none)\` | \`oklch(70.8% 0 none)\` |
| \`--success\` | \`oklch(69.6% 0.17 162.48)\` | \`oklch(69.6% 0.17 162.48)\` |
| \`--success-foreground\` | \`oklch(50.8% 0.118 165.612)\` | \`oklch(76.5% 0.177 163.223)\` |
| \`--warning\` | \`oklch(76.9% 0.188 70.08)\` | \`oklch(76.9% 0.188 70.08)\` |
| \`--warning-foreground\` | \`oklch(55.5% 0.163 48.998)\` | \`oklch(82.8% 0.189 84.429)\` |

### Spacing values

The default spacing unit is \`0.25rem\` (4px).
These rows are spacing multipliers, not separate tokens.
Multiply the spacing token in a StyleX \`calc()\` value.
Pixel equivalents assume a 16px root font size.
Spacing-based values change when the spacing token changes.

| Units | Default value | Pixel equivalent |
| --- | --- | --- |
| 0 | \`0rem\` | 0px |
| 0.5 | \`0.125rem\` | 2px |
| 1 | \`0.25rem\` | 4px |
| 1.5 | \`0.375rem\` | 6px |
| 2 | \`0.5rem\` | 8px |
| 3 | \`0.75rem\` | 12px |
| 4 | \`1rem\` | 16px |
| 5 | \`1.25rem\` | 20px |
| 6 | \`1.5rem\` | 24px |
| 8 | \`2rem\` | 32px |
| 10 | \`2.5rem\` | 40px |
| 12 | \`3rem\` | 48px |
| 16 | \`4rem\` | 64px |
| 20 | \`5rem\` | 80px |
| 24 | \`6rem\` | 96px |
| 32 | \`8rem\` | 128px |

Stack, VStack, and HStack gaps use four units: \`1rem\` (16px) by default.

### Typography sizes

These values describe unmodified component defaults.
Heading size follows the rendered heading level. Line height values are unitless.

| Component | Font size | Line height | Font weight |
| --- | --- | --- | --- |
| Text | \`1rem\` (16px) | \`1.5\` | 400 |
| Heading h1 | \`2.25rem\` (36px) | \`1.25\` | 600 |
| Heading h2 | \`1.5rem\` (24px) | \`1.25\` | 600 |
| Heading h3 | \`1.25rem\` (20px) | \`1.25\` | 600 |
| Heading h4 | \`1.125rem\` (18px) | \`1.25\` | 600 |
| Heading h5 | \`1rem\` (16px) | \`1.25\` | 600 |
| Heading h6 | \`0.875rem\` (14px) | \`1.25\` | 600 |

### Control sizes

The responsive breakpoint is \`640px\`.
Input heights exclude the wrapper's 1px borders.
Icon button width equals its height.

| Component size | Height below 640px | Height at 640px and above |
| --- | --- | --- |
| Button xs / icon-xs | \`1.75rem\` (28px) | \`1.5rem\` (24px) |
| Button sm / icon-sm | \`2rem\` (32px) | \`1.75rem\` (28px) |
| Button default / icon | \`2.25rem\` (36px) | \`2rem\` (32px) |
| Button lg / icon-lg | \`2.5rem\` (40px) | \`2.25rem\` (36px) |
| Button xl / icon-xl | \`2.75rem\` (44px) | \`2.5rem\` (40px) |
| Input sm | \`1.875rem\` (30px) | \`1.625rem\` (26px) |
| Input default | \`2.125rem\` (34px) | \`1.875rem\` (30px) |
| Input lg | \`2.375rem\` (38px) | \`2.125rem\` (34px) |

Default Button and Input text uses \`1rem\` (16px) below 640px and \`0.875rem\` (14px) at 640px and above.
Button xs text uses \`0.875rem\` (14px) below 640px and \`0.75rem\` (12px) at 640px and above.
Button xl text uses \`1.125rem\` (18px) below 640px and \`1rem\` (16px) at 640px and above.

### Layout and radius sizes

| Setting | Default value | Pixel equivalent |
| --- | --- | --- |
| Container maximum width | \`90rem\` | 1440px |
| Container inline padding | \`1rem\` (4 spacing units) | 16px |
| Button coarse-pointer target minimum | \`2.75rem\` | 44px |
| \`--radius\` | \`0.625rem\` | 10px |
| \`--radius-sm\` | \`0.375rem\` | 6px |
| \`--radius-md\` | \`0.5rem\` | 8px |
| \`--radius-lg\` | \`0.625rem\` | 10px |
| \`--radius-xl\` | \`0.875rem\` | 14px |

A fluid Container uses full width without a maximum width.

### StyleX composition

- Define local styles with \`stylex.create\` from \`@stylexjs/stylex\`.
- Compose native element styles with \`stylex.props\`.
- Use \`stylexProps\` when merging consumer \`className\` in copied components.
- Keep variants as StyleX style objects.
- Pass component customization through \`xstyle\`.
- Merge consumer \`xstyle\` after defaults and variants.
- Use \`controlXstyle\` for Input and Textarea wrappers. Use \`xstyle\` for their native controls.
- Prefer logical CSS properties, such as \`paddingInline\` and \`inlineSize\`.
- Do not add Tailwind, utility classes, \`cva\`, literal CSS class names, or authored JSX \`style\` props.
- Do not add embedded style blocks or broad SVG and descendant selectors.
- Style owned elements through explicit slots. Keep unavoidable upstream selectors in scoped compatibility CSS.
- Use Lucide icons. Keep Remix Icon only where existing code requires it.

### Layout and typography

Prefer design system primitives in application JSX, including unstyled wrappers and conditional branches.
Preserve semantic elements, native attributes, events, and ref types.

- Start with Box. Its default element is div.
- Use the Box render prop for semantic elements, such as \`render={<section />}\`.
- Use Flex for custom direction and alignment.
- Use Stack or VStack for columns. Use HStack for centered rows.
- Use Grid for columns and rows. Use Center for centering on both axes.
- Use Container for a centered fluid page up to \`90rem\`. Use \`fluid\` for full width.
- Use AbsoluteCenter inside a positioned parent.
- Use Bleed to extend into inline padding. Use Float over a parent's corner.
- Use Wrap for wrapping rows. Customize layout with \`xstyle\`.
- Use Text for paragraphs. Use Heading for semantic headings.
- Heading defaults to h2. Use \`render={<h1 />}\` through h6 for other levels.
- Use Blockquote for quotations, Em for emphasis, and Mark for marked text.
- Use Highlight for matching words. Use Prose for readable long-form content.
- Use Codeblock for code displays. Its wrapper, toolbar, and internal pre cannot replace every native pre.
- Use framework links for application navigation. Native anchors remain valid for navigation and downloads.
- Keep native controls, tables, metadata, SVG, custom elements, strong, and inline code where no equivalent applies.
- Keep native markup inside primitive implementations. Do not wrap primitives recursively.

### Component selection

Use existing components before building substitutes. Check their documented props and slots.

- Forms: Field, Fieldset, Form, Label, Input, Textarea, InputGroup, NativeSelect, Select, Combobox, Autocomplete, NumberField, OTPField.
- Selection: Checkbox, CheckboxGroup, RadioGroup, Switch, Slider, Toggle, ToggleGroup, Rating, Calendar.
- Actions and navigation: Button, Link, Menu, ContextMenu, Toolbar, Tabs, Breadcrumb, Pagination, Sidebar, Steps.
- Overlays: Dialog, AlertDialog, Sheet, Drawer, Popover, Tooltip, PreviewCard.
- Feedback: Alert, Toast, Badge, Progress, Meter, Spinner, Skeleton, Empty, Checkmark.
- Content: Card, Frame, Table, Avatar, Accordion, Collapsible, Separator, ScrollArea, Stat, Kbd, Clipboard, Group, Marquee.

### Themes and accessibility

Keep light and dark theme values complete in \`tokens.stylex.ts\`.
Keep StyleX theme object spreads in that module. Keep the theme marker and root styles intact.
Install the theme item only when theme switching is needed.
Use identical theme configuration in root props, ThemeScript, and ThemeProvider.
Use matching \`defaultTheme\` and \`storageKey\` values in the script and provider.
Pass the CSP nonce to ThemeScript when required.
Keep \`theme.tsx\` server-safe. Only \`theme-provider.tsx\` is a client entry.
Keep ThemeScript synchronous. Keep its \`data-cfasync="false"\` attribute to prevent Rocket Loader deferral.

Preserve Base UI keyboard behavior, focus management, dismissal, and disabled states.
Provide accessible names for controls. Keep visible focus styles and form labels.
Preserve reduced motion and coarse-pointer targets. Do not communicate status through color alone.
Test pointer and keyboard workflows, focus changes, and rendered accessibility states.
${end}`

  const start = content.indexOf(begin)
  const finish = content.indexOf(end)

  if (start === -1 && finish === -1) {
    const separator = content ? (content.endsWith("\n") ? "\n" : "\n\n") : ""

    return `${content}${separator}${block}\n`
  }

  if (
    start === -1 ||
    finish < start ||
    content.includes(begin, start + begin.length) ||
    content.includes(end, finish + end.length)
  ) {
    throw new Error(
      "Invalid Yopem UI guidance markers; review the selected file",
    )
  }

  return content.slice(0, start) + block + content.slice(finish + end.length)
}
