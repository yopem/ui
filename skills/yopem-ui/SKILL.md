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

Import `CSPProvider` from `@base-ui/react/csp-provider`. Import
`DirectionProvider` from `@base-ui/react/direction-provider`. Supply the host
CSP nonce. Keep the host CSP policy intact.

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
features. Do not assume full Plate parity. Use Lucide icons for standard toolbar
actions. Keep full accessible names and titles. For standard editor actions,
pass Button icon sizes through render. Keep current values visible in selection
controls. Set aria-pressed on ToolbarButton for controlled toggle actions.
Native toggle renderers keep their own state.

Open https://ui.yopem.com/editor/examples/notion-like for the standalone
Potion-style workspace. Keep the app height within the viewport. Use separate
ScrollArea viewports for navigation and document content. Use Sheet navigation
when the parent is narrow. Keep page controls outside document scrolling. Native
controls include links, demo mentions, callouts, math, contents, and URL images.
Demo mention IDs grant no access. The Table of Contents page has a separate
outline and an in-document contents block. Both show the first 500 nonempty
headings in preorder. Titles normalize whitespace and truncate to 256 UTF-16
code units. The outline does not change saved content. See
https://ui.yopem.com/editor/examples#notion-like for consumer source and
installation commands. Public runtime observations guide this example. The
deployed Potion revision is unknown. It uses `yopem-ui:notion-like:v1:document:`
keys for validated known-page JSON drafts. Stored documents validate before the
native root mounts. Rejected stored bytes stay unchanged. Storage or validation
failure pauses writes. Memory editing and active-page JSON copy remain
available. Page switches reset undo history and selection. Titles and page
options stay in memory. Browser drafts are unencrypted. Scripts on this origin
can read them. Browser storage can remove drafts. Two tabs can overwrite drafts.
No conflict resolution or remote synchronization exists. Do not treat browser
drafts as private or durable storage. Supply accounts, collaboration, and other
host services separately.

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
same installation copies all composition source files and UI dependencies. Core
editing links plain URLs and email addresses with native `AutoLinkNode`. Code
stays inert. Register `AutoLinkNode` in custom readers of core editor JSON.

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
`useEditorState` for text formats and history availability inside the root. Use
`useEditorState().editable` for mutation controls. It reports attached native
editability. Server markup stays read-only until the native root connects. The
`editable` prop keeps the requested setting. Preserve keyboard behavior, URL
validation, read-only state, refs, and consumer props. This API does not accept
Slate documents or Plate plugins.

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

Before loading or mutating live Lexical slots, bound occupied slots and preserve
acyclic ownership. Validate complete candidates at host boundaries. Root
transforms do not validate all queued updates. Rejected updates can discard
coalesced pending edits. Do not rely on transforms for `skipTransforms` updates
or unvalidated external state.

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

### Native collaboration grants

Install `editor-collaboration-grants` separately:

```sh
bunx --bun @yopem-ui/cli add editor-collaboration-grants
npx @yopem-ui/cli add editor-collaboration-grants
pnpm dlx @yopem-ui/cli add editor-collaboration-grants
yarn dlx @yopem-ui/cli add editor-collaboration-grants
```

Import `createEditorNativeGrantsHttpHandler` from
`@/lib/editor-collaboration/collaboration-native-grants` on the server only.
Import pure grant codecs from
`@/lib/editor-collaboration/collaboration-native-model`.

Configure one exact trusted HTTPS origin and POST path. Require the exact
`Origin` header. Reuse host authentication with verified `credentialExpiresAt`,
CSRF approval, and literal `true` from the current room policy. Preserve opaque
`userId` bytes without normalization.

The handler reads one bounded body and gives each callback an isolated copy of
its exact bytes. The host provision callback receives a bounded copy of the
current request, signal, and deadline. Noncooperative callbacks keep capacity
until they settle.

Initialize each room once from authoritative host state. Bind each grant to the
exact room, generation, permission, and identity. Keep expiry within five
minutes and at or below `maximumCredentialExpiresAt`. Verify each Hocuspocus
credential against current host state. Returned `seeded` metadata does not prove
durable seeding or scope enforcement.

Issue peer credentials only to writers. Configure trusted WSS signaling and a
nine-peer limit. Native Hocuspocus and WebRTC provide no `editor-v1` ACKs,
per-frame host authorization, atomic revocation, or durability proof from sync.
No account, ACL, endpoint, model, or token service is supplied.

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

