---
"@yopem-ui/cli": minor
---

Update the component design system, hosted registry, documentation, and
CLI-generated design guidance.

The component registry remains source-owned. This release does not add a
published React component package.

### Theme foundations and typography

- Use neutral light and dark surfaces. Keep normal links and hover states
  neutral.
- Limit blue to focus indicators, selected controls, and small information
  accents.
- Keep every existing color token name and public component export.
- Add `--accent-solid` and `--accent-solid-foreground` for filled selection
  states.
- Add `--control-background`, `--card-border`, `--overlay-shell`, and
  `--overlay-backdrop` for explicit surface composition.
- Add `--destructive-solid-foreground` and `--destructive-hover` for destructive
  controls.
- Add `--shadow-sm`, `--shadow-md`, `--shadow-lg`, and `--radius-full`.
- Use 12px corners for main surfaces and 8px corners for compact details. Keep
  functional circles and consumer radius overrides.
- Use Geist Sans and Geist Mono as the default font families. Load their
  variable fonts in the documentation app.
- Update Heading, Text, Blockquote, Mark, and Prose styling to match the revised
  typography.
- Align Label, Link, Kbd, and Clipboard details with the shared typography,
  surfaces, and focus styles.
- Keep focus styling connected to `--ring`. Keep active Sidebar colors connected
  to the sidebar-specific token pairs.
- Replace legacy translucent control surfaces and inset bevels with explicit
  semantic surfaces and shared shadows.

### Border and width options

- Add `Card.bordered`, with `true` as the default. Borderless cards remove their
  border and obsolete outline shadow.
- Remove the negative overlap when a borderless Card sits inside a CardFrame.
  Keep the existing CardFrame API.
- Add `Input.bordered` and `InputGroup.bordered`, with `true` as the default.
- Keep input focus, validation, disabled states, and consumer style overrides
  when borders are disabled.
- Add `Field.bordered` and `Fieldset.bordered`, with `false` as the default.
- Apply optional Field and Fieldset borders, padding, and corner styles to the
  wrapper only. Do not change child-control borders.
- Make NumberField compact by default, with `fullWidth={false}`. Set `fullWidth`
  to request the previous full-width layout.
- Make Table body rows borderless by default. Add `rowBorders` to show body-row
  dividers.
- Keep native table semantics and consumer StyleX overrides.

### Form controls and selection

- Update Button, Toggle, and ToggleGroup surfaces, corner sizes, spacing, focus
  states, and disabled styling.
- Align Checkbox, RadioGroup, Rating, Slider, and selection indicators with the
  shared semantic color pairs.
- Use shared control surfaces for Input, Textarea, InputGroup, NativeSelect,
  Select, and Combobox.
- Update Select with a 40px trigger, a quiet borderless popup, compact options,
  and blue selected rows.
- Update Combobox with compact neutral hover states and a borderless popup.
- Keep the blue selected Combobox row visible when that row is also highlighted.
- Align Autocomplete suggestion surfaces and focus styling with the shared
  selection controls.
- Add `AutocompleteInput.controlXstyle` for its rendered Input wrapper.
- Update Switch with a 37px by 18px track and an 8px thumb. Preserve RTL
  placement and coarse-pointer targets.
- Use logical positioning for Switch thumb travel. Honor text direction
  independently of document language.
- Align Calendar, OTPField, Tabs, and Toolbar controls with the revised surfaces
  and spacing.
- Start the Toolbar font selector with the valid `geist` option.

### Dialogs, sheets, drawers, and command search

- Add inset frames with separate outer-shell and inner-content surfaces to
  Dialog, AlertDialog, Sheet, and Command.
- Add optional `frameTitle` captions without replacing the inner accessible
  title.
- Add AlertDialogPopup `showCloseButton`, with `true` as the default, and
  `closeProps`. The close icon dismisses the dialog instead of confirming its
  action.
- Keep existing Dialog close options and Base UI focus management.
- Add `SheetPopup.surfaceXstyle` for direct inner-surface overrides. Apply
  consumer styles after the surface defaults.
- Keep Dialog and Sheet content scrollable and usable in short viewports.
- Align overlay footers with their inner content surfaces and remove obsolete
  dividing borders.
- Make Command reuse DialogPopup and declare its registry dependency on Dialog.
- Update Command search spacing, icon separation, focus styling, result rows,
  group labels, and mono shortcuts.
- Use the same Command example on the homepage and component page.
- Give Drawer one uniform surface instead of contrasting nested colors.
- Add optional Drawer frame captions while preserving swipe and snap behavior
  and existing close-button defaults.
