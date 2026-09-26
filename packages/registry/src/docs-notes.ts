// These notes describe Yopem's composition choices, not only the upstream types.
export const usageNotes: Record<string, [string, ...string[]]> = {
  base: [
    "Copy the base files, configure StyleX in your bundler, and import styles/styles.css once. Native StyleX tokens provide light defaults; no provider, script, or font package is required.",
    "Customize tokens and create complete light/dark themes in tokens.stylex.ts. The optional theme item adds saved light/dark/system switching. styles.css contains reset, reduced-motion policy, and unavoidable upstream viewport rules, not theme values.",
    "The documentation copies components into src/components/ui and uses the standard @/* alias for src. Keep this alias in TypeScript, your bundler, and StyleX.",
    "Create local styles with stylex.create and compose them through xstyle after component defaults and variants. className remains available for external CSS integration; docs use StyleX only.",
  ],
  theme: [
    "Copy the two optional theme runtime files after base. Pass the same configuration to ThemeProvider, ThemeScript, and getRootThemeProps.",
    "Create custom themes with StyleX in tokens.stylex.ts. Call createThemeConfig in your existing root layout; no extra config file is required. Match storageKey and defaultTheme between the provider and initial-paint script.",
  ],
  spinner: [
    "Use Spinner beside a loading label or inside a pending action.",
    "Keep a text status available to assistive technology. A spinner alone does not explain what is loading.",
  ],
  button: [
    'Use Button for an action. Set type="submit" inside a form when it should submit.',
    "loading displays Spinner and disables the native button. Use an accessible label for icon-only sizes. Use render with a link for navigation; custom elements must handle disabled interaction themselves because an anchor does not honor the disabled attribute.",
  ],
  alert: [
    "Compose AlertTitle and AlertDescription inside Alert. Add AlertAction when the message needs a nearby action.",
    'Choose variant to communicate status, but include the status in text too. The root uses role="alert", so reserve it for messages that should be announced.',
  ],
  avatar: [
    "Place AvatarImage and AvatarFallback inside Avatar.",
    "Give the image useful alt text. The fallback can show initials when the image cannot load.",
  ],
  badge: [
    "Use Badge for short status text or a count.",
    "variant controls color and size controls spacing. Use render to change the element when the badge is also a link.",
  ],
  breadcrumb: [
    "Compose BreadcrumbList with BreadcrumbItem, BreadcrumbLink and BreadcrumbSeparator inside Breadcrumb.",
    "Use BreadcrumbPage for the current page. BreadcrumbEllipsis is a visual overflow indicator; provide a real control if hidden ancestors need to be opened.",
  ],
  card: [
    "Compose CardHeader, CardTitle, CardDescription, CardPanel and CardFooter inside Card.",
    "CardContent aliases CardPanel. Use separator on CardHeader or CardFooter for a divider and matching spacing. CardFrame parts add an outer frame.",
  ],
  empty: [
    "Use EmptyHeader with EmptyMedia, EmptyTitle and EmptyDescription, followed by EmptyContent for recovery actions.",
    'Explain why the view is empty and offer a next step. EmptyMedia variant="icon" adds a container for an icon.',
  ],
  frame: [
    "Use Frame to group FramePanel sections with a shared FrameHeader and FrameFooter.",
    "FrameTitle and FrameDescription label the group. Keep interactive controls inside the panels rather than making the entire frame clickable.",
  ],
  box: [
    "Start with Box for generic containers. It renders a div by default, applies default box sizing and minimum inline size, and supports native tags through as.",
    "Use xstyle for StyleX overrides and className for external CSS integration. Native attributes and refs follow the selected tag, including input size, image dimensions, and meta content.",
  ],
  flex: [
    "Flex renders a div with display:flex. Customize direction, alignment, and gap with xstyle.",
  ],
  vstack: [
    "VStack renders a div with centered items, column direction, and a default gap of four spacing units. Override through xstyle.",
  ],
  hstack: [
    "HStack renders a div with centered items, row direction, and a default gap of four spacing units. Override through xstyle.",
  ],
  stack: [
    "Stack renders a div with column direction and a default gap of four spacing units. Override through xstyle.",
  ],
  grid: [
    "Grid renders a div with display:grid. Set columns and gaps through xstyle.",
  ],
  center: [
    "Center renders a div with flex layout centered on both axes. Override through xstyle.",
  ],
  container: [
    "Container centers page content with a 90rem maximum inline size and four spacing units of horizontal padding. Use fluid to remove the width cap or xstyle to choose another maximum width and padding.",
  ],
  "absolute-center": [
    "Position an ancestor before placing AbsoluteCenter inside it. Set axis to horizontal or vertical to center along one dimension only.",
  ],
  bleed: [
    "Place Bleed inside a padded region to extend content to its inline edges. Avoid using it as a page-width wrapper; Container handles that case.",
  ],
  float: [
    "Position the parent and use Float to place a badge or action over one corner. Keep interactive content keyboard reachable.",
  ],
  wrap: [
    "Wrap uses flex rows that wrap automatically. Set gap through xstyle rather than adding spacing to every child.",
  ],
  link: [
    'Link renders a native anchor with href, events, ref, and keyboard behavior. Use render={<RouterLink to="/path" />} with TanStack Router or render={<NextLink href="/path" />} with Next.js so the framework handles navigation. Both router components must render an anchor.',
  ],
  text: [
    "Text replaces Paragraph and renders a native p. Use xstyle for typography.",
  ],
  blockquote: [
    "Use Blockquote for quoted passages, not for indentation. Supply a citation in surrounding content when needed.",
  ],
  em: [
    "Em adds semantic stress emphasis. Use it for meaning rather than visual italics alone.",
  ],
  highlight: [
    "Highlight marks matching text segments. Keep the original text readable when there are no matches.",
  ],
  mark: [
    "Mark highlights text relevant to the current context. It does not replace an accessible status message.",
  ],
  prose: [
    "Prose supplies a readable width for long-form content. Compose semantic headings, paragraphs and lists inside it.",
  ],
  codeblock: [
    "Codeblock preserves code whitespace and allows horizontal scrolling. Supply a language label outside the block when context is not obvious.",
  ],
  heading: [
    "Heading renders h2 by default; as accepts h1 through h6. Use xstyle to control visual size independently of semantics.",
  ],
  checkmark: [
    "Checkmark is decorative and hidden from assistive technology. Include text that communicates success or selection beside it.",
  ],
  clipboard: [
    "Supply the value to copy. The button reports success or failure to assistive technology and never submits its parent form by default.",
  ],
  marquee: [
    "Marquee provides a pause control and stops animating with reduced motion. Avoid putting essential controls in moving content.",
  ],
  group: [
    "Wrap adjacent controls in Group. Apply groupItemStyles.item through each direct control's xstyle, or controlXstyle for Input and Textarea wrappers. GroupText and GroupSeparator apply joining styles themselves.",
    "orientation switches between horizontal and vertical layouts. ButtonGroup, ButtonGroupText and ButtonGroupSeparator are aliases.",
  ],
  kbd: [
    "Use Kbd for one key and KbdGroup for a shortcut sequence.",
    "This is display-only. Register the keyboard shortcut separately and use the modifier names appropriate to the platform.",
  ],
  separator: [
    'Place Separator between related sections. Set orientation="vertical" for side-by-side content.',
    "Use decorative when the separator should not appear in the accessibility tree.",
  ],
  skeleton: [
    "Size Skeleton to match the content being loaded.",
    "Keep the loading status outside the placeholder. Replace the skeleton with content when loading completes.",
  ],
  table: [
    "Compose TableCaption, TableHeader, TableBody and TableFooter with TableRow, TableHead and TableCell.",
    "Use scope on header cells to identify row or column headers. Table provides an overflow wrapper; variant selects the presentation, not sorting or pagination.",
  ],
  input: [
    "Pair Input with a label using Field or matching id and htmlFor.",
    "The default uses Base UI's input. nativeInput selects a plain input. A numeric size controls the native input width; string sizes control the visual size. unstyled removes only the outer wrapper styles. The inner input keeps its styles. A string className applies to the wrapper; a callback receives the actual Base UI input state.",
  ],
  textarea: [
    "Pair Textarea with a visible label and use rows to set the initial height.",
    "The control uses Base UI Field.Control rendered as a textarea. unstyled removes the outer wrapper styles, not the textarea styles. String sizes choose visual sizing; numeric size is accepted but does not set rows. Use rows explicitly. className styles the outer wrapper.",
  ],
  label: [
    "Use Label with htmlFor matching the control's id.",
    "For Base UI validation and description associations, use FieldLabel within Field instead.",
  ],
  field: [
    "Wrap FieldLabel, a control, FieldDescription and FieldError in Field.",
    "Field connects validation state and accessible descriptions. FieldControl exposes the underlying control integration; FieldValidity provides render access to validation results. FieldItem lays out a control and its label.",
  ],
  fieldset: [
    "Group related controls inside Fieldset with FieldsetLegend as their shared label.",
    "Each control still needs its own label. Use this for a set of radio buttons or related contact fields.",
  ],
  form: [
    "Use Form around Field components to coordinate validation and submission.",
    "Handle onSubmit for client-side work and prevent the browser navigation when appropriate. errors supplies server validation errors by field name.",
  ],
  "input-group": [
    "Place InputGroupInput or InputGroupTextarea inside InputGroup. Use InputGroupAddon for icons or controls and InputGroupText for fixed text.",
    "Addon align accepts inline-start, inline-end, block-start or block-end. Addons do not replace the input's accessible label.",
  ],
  checkbox: [
    "Use Checkbox with a visible label for an independent yes-or-no choice.",
    "Use checked and onCheckedChange for controlled state, or defaultChecked for uncontrolled state. indeterminate represents a partially selected group.",
  ],
  "checkbox-group": [
    "Place Checkbox controls inside CheckboxGroup and give each checkbox a distinct value.",
    "The group value is an array. Label the set with FieldsetLegend or an accessible label; keep individual checkbox labels too.",
  ],
  "radio-group": [
    "Place Radio controls with distinct values inside RadioGroup.",
    "Use value and onValueChange for a controlled selection. RadioGroupItem aliases Radio. Give the group and each option a label.",
  ],
  switch: [
    "Use Switch for a setting that takes effect immediately.",
    "Pair it with a label describing the setting, not the current state. checked and onCheckedChange control it; defaultChecked supplies initial state.",
  ],
  slider: [
    "Use Slider for a value within min and max. Supply an array value for multiple thumbs.",
    "The wrapper creates the track, indicator and thumbs. Label the control and use SliderValue to display the selected value.",
  ],
  meter: [
    "Compose MeterLabel, MeterTrack with MeterIndicator, and MeterValue inside Meter.",
    "A meter describes a measurement such as storage usage. Use Progress instead for completion of a task.",
  ],
  progress: [
    "Compose ProgressLabel, ProgressTrack with ProgressIndicator, and ProgressValue inside Progress.",
    "Use a numeric value for known completion or null for indeterminate progress. Label the task, not just its percentage.",
  ],
  "number-field": [
    "Compose NumberFieldGroup with NumberFieldDecrement, NumberFieldInput and NumberFieldIncrement inside NumberField.",
    "Set min, max and step to match the quantity. NumberFieldScrubArea requires a label and supports pointer scrubbing. CursorGrowIcon is the scrub cursor graphic.",
  ],
  "otp-field": [
    "Place OTPFieldInput cells inside OTPField and use OTPFieldSeparator to split groups.",
    "Set length to the code length and provide a label. Use onValueComplete to react when all cells are filled; validate the code on the server.",
  ],
  toggle: [
    "Use Toggle for a pressed or unpressed action such as bold formatting.",
    "Use pressed and onPressedChange for controlled state. A toggle is not a checkbox replacement when collecting form data.",
  ],
  "toggle-group": [
    "Place ToggleGroupItem controls with distinct values inside ToggleGroup.",
    "multiple allows more than one selected item. The group supplies size and variant to its items. ToggleGroupSeparator divides adjacent sections.",
  ],
  toolbar: [
    "Compose ToolbarButton, ToolbarLink and ToolbarInput inside Toolbar, grouping related actions with ToolbarGroup.",
    "Toolbar manages focus movement between controls. Set an accessible label and use ToolbarSeparator between action groups.",
  ],
  accordion: [
    "Place AccordionItem sections inside Accordion. Each item contains AccordionTrigger followed by AccordionPanel.",
    "Give each item a stable value. multiple allows several expanded items. AccordionTrigger includes the heading wrapper and chevron; AccordionContent aliases AccordionPanel.",
  ],
  collapsible: [
    "Place CollapsibleTrigger and CollapsiblePanel inside Collapsible.",
    "Use open and onOpenChange for controlled expansion or defaultOpen for initial expansion. CollapsibleContent aliases CollapsiblePanel.",
  ],
  tabs: [
    "Place TabsTab controls inside TabsList and match each value with a TabsPanel inside Tabs.",
    "TabsList chooses size and variant for the tab strip. TabsTrigger aliases TabsTab and TabsContent aliases TabsPanel. Use tabs for switching views, not unrelated page navigation.",
  ],
  pagination: [
    "Compose PaginationContent with PaginationItem and PaginationLink inside Pagination.",
    "Supply href for every destination and isActive on the current page. PaginationPrevious and PaginationNext provide direction labels. Pagination does not calculate page ranges or load data.",
  ],
  "scroll-area": [
    "Wrap overflowing content in ScrollArea and give its container a bounded height or width.",
    "The wrapper includes its viewport and scrollbars. scrollFade adds edge fades; scrollbarGutter reserves scrollbar space. ScrollBar is available for custom composition with ScrollAreaPrimitive.",
  ],
  "alert-dialog": [
    "Compose AlertDialogTrigger and AlertDialogPopup inside AlertDialog, with AlertDialogTitle, AlertDialogDescription and confirmation controls in the popup.",
    "Popup includes the portal, backdrop and viewport. Do not wrap it in a second portal. Use this for decisions that require a response, and keep the cancel action easy to reach.",
  ],
  "context-menu": [
    "Place ContextMenuTrigger and ContextMenuPopup inside ContextMenu. Put ContextMenuItem or ContextMenuLinkItem controls in the popup.",
    "Use checkbox and radio parts for choices and ContextMenuSub for nested menus. Popup includes positioning and a portal. Context menus should supplement, not replace, visible actions.",
  ],
  dialog: [
    "Compose DialogTrigger and DialogPopup inside Dialog. Give the popup a DialogTitle and, when useful, DialogDescription.",
    "DialogPopup includes its portal, backdrop, viewport and optional close button. DialogPanel provides a scrolling content region. DialogContent and DialogOverlay are aliases for Popup and Backdrop.",
  ],
  drawer: [
    "Compose DrawerTrigger and DrawerPopup inside Drawer, with DrawerTitle, DrawerDescription and DrawerPanel in the popup.",
    "position selects the edge and drives the default swipe direction. DrawerPopup includes portal, backdrop and viewport. DrawerContent is the Base UI content region, not an alias for DrawerPopup.",
    "DrawerMenu parts arrange actions inside a drawer. They do not turn the drawer into an anchored Menu.",
  ],
  menu: [
    "Compose MenuTrigger and MenuPopup inside Menu. Add MenuItem for actions and MenuLinkItem for links.",
    "Use MenuCheckboxItem or MenuRadioGroup and MenuRadioItem for persistent choices. MenuSub, MenuSubTrigger and MenuSubPopup form a submenu. Popup already includes its portal and positioner.",
    "DropdownMenu-prefixed exports are compatibility aliases. MenuCreateHandle connects detached triggers to a root.",
  ],
  popover: [
    "Compose PopoverTrigger and PopoverPopup inside Popover. Add PopoverTitle, PopoverDescription and PopoverClose as needed.",
    "Popup includes the portal and positioner. side, align and offsets control placement. Use a dialog when the content must block interaction outside.",
  ],
  "preview-card": [
    "Compose PreviewCardTrigger and PreviewCardPopup inside PreviewCard to preview a linked resource.",
    "Keep essential information available without opening the preview. HoverCard, HoverCardTrigger and HoverCardContent are aliases.",
  ],
  select: [
    "Place SelectValue inside SelectTrigger, then SelectItem choices inside SelectPopup, all within Select.",
    "Assign a value to each item. Use SelectGroup with SelectGroupLabel for sections. Popup includes its portal and positioner; alignItemWithTrigger aligns the selected item with the trigger when possible.",
    "SelectButton is a styled button without the selection trigger behavior. Use SelectTrigger for a working select.",
  ],
  sheet: [
    "Compose SheetTrigger and SheetPopup inside Sheet, with SheetTitle, SheetDescription and SheetPanel in the popup.",
    "side chooses the viewport edge. SheetPopup includes portal, backdrop, viewport and an optional close button. Use Drawer instead when swipe gestures are required.",
  ],
  tooltip: [
    "Place TooltipTrigger and TooltipPopup inside Tooltip. Share timing across nearby tooltips with TooltipProvider.",
    "Tooltip content is a short description, not an interactive panel. Icon buttons still need an accessible name. TooltipPopup includes its portal and positioner.",
  ],
  autocomplete: [
    "Use AutocompleteInput and AutocompletePopup with AutocompleteList and AutocompleteItem inside Autocomplete.",
    "Autocomplete suggests text without requiring the input to equal an option. Supply items and render matching results through the list or collection. AutocompleteEmpty covers no matches; AutocompleteStatus announces result updates.",
    "The input can include a trigger, clear button and start addon. Use Combobox when users must select values.",
  ],
  calendar: [
    'Use Calendar with mode="single", "multiple" or "range", matching selected and onSelect to that mode.',
    "The default mode is single and outside days are visible. disabled blocks dates; startMonth and endMonth constrain navigation. classNames and components merge with Yopem defaults.",
    "Selection props form a union. A property can be required in one mode even when the combined table marks it optional. Read the branch signatures for the selected mode.",
  ],
  combobox: [
    "Compose ComboboxInput and ComboboxPopup with ComboboxList and ComboboxItem inside Combobox.",
    "For multiple selection, use ComboboxChips, ComboboxChip and ComboboxChipsInput. Each chip includes a remove control. Supply items and a stable item-to-value mapping when options are objects.",
    "ComboboxEmpty handles no matches. ComboboxCollection supports grouped rendering; useComboboxFilter provides locale-aware string matching.",
  ],
  command: [
    "Compose CommandInput and CommandList with CommandItem controls inside Command. Use CommandEmpty for no matches.",
    "Command is built on Autocomplete. Group results with CommandGroup and CommandGroupLabel. CommandShortcut displays a shortcut but does not register it.",
    "For a command palette, place Command inside CommandDialogPopup under CommandDialog. The popup includes portal, backdrop and viewport; supply an accessible title or aria-label.",
  ],
  sidebar: [
    "Wrap Sidebar and the main content in SidebarProvider. Place SidebarTrigger where users can reach it and use SidebarInset for inset content.",
    "Build navigation with SidebarGroup, SidebarMenu, SidebarMenuItem and SidebarMenuButton. Use render for links and isActive for the current location.",
    "collapsible selects offcanvas, icon or none. Mobile uses a sheet. useSidebar exposes desktop and mobile state separately. Tooltip text helps identify icon-only items when collapsed.",
  ],
  toast: [
    'Mount ToastProvider once, then call toastManager.add({ title: "Saved" }) after an action.',
    "Use anchoredToastManager with AnchoredToastProvider for anchor-positioned notifications. Keep the matching provider mounted while sending updates or closing a toast.",
    "ToastProvider position chooses the viewport corner or center edge. Use timeout to control dismissal and include actions only when users have enough time to reach them.",
  ],
}