A ghost Button uses the accent background when its final element has
`aria-pressed="true"`. The `data-pressed` marker also applies the accent
independently. Hover and `xstyle` can change the background. Supply the correct
`aria-pressed` state for toggle actions.

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
callbacks. Combobox chip navigation closes open suggestions before focus moves
to a chip. If closing is cancelled, navigation does not focus a chip. ScrollArea
viewports use tabIndex=0 by default. Use viewportTabIndex={-1} when an input
owns composite keyboard navigation. ComboboxList and AutocompleteList set this
automatically. Keep standalone viewports keyboard-accessible. Use
portalProps.container for a host landmark that contains nonmodal suggestions.
Check popup position and clipping after setting the container.

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

## Optional editor toolbar menus

Install this optional item before importing its parts:

```sh
bunx --bun @yopem-ui/cli add editor-toolbar-menus
npx @yopem-ui/cli add editor-toolbar-menus
pnpm dlx @yopem-ui/cli add editor-toolbar-menus
yarn dlx @yopem-ui/cli add editor-toolbar-menus
```

Import parts from `@/components/editor/toolbar-menus`. Compose
`EditorFixedToolbarButtons` inside `EditorFixedToolbar` within `EditorRoot`. Use
`EditorListToolbarButtons` for grouped list controls. Use grouped icon controls
with full accessible names. Keep each group within its toolbar.
`EditorInsertMenu` adds an empty block after one current root block. It does not
convert selected content. `EditorTurnIntoMenu` converts native blocks.
`EditorMoreMenu` applies strikethrough, subscript, superscript, and highlight.
Saved selections expire after document or editable-state changes. Preserve host
event cancellation. Configured `authorizeAction` must return literal `true`. It
checks menu actions, not all grouped controls. Install `editor-floating-toolbar`
separately before composing `EditorFloatingToolbarButtons` inside
`EditorFloatingToolbar`. Optional feature nodes are not included. Native
keyboard, history, focus, and accessibility checks remain unvalidated. See
https://ui.yopem.com/components/editor-toolbar-menus for API notes.

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

Import `EditorReviewModeMenu` from `@/components/editor/review`. Keep it outside
a disabled `EditorToolbar`. Supply controlled `value`, synchronous
`canChangeMode`, and `onModeChange` for Editing, Suggestion, and Viewing. The
default accessible name includes the current mode. An explicit `aria-label` also
sets default visible text. Keep custom child text in the accessible name. Values
are `editing`, `suggestion`, and `viewing`. The host owns editable state and
review mode. Keep `onModeChange` synchronous. Commit the controlled value only
after review accepts. Recheck host write and suggestion policies in the
callback. Mode changes never grant permission. Enable editing synchronously
before `setSuggesting` when leaving Viewing. Restore the previous editable state
if review rejects.

Set `viewer` from a verified host identity. Supply a synchronous `can` policy.
Allow each action only when current policy returns literal `true`. Serialized
author IDs do not grant access. Check each action again on the server before
saving. `visible=false` hides review UI. It does not redact or delete state.

Review state uses root NodeState `yopemReview`, pending tree state
`yopemReviewStructural`, and text NodeState `yopemSuggestion`. Validate imported
state with `parseReviewDocument`. Register `MarkNode` in every reader that loads
review state. Untrusted input loses review metadata. Trust it only after host
verification.

Text diffs support one paragraph, 2048 graphemes, and 4096 UTF-16 units. Call
`$suggestDocumentTree` inside an editor update for one bounded tree proposal.
Resolve inline suggestions first. Tree proposals allow 128 KiB, 1024 nodes,
depth 24, and 128 changes. Call `decideStructural` outside Lexical read and
update contexts. Pending edits, changed documents, and ambiguous comment anchors
reject before replacement. Use `$suggestCompletedText` inside an update for
single-line output up to 16384 UTF-16 units. Suggestion creation and acceptance
are separate actions. Authorize document writes separately. Compose the
structural proposal, change-list, and decision parts. Use
`parseReviewDocument(value, trusted, true)` for structural-review IO. Trust
metadata only after host verification. Runtime validation remains deferred.
Enter tracks a root paragraph split. Shift+Enter tracks a line break. Other
supported block contexts use tracked line breaks. Resolve a pending paragraph
break before splitting that paragraph again. Call `$suggestNativeInsertNodes`
inside a synchronous editor update for explicit insert-only operations. Return
the new inserted nodes. Use normal text descendants and snapshots within 128
KiB. Resolve pending suggestions first. This API does not track arbitrary
callbacks or text-free nodes. Paste can retain validated same-namespace
paragraph and list fragments as one authored suggestion. Accept keeps the
fragment. Reject changes only that suggestion and preserves unrelated edits.
Rich HTML and unsupported native fragments are rejected. Pasted review metadata
is not preserved. `editor-document` does not import review formats. See
https://ui.yopem.com/components/editor-review for public contracts and limits.

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
state with useEditorInlineCombobox. Keep default option names short.
Descriptions use aria-describedby outside the named option. Keep the complete
row available for pointer selection. Compose EditorEmojiPopover,
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
does not require `EditorRoot`. Keep `@types/hast` and `@types/mdast` as direct
consumer dependencies. Keep copied pure models and `document/optional-nodes.ts`.

