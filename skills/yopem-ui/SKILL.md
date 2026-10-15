---
name: yopem-ui
description: >-
  Build React interfaces with Yopem UI source-owned components, Base UI, and
  StyleX. Use for component selection and composition, forms, dialogs, selection
  controls, responsive layout, spacing, typography, headings, text, code blocks,
  themes, or component accessibility. Applies to projects with ui.json or
  imports from copied Yopem UI source.
---

# Yopem UI

## Read the project first

1. Read the project's agent instructions, `package.json`, and `ui.json` when
   present.
2. Find the installed component source, token file, and root stylesheet.
3. Read the required component's exports, props, and usage example before
   editing.
4. Check the Oxlint configuration before choosing style overrides.

Yopem UI copies source into the project. It does not provide a component npm
package. Do not install `@yopem-ui/ui` or substitute shadcn/Radix APIs.

The examples use the default `@/` alias. Shared workspaces use their UI package
name instead. Follow the project's installed import paths.

Use `yopem-ui-cli` for setup and source updates with Bun, npm, pnpm, or Yarn 2
and later. Use `yopem-ui-oxlint` for rule setup and diagnostic repairs.

## Find the correct API

Use installed source as the version-specific API reference. Read only the
required component documentation:

- [Documentation index](https://ui.yopem.com/llms.txt)
- [Component index](https://ui.yopem.com/components.md)
- [Button documentation](https://ui.yopem.com/components/button.md)
- [Button API JSON](https://ui.yopem.com/r/docs/button.json)
- [Registry inventory](https://ui.yopem.com/r/registry.json)

Replace `button` with the required item name. Install each component before
importing it; init installs only base files. Import from the copied file, such
as `@/components/ui/button`. Do not infer props from another UI library.

## Prefer components before custom styles

Use existing UI, layout, and typography components before writing custom StyleX.
Check their documented props, variants, sizes, and composition options first.

Use HStack for centered rows, Text for paragraphs, and Button variants for
actions. Do not recreate their defaults with custom styles on generic elements.

Use custom StyleX only when no existing component or supported composition meets
the requirement. Keep the closest matching component. Customize only the missing
part through `xstyle`. Preserve its semantics, behavior, and style contracts.

## Choose components by task

These are registry item names, not a promise that every file exports a root with
the same spelling. Read the required item's exports and compound parts.

| Task                                          | Items                                                                              |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| Actions, copying, and grouped commands        | `button`, `clipboard`, `toggle`, `toggle-group`, `toolbar`                         |
| Text entry and form structure                 | `input`, `textarea`, `input-group`, `label`, `field`, `fieldset`, `form`           |
| Independent choices and settings              | `checkbox`, `checkbox-group`, `switch`                                             |
| One option or popup selection                 | `radio-group`, `native-select`, `select`                                           |
| Searchable values or text suggestions         | `combobox`, `autocomplete`                                                         |
| Quantities, ratings, codes, and dates         | `number-field`, `slider`, `rating`, `otp-field`, `calendar`                        |
| Modal tasks and critical confirmations        | `dialog`, `alert-dialog`                                                           |
| Edge panels and swipe gestures                | `sheet`, `drawer`                                                                  |
| Anchored content and descriptions             | `popover`, `tooltip`, `preview-card`                                               |
| Action menus                                  | `menu`, `context-menu`                                                             |
| Content disclosure and views                  | `accordion`, `collapsible`, `tabs`                                                 |
| Navigation and process steps                  | `breadcrumb`, `pagination`, `sidebar`, `steps`, `link`                             |
| Search and command selection                  | `command`                                                                          |
| Status, loading, completion, and measurements | `alert`, `toast`, `empty`, `spinner`, `skeleton`, `progress`, `meter`, `checkmark` |
| Identity, metadata, and data                  | `avatar`, `badge`, `stat`, `table`, `kbd`                                          |
| Content and control structure                 | `card`, `frame`, `group`, `separator`, `scroll-area`                               |
| Moving content                                | `marquee`                                                                          |

Use framework links for application navigation. Native anchors remain valid.
`variant="link"` changes Button appearance, not its element or navigation
behavior.

Use `Progress` for task completion and `Meter` for bounded measurements. `Table`
does not supply sorting or data loading. `Pagination` does not calculate page
ranges. `Kbd` displays shortcuts; it does not register keyboard handlers.

Use `SidebarProvider` around Sidebar parts. Use `ToastProvider` and
`toastManager` for toast notifications. Do not invent a `Toast` root. Install
`menu`, not a separate dropdown-menu item. Compose date pickers from `calendar`
and a suitable popup; there is no separate date-picker item.

### Buttons and controls

Button variants are `default`, `secondary`, `outline`, `ghost`, `link`,
`destructive`, and `destructive-outline`. Text sizes are `xs`, `sm`, `default`,
`lg`, and `xl`. Icon sizes are `icon-xs`, `icon-sm`, `icon`, `icon-lg`, and
`icon-xl`.

Use a normal size for text with an icon. Use an icon size for icon-only buttons.
Give icon-only buttons an accessible name. Hide decorative icons from assistive
technology. Set Lucide dimensions explicitly; Button does not size arbitrary
SVGs.

Button defaults to `type="button"` when `render` is omitted. Set the type
explicitly when composing a rendered button. Use `type="submit"` for submission.
`loading` shows a spinner, keeps the children, and disables native interaction.
Retain meaningful action text.

A rendered anchor does not support native button `disabled`. Prevent its
navigation when disabled. Keep coarse-pointer targets at least 44px. Do not clip
the extended targets.

### Forms and validation

Compose `Form`, `Field`, `FieldLabel`, a control, and optional description/error
parts. Input already uses Base UI Input; do not wrap it in another
`FieldControl`. Use `Fieldset` with `FieldsetLegend` for related controls. Keep
individual labels. A standalone `Label` needs matching `htmlFor` and control
`id` values.

Input visual sizes are `sm`, `default`, and `lg`. Numeric `size` controls native
input width. Use `rows` for Textarea height. `controlXstyle` targets the outer
Input/Textarea wrapper; `xstyle` targets the native control.

This example delegates the accepted value to the caller. Validate submitted data
on the server too. Use `Form errors` for server errors keyed by field name.

```tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Stack } from "@/components/ui/stack"

export function EmailForm({ onSubmit }: { onSubmit: (email: string) => void }) {
  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault()
        const email = new FormData(event.currentTarget).get("email")
        if (typeof email === "string") onSubmit(email)
      }}
    >
      <Stack>
        <Field name="email">
          <FieldLabel>Email</FieldLabel>
          <Input name="email" type="email" autoComplete="email" required />
          <FieldDescription>Use your account email.</FieldDescription>
          <FieldError>Enter a valid email.</FieldError>
        </Field>
        <Button type="submit">Continue</Button>
      </Stack>
    </Form>
  )
}
```

### Selection state

Controlled callbacks must update the supplied state. `default*` props set only
initial state. Selection and popup `open` state are separate.

| Component        | State contract                                                                       |
| ---------------- | ------------------------------------------------------------------------------------ |
| Checkbox, Switch | Boolean `checked` and `onCheckedChange`; initial `defaultChecked`.                   |
| CheckboxGroup    | Array `value` and `onValueChange`; each Checkbox needs a distinct `value`.           |
| RadioGroup       | One `value` and `onValueChange`; use `Radio` for each option.                        |
| Toggle           | Boolean `pressed` and `onPressedChange`, not checkbox form data.                     |
| ToggleGroup      | Array `value`, even for single selection. Use `multiple`, not `type="multiple"`.     |
| Select, Combobox | Selected `value` and `onValueChange`; `multiple` changes the value to an array.      |
| Autocomplete     | `value` and `onValueChange` describe input text, not a selected option.              |
| Combobox search  | Separate `inputValue` and `onInputValueChange` from the selected value.              |
| NativeSelect     | Native `value` and `onChange`; handle selected options for multiple selection.       |
| Rating, Slider   | Numeric `value` and `onValueChange`; Slider also accepts arrays for multiple thumbs. |
| Calendar         | `selected` and `onSelect`; match the `single`, `multiple`, or `range` mode.          |

Use `SelectTrigger` with `SelectValue`, and `SelectPopup` with `SelectItem`.
`SelectButton` supplies styling, not popup trigger behavior. Read the installed
Combobox/Autocomplete item-rendering contract before building a searchable
control. For object values, check label, submitted-value, and equality
callbacks.

### Dialog composition

Compose triggers and close controls through `render`, not `asChild`. Do not nest
buttons. `DialogPopup` includes its portal, backdrop, viewport, and default
close button. Do not add a second portal or backdrop around it.

Use `DialogPanel` for scrollable body content. Keep Base UI focus management,
Escape handling, dismissal, and focus return. Give dialogs an accessible title
and an appropriate description.

```tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function MaintenanceNotice() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Read notice
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Scheduled maintenance</DialogTitle>
          <DialogDescription>
            Service will pause tonight at midnight.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button />}>Understood</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
```

`DialogContent` remains an alias for `DialogPopup`. Do not assume every overlay
uses that alias pattern: `DrawerContent` is not `DrawerPopup`.

## Build layouts with primitives

All layout primitives accept native attributes, events, refs, `className`, and
`xstyle`. Only Box supports `render`; the others render fixed div elements.
There are no `gap`, `direction`, `align`, `columns`, `as`, or `asChild` props.
Choose the closest layout primitive first. Use StyleX through `xstyle` only for
layout requirements that its defaults and supported composition cannot meet.

| Primitive      | Default and purpose                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Box            | Generic div. Use `render` for sections, landmarks, lists, inline spans, or generic preformatted content.                |
| Flex           | Flex row; no gap or wrapping. Use for custom alignment and direction.                                                   |
| Stack          | Flex column; children stretch; gap four spacing units.                                                                  |
| VStack         | Flex column; children center across the column; gap four spacing units.                                                 |
| HStack         | Flex row; children center across the row; gap four spacing units; no wrapping.                                          |
| Grid           | CSS grid; no explicit columns or gap. Set tracks through `xstyle`.                                                      |
| Center         | Flex layout centered on both axes; no gap.                                                                              |
| Container      | Full width, centered, maximum `90rem`, inline padding four spacing units. `fluid` removes the maximum, not the padding. |
| AbsoluteCenter | Absolute placement in a positioned parent. `axis` accepts `both` (default), `horizontal`, or `vertical`.                |
| Bleed          | Negative inline margins of four spacing units. Cancels matching parent inline padding, not block padding.               |
| Float          | Absolute corner/edge placement in a positioned parent. Default `placement="top-end"`; z-index 1.                        |
| Wrap           | Flex row with wrapping, centered cross-axis alignment, and a two-unit gap.                                              |

Float placements combine `top`, `middle`, or `bottom` with `start`, `center`, or
`end`, such as `bottom-start`. Start/end follow text direction. Float does not
move badges halfway outside the parent automatically.

AbsoluteCenter and Float reserve no space in normal flow. Give the containing
parent suitable positioning and size. Single-axis AbsoluteCenter placement
leaves the other axis unspecified.

Preserve semantic HTML with Box around fixed layout elements. Put labels,
landmark attributes, and tag-specific refs on the correct rendered element. Keep
native controls, tables, metadata, SVG, custom elements, `strong`, and inline
`code` where no equivalent applies. Do not wrap primitive internals recursively.

### Spacing and responsive layout

The spacing unit is `tokens["--spacing"]`, default `0.25rem`. Common multipliers
are 1 = 4px, 2 = 8px, 4 = 16px, 6 = 24px, and 8 = 32px at default settings. Use
`calc()` with the token, not copied pixel literals.

Use property-level StyleX conditions when responsive requirements need custom
styles. Primitives do not have breakpoint props. Keep DOM order meaningful when
columns change. Grid has no column prop; this example customizes only tracks and
gap on the existing primitive.

The example needs a project-approved Grid contract permitting `gap` and
`gridTemplateColumns`. The default `no-restyle` layout category does not include
these properties. Preserve existing restrictions; do not disable the rule.

Merge this contract into the existing rule options only when the project's
layout policy permits it. Retain existing contracts and deny entries.

```json
{
  "rules": {
    "yopem-ui/no-restyle": [
      "error",
      {
        "contracts": [
          {
            "pattern": "^Grid$",
            "allow": ["layout", "gap", "gridTemplateColumns"]
          }
        ]
      }
    ]
  }
}
```

```tsx
import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import { Container } from "@/components/ui/container"
import { Grid } from "@/components/ui/grid"
import { Heading } from "@/components/ui/heading"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { tokens } from "@/styles/tokens.stylex"

const styles = stylex.create({
  columns: {
    gap: `calc(${tokens["--spacing"]} * 6)`,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 48rem)": "repeat(2, minmax(0, 1fr))",
    },
  },
})

export function ProjectsPage() {
  return (
    <Box render={<main />}>
      <Container>
        <Stack>
          <Heading render={<h1 />}>Projects</Heading>
          <Grid xstyle={styles.columns}>
            <Box render={<section aria-labelledby="active-title" />}>
              <Heading id="active-title">Active</Heading>
              <Text>Current projects appear here.</Text>
            </Box>
            <Box render={<section aria-labelledby="archived-title" />}>
              <Heading id="archived-title">Archived</Heading>
              <Text>Completed projects appear here.</Text>
            </Box>
          </Grid>
        </Stack>
      </Container>
    </Box>
  )
}
```

## Set typography with semantic components

Typography uses Inter for body text and headings, and IBM Plex Mono for code.
Load both fonts in the application; font tokens do not download fonts.

These components accept native attributes, refs, `className`, and `xstyle`. Only
Heading supports `render`. Do not invent `size`, `weight`, `level`, `as`, or
`asChild` props. Heading size follows the rendered native heading level.

| Component  | Semantics and defaults                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Text       | Fixed paragraph; `1rem`, line height `1.5`, weight 400, zero margin.                                                            |
| Heading    | h2 by default; line height `1.25`, weight 600, zero margin. Use `render={<h1 />}` through h6.                                   |
| Blockquote | Block quotation; italic, muted foreground, line height `1.65`, inline-start border. Native `cite` does not display attribution. |
| Em         | Inline semantic stress with italic text; inherits font size, weight, and line height.                                           |
| Mark       | Inline marked text; accent surface/foreground pair and small radius.                                                            |
| Highlight  | Inline span; required string `query`; wraps matching text with Mark.                                                            |
| Prose      | Div with maximum width `68ch` and line height `1.7`; no automatic descendant styling or content spacing.                        |
| Codeblock  | Div with copy toolbar and internal pre/code; mono text `0.875rem`, preserved whitespace, horizontal scrolling.                  |

| Heading level | Default font size |
| ------------- | ----------------- |
| h1            | `2.25rem`         |
| h2            | `1.5rem`          |
| h3            | `1.25rem`         |
| h4            | `1.125rem`        |
| h5            | `1rem`            |
| h6            | `0.875rem`        |

Choose heading levels from document structure, not visual size. A Text paragraph
must not contain headings, other paragraphs, layout containers, or Codeblock.
Keep block content inside Prose or layout primitives. Native `strong` and inline
`code` remain valid. Text inside Prose keeps its own typography defaults.

Highlight matches literal substrings without case sensitivity, including within
supplied child elements. It does not split the query into terms or match across
separate text nodes. Empty queries leave the content readable without marks. Its
`xstyle` targets the outer span, not generated Mark elements.

Codeblock has no `language`, `filename`, `showLineNumbers`, or `preProps` props.
Supply string children. It does not provide syntax highlighting. Its ref,
events, and `xstyle` target the outer div, not the internal pre. Use
`Box render={<pre />}` for generic preformatted content with native pre
behavior.

```tsx
"use client"

import { Blockquote } from "@/components/ui/blockquote"
import { Codeblock } from "@/components/ui/codeblock"
import { Em } from "@/components/ui/em"
import { Heading } from "@/components/ui/heading"
import { Highlight } from "@/components/ui/highlight"
import { Mark } from "@/components/ui/mark"
import { Prose } from "@/components/ui/prose"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"

export function ContentGuide() {
  return (
    <Prose>
      <Stack>
        <Heading render={<h1 />}>Content guide</Heading>
        <Text>
          Use <Em>clear instructions</Em>. Mark <Mark>required steps</Mark>.
        </Text>
        <Heading>Search results</Heading>
        <Text>
          <Highlight query="read">
            Read the guide before reading examples.
          </Highlight>
        </Text>
        <Blockquote cite="https://www.w3.org/WAI/">
          The power of the Web is in its universality.
        </Blockquote>
        <Text>— Tim Berners-Lee</Text>
        <Heading>TypeScript example</Heading>
        <Codeblock>{'const greeting = "Hello, Ada!"'}</Codeblock>
      </Stack>
    </Prose>
  )
}
```

## Use StyleX for unmet requirements

Confirm that no existing UI, layout, or typography component, prop, or
composition fits before adding styles. Define only the missing styles with
`stylex.create`. Pass component styles through `xstyle`. Later entries override
earlier entries. Components merge consumer styles after defaults and variants.

- Use `stylex.props` on native or framework elements, not on Yopem components.
- Keep `className` support for external CSS integration. Do not add utility
  classes, Tailwind, `cva`, authored JSX `style` props, or embedded style
  blocks.
- Prefer logical properties such as `marginInline` and `inlineSize`.
- Use semantic tokens for colors, spacing, typography, and radius.
- Rounded surfaces default to md (12px). Use xstyle to change border radius. Use
  controlXstyle for Input and Textarea wrappers. Keep circular indicators
  intact.
- Keep StyleX object shapes static. Do not add spreads or computed keys except
  supported StyleX `when` conditions.
- Style owned slots explicitly. Do not add broad SVG or descendant selectors.
- Use Lucide icons unless existing code requires another supported icon set.

The default `no-restyle` policy permits only its narrow layout category. Prefer
`variant` and `size` props before changing a component's appearance. Typography
and structural overrides must follow the project's component contracts too. Do
not disable rules to force an override through.

When changing copied components, preserve named exports, props, refs,
`className`, and `data-slot`. Keep `"use client"` where required. Reuse copied
StyleX helpers when merging consumer classes and styles.

## Keep themes consistent

Keep the root stylesheet loaded, including `@stylex;` and its CSS layer order.
Keep root styles and the theme marker intact. The reset supplies border-box
sizing and minimum inline size zero; Box does not add these locally.

Change global semantic values in the copied `tokens.stylex.ts`. Keep light and
dark values complete. Change surface and foreground pairs together. Keep StyleX
theme object spreads in that module.

Fixed themes do not need a provider or script. For user-selectable themes,
install the `theme` item through the CLI. Then wire `getRootThemeProps`,
`ThemeScript`, and `ThemeProvider` into the framework root.

Use identical theme configuration across all three. Keep `defaultTheme` and
`storageKey` identical in the script and provider. Run the script before
hydration. Pass the permitted per-request CSP nonce when required. Keep
`theme.tsx` server-safe; only `theme-provider.tsx` is a client entry.

See [theming](https://ui.yopem.com/docs/theming.md),
[styling](https://ui.yopem.com/docs/styling.md), and
[layout](https://ui.yopem.com/docs/layout.md) for details.

## Verify the result

Run the project's lint, format, typecheck, and production build commands.
Exercise the affected workflow with pointer and keyboard input. Check focus
restoration, labels, disabled states, open/close behavior, and visible focus
indicators. Check light and dark states, reduced motion, coarse-pointer targets,
responsive columns, semantic heading order, and code-copy output. Save a
reproducible browser report, trace, or screenshot for UI changes. Report checks
that could not run.