export const ownPropNotes: Record<string, string> = {
  xstyle:
    "StyleX styles compose after this part's defaults and variants. Accepts style objects, conditional arrays, themes, and dynamic styles.",
  controlXstyle:
    "StyleX overrides and scoped themes for the decorative control wrapper. xstyle targets the native input or textarea.",
  children: "Content rendered inside this part.",
  className:
    "Additional CSS class names use the external CSS cascade and are not guaranteed to win last. When the type accepts a callback, it receives the Base UI part state.",
  render:
    "Replaces the default element with an element or render callback while merging the part's props and behavior.",
  orientation: "Chooses horizontal or vertical layout.",
  label: "Accessible label for the number field's scrub area.",
  defaultTheme:
    "Initial theme preference before a stored preference is read. system follows the operating system theme.",
  nonce: "Content Security Policy nonce for the inline theme script.",
  dark: "CSS class for the dark theme.",
  light: "CSS class for the light theme.",
  marker: "Theme marker class used by descendant StyleX selectors.",
  isMobile: "Whether the sidebar is using its mobile layout.",
  openMobile: "Whether the mobile sidebar sheet is open.",
  setOpen: "Updates the desktop sidebar's expanded state.",
  setOpenMobile: "Updates the mobile sidebar's open state.",
  state: "Desktop sidebar presentation: expanded or collapsed.",
  toggleSidebar:
    "Toggles the mobile sheet or desktop sidebar according to the current layout.",
  variant: "Selects the visual treatment. Allowed values depend on this part.",
  size: "Selects the control's visual size. Numeric input sizes use native width; Textarea accepts numeric size but requires rows to set its row count.",
  loading:
    "Shows a spinner and sets disabled on the rendered element. Native buttons block interaction; custom rendered links need their own disabled handling.",
  nativeInput: "Renders a native input instead of Base UI Input.",
  unstyled:
    "Skips the control wrapper styles while retaining behavior. Input and Textarea keep their inner element styles.",
  isActive: "Marks this navigation item as the current item.",
  inset:
    "Adds leading space to align text with neighboring items that have indicators.",
  portalProps:
    "Props passed to the portal created by this wrapper, including its container and keepMounted option.",
  closeProps: "Props passed to the built-in close control.",
  triggerProps: "Props passed to the input's built-in trigger.",
  clearProps: "Props passed to the input's built-in clear control.",
  removeProps: "Props passed to the chip's built-in remove control.",
  showTrigger: "Shows the built-in popup trigger beside the input.",
  showClear:
    "Includes the built-in clear control. Its visibility follows the input's state.",
  startAddon: "Content before the editable input, such as an icon.",
  showCloseButton: "Includes a close button in the popup.",
  bottomStickOnMobile: "Aligns the popup to the bottom edge on narrow screens.",
  scrollFade: "Shows fades at the edges of scrollable content.",
  scrollable: "Wraps panel content in the scrolling area when true.",
  allowSelection:
    "Allows text selection in this drawer section instead of treating it only as a drag region.",
  showBar: "Shows the drawer's drag indicator.",
  position:
    "Selects the drawer edge or toast placement. See this part's allowed values.",
  side: "Selects the edge or anchored placement side. Collision handling may adjust anchored placement.",
  align:
    "Aligns the popup along its anchor, or positions an input addon along its group.",
  sideOffset:
    "Distance from the anchor along the placement axis, in CSS pixels, or an offset callback.",
  alignOffset:
    "Offset along the alignment axis, in CSS pixels, or an offset callback.",
  anchor:
    "Positioning anchor override. Accepts the element, ref, virtual element or callback described by the type.",
  instant: "Skips the popover transition styles when true.",
  tooltipStyle: "Uses the compact tooltip appearance for the popover.",
  alignItemWithTrigger:
    "Aligns the selected option with the trigger when the positioning conditions allow it.",
  clampContentMinWidth:
    "Constrains the scroll content's minimum width to the viewport.",
  fill: "Makes the scroll area fill the available container space.",
  overscrollContain:
    "Prevents scroll chaining to ancestors at the scroll area's boundary.",
  scrollbarGutter: "Reserves space for the vertical scrollbar.",
  collapsible:
    "Chooses offcanvas hiding, icon-only collapse, or a non-collapsible sidebar.",
  tooltip:
    "Tooltip text or TooltipPopup props for a collapsed sidebar menu button.",
  showOnHover:
    "Reveals the menu action on hover or focus rather than keeping it visible.",
  showIcon: "Adds an icon placeholder to the sidebar skeleton.",
  defaultOpen: "Initial expanded state when uncontrolled.",
  open: "Controlled expanded state.",
  onOpenChange: "Called when expanded state should change.",
}

// Defaults delegated to a styling helper or context are not parameter initializers.
export const delegatedDefaults: Record<string, Record<string, string>> = {
  Button: {
    size: '"default"',
    variant: '"default"',
    type: '"button" when render is omitted',
  },
  Badge: { size: '"default"', variant: '"default"' },
  Alert: { variant: '"default"' },
  Toggle: { size: '"default"', variant: '"default"' },
  SelectButton: { size: '"default"' },
  AutocompleteInput: { size: '"default"' },
  ComboboxInput: { size: '"default"' },
  TabsTab: { size: "Inherited from TabsList" },
  TabsTrigger: { size: "Inherited from TabsList" },
  ToggleGroupItem: {
    size: "Inherited from ToggleGroup",
    variant: "Inherited from ToggleGroup",
  },
  DrawerPopup: { position: "Inherited from Drawer" },
  DrawerSwipeArea: { position: "Inherited from Drawer" },
  DrawerBar: { position: "Inherited from Drawer" },
}
