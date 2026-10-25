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
| Rich-text editing                             | `editor`                                                                           |
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
| Media proportions, lists, and captions        | `aspect-ratio`, `list`, `figcaption`                                               |
| Semantic importance                           | `strong`                                                                           |
| Moving content                                | `marquee`                                                                          |

Use Editor for rich-text entry. Install the `editor` registry item before use.
Keep its document state in Lexical JSON. Slate documents and Plate plugins are
not compatible. Use the installed source and editor documentation for supported
features. Do not assume full Plate parity.

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

### Editor composition

Install the `editor` item before you use either the preset or public parts. The
same installation copies all composition source files and UI dependencies.
Import `Editor` from `@/components/editor` for the preset. Import `EditorRoot`,
`EditorToolbar`, and `EditorContent` from the same copied source for custom UI.
Keep each toolbar and surface inside one root. Each root keeps separate history
and document state. Root `ariaLabel` and `editable` apply to its content.

```tsx
"use client"

import {
  EditorRoot,
  EditorContent,
  EditorToolbar,
  EditorFormatButton,
  EditorHistoryButton,
  EditorBlockButton,
} from "@/components/editor"

export function ComposedNotes() {
  return (
    <EditorRoot ariaLabel="Composed editor">
      <EditorToolbar aria-label="Custom formatting">
        <EditorFormatButton format="bold" />
        <EditorFormatButton format="italic" />
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
        <EditorBlockButton block="h2" />
      </EditorToolbar>
      <EditorContent placeholder="Write your notes…" />
    </EditorRoot>
  )
}
```

Add `EditorListButton`, `EditorIndentButton`, `EditorLinkControl`, or
`EditorTableButton` when needed. Use `useEditor` for Lexical commands and
`useEditorState` for text formats and history availability inside the root.
Preserve keyboard behavior, URL validation, read-only state, refs, and consumer
props. This API does not accept Slate documents or Plate plugins.

Use `EditorTableMenu` for row, column, header, merge, and split actions.
Register `EditorTablePresentationExtension` for bounded tables and persisted
cell presentation. Add `EditorTableDimensions`, `EditorTableCellPresentation`,
and `EditorTableResizeControls` inside `EditorRoot`. Use
`EditorTableBackgroundControls` and `EditorTableBorderControls` for separate
controls. Border actions support individual logical edges, inside, outside, all,
none, and reset. Shared merged edges are indivisible. Row resizing stores native
minimum height, not fixed content height. Keep `data-editor-row-height` in
exported HTML to preserve finite native heights. Keep table scrolling bounded in
both directions and keyboard-accessible. Validate external table JSON and HTML
before conversion. Invalid updates must preserve existing content. Discard saved
table selections after document changes. Preserve resize cancellation, history,
and right-to-left keyboard behavior.

Configure `disableMerge:true` on `EditorTablePresentationExtension` at mount
time to block house merge actions. Existing spans remain. Explicit splitting
stays available. Native host mutations bypass this policy.

Pass additional Lexical extensions through `extensions` on EditorRoot or Editor.
Keep the extension list stable. Treat it as initial configuration. Remount the
root when the list changes. Use Lexical registration cleanup for custom
behavior.

### Native code editing

Install optional native code editing:

```sh
bunx --bun @yopem-ui/cli add editor-code
npx @yopem-ui/cli add editor-code
pnpm dlx @yopem-ui/cli add editor-code
yarn dlx @yopem-ui/cli add editor-code
```

Import parts from `@/components/editor/code`. Register `EditorCodeExtension`
when you create `EditorRoot`. Keep `EditorContent` as the editable surface. Do
not replace native code nodes with Codeblock. Put `EditorCodeLanguage`,
`EditorCodeCopyButton`, `EditorCodeToggle`, and `EditorCodeStatus` inside
`EditorCodeToolbar`. Select one code block before using its controls. Copy can
run read-only; mutation cannot. Line numbers and wrapping turn each other off.
Lexical JSON preserves these choices. Keep native code keyboard behavior and
serializers. Discard saved targets after host document changes.