Optional `idPrefix` has 1–64 ASCII characters. Start with an ASCII letter. Use
ASCII letters, digits, underscores, or non-consecutive hyphens after it. Invalid
prefixes throw. Use the same stable prefix for server rendering and hydration.
Use a distinct prefix for each document in one owner document. Reserve generated
IDs against other host markup. Choose distinct, meaningful `aria-label` values
for multiple documents.

A prefix changes rendered IDs and fragment targets to
`<idPrefix>--<canonical-id>`. Update deep links when opting in. Native fragment
activation can change the URL and browser history. Changing a prefix changes its
links. Omitting `idPrefix` preserves canonical IDs and existing deep links, but
does not isolate multiple instances. Static prefixing does not change document
data. Prefixed markup is not portable document HTML.

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
readers. The portable reader rejects credentials and nonempty query or fragment
components. It may retain canonical ordinary-media and track URLs with empty
trailing delimiters, subject to all other checks. Register optional feature
nodes before live import. Readers retain footnotes, contents, columns, dates,
labels, drawings, editable cards, and diagram metadata. Optional nodes use
canonical HTML fallback. Markdown footnote input is supported. Transient card
fields are not saved. Drawing SDKs do not run during static conversion. Review
nodes remain unsupported. Do not silently remove unknown nodes or formatting
during conversion. See https://ui.yopem.com/components/editor-document for
supported formats.

## Optional editor media

Install `editor-media` separately. Import parts from
`@/components/editor/media`. Register `MediaExtension` in a stable root
extension array. Compose `MediaInsertControl` inside `EditorToolbar`.
`MediaInsertControl` and `MediaEditControl` reject literal `?` and `#`,
including empty delimiters. This insert rule applies to direct URLs and upload
results. Use query-free provider URLs with this control. In URL paths, `%3F` and
`%23` are path data. Provider and iframe rules can be stricter.
`MediaInsertControl` requires a fresh valid range, a connected editable root,
and a registered `MediaNode`. Content, changed non-null selection, read-only, or
root changes can invalidate the target. A null selection can remain while the
dialog has focus. On success, the control inserts after the ordered
selection-end root child or at the exact root gap. Its insertion keeps selected
content, list and table structure, and empty target blocks. It adds an empty
paragraph and selects the new media node. `$insertMedia` uses Lexical
nearest-root insertion on the current range. `MediaFileClipboard` restores its
range and calls `$insertMedia`. Its drop range comes from the drop position.
Clipboard completion requires an unchanged non-null range. The insert control
and clipboard insertion request `HISTORY_PUSH_TAG`. Media action changes and
removal also request it. This tag does not guarantee exact undo grouping. The
standalone `$insertMedia` helper adds no history tag or saved-target lease. Its
caller owns the update, selection, and history policy. These paths use
`parseMedia`, not the insert control's delimiter rule. Provider-specific checks
still apply. Ordinary URLs can have nonempty components that the portable reader
rejects. Placement has no control preservation guarantee. Cancellation signals
the host and discards stale local results. Remote cancellation is cooperative.
Each mounted `MediaInsertControl` instance keeps its upload slot until its
callback settles. Separate instances and remounts do not share that slot. The
placeholder controller keeps its own busy slot until settlement.
`MediaFileClipboard` does not retain an equivalent slot after cancellation.
Calling `start` on the same `createMediaUpload` task can supersede an unsettled
call. Earlier callbacks can continue. Enforce remote upload concurrency and
retry policy in the host. Cancellation does not prove that remote work stopped.
Mount `MediaFileClipboard` inside `EditorRoot` with a stable host upload
callback. It handles one file per paste or drop. Without upload, it registers
nothing. Rich MIME and higher-priority host handlers stay first. Callback
changes cancel pending work. Moving the caret cancels pending insertion. Host
callbacks enforce size, content, authorization, and quota limits. `MediaContent`
and image preview parts work without `EditorRoot`. Compose `MediaPreviewRoot`,
`MediaPreviewTrigger`, and `MediaPreviewDialog`, or use `MediaPreviewGallery`.
Supply unique image IDs. Zoom stays local. Use the house Slider and ScrollArea
controls for keyboard zoom and scrolling. `MediaEmbedContent` needs an explicit
provider or exact HTTPS-origin policy. Frames need user consent. Source, policy,
and disabled changes discard consent. Frame consent does not cover images,
video, audio, or caption tracks. Images can request their URLs when rendered.
Native media and tracks can make network requests. Preload settings do not
guarantee network privacy. Successful uploads retain the file name and URL.
Media JSON and tagged HTML can include URLs, names, alt text, and captions.
Account for this data in host delivery, CSP, logs, clipboard, and storage
policies. Tweet embeds use the fixed platform.twitter.com endpoint. HTML exports
keep inert links. Origin validation does not check DNS or redirects. Keep these
controls in the host. Use absolute HTTPS source and track URLs without
credentials. Supply alt text and captions for your content. Keep native
playback, file links, and iframe controls usable in read-only roots. Supply
bounded, abort-aware host uploads with server authorization and validation.
Private assets need explicit same-origin delivery integration. Never put tokens
in media URLs. Register `MediaNode` in document readers. Do not flatten
unsupported media during conversion.

