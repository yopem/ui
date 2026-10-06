// These notes describe Yopem's composition choices, not only the upstream types.
const usageNoteValues = {
  "use-event-callback": [
    "The returned function keeps its identity. It calls the latest committed callback. Arguments, return values, promises, and errors do not change.",
    "Use it only for event handlers and effect callbacks. Do not call it during render. A call before the first commit throws an error. Insertion effects publish updates. Aborted renders do not replace the committed callback.",
  ],
  "use-media-query": [
    "Pass a named breakpoint, max-md, a range such as sm:max-lg, or a raw CSS media query. Named breakpoint widths in pixels: sm=640, md=800, lg=1024, xl=1280, 2xl=1536, 3xl=1600, and 4xl=2000.",
    "Object queries accept min, max, and pointer (coarse or fine). Minimum widths are inclusive. Maximum widths are exclusive. Server snapshots return false. matchMedia change listeners update the client. They unsubscribe when the component unmounts or the query changes.",
  ],
  base: [
    "Copy the base files. Configure StyleX in your bundler. Import styles/styles.css once. Native StyleX tokens provide light defaults. You do not need a provider, script, or font package.",
    "Change tokens in tokens.stylex.ts. Create complete light and dark themes in that file. The optional theme item saves light, dark, and system preferences. styles.css contains reset, reduced-motion policy, and required upstream viewport rules. It does not contain theme values.",
    "The documentation copies components into src/components/ui and uses the standard @/* alias for src. Keep this alias in TypeScript, your bundler, and StyleX.",
    "Create local styles with stylex.create. Apply them through xstyle after component defaults and variants. Use className for external CSS integration.",
  ],
  theme: [
    "Install base first. Copy the two optional theme runtime files and their use-event-callback hook dependency. Pass the same configuration to ThemeProvider, ThemeScript, and getRootThemeProps.",
    "Create custom themes with StyleX in tokens.stylex.ts. Call createThemeConfig in your existing root layout. You do not need another configuration file. Use the same storageKey and defaultTheme in the provider and initial-paint script.",
  ],
  spinner: [
    "Use Spinner beside a loading label or inside a pending action.",
    "Keep a text status available to assistive technology. A spinner alone does not explain what is loading.",
  ],
  button: [
    'Use Button for an action. Set type="submit" inside a form when it should submit.',
    "loading displays Spinner and disables the native button. Use an accessible label for icon-only sizes. Use render with a link for navigation. Custom elements must block disabled interaction themselves. An anchor does not honor the disabled attribute.",
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
    "Use BreadcrumbPage for the current page. BreadcrumbEllipsis indicates hidden ancestor pages. Provide an interactive control if users must open those pages.",
  ],
  card: [
    "Compose CardHeader, CardTitle, CardDescription, CardPanel and CardFooter inside Card.",
    "CardContent is an alias for CardPanel. Use separator on CardHeader or CardFooter for a divider and matching spacing. CardFrame parts add an outer frame.",
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
    "Start with Box for generic containers. It renders a div by default. It sets default box sizing and minimum inline size. Use an element or callback with the Base UI render prop for composition. Put element-specific attributes, handlers, and refs on the rendered element.",
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
    "Container centers page content. It sets a 90rem maximum inline size and four spacing units of horizontal padding. Use fluid to remove the width limit. Use xstyle to change maximum width and padding.",
  ],
  "absolute-center": [
    "Position an ancestor before placing AbsoluteCenter inside it. Set axis to horizontal or vertical to center along one dimension only.",
  ],
  bleed: [
    "Place Bleed inside a padded region to extend content to its inline edges. Avoid using it as a page-width wrapper; Container handles that case.",
  ],
  float: [
    "Position the parent and use Float to place a badge or action over one corner. Keep interactive content accessible from the keyboard.",
  ],
  wrap: [
    "Wrap uses flex rows that wrap automatically. Set gap through xstyle rather than adding spacing to every child.",
  ],
  link: [
    'Link renders a native anchor with href, events, ref, and keyboard behavior. With TanStack Router, use render={<RouterLink to="/path" />}. With Next.js, use render={<NextLink href="/path" />}. The framework then handles navigation. Both router components must render an anchor.',
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
    "Heading renders h2 by default. Use render={<h1 />} through render={<h6 />} to select semantic levels. The Base UI render prop also supports callbacks and custom components. Use xstyle to control visual size independently of semantics.",
  ],
  checkmark: [
    "Checkmark is decorative and hidden from assistive technology. Include text that communicates success or selection beside it.",
  ],
  clipboard: [
    "Supply the value to copy. The button reports success or failure to assistive technology and never submits its parent form by default.",
  ],
  marquee: [
    "Marquee provides a pause control and stops animating with reduced motion. Do not put essential controls in moving content.",
  ],
  "native-select": [
    "Use NativeSelect with a visible label and native option elements. Choose it when custom popup behavior is unnecessary.",
  ],
  rating: [
    "Rating uses Base UI radio controls with arrow-key selection. Supply an accessible group label and use value or defaultValue with onValueChange.",
  ],
  stat: [
    "Compose StatLabel, StatValue and optional StatDescription inside Stat. The definition list keeps values paired with their labels.",
  ],
  steps: [
    "Compose StepsItem inside Steps in process order. Set status=current for the active item; the current step is exposed with aria-current=step.",
  ],
  group: [
    "Wrap adjacent controls in Group. Apply groupItemStyles.item through xstyle on each direct control. For Input and Textarea wrappers, use controlXstyle instead. GroupText and GroupSeparator apply joining styles themselves.",
    "orientation switches between horizontal and vertical layouts. ButtonGroup, ButtonGroupText and ButtonGroupSeparator are aliases.",
  ],
  kbd: [
    "Use Kbd for one key and KbdGroup for a shortcut sequence.",
    "This component only displays keys. Register the keyboard shortcut separately. Use the modifier names for the target platform.",
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
    "Use scope on header cells to identify row or column headers. Table provides an overflow wrapper. variant selects the presentation. It does not control sorting or pagination.",
  ],
  input: [
    "Pair Input with a label using Field or matching id and htmlFor.",
    "The default uses Base UI Input. nativeInput selects a plain input. A numeric size controls native input width. String sizes control visual size. unstyled removes only the outer wrapper styles. The inner input keeps its styles. A string className applies to the wrapper. A className callback receives the Base UI input state.",
  ],
  textarea: [
    "Pair Textarea with a visible label and use rows to set the initial height.",
    "The control renders Base UI Field.Control as a textarea. unstyled removes only the outer wrapper styles. It keeps the textarea styles. String sizes select visual size. The control accepts numeric size, but this does not set rows. Use rows explicitly. className styles the outer wrapper.",
  ],
  label: [
    "Use Label with htmlFor matching the control's id.",
    "For Base UI validation and description associations, use FieldLabel within Field instead.",
  ],
  field: [
    "Wrap FieldLabel, a control, FieldDescription and FieldError in Field.",
    "Field connects validation state and accessible descriptions. FieldControl provides the underlying control integration. FieldValidity provides render access to validation results. FieldItem arranges a control and its label.",
  ],
  fieldset: [
    "Group related controls inside Fieldset with FieldsetLegend as their shared label.",
    "Each control still needs its own label. Use this for a set of radio buttons or related contact fields.",
  ],
  form: [
    "Use Form around Field components to coordinate validation and submission.",
    "Handle onSubmit for client-side work. Prevent browser navigation when necessary. errors supplies server validation errors by field name.",
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
    "The group value is an array. Label the set with FieldsetLegend or an accessible label. Keep individual checkbox labels.",
  ],
  "radio-group": [
    "Place Radio controls with distinct values inside RadioGroup.",
    "Use value and onValueChange for a controlled selection. RadioGroupItem is an alias for Radio. Give the group a label. Give each option a label.",
  ],
  switch: [
    "Use Switch for a setting that takes effect immediately.",
    "Pair it with a label that describes the setting, not the current state. checked and onCheckedChange control the state. defaultChecked supplies the initial state.",
  ],
  slider: [
    "Use Slider for a value within min and max. Supply an array value for multiple thumbs.",
    "The wrapper creates the track, indicator, and thumbs. Label the control. Use SliderValue to display the selected value.",
  ],
  meter: [
    "Compose MeterLabel, MeterTrack with MeterIndicator, and MeterValue inside Meter.",
    "A meter describes a measurement such as storage usage. Use Progress instead for completion of a task.",
  ],
  progress: [
    "Compose ProgressLabel, ProgressTrack with ProgressIndicator, and ProgressValue inside Progress.",
    "Use a numeric value for known completion. Use null for indeterminate progress. Label the task, not only its percentage.",
  ],
  "number-field": [
    "Compose NumberFieldGroup with NumberFieldDecrement, NumberFieldInput and NumberFieldIncrement inside NumberField.",
    "Set min, max, and step to match the quantity. NumberFieldScrubArea requires a label. It supports pointer scrubbing. CursorGrowIcon is the scrub cursor graphic.",
  ],
  "otp-field": [
    "Place OTPFieldInput cells inside OTPField and use OTPFieldSeparator to split groups.",
    "Set length to the code length. Provide a label. Use onValueComplete to handle completion of all cells. Validate the code on the server.",
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
    "Toolbar manages focus movement between controls. Set an accessible label. Use ToolbarSeparator between action groups.",
  ],
  accordion: [
    "Place AccordionItem sections inside Accordion. Each item contains AccordionTrigger followed by AccordionPanel.",
    "Give each item a stable value. multiple permits several expanded items. AccordionTrigger includes the heading wrapper and chevron. AccordionContent is an alias for AccordionPanel.",
  ],
  collapsible: [
    "Place CollapsibleTrigger and CollapsiblePanel inside Collapsible.",
    "Use open and onOpenChange for controlled expansion. Use defaultOpen for initial expansion. CollapsibleContent is an alias for CollapsiblePanel.",
  ],
  tabs: [
    "Place TabsTab controls inside TabsList and match each value with a TabsPanel inside Tabs.",
    "TabsList selects size and variant for the tab strip. TabsTrigger is an alias for TabsTab. TabsContent is an alias for TabsPanel. Use tabs to switch views, not for unrelated page navigation.",
  ],
  pagination: [
    "Compose PaginationContent with PaginationItem and PaginationLink inside Pagination.",
    "Supply href for every destination and isActive on the current page. PaginationPrevious and PaginationNext provide direction labels. Pagination does not calculate page ranges or load data.",
  ],
  "scroll-area": [
    "Wrap overflowing content in ScrollArea and give its container a bounded height or width.",
    "The wrapper includes its viewport and scrollbars. scrollFade adds edge fades. scrollbarGutter reserves scrollbar space. Use ScrollBar for custom composition with ScrollAreaPrimitive.",
  ],
  "alert-dialog": [
    "Compose AlertDialogTrigger and AlertDialogPopup inside AlertDialog, with AlertDialogTitle, AlertDialogDescription and confirmation controls in the popup.",
    "Popup includes the portal, backdrop, and viewport. Do not wrap it in a second portal. Use this dialog for decisions that require a response. Keep the cancel action easy to reach.",
  ],
  "context-menu": [
    "Place ContextMenuTrigger and ContextMenuPopup inside ContextMenu. Put ContextMenuItem or ContextMenuLinkItem controls in the popup.",
    "Use checkbox and radio parts for choices. Use ContextMenuSub for nested menus. Popup includes positioning and a portal. Use context menus in addition to visible actions, not as replacements.",
  ],
  dialog: [
    "Compose DialogTrigger and DialogPopup inside Dialog. Give the popup a DialogTitle and, when useful, DialogDescription.",
    "DialogPopup includes its portal, backdrop, viewport, and optional close button. DialogPanel provides a scrolling content region. DialogContent is an alias for DialogPopup. DialogOverlay is an alias for DialogBackdrop.",
  ],
  drawer: [
    "Compose DrawerTrigger and DrawerPopup inside Drawer, with DrawerTitle, DrawerDescription and DrawerPanel in the popup.",
    "position selects the edge and sets the default swipe direction. DrawerPopup includes the portal, backdrop, and viewport. DrawerContent is the Base UI content region. It is not an alias for DrawerPopup.",
    "DrawerMenu parts arrange actions inside a drawer. They do not turn the drawer into an anchored Menu.",
  ],
  menu: [
    "Compose MenuTrigger and MenuPopup inside Menu. Add MenuItem for actions and MenuLinkItem for links.",
    "Use MenuCheckboxItem or MenuRadioGroup and MenuRadioItem for persistent choices. MenuSub, MenuSubTrigger and MenuSubPopup form a submenu. Popup already includes its portal and positioner.",
    "DropdownMenu-prefixed exports are compatibility aliases. MenuCreateHandle connects detached triggers to a root.",
  ],
  popover: [
    "Compose PopoverTrigger and PopoverPopup inside Popover. Add PopoverTitle, PopoverDescription and PopoverClose as needed.",
    "Popup includes the portal and positioner. side, align, and offsets control placement. Use a dialog if the content must block interaction outside it.",
  ],
  "preview-card": [
    "Compose PreviewCardTrigger and PreviewCardPopup inside PreviewCard to preview a linked resource.",
    "Keep essential information available without the preview. HoverCard, HoverCardTrigger, and HoverCardContent are aliases.",
  ],
  select: [
    "Place SelectTrigger and SelectPopup inside Select. Place SelectValue inside SelectTrigger. Place SelectItem choices inside SelectPopup.",
    "Assign a value to each item. Use SelectGroup with SelectGroupLabel for sections. Popup includes its portal and positioner. alignItemWithTrigger aligns the selected item with the trigger when possible.",
    "SelectButton is a styled button without the selection trigger behavior. Use SelectTrigger for a working select.",
  ],
  sheet: [
    "Compose SheetTrigger and SheetPopup inside Sheet, with SheetTitle, SheetDescription and SheetPanel in the popup.",
    "side selects the viewport edge. SheetPopup includes the portal, backdrop, viewport, and an optional close button. Use Drawer if swipe gestures are required.",
  ],
  tooltip: [
    "Place TooltipTrigger and TooltipPopup inside Tooltip. Share timing across nearby tooltips with TooltipProvider.",
    "Tooltip content is a short description, not an interactive panel. Icon buttons still need an accessible name. TooltipPopup includes its portal and positioner.",
  ],
  autocomplete: [
    "Place AutocompleteInput and AutocompletePopup inside Autocomplete. Use AutocompleteList and AutocompleteItem for results.",
    "Autocomplete suggests text. The input does not have to equal an option. Supply items. Render matching results through the list or collection. AutocompleteEmpty handles no matches. AutocompleteStatus announces result updates.",
    "The input can include a trigger, clear button and start addon. Use Combobox when users must select values.",
  ],
  calendar: [
    'Use Calendar with mode="single", "multiple" or "range", matching selected and onSelect to that mode.',
    "The default mode is single. Days outside the current month are visible. disabled blocks dates. startMonth and endMonth limit navigation. classNames and components merge with Yopem defaults.",
    "Selection props form a union. A property can be required in one mode even when the combined table marks it optional. Read the branch signatures for the selected mode.",
  ],
  combobox: [
    "Compose ComboboxInput and ComboboxPopup with ComboboxList and ComboboxItem inside Combobox.",
    "For multiple selection, use ComboboxChips, ComboboxChip, and ComboboxChipsInput. Each chip includes a remove control. Supply items. If options are objects, supply a stable mapping from each item to its value.",
    "ComboboxEmpty handles no matches. ComboboxCollection supports grouped rendering. useComboboxFilter matches strings for the selected locale.",
  ],
  command: [
    "Compose CommandInput and CommandList with CommandItem controls inside Command. Use CommandEmpty for no matches.",
    "Command is built on Autocomplete. Group results with CommandGroup and CommandGroupLabel. CommandShortcut displays a shortcut but does not register it.",
    "For a command palette, place Command inside CommandDialogPopup under CommandDialog. The popup includes the portal, backdrop, and viewport. Supply an accessible title or aria-label.",
  ],
  sidebar: [
    "Wrap Sidebar and the main content in SidebarProvider. Place SidebarTrigger where users can reach it. Use SidebarInset for inset content.",
    "Build navigation with SidebarGroup, SidebarMenu, SidebarMenuItem, and SidebarMenuButton. Use render for links. Use isActive for the current location.",
    "collapsible selects offcanvas, icon, or none. Mobile layout uses a sheet. useSidebar provides desktop and mobile state separately. Tooltip text identifies icon-only items in the collapsed state.",
  ],
  toast: [
    'Mount ToastProvider once, then call toastManager.add({ title: "Saved" }) after an action.',
    "Use anchoredToastManager with AnchoredToastProvider for anchor-positioned notifications. Keep the matching provider mounted while sending updates or closing a toast.",
    "ToastProvider position selects the viewport corner or center edge. Use timeout to control dismissal. Include actions only if users have sufficient time to reach them.",
  ],
} satisfies Record<string, [string, ...string[]]>