Base editor-code does not require Prettier. Supply an `EditorCodeFormatter` for
formatting controls. Without a formatter, the preset hides these controls.
Install the separate adapter only when you want Prettier formatting:

```sh
bunx --bun @yopem-ui/cli add editor-code-format
npx @yopem-ui/cli add editor-code-format
pnpm dlx @yopem-ui/cli add editor-code-format
yarn dlx @yopem-ui/cli add editor-code-format
```

Import `prettierEditorCodeFormatter` from `@/components/editor/code-format`.
Pass it through the `formatter` prop. Syntax colors support more languages than
this adapter can format. Cancellation cannot stop synchronous parsing. The
adapter does not change your repository formatter.

### Editor authentication

Install the separate `editor-auth` item for server integration. Import its
helpers from `@/lib/editor-auth`, or the configured shared library path. Select
OpenAuth or Better Auth explicitly. Keep these imports out of browser code.
OpenAuth defaults to `https://auth.yopem.com` and requires an accepted audience.
Better Auth uses the host application's session getter without session refresh.
Both adapters supply verified `credentialExpiresAt` in Unix epoch milliseconds.
Authorization rejects supplied expired metadata before and after policy checks.
Collaboration tickets must require verified expiry. These helpers do not create
accounts or a database.

Require a separate document policy. Only an explicit true result grants access.
Check route origins and CSRF tokens in the host backend. Do not put tokens in
URLs or logs. JWT verification does not guarantee immediate revocation. See the
[authentication guide](https://ui.yopem.com/docs/editor-auth.md).

### Editor collaboration

Install `editor-collaboration` for browser parts and
`editor-collaboration-server` for generic server helpers. Import browser parts
from `@/components/editor/collaboration` and server helpers from
`@/lib/editor-collaboration`.

Install only the matching runtime item: `editor-collaboration-worker` for
Durable Objects, `editor-collaboration-bun` for Bun, or
`editor-collaboration-node` for Node. Import from
`@/lib/editor-collaboration/collaboration-do`,
`@/lib/editor-collaboration/collaboration-bun`, or
`@/lib/editor-collaboration/collaboration-node` as appropriate. Keep these
imports out of browser and generic server barrels.

Create one collaboration controller and stable extension array per root. Compose
`EditorCollaborationRoot` inside `EditorRoot` and keep `EditorContent` as the
editable surface. Use native per-client history.

Supply existing authentication with verified expiry, an exact HTTPS origin, CSRF
checks, literal-true document policies, real SQL transactions, and a
schema-complete initializer. Bun can use host TLS. Bind the Node `node:http`
server privately behind a trusted HTTPS/WSS proxy.

Keep binary document frames and bounded text readiness, delivery, and ACK
controls for `editor-v1`. Ordinary WebSocket send completion does not confirm
durable delivery. Recipient checks do not make revocation atomic with writes.
History is bounded, with no automatic compaction. Do not replay offline drafts
with uncertain outcomes. This guide does not confirm runtime or deployment
validation. See https://ui.yopem.com/docs/editor-collaboration.

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
`xstyle`. Box and List support `render`; other layout primitives render fixed
div elements. There are no `gap`, `direction`, `align`, `columns`, `as`, or
`asChild` props. Choose the closest layout primitive first. Use StyleX through
`xstyle` only for layout requirements that its defaults and supported
composition cannot meet.

| Primitive      | Default and purpose                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Box            | Generic div. Use `render` for sections, landmarks, figures, inline spans, or generic preformatted content.              |
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

AspectRatio renders a div with CSS `aspectRatio`. Its optional numeric `ratio`
defaults to `16 / 9`. Nonpositive and nonfinite values use the default. It does
not clip or automatically size children. Set child dimensions through their own
attributes or styles when needed.

Import List and ListItem from `@/components/ui/list`. List renders ul by
default. Use `List render={<ol start={3} reversed />}` for ordered lists through
Base UI `useRender`. Keep native `start` and `reversed` attributes on ol.
ListItem renders li. Neither component has an `ordered` or `as` prop.

Float placements combine `top`, `middle`, or `bottom` with `start`, `center`, or
`end`, such as `bottom-start`. Start/end follow text direction. Float does not
move badges halfway outside the parent automatically.

AbsoluteCenter and Float reserve no space in normal flow. Give the containing
parent suitable positioning and size. Single-axis AbsoluteCenter placement
leaves the other axis unspecified.

Preserve semantic HTML with Box around fixed layout elements. Put labels,
landmark attributes, and tag-specific refs on the correct rendered element. Keep
native controls, tables, metadata, SVG, custom elements, and inline `code` where
no equivalent applies. Do not wrap primitive internals recursively.

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
| Strong     | Semantic strong; weight 600; inherits surrounding font family, size, line height, and color.                                    |
| Figcaption | Semantic figcaption; muted text, `0.875rem` font size, line height `1.5`.                                                       |
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
Keep block content inside Prose or layout primitives. Use Strong for semantic
importance. Native inline `code` remains valid. Text inside Prose keeps its own
typography defaults.

Place Figcaption inside `Box render={<figure />}` with its associated content.
There is no Figure primitive. Strong and Figcaption accept native attributes,
refs, `className`, and `xstyle`; neither supports `render`.

Highlight matches literal substrings without case sensitivity, including within
supplied child elements. It does not split the query into terms or match across
separate text nodes. Empty queries leave the content readable without marks. Its
`xstyle` targets the outer span, not generated Mark elements.

The Codeblock code pane accepts keyboard focus for horizontal scrolling.
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

## Editor document storage

Use the separate `editor-store` server library for D1 or PostgreSQL snapshots.
Apply one copied SQL migration before use. Supply existing authentication,
complete Lexical validation, and host document policies, including deletion.
Keep snapshots within 1 MiB, 131072 JSON values, and 64 nested objects or
arrays. Use exact trusted origins and host CSRF verification for HTTP writes.
Keep operation IDs, preconditions, authentication provider, and user ID
unchanged on uncertain retries. Do not add accounts, ACL tables, or implicit
document grants. See https://ui.yopem.com/docs/editor-store for protocol and
deployment limits.

HTTP callbacks receive cancellation through `Request.signal`. Storage checks
deadlines before driver calls. PostgreSQL checks remaining time before each
statement. Synchronous work cannot be stopped.

## Editor style composition

Import editor parts from `@/components/editor` after editor installation. Keep
style controls inside `EditorRoot` and `EditorToolbar`. Use
`EditorAlignmentButton`, `EditorFontColorControl`,
`EditorBackgroundColorControl`, `EditorFontFamilyControl`,
`EditorFontSizeControl`, and `EditorFontWeightControl` for text presentation.
Use `EditorLineHeightControl` and `EditorFirstLineIndentControl` for block
styles. Keep `EditorIndentButton` for block indentation.

Register `EditorBlockPresentationExtension` in a stable mount-time extension
array, including read-only roots. Import pure codecs from
`@/components/editor/block-presentation` for server use. Pass only the
`editorBlockPresentation` NodeState payload to `parseEditorBlockPresentation`.
Line height accepts unitless 1 through 4. First-line indentation accepts
nonnegative values through 160px or 10em/rem. JSON and HTML preserve validated
values. Keep host HTML sanitization and native conversion hooks.

Use `EditorClearFormattingButton` to remove presentation. Keep content, links,
list nesting, table structure, and unrelated NodeState. Saved style selections
expire after document changes. See
[editor composition](https://ui.yopem.com/docs/editor.md).

## Optional editor blocks

Install `editor-blocks` for native Lexical callouts and toggles. Register
`EditorBlocksExtension` from `@/components/editor/blocks` in a stable extension
array. Compose focused controls inside `EditorToolbar`. Import server-safe
models from `@/components/editor/blocks-model`. Validate block JSON and HTML
before document replacement. Reject unsupported content without changing the
current document. Read-only disclosure changes local visibility, not saved state
or history. Keep rich toggle titles outside the native summary control. Keep
title links usable when closed. Keep the native details body, empty disclosure
control, and content slot together.

## Editor AI proposals

Install optional `editor-ai` server source separately from `editor` client
source. Import server helpers from `@/lib/editor-ai`. Never import them into
browser code. Compose `EditorAiRoot`, `EditorAiTrigger`, and `EditorAiPanel`
inside `EditorRoot`. Supply an explicit same-origin endpoint, documentId, and
current host authentication and CSRF headers. Without configuration, AI controls
render nothing. No default endpoint or model exists. Review progressive
untrusted plain text. Approval requires explicit completion and clean EOF.
Content, format, style, non-null selection, and read-only changes invalidate
proposals. A null selection retains the saved target for dialog use. Remount
EditorAiRoot when host code discards the saved target. Approval makes one local
history update. Authorize document writes separately. Supply existing OpenAuth
or Better Auth, verified expiry, exact HTTPS Origin, CSRF verification, and
durable host quota. Require literal true from the document policy for
`ai:invoke`. This permission never grants `document:write`. Keep provider
credentials and model selection on the server. Never retry paid requests
automatically. Keep tokens out of browser storage, URLs, and logs. Cancellation
does not prove that billing stops. See https://ui.yopem.com/docs/editor-ai for
provider schema and deployment limits.

## Optional editor review

Install `editor-review` separately from `editor`:

```sh
bunx --bun @yopem-ui/cli add editor-review
npx @yopem-ui/cli add editor-review
pnpm dlx @yopem-ui/cli add editor-review
yarn dlx @yopem-ui/cli add editor-review
```

Import `EditorReviewPreset` and `EditorReviewHost` from
`@/components/editor/review`. The preset supplies its own root and editable
surface. For custom composition, create one controller per root and add its
extension to the stable root extension list. Place `EditorReviewProvider` inside
`EditorRoot`.

Set `viewer` from a verified host identity. Supply a synchronous `can` policy.
Allow each action only when current policy returns literal `true`. Serialized
author IDs do not grant access. Check each action again on the server before
saving. `visible=false` hides review UI. It does not redact or delete state.

Review state uses root NodeState `yopemReview` and text NodeState
`yopemSuggestion`. Validate imported state with `parseReviewDocument`. Register
`MarkNode` in every reader that loads review state. Untrusted input loses review
metadata. Trust it only after host verification.

Review suggestions are inline only. Text diffs support one paragraph, 2048
graphemes, and 4096 UTF-16 units. Paste inserts plain text only. Rich HTML paste
is rejected. Pasted review metadata is not preserved. `editor-document` does not
import review formats. See https://ui.yopem.com/components/editor-review for
public contracts and limits.

## Optional editor typeahead

Install `editor-typeahead` separately. Import optional parts from the copied
editor `typeahead-index` module. Create one stable controller per root. Keep its
extension and custom command arrays stable at mount time. Render
`EditorTypeahead` inside that root. Compose `EditorEmojiMenu` inside
EditorToolbar for search. Supply a bounded, abort-aware host mention loader.
Missing loaders disable mentions. The controller registers `MentionNode` only
when `mentions.load` is set. Keep mention options fixed for each root. Register
`MentionNode` in every document reader. Use the pure `mention-codec` helpers for
IO validation. Serialized identities do not grant access. Register Markdown
conversion explicitly and keep host HTML sanitization. Use the full English
emojibase-data inventory or validated host emoji graphemes. Search returns at
most 50 results per page. Use category and page controls to browse the
inventory. Validate host lists with `parseEditorEmojiInventory`. Pass
`controller.emojiHistory` to the picker to share bounded memory counts. No
automatic storage is included. See
https://ui.yopem.com/components/editor-typeahead for public contracts and
limits.

Use EditorInlineCombobox with Input, Content, List, Item, Empty, Status, Group,
GroupLabel, and Row parts. EditorInlineComboboxInput renders EditorContent. Do
not add a second query input. Keep every current item in controller order. Read
state with useEditorInlineCombobox. Compose EditorEmojiPopover,
EditorEmojiToolbarButton, EditorEmojiPopoverContent, and EditorEmojiPicker
inside EditorToolbar. EditorEmojiPicker is the panel. EditorEmojiMenu is the
complete toolbar preset. Compose EditorEmojiSearch, EditorEmojiCategory,
EditorEmojiList, EditorEmojiItem, EditorEmojiEmpty, EditorEmojiPrevious,
EditorEmojiNext, and EditorEmojiClearHistory. Read picker state with
useEditorEmojiPicker. Keep inventory, filter, and history stable until unmount.
Keep inline and emoji options at least 44px high for coarse pointers.
EditorTypeahead renders the editable surface and suggestions. Do not add
EditorContent beside this preset.

## Optional editor document conversion

Install `editor-document` for JSON, HTML, Markdown, streaming, and static
output. Keep this optional item separate from the base editor installation.
Import portable helpers from `@/components/editor/document`. Import
`DocumentStatic` from `@/components/editor/document/static`. The static renderer
does not require `EditorRoot`.

Register `EditorDocumentClipboardExtension` in the stable root extension array.
Call `registerDocumentPaste` after editor creation. Retain its cleanup callback.
Keep native MIME policy composition and host paste vetoes intact. Validate
complete documents before replacement. Keep host HTML sanitization. Preserve
canonical block metadata, table borders, and `data-editor-row-height`. Failed
imports preserve existing content. Stream imports commit only at EOF. Abort
stale requests. Cancellation cannot stop a noncooperative producer. Register
math and mention nodes before importing their representations. Markdown supports
TeX delimiters with canonical HTML fallback when required for fidelity. Static
and standalone HTML use native MathML. Mentions use the validated identity
codec. Saved mention identities do not grant access. Media JSON and canonical
tagged figure HTML retain native metadata. Markdown uses canonical HTML for
media. Register `MediaExtension` for live rendering or `MediaNode` in headless
readers. Media URLs cannot contain credentials, queries, or fragments. Review
nodes remain unsupported. Do not silently remove unknown nodes or formatting
during conversion. See https://ui.yopem.com/components/editor-document for
supported formats.

## Optional editor media

Install `editor-media` separately. Import parts from
`@/components/editor/media`. Register `MediaExtension` in a stable root
extension array. Compose `MediaInsertControl` inside `EditorToolbar`.
`MediaContent` renders validated `parseMedia` data without `EditorRoot`. Use
HTTPS URLs without credentials. Supply alt text and captions for your content.
Keep native playback, file links, and iframe controls usable in read-only roots.
Supply bounded, abort-aware host uploads with server authorization and
validation. Private assets need explicit same-origin delivery integration. Never
put tokens in media URLs. Register `MediaNode` in document readers. Do not
flatten unsupported media during conversion.

## Optional footnotes and table of contents

Install `editor-footnotes` and `editor-toc` separately. Import parts from
`@/components/editor/footnote` and `@/components/editor/toc`. Keep feature
extensions stable when the root mounts. Compose controls inside `EditorToolbar`.
`EditorFootnoteTypeahead` owns the editable surface. Do not add adjacent
`EditorContent`. Keep repeated and unresolved references and duplicate
definitions. Renumber a selected duplicate explicitly. Do not silently rewrite
identifiers. Table-of-contents links target the current editor only. Base
contents controls do not require typeahead. Add `editorTocSlashCommand` only to
a configured slash controller. Register feature nodes in each reader. Model
fragment codecs do not validate complete host documents. Generic
`editor-document` conversion does not yet support footnotes or contents nodes.

## Optional editor columns and dates

Install the optional source items with your selected package manager.

```sh
bunx --bun @yopem-ui/cli add editor-columns
bunx --bun @yopem-ui/cli add editor-date
npx @yopem-ui/cli add editor-columns
npx @yopem-ui/cli add editor-date
pnpm dlx @yopem-ui/cli add editor-columns
pnpm dlx @yopem-ui/cli add editor-date
yarn dlx @yopem-ui/cli add editor-columns
yarn dlx @yopem-ui/cli add editor-date
```

Register `EditorColumnsExtension` from `@/components/editor/columns` in a stable
root extension array. Register `EditorDateExtension` from
`@/components/editor/date` in that array. Compose `EditorColumnsControls` and
`EditorDateControls` inside `EditorToolbar`. Use focused column insert, layout,
resize, move, and remove controls when needed. Columns contain two through four
native rich-text containers. Nested column groups are not supported. Use the
house Slider for resizing. Remove deletes the group and its content. The house
Calendar inserts dates and edits native date nodes through `EditorDateInline`.
Store validated YYYY-MM-DD strings without timezone conversion. Use
`editorDateFromLocalDate` for local dates. Import pure codecs from
`@/components/editor/columns-model` and `@/components/editor/date-model`. Keep
all copied feature and core selection helpers. Shared packages must export both
feature and model subpaths. Generic document converters do not support columns
or dates. Never flatten these nodes silently. Supply complete host document
validation; feature validators check only their own contracts. See
https://ui.yopem.com/components/editor-columns and
https://ui.yopem.com/components/editor-date for composition.

## Optional editor math

Install `editor-math` for inline and block TeX equations. Register
`EditorMathExtension` in a stable extensions array. Compose `EditorMathControls`
inside `EditorToolbar`. Use `EditorMathControl kind="inline"` or `kind="block"`
to insert an equation. Omit `kind` to edit one selected equation. Use
`EditorMathPreview` for the current expression. Select equations with pointer
input or keyboard focus. Apply changes, cancel changes, or delete the selected
equation. Host document changes expire saved targets. Read-only roots cannot
change equations.

```sh
bunx --bun @yopem-ui/cli add editor-math
npx @yopem-ui/cli add editor-math
pnpm dlx @yopem-ui/cli add editor-math
yarn dlx @yopem-ui/cli add editor-math
```

KaTeX renders native MathML. No stylesheet, font, CDN, or service import is
required. Browser MathML support controls visual output. Keep a visible error
for invalid TeX. Trust features and user macros are not supported. TeX has a
4096-character limit. Use `math-model` for pure JSON, HTML attribute, and
Markdown fragment codecs. Use `math-node` for native Lexical JSON and HTML
conversion. JSON uses type `editor-math`, version `1`, kind `inline` or `block`,
and `tex`. HTML uses `span` for inline math and `div` for block math. Both
elements require `data-editor-math` and `data-editor-tex`. Exported text
contains TeX, not rendered HTML. Sanitize host HTML before import. Validate
metadata before replacing document content. These fragment codecs do not parse
complete documents or Plate state.

## Editor private assets

Use the separate `editor-assets` server library with D1 or PostgreSQL and
private R2 or S3. Apply matching dialect migrations 0001, 0002, and 0003 in
order. Keep authentication, verified expiry, document and asset policy, exact
origins, and CSRF checks in the host. Reuse factory instances. Supply quotas,
bounded structural decoders, security scanners, and recurring cleanup with
complete inventory cycles. Do not treat fixture validators or signatures as
production scanners. Keep immutable attempts, fences, terminal probes, and
permanent lifetime reservations. Resolve private relative asset routes against
an explicit trusted HTTPS same-origin delivery origin. Validate the exact
document and asset route. Native media requires existing same-origin cookie
authentication. Never put tokens in URLs, return bucket keys, or use public
bucket fallbacks. Keep provider credentials and server imports out of browser
entries. This item adds no media UI nodes or accounts. See
https://ui.yopem.com/docs/editor-assets for migration, callback, delivery, and
deployment limits. Asset repositories do not receive request cancellation.
PostgreSQL timeouts apply per statement, not cumulatively. Configure host limits
for pool waits. D1 batches and R2 binding calls cannot be interrupted through
this API. S3 fetches receive cancellation signals.

## Optional whole-block selection

Install `editor-block-selection` separately. Create one stable controller with
`createEditorBlockSelection`. Compose `EditorBlockSelection` inside
`EditorRoot`. Use the gutter and actions for keyboard selection and movement.
Use drag handles for pointer movement. Keep keyboard movement available. Require
synchronous literal `true` from `authorizeCut` before native cut. Preserve
native MIME handlers and higher-priority host cancellation. Require literal
`true` from custom document validation. Content, selection, and read-only
changes expire saved operations. Authorize persisted document writes separately.
Import parts from `@/components/editor/block-selection-index`.

## Optional CSV paste

Install `editor-csv` separately. Register `EditorCsvExtension` in a stable root
extension array. Use `parseEditorCsv` from `@/components/editor/csv-model` for
pure parsing. Keep native Lexical JSON/HTML priority and HIGH/CRITICAL host
paste vetoes. Configure `EditorTablePresentationExtension` with `pasteTsv:false`
when CSV owns tab-containing input. HTML validation stays active. Reject
malformed quotes, unequal row widths, and inputs above 1 MiB or 50 by 50 cells
before content changes. Plain text needs a comma and multiple lines. Explicit
`text/csv` also supports one row. Fields remain plain text. Do not evaluate
formulas or render HTML.

## Optional editor search

Install `editor-search` separately. Compose `EditorSearchRoot` inside
`EditorRoot`. Place `EditorContent` inside `EditorSearchViewport`. Use the
input, previous/next, and status parts. Search does not replace text or persist
highlights. Queries use at most 64 Unicode code points. Results contain at most
200 matches within individual TextNodes, not across styled nodes. Use
`@/components/editor/search-model` for pure helpers outside React. Preserve host
cancellation and read-only navigation.

## Optional floating editor controls

Install `editor-floating-toolbar` separately. Import `EditorFloatingToolbar`
from the copied `@/components/editor/floating-toolbar` module. Compose it inside
EditorRoot beside EditorContent. Use existing editor controls as children.
Select native text to open the toolbar. Press Alt+F10 to focus its first enabled
button. Keep the saved-range guard. Document changes and read-only transitions
invalidate the target.

## Optional native editing rules

Install `editor-editing-rules` separately. Import
`createEditorEditingRulesExtension` from the copied
`@/components/editor/editing-rules` module. Create a stable extension array
before the root mounts. Mod+Enter exits the containing root block; Shift inserts
before it. Single-paragraph modes retain one paragraph for Enter and modifier
shortcuts. Other shapes keep native behavior without flattening. Plain text has
a 1 MiB limit. Converted block text has a 2501-line limit. Keep higher-priority
host handlers, IME, native Tab, and empty-paste preservation.

## Selected block placeholders

Install `editor-block-placeholder` separately. Import `EditorBlockPlaceholder`
from `@/components/editor/block-placeholder`. Mount one layer beside
`EditorContent` inside `EditorRoot`. Keep labels fixed until unmount. Hints
apply only to focused, editable, empty root elements. Use native node types or
heading tags as label keys. Placeholder text stays outside document content and
serializers. Preserve native focus, history, and host classes.