- Keep the Drawer close icon at the top inline end and above the swipe handle.
- Apply Drawer close styles through Button `xstyle`, so Button defaults cannot
  override the close position.
- Remove the extra text close action from the Drawer example while retaining its
  close icon.

### Menus and floating content

- Update Menu and ContextMenu with quiet borderless popups, shared shadows,
  compact rows, and neutral hover states.
- Keep submenu navigation, checked indicators, selected states, keyboard
  behavior, and focus handling.
- Update Popover surfaces and floating frames to use the shared semantic tokens.
- Refine Tooltip spacing, text, compact corners, and arrow surfaces.
- Refine PreviewCard trigger styling, responsive content spacing, floating
  surface, and arrow treatment.

### Feedback, content, and data display

- Add a shared Toast close icon with the accessible name `Dismiss notification`.
- Remove the example's text-only Dismiss action.
- Use flat Toast surfaces and shared shadows for normal, stacked, and anchored
  notifications.
- Keep semantic status icon colors and Base UI stack, expansion, focus, and
  visibility behavior.
- Add public Toast examples for status, stacked, and anchored workflows.
- Keep Steps static, with blue current/completed indicators and neutral upcoming
  states.
- Use native list markers so visible Steps numbers honor `start`, `reversed`,
  and item `value` attributes.
- Keep the completed-step checkmark.
- Give ScrollArea quieter scrollbar colors and preview borders. Preserve wheel
  and keyboard scrolling.
- Update Codeblock frames, toolbars, labels, and copy controls while preserving
  syntax contrast, scrolling, and clipboard behavior.
- Align Accordion, Breadcrumb, Pagination, Frame, Group, Alert, Badge, Empty,
  Meter, Progress, Stat, and Marquee styling with the shared system.
- Keep the Float positioning API unchanged and update its example composition.
- Make the Skeleton example remain a skeleton. Remove its timer, profile data,
  and Follow actions.
- Update avatar examples with neutral sample names and Unsplash portraits.

### Sidebar, homepage, and documentation

- Use a compact 14rem Sidebar with neutral hierarchy, indented submenus, and
  borderless navigation rows.
- Keep mobile Sidebar surfaces uniform when composed with Sheet. Preserve
  dismissal, focus return, and navigation.
- Match documentation header, sidebar, and page backgrounds in both themes.
  Remove unwanted dividing borders.
- Redesign documentation search with a quiet borderless trigger, search icon,
  and borderless input group.
- Adapt global search to the shared inset Dialog frame.
- Add a `Browse components` link to the shared static 404 page. Keep recovery
  usable without JavaScript.
- Update homepage component showcases with square bordered preview panels and
  captions outside the panels.
- Center showcase content and use neutral caption links.
- Align component pages, API tables, navigation, code displays, and guide
  typography with the updated layout.
- Update theming, layout, styling, setup, and component usage documentation.
- Keep generated API notes, usage examples, registry dependencies,
  machine-readable docs, and consumer guidance aligned.
- Update CLI-generated guidance and the related agent skills for current tokens,
  component options, and composition rules.

### Preview loading and regression coverage

- Wait for preview imports before rendering lazy client previews. Preserve
  preload behavior and existing chunk-error recovery.
- Keep server-rendered preview controls available when JavaScript is disabled.
- Schedule homepage fallback previews without blocking hydration when
  IntersectionObserver is unavailable.
- Add shared browser readiness helpers for hydrated documentation and preview
  controls.
- Improve navigation checks for destination readiness and active mobile links.
- Add light/dark and desktop/mobile coverage for the new component options and
  visual states.
- Add native Steps numbering, Drawer pointer/keyboard/swipe dismissal, and
  mobile Sidebar/Sheet composition regressions.
- Extend open-state accessibility coverage to fourteen popup families in both
  themes and browser projects.
- Check suggestion inputs and popups with Axe while preserving Base UI
  background accessibility behavior.

### Existing consumers

- Use `fullWidth` on NumberField when a full-width field is required.
- Use `rowBorders` on Table when body-row dividers are required.
- Use `bordered={false}` to remove Card, Input, or InputGroup borders.
- Use `bordered` on Field or Fieldset to add a wrapper border without changing
  nested controls.
- Use `surfaceXstyle` on SheetPopup when the inner surface needs a direct style
  override.
- Keep existing token names, imports, exports, component props, refs, and
  documented slots. Review the revised visual defaults when updating copied
  source.