Compose selected-media controls inside `MediaActions` and `EditorRoot`. Omit
`nodeKey` to follow one selected media node. Keep an explicit `nodeKey` fixed
until unmount. `MediaEditControl` changes the current source without another
insertion. `MediaCaptionTextarea` stores plain text with line breaks and a
10000-character limit. `MediaImageResize` supports images only. Escape and
pointer cancellation discard resize drafts. Content, target, and read-only
changes expire saved edits. Host event cancellation takes priority.

## Optional editor media placeholders

Install this optional item separately:

```sh
bunx --bun @yopem-ui/cli add editor-media-placeholder
npx @yopem-ui/cli add editor-media-placeholder
pnpm dlx @yopem-ui/cli add editor-media-placeholder
yarn dlx @yopem-ui/cli add editor-media-placeholder
```

Import parts from `@/components/editor/media-placeholder`. Create one stable
`createEditorMediaPlaceholder({ upload })` controller per root. Register
`MediaExtension` and `createMediaPlaceholderExtension(controller)` in a stable
root extensions array. Compose `MediaPlaceholderInsertButton` inside
`EditorToolbar` and `MediaUploadNotification` beside `EditorContent`. The native
node renders file, progress, typed failure, retry, cancel, and remove controls
through `MediaPlaceholderElement`. Each root allows at most 16 placeholders and
one active upload task. Files require 1 byte through 16 MiB and names of at most
512 characters. Use `controller.configure(upload)` when host authentication or
the upload callback changes. Document, changed non-null selection, read-only,
root, and host changes invalidate work. Cancel retains the busy slot until the
task settles. Cancellation does not prove that remote storage stopped. Retry
requires an explicit action. Success replaces the placeholder with validated
media. Placeholder upload results reject literal `?` and `#`, including empty
delimiters. JSON stores only `type: "editor-media-placeholder"`, `version: 1`,
and `uploadKind`. Never serialize File objects or private data. Restored
placeholders need a fresh file selection. An active upload holds a File in
memory. A failed upload can retain one File for explicit retry until
invalidation or cleanup. The host callback receives the File and can retain or
copy it, including after settlement. Successful replacement stores the file name
and URL in media JSON and tagged HTML. JSON omission does not erase memory or
remote copies. Insertion, replacement, and removal each create a separate
history step. Progress, failure, retry, and cancellation add no history steps.
Undo invalidates work; redo never uploads. No automatic upload, retry, or fetch
is supplied. No file-upload paste or drop handler is supplied. The extension
checks clipboard node insertion for placeholder limits and valid placement. Keep
authorization, content validation, and quotas in the host. Source workflows
remain runtime-unvalidated. See
https://ui.yopem.com/components/editor-media-placeholder for API notes.

## Optional footnotes and table of contents

