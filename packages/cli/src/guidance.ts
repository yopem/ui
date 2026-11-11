export type Guidance = "design" | "agents" | "none"

export function isGuidance(value: string | undefined): value is Guidance {
  return value === "design" || value === "agents" || value === "none"
}

const begin = "<!-- BEGIN:yopem-ui-design -->"

const end = "<!-- END:yopem-ui-design -->"

export function designGuidance(
  content: string,
  importPrefix = "@/",
  imports = {
    components: `${importPrefix}components/ui`,
    tokens: `${importPrefix}styles/tokens.stylex`,
    lib: `${importPrefix}lib/stylex`,
    css: `${importPrefix}styles/styles.css`,
  },
) {
  const block = `${begin}
## Yopem UI design system

### Source and imports

Yopem UI provides source-owned React components with TypeScript, Base UI, and StyleX.
Init installs only base files. Install each component before you use it.
Use the installed source and component documentation as the API reference.

- Import components from \`${imports.components}/<name>\`.
- Import semantic tokens from \`${imports.tokens}\`.
- Import StyleX helpers from \`${imports.lib}\`.
- Keep \`${imports.css}\` loaded at the application root.
- Keep the \`@stylex;\` directive and CSS layer order intact.
- Use named function exports for React components.
- Keep \`"use client"\` in client components.
- Preserve public exports, consumer props, refs, \`className\`, and \`data-slot\` values.

### Visual foundations

Use neutral light and dark surfaces with semantic color pairs.
Use background/foreground, primary, secondary, muted, accent, card, and popover tokens.
Use destructive, success, warning, and info tokens for status.
Use neutral inverse primary actions.
Keep links and hover surfaces neutral, including on hover. Use \`--ring\` for focus.
Use the blue accent-solid pair for checked and selected indicators.
Use blue for info status and occasional sidebar-primary actions.
Keep the accent and sidebar-accent pairs neutral.
Keep existing color token names. Add tokens when a new role needs them.
Do not replace semantic tokens with raw palette values when a token exists.

Use Geist Sans for body text and headings.
Use Geist Mono for code and mono text.
Font tokens specify these families. Load both fonts in the application.

Use \`tokens["--spacing"]\` for spacing. Its default is \`0.25rem\`.
Stack, VStack, and HStack use four spacing units by default.
Use the main and compact radius defaults below. Other radius tokens are explicit overrides.

Use \`--control-background\` for field surfaces. Use \`--overlay-shell\` for the
outer Dialog, AlertDialog, Sheet, and Command frame. Use the card pair for the
inner surface and footer. Use the popover pair for floating menus, Popover,
Select, and Toast. Use \`--overlay-backdrop\` for overlay backdrops. Do not add
inset highlight shadows. Use \`bordered={false}\` on Input or InputGroup for a
borderless control. Keep the focus indicator. Field and Fieldset are borderless by
default. Use \`bordered\` to add a border and padding to the wrapper only.

### Color values

These are Yopem UI defaults from \`tokens.stylex.ts\`.
Use current token and component values when the project has overrides.
Keep the CSS color values intact.
Use semantic tokens in styles, not these literal values.

| Token | Light value | Dark value |
| --- | --- | --- |
| \`--accent\` | \`#f3f4f6\` | \`#212121\` |
| \`--accent-foreground\` | \`#111111\` | \`#f5f5f5\` |
| \`--accent-solid\` | \`#2563eb\` | \`#2563eb\` |
| \`--accent-solid-foreground\` | \`#fff\` | \`#fff\` |
| \`--background\` | \`#fff\` | \`#090909\` |
| \`--border\` | \`#e5e7eb\` | \`#292929\` |
| \`--control-background\` | \`#fff\` | \`#181818\` |
| \`--overlay-backdrop\` | \`rgb(0 0 0 / 0.7)\` | \`rgb(0 0 0 / 0.7)\` |
| \`--overlay-shell\` | \`#f3f4f6\` | \`#090909\` |
| \`--destructive-hover\` | \`#b91c1c\` | \`#b91c1c\` |
| \`--destructive-solid-foreground\` | \`#fff\` | \`#fff\` |
| \`--card\` | \`#fff\` | \`#111111\` |
| \`--card-border\` | \`#e5e7eb\` | \`#181818\` |
| \`--card-foreground\` | \`#111111\` | \`#f5f5f5\` |
| \`--code\` | \`#fff\` | \`#111111\` |
| \`--code-foreground\` | \`#111111\` | \`#f5f5f5\` |
| \`--code-highlight\` | \`#f3f4f6\` | \`#212121\` |
| \`--destructive\` | \`#dc2626\` | \`#dc2626\` |
| \`--destructive-foreground\` | \`#b91c1c\` | \`#fca5a5\` |
| \`--foreground\` | \`#111111\` | \`#f5f5f5\` |
| \`--info\` | \`#2563eb\` | \`#60a5fa\` |
| \`--info-foreground\` | \`#1d4ed8\` | \`#93c5fd\` |
| \`--input\` | \`#e5e7eb\` | \`#212121\` |
| \`--muted\` | \`#f9fafb\` | \`#111111\` |
| \`--muted-foreground\` | \`#606775\` | \`#a3a3a3\` |
| \`--popover\` | \`#fff\` | \`#181818\` |
| \`--popover-foreground\` | \`#111111\` | \`#f5f5f5\` |
| \`--primary\` | \`#111111\` | \`#f5f5f5\` |
| \`--primary-foreground\` | \`#fff\` | \`#090909\` |
| \`--ring\` | \`#2563eb\` | \`#60a5fa\` |
| \`--secondary\` | \`#f3f4f6\` | \`#212121\` |
| \`--secondary-foreground\` | \`#111111\` | \`#f5f5f5\` |
| \`--sidebar\` | \`#fff\` | \`#090909\` |
| \`--sidebar-accent\` | \`#f3f4f6\` | \`#111111\` |
| \`--sidebar-accent-foreground\` | \`#111111\` | \`#f5f5f5\` |
| \`--sidebar-border\` | \`#e5e7eb\` | \`#181818\` |
| \`--sidebar-foreground\` | \`#606775\` | \`#a3a3a3\` |
| \`--sidebar-primary\` | \`#2563eb\` | \`#2563eb\` |
| \`--sidebar-primary-foreground\` | \`#fff\` | \`#fff\` |
| \`--sidebar-ring\` | \`#2563eb\` | \`#60a5fa\` |
| \`--success\` | \`#059669\` | \`#34d399\` |
| \`--success-foreground\` | \`#047857\` | \`#6ee7b7\` |
| \`--warning\` | \`#d97706\` | \`#fbbf24\` |
| \`--warning-foreground\` | \`#92400e\` | \`#fcd34d\` |

### Shadow values

Use shadow tokens for subtle depth.

| Token | Light value | Dark value |
| --- | --- | --- |
| \`--shadow-lg\` | \`0 0 30px rgb(0 0 0 / 0.04), 0 0 10px rgb(0 0 0 / 0.06)\` | \`0 0 30px rgb(0 0 0 / 0.2), 0 0 10px rgb(0 0 0 / 0.24)\` |
| \`--shadow-md\` | \`0 0 15px rgb(0 0 0 / 0.04), 0 0 2px rgb(0 0 0 / 0.06)\` | \`0 0 15px rgb(0 0 0 / 0.16), 0 0 2px rgb(0 0 0 / 0.24)\` |
| \`--shadow-sm\` | \`0 1px 2px rgb(0 0 0 / 0.05)\` | \`0 1px 2px rgb(0 0 0 / 0.15)\` |

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
| Heading h1 | \`2.25rem\` (36px) | \`1.25\` | 400 |
| Heading h2 | \`1.5rem\` (24px) | \`1.25\` | 400 |
| Heading h3 | \`1.25rem\` (20px) | \`1.25\` | 400 |
| Heading h4 | \`1.125rem\` (18px) | \`1.25\` | 400 |
| Heading h5 | \`1rem\` (16px) | \`1.25\` | 400 |
| Heading h6 | \`0.875rem\` (14px) | \`1.25\` | 400 |

### Control sizes

The responsive breakpoint is \`640px\`.
Input heights exclude the wrapper's 1px borders.
The default Input is 40px high with its borders.
Icon button width equals its height.

| Component size | Height below 640px | Height at 640px and above |
| --- | --- | --- |
| Button xs / icon-xs | \`2rem\` (32px) | \`2rem\` (32px) |
| Button sm / icon-sm | \`2rem\` (32px) | \`2rem\` (32px) |
| Button default / icon | \`2.5rem\` (40px) | \`2.5rem\` (40px) |
| Button lg / icon-lg | \`3rem\` (48px) | \`3rem\` (48px) |
| Button xl / icon-xl | \`3rem\` (48px) | \`3rem\` (48px) |
| Input sm | \`1.875rem\` (30px) | \`1.875rem\` (30px) |
| Input default | \`2.375rem\` (38px) | \`2.375rem\` (38px) |
| Input lg | \`2.875rem\` (46px) | \`2.875rem\` (46px) |

Default Button and Input text uses \`1rem\` (16px) below 640px and \`0.875rem\` (14px) at 640px and above.
Button xs text uses \`0.875rem\` (14px) below 640px and \`0.75rem\` (12px) at 640px and above.
Button xl text uses \`1.125rem\` (18px) below 640px and \`1rem\` (16px) at 640px and above.
Select defaults to 40px height and 14px text. Its popup uses a soft shadow.
Selected options are blue. Unselected options have a neutral highlight.
Switch has a 37px by 18px visual track and an 8px thumb. Its checked track is
blue. Its off state uses neutral colors. Its coarse-pointer target is at least 44px.

Use \`--radius\` (12px by default) for standard buttons, inputs, cards, dialogs, menus, sidebars, and app surfaces. Use \`--radius-sm\` (8px by default) for compact details. Other radius tokens are explicit overrides. Use xstyle to change corners. Use controlXstyle for Input and Textarea wrappers. Keep functional circles, compact indicators, and edge-attached corners intact.

### Layout and radius sizes

| Setting | Default value | Pixel equivalent |
| --- | --- | --- |
| Container maximum width | \`90rem\` | 1440px |
| Container inline padding | \`1rem\` (4 spacing units) | 16px |
| Button coarse-pointer target minimum | \`2.75rem\` | 44px |
| \`--radius\` | \`0.75rem\` | 12px |
| \`--radius-sm\` | \`0.5rem\` | 8px |
| \`--radius-md\` | \`0.75rem\` | 12px |
| \`--radius-lg\` | \`1rem\` | 16px |
| \`--radius-xl\` | \`2rem\` | 32px |
| \`--radius-full\` | \`9999px\` | 9999px |

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
- Use AspectRatio for a div with CSS \`aspectRatio\`. Its optional numeric \`ratio\` defaults to \`16 / 9\`.
- Nonpositive and nonfinite ratios use the default. AspectRatio does not clip or automatically size children.
- Use List for unordered lists. Use \`List render={<ol />}\` for ordered lists through Base UI \`useRender\`.
- Put native \`start\` and \`reversed\` attributes on the rendered ol.
- Use ListItem for li elements. Import List and ListItem from the same \`list\` module.
- AspectRatio, List, ListItem, Strong, and Figcaption accept \`xstyle\`, \`className\`, native attributes, events, and refs.
- Use Text for paragraphs. Use Heading for semantic headings.
- Heading defaults to h2. Use \`render={<h1 />}\` through h6 for other levels.
- Use Blockquote for quotations, Em for emphasis, Strong for importance, and Mark for marked text.
- Strong renders strong with weight 600 and inherits surrounding typography.
- Use Figcaption inside \`Box render={<figure />}\` for figure captions. There is no Figure primitive.
- Figcaption renders figcaption with muted text, \`0.875rem\` font size, and \`1.5\` line height.
- Use Highlight for matching words. Use Prose for readable long-form content.
- Use Codeblock for code displays. Its wrapper, toolbar, and internal pre cannot replace every native pre.
- Use framework links for application navigation. Native anchors remain valid for navigation and downloads.
- Keep native controls, tables, metadata, SVG, custom elements, and inline code where no equivalent applies.
- Component selection guidance does not expand the lint rule's supported native tags.
- Keep native markup inside primitive implementations. Do not wrap primitives recursively.

### Component selection

Use existing components before building substitutes. Check their documented props and slots.

- Forms: Field, Fieldset, Form, Label, Input, Textarea, InputGroup, NativeSelect, Select, Combobox, Autocomplete, NumberField, OTPField.
- Selection: Checkbox, CheckboxGroup, RadioGroup, Switch, Slider, Toggle, ToggleGroup, Rating, Calendar.
- Actions and navigation: Button, Link, Menu, ContextMenu, Toolbar, Tabs, Breadcrumb, Pagination, Sidebar, Steps.
- Overlays: Dialog, AlertDialog, Sheet, Drawer, Popover, Tooltip, PreviewCard.
- Feedback: Alert, Toast, Badge, Progress, Meter, Spinner, Skeleton, Empty, Checkmark.
- Content: Card, Frame, Table, Avatar, Accordion, Collapsible, Separator, ScrollArea, Stat, Kbd, Clipboard, Group, Marquee.

Use Card with CardHeader, CardPanel, and CardFooter for card content. Set
\`bordered={false}\` to remove the Card border. CardFrame adds an outer frame.
NumberField is compact by default; set \`fullWidth\` to fill its parent. Table
has no body row dividers by default; set \`rowBorders\` to add them.
AutocompleteInput accepts \`controlXstyle\` for its outer Input wrapper.

Dialog, AlertDialog, Sheet, Drawer, and Command popups accept \`frameTitle\` as a
visual caption. Provide a separate accessible title or label. AlertDialog's
close button defaults to visible and cancels; it does not confirm. \`closeProps\`
configures that close control. Drawer hides its close button by default.
CommandDialogPopup includes the Dialog close button.
Drawer uses one sidebar-colored surface for its frame, content, and footer.
Select and Combobox use neutral hover and solid-accent selected rows.
Steps is a static ordered process, not a navigation control.

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