export const usageNotes = new Map<string, [string, ...string[]]>(
  Object.entries(usageNoteValues),
)

const ownPropNoteValues = {
  xstyle:
    "The component applies StyleX styles after this part's defaults and variants. xstyle accepts style objects, conditional arrays, themes, and dynamic styles.",
  controlXstyle:
    "StyleX overrides and scoped themes for the decorative control wrapper. xstyle targets the native input or textarea.",
  children: "Content rendered inside this part.",
  className:
    "Additional CSS class names use the external CSS cascade. They do not always override other styles. If the type accepts a callback, that callback receives the Base UI part state.",
  render:
    "Replaces the default element with an element or render callback while merging the part's props and behavior.",
  orientation: "Chooses horizontal or vertical layout.",
  label: "Accessible label for the number field's scrub area.",
  defaultTheme:
    "Sets the initial theme preference before the provider reads a stored preference. system uses the operating system theme.",
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
  size: "Selects the control's visual size. Numeric input sizes use native width. Textarea accepts numeric size. Use rows to set its row count.",
  loading:
    "Shows a spinner and sets disabled on the rendered element. Native buttons block interaction. Custom rendered links must block disabled interaction themselves.",
  nativeInput: "Renders a native input instead of Base UI Input.",
  unstyled:
    "Does not apply control wrapper styles. It keeps control behavior. Input and Textarea keep their inner element styles.",
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
    "Includes the built-in clear control. The input state controls its visibility.",
  startAddon: "Content before the editable input, such as an icon.",
  showCloseButton: "Includes a close button in the popup.",
  bottomStickOnMobile: "Aligns the popup to the bottom edge on narrow screens.",
  scrollFade: "Shows fades at the edges of scrollable content.",
  scrollable: "Wraps panel content in the scrolling area when true.",
  allowSelection:
    "Permits text selection in this drawer section. The section is not only a drag region.",
  showBar: "Shows the drawer's drag indicator.",
  position:
    "Selects the drawer edge or toast placement. See this part's allowed values.",
  side: "Selects the edge or anchored placement side. Collision handling can change anchored placement.",
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
    "Limits the scroll content's minimum width to the viewport.",
  fill: "Makes the scroll area fill the available container space.",
  overscrollContain:
    "Prevents scroll chaining to ancestors at the scroll area's boundary.",
  scrollbarGutter: "Reserves space for the vertical scrollbar.",
  collapsible:
    "Chooses offcanvas hiding, icon-only collapse, or a non-collapsible sidebar.",
  tooltip:
    "Tooltip text or TooltipPopup props for a collapsed sidebar menu button.",
  showOnHover: "Shows the menu action only on hover or focus.",
  showIcon: "Adds an icon placeholder to the sidebar skeleton.",
  defaultOpen: "Initial expanded state when uncontrolled.",
  open: "Controlled expanded state.",
  onOpenChange: "Called when expanded state should change.",
}

export const ownPropNotes = new Map(Object.entries(ownPropNoteValues))

// Defaults delegated to a styling helper or context are not parameter initializers.
const delegatedDefaultValues = {
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

export const delegatedDefaults = new Map<string, ReadonlyMap<string, string>>(
  Object.entries(delegatedDefaultValues).map(
    ([name, defaults]) =>
      [name, new Map<string, string>(Object.entries(defaults))] satisfies [
        string,
        ReadonlyMap<string, string>,
      ],
  ),
)