Install `editor-footnotes` and `editor-toc` separately. Import parts from
`@/components/editor/footnote` and `@/components/editor/toc`. Keep feature
extensions stable when the root mounts. Compose controls inside `EditorToolbar`.
`EditorFootnoteTypeahead` owns the editable surface. Do not add adjacent
`EditorContent`. Keep repeated and unresolved references and duplicate
definitions. Renumber a selected duplicate explicitly. Do not silently rewrite
identifiers. Table-of-contents links target the current editor only. Live
contents and native TOC HTML show the first 500 nonempty headings in preorder.
Titles normalize whitespace and truncate to 256 UTF-16 code units. Portable
document export uses all headings and full text, subject to document limits. It
uses canonical document-scoped IDs, not live editor-scoped IDs. Portable HTML
input requires complete canonical heading links. Native TOC HTML can fail this
check. Base contents controls do not require typeahead. Add
`editorTocSlashCommand` only to a configured slash controller. Register feature
nodes in each reader. Model fragment codecs do not validate complete host
documents. Document readers support validated footnotes and table-of-contents
nodes. Keep canonical reference IDs.

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
feature and model subpaths. Document readers retain validated columns and dates.
Register the matching nodes before live import. Never flatten unknown nodes.
Supply complete host document validation; feature validators check only their
own contracts. See https://ui.yopem.com/components/editor-columns and
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
`EditorRoot`. Keep the wrapper mounted without a gutter. Use `onKeyDown` for
host Escape cancellation. Forward wrapper refs and `onKeyDownCapture` through
custom render elements. Same-document React portals retain wrapper ownership.
Keep native composition and unowned Escape behavior. Use the gutter and actions
for keyboard selection and movement. Use drag handles for pointer movement. Keep
keyboard movement available. Require synchronous literal `true` from
`authorizeCut` before native cut. Preserve native MIME handlers and
higher-priority host cancellation. Require literal `true` from custom document
validation. Content, selection, and read-only changes expire saved operations.
Authorize persisted document writes separately. Import parts from
`@/components/editor/block-selection-index`.

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
Select native text to open the toolbar. Use `EditorLinkFloatingToolbar` from the
same module for open, edit, and remove actions at a collapsed link caret.
Expanded link text keeps the text toolbar. Press Alt+F10 to focus the first
enabled control. Keep the saved-range guard. Document changes and read-only
transitions invalidate the target.

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

## Optional native Markdown fragment paste

Pass `{ markdown: true }` to `registerDocumentPaste` to insert validated
Markdown at the caret. Keep `EditorDocumentClipboardExtension` in the stable
root extensions array. Keep registration cleanup in the host lifecycle. Lexical
JSON and HTML have priority. Without this option, plain-text paste stays native.
Rejected empty or unsupported fragments keep selected content. Higher-priority
host vetoes still apply.

## Optional editor input shortcuts

Install `editor-autoformat` separately. Import `EditorAutoformatExtension` from
`@/components/editor/autoformat`. Keep it in a stable root extensions array.
Base Markdown shortcuts remain separate. Additional rules support checklist and
nested quote prefixes, horizontal rules, and smart text substitutions. Configure
stable element and text-match `transformers` with Lexical `configExtension`.
Host rules precede the extension's built-ins. Set `includeBuiltInRules` to
`false` to disable only these built-ins. Base Markdown stays separate. Register
transformer node dependencies at root creation. Keep callbacks synchronous and
regular expressions bounded. Host rules are not a sandbox. Remount to change
rule configuration. Code remains literal. Fractions require word boundaries.
Check native input policies, IME, history, and clipboard before production use.

Document readers support plain native horizontal rules. Register
`HorizontalRuleExtension` for live imports. Keep rules in block containers.
Unsupported presentation rejects instead of being discarded. Static output uses
the house Separator. Conversion workflows remain runtime-unverified.

## Optional editor block behavior

Install `editor-block-behavior` separately. Import
`EditorBlockBehaviorExtension` from `@/components/editor/block-behavior`.
Register it in a stable root extension array. Collapsed heading Enter makes the
new half a paragraph. Higher-priority host handlers can preempt the LOW-priority
rule. Other native handlers remain unchanged. Validate metadata, selection,
composition, history, and nested contexts before production use.

### Native label tokens

Install optional `editor-labels`. Import parts from
`@/components/editor/labels`. Keep `createEditorLabelsExtension(options)` stable
for the root. Compose the picker or house CheckboxGroup options. Use one through
64 unique options and at most ten tokens. Use `EditorLabelsSelect` for filtered
multiselect with removable tags. Compose `EditorLabelsInput`,
`EditorLabelsContent`, and `EditorLabelsTag` for custom layouts. Uncontrolled
selections update the native label document with undo support. Controlled
`value` needs `onValueChange`. Commit document changes through
`$replaceEditorLabels` in the host callback. Keep `options` identical to the
labels extension. Disabled and read-only changes close suggestions and clear the
query. Restoring editing does not open suggestions. Apply host minimum counts
separately. Replace only label-only content. Register EditorLabelNode in each
reader. Use labels-model for pure validation. Invalid node metadata rejects.
Unknown, duplicate, and excess valid tokens become plain text. Labels grant no
access. Document readers retain validated label tokens. Register label nodes
before live import.

## Optional Word clipboard

Install the separate bounded Office HTML feature.

```sh
bunx --bun @yopem-ui/cli add editor-word-clipboard
npx @yopem-ui/cli add editor-word-clipboard
pnpm dlx @yopem-ui/cli add editor-word-clipboard
yarn dlx @yopem-ui/cli add editor-word-clipboard
```

Register `EditorWordClipboardExtension` in a stable root extensions array.
Import helpers from `@/components/editor/word-clipboard` and pure normalization
from `@/components/editor/word-clipboard-model`. Call `registerDocumentPaste`
and `registerWordClipboardPaste` after creation. Keep both cleanup functions. Do
not change resolver options before remounting.

Keep native JSON and host MIME priority. Unsupported or stale fragments must not
remove selected content. Images reject by default. Supply a synchronous resolver
for already trusted media. Register `MediaExtension` for resolved images. Never
fetch pasted file or network image URLs automatically. Promises and thenables
reject. Host callback side effects cannot be rolled back.

This feature is separate from DOCX files. Full Word page layout and native
capture acceptance are not supplied. See
https://ui.yopem.com/components/editor-word-clipboard.

## Optional print and document images

```sh
bunx --bun @yopem-ui/cli add editor-document-export
npx @yopem-ui/cli add editor-document-export
pnpm dlx @yopem-ui/cli add editor-document-export
yarn dlx @yopem-ui/cli add editor-document-export
```

Compose `EditorDocumentPrintControl` inside `EditorRoot`. Print needs no capture
SDK. Read-only roots can export validated snapshots. Export keeps selection and
history unchanged. PNG needs an explicit capture callback.

```sh
bunx --bun @yopem-ui/cli add editor-document-export-image
npx @yopem-ui/cli add editor-document-export-image
pnpm dlx @yopem-ui/cli add editor-document-export-image
yarn dlx @yopem-ui/cli add editor-document-export-image
```

Import `captureEditorDocumentImageWithHtmlToImage` from
`@/components/editor/document-export-html-to-image`. Pass it as `capture` to
`EditorDocumentImageExportControl` or `EditorDocumentExportControls`. Supply an
abort-aware host resolver for remote images. Check exact origins and private
asset permission. Credential, query, and fragment URLs reject. Keep the
dependency license notice. Supply a CSP nonce when required. Print and PNG
layouts allow 4096 by 16384 pixels and 16777216 pixels total. Image limits count
every occurrence, including cached images. PNG checks validate container
structure and checksums, not decoded pixels. Only one export can run. Cancelled
work retains capacity until it settles. Native print dialogs and synchronous
browser work cannot be stopped. Verify local fonts, SVG foreignObject, CSP,
keyboard access, and owner-document cleanup. Browser and output checks remain
deferred.

## Optional editor PDF export

Install this optional item separately:

```sh
bunx --bun @yopem-ui/cli add editor-document-export-pdf
npx @yopem-ui/cli add editor-document-export-pdf
pnpm dlx @yopem-ui/cli add editor-document-export-pdf
yarn dlx @yopem-ui/cli add editor-document-export-pdf
```

Import `EditorDocumentPDFExportControl` from
`@/components/editor/document-export-pdf`. Compose it inside `EditorRoot` with
an explicit PNG `capture` callback. Install `editor-document-export-image` only
to use its optional `captureEditorDocumentImageWithHtmlToImage` adapter. Import
that adapter from `@/components/editor/document-export-html-to-image`. No
capture adapter is installed automatically. The control downloads `plate.pdf`
directly. It does not use native print. Output contains one raster page with an
opaque white JPEG image. Text is not selectable. Keep the existing export
resource policy, CSP nonce, stale-target checks, and shared operation lease.
Dimensions allow 4096 by 16384 pixels and 16777216 pixels total. Output has a 16
MiB limit. Decoded image dimensions must match the snapshot. Cancelled work
retains capacity until outstanding work settles. Read-only roots can export
without changes to saved content, selection, or history. Synchronous browser
work cannot be stopped. Browser and real PDF output checks remain unvalidated.
See https://ui.yopem.com/components/editor-document-export-pdf for API notes.

## Optional Word files

Install the separate source item:

```sh
bunx --bun @yopem-ui/cli add editor-docx
npx @yopem-ui/cli add editor-docx
pnpm dlx @yopem-ui/cli add editor-docx
yarn dlx @yopem-ui/cli add editor-docx
```

Import `parseDocx`, `importDocx`, and `exportDocx` from
`@/components/editor/docx`. Compose `EditorDocxImportControl`,
`EditorDocxExportControl`, or `EditorDocxControls` inside `EditorRoot`. Import
these client parts from `@/components/editor/docx-controls`. Read-only roots can
export but cannot import. Supply cancellation signals for host lifecycle
changes. Keep the independent 1 MiB archive and decoded-data limits. Native
deflate decompression is required for compressed Word files. Unsupported content
rejects before replacement. Full Word layout, images, macros, headers, and
footers are not supported. Synchronous parsing cannot be stopped. Word clipboard
cleanup is a separate integration. See
https://ui.yopem.com/components/editor-docx for the current subset and limits.

### Native list presentation

Install this optional item separately.

```sh
bunx --bun @yopem-ui/cli add editor-list-presentation
npx @yopem-ui/cli add editor-list-presentation
pnpm dlx @yopem-ui/cli add editor-list-presentation
yarn dlx @yopem-ui/cli add editor-list-presentation
```

Import controls from `@/components/editor/list-presentation`. Register
`EditorListPresentationExtension` in a stable root extensions array. Compose
`EditorListMarkerControl`, `EditorListStartControl`, or
`EditorListPresentationControls` inside `EditorToolbar`. Markers affect one
native list. Nested lists and checklists keep their own behavior. Preserve
`yopemListMarker` NodeState, `data-editor-list-marker`, and native ordered-list
`start` attributes. Starts accept signed 32-bit integers. Invalid drafts and
stale selections cannot change lists.

Optional `editor-document` retains validated list markers and signed starts in
JSON, HTML, Markdown, and static output. Markdown uses canonical HTML when
native Markdown cannot retain list presentation.

Install optional `editor-editable-card` separately. Import parts from
`@/components/editor/editable-card`. Register `EditorEditableCardExtension` at
root creation. Compose `EditorEditableCardInsertButton` inside `EditorToolbar`.
Keep native Tab order. Local fields and nested notes are transient and reset
after card removal or import. The nested editor has independent history. JSON
stores only type and version. Document readers retain this saved node, not
transient form values or nested-editor drafts.

Install optional `editor-copilot`. Import `EditorCopilot` from
`@/components/editor/copilot` inside `EditorRoot`. Supply stable host endpoint,
document ID, authentication, and CSRF configuration. No default endpoint or
model exists. Control+Space requests paragraph-end completion. Tab accepts all
completed text; Mod+Right accepts one grapheme. Escape cancels. Require
completion and clean EOF. Automatic requests require host and user opt-in and
can incur charges. Keep document authorization, quota, provider credentials, and
model selection on the server. Cancellation does not prove billing stops.

Install optional `editor-block-menu`. Import `createEditorBlockMenu` and
`EditorBlockMenu` from `@/components/editor/block-menu-index`. Keep one stable
controller per root. Register its extension before wrapping `EditorContent` with
the menu. Compose `EditorBlockSelection` with a separate stable controller for
gutter actions. Register both controller extensions once. Right-click or press
Shift+F10. Configured policy must return literal `true`; stale or pending
targets reject. Host Ask AI and Code Drawing callbacks require separate
authorization. No default service is supplied. Their second argument retains a
validated target after menu close. Subscribe to its availability. Call
`restoreSelection` from the native control's `onClick` handler. Prevent default
when restoration fails. Call `refresh` after host policy changes. Dispose
retained preparations during cleanup. New captures, content changes, and
read-only transitions invalidate them. For Add comment, supply `onAddComment`
and an `authorizeAction` policy that returns literal `true`. The callback owns
review UI, focus, and storage. It receives frozen block context. The controller
does not restore the captured selection for this action. Preserve native
selection, clipboard policy, history, and host event cancellation.

## Native diagram controls

Install `editor-diagram` separately. Import controls from
`@/components/editor/diagram`. Register `EditorDiagramExtension` in a stable
extensions array. Compose `EditorDiagramRoot` inside `EditorRoot` with explicit
renderers. Use focused Toolbar, InsertButton, KindSelect, ViewModeSelect,
RenderButton, DownloadButton, DeleteButton, Status, and Preview parts.

Native JSON and marked code HTML keep metadata. Document readers retain this
metadata without running renderers. Source stays visible until a matching
sanitized SVG image loads. Mount-time autoRender includes saved and read-only
nodes. Source changes wait 500 ms. Work allows two active renderers and sixteen
queued jobs. Use EditorDiagramDownloadButton format="png" for bounded PNG. SVG
remains the default. PDF is not supplied. Synchronous canvas work cannot be
interrupted. Install optional Mermaid, PlantUML, Graphviz, and Flowchart
adapters as separate registry items. Import SDK adapters only in browser-only
entries, never SSR routes. Use `renderEditorDiagram` for direct calls. It checks
budgets and sanitizes SVG. Source filters are supported subsets, not SDK
sandboxes. Cancellation cannot stop synchronous SDK work. Validate engine, CSP,
WebAssembly, and lifecycle compatibility before deployment. Host endpoints need
authentication, document authorization, exact Origin, CSRF, and execution
limits. Never put credentials in diagram URLs. Supply headers explicitly. See
https://ui.yopem.com/editor/diagram-root for composition and API details.

## Optional AI command menu

Install `editor-ai-menu` for configured commands and bounded local chat. Compose
EditorAiMenuRoot, EditorAiMenuTrigger, EditorAiMenuContent, and
EditorAiMenuPanel inside configured EditorAiRoot. Import EditorAiInlinePreview
from `@/components/editor/ai-menu-preview` for bounded escaped proposal text
beside the saved range. It changes no document state. Keep explicit approval
controls. EditorAiMenuContent owns the editable surface. Do not add
EditorContent beside it. Pass
`render={<EditorTypeahead controller={controller} />}` to compose typeahead into
that surface. Install editor-typeahead for this composition. Keep the controller
and root extensions stable. Supply an explicit same-origin host endpoint,
document ID, and current authentication and CSRF headers. Only explicit user
requests start inference. Approve cleanly completed plain text explicitly.
Review comments require the current review controller and literal-true host
policy. Suggest change creates an inline review suggestion from completed
single-line output. It requires current suggest permission and a valid saved
range. Accept or reject the suggestion separately. Authorize document writes
separately. Twelve truncated chat messages stay in memory across closes until
the menu root unmounts. Remount on document or viewer changes. No server chat
storage is supplied. Null selection retains the dialog target. Remount
EditorAiRoot to discard it. Selected-text context actions respect prevented host
events. Supply synchronous markdownInsertion for optional validated Markdown
approval. Install editor-document and call $insertDocumentFragment inside the
supplied update. Return literal true only after insertion succeeds. Failed
insertion keeps the proposal open. Register required nodes before rich
insertion. MDX remains literal source. Below insertion requires a supported
native block container. Runtime acceptance remains deferred.

### Native cursor overlays

Install optional `editor-cursor-overlay` separately. Import
`EditorCursorOverlay` from `@/components/editor/cursor-overlay`. Compose it
inside `EditorRoot` beside `EditorContent`. Keep native drag and drop. Overlay
paint is not saved document state or AI authorization. The root owner document
supplies the portal and native selection. Read-only transitions and document
changes clear the paint.

### Optional native drawing scenes

Install `editor-drawing` separately. Register `EditorDrawingExtension` in a
stable root array. Load `@/components/editor/drawing-browser` and the SDK
stylesheet inside a framework browser boundary. Self-host the installed SDK
fonts and preserve SDK and font notices. Restrict fallback font resources
through CSP. Register one drawing runtime per root and run its cleanup.
Concurrent runtimes must share the asset path. Keep scenes within 512 KiB and
2000 supported shapes. Files, images, link targets, and custom metadata reject.
Read-only roots can open saved scenes in view mode. They cannot insert or apply
drawing edits. Download validated JSON, sanitized SVG, or bounded PNG without
applying drafts. PNG clipboard copy requires browser support and user
activation. One module-instance export has a 30-second deadline and 16 MiB
output limit. PNG allows 4096 by 16384 pixels and 16777216 pixels total.
Cancellation cannot interrupt synchronous SDK or native clipboard work. Document
readers retain validated scene metadata, not SDK-rendered output. SDK dependency
advisories and runtime/SSR/accessibility acceptance remain unresolved. Do not
claim production safety.
