import type { RuleTester } from "oxlint/plugins-dev"

type Rule = Parameters<RuleTester["run"]>[1]
type CreateRule = Extract<Rule, { create: (...args: never[]) => unknown }>
type RuleContext = Parameters<CreateRule["create"]>[0]
type RuleVisitor = ReturnType<CreateRule["create"]>
type JSXOpeningElement = Parameters<
  NonNullable<RuleVisitor["JSXOpeningElement"]>
>[0]

interface Plugin {
  meta: {
    name: string
  }
  configs: Record<string, { rules: Record<string, unknown> }>
  rules: Record<string, Rule>
}

type ImportDeclaration = Parameters<
  NonNullable<RuleVisitor["ImportDeclaration"]>
>[0]
type VariableDeclarator = Parameters<
  NonNullable<RuleVisitor["VariableDeclarator"]>
>[0]
type SourceNode = NonNullable<
  Parameters<RuleContext["sourceCode"]["getText"]>[0]
> & { type: string }
type Namespace = "svg" | "math" | null
type StylingMethod =
  | "atoms"
  | "className"
  | "reactStyle"
  | "stylexStyle"
  | "xstyle"

interface ImportBindings {
  components: Map<string, string>
  componentNamespaces: Set<string>
  stylexCreate: Set<string>
  stylexNamespaces: Set<string>
  stylexProps: Set<string>
  stylexWhen: Set<string>
  atoms: Set<string>
}

interface StyleDeclaration {
  name: string
  value: SourceNode
  valueText?: string
}

interface StylingOptions {
  atomsImports: string[]
  componentSources: string[]
  methods: Record<StylingMethod, boolean>
  preferStyleProps: boolean
  styleComponents: Set<string>
}

const DEFAULT_COMPONENT_SOURCES = [
  "@/components/ui/",
  "@registry/components/ui/",
  "@yopem-ui/ui",
]
const DEFAULT_ATOMS_IMPORTS = ["@stylexjs/atoms"]
export const styleComponentNames =
  "Accordion AccordionContent AccordionItem AccordionPanel AccordionTrigger Alert AlertAction AlertDescription AlertDialogBackdrop AlertDialogClose AlertDialogContent AlertDialogDescription AlertDialogFooter AlertDialogHeader AlertDialogOverlay AlertDialogPopup AlertDialogTitle AlertDialogTrigger AlertDialogViewport AlertTitle AnchoredToastProvider AutocompleteClear AutocompleteEmpty AutocompleteGroup AutocompleteGroupLabel AutocompleteInput AutocompleteItem AutocompleteList AutocompletePopup AutocompleteRow AutocompleteSeparator AutocompleteStatus AutocompleteTrigger Avatar AvatarFallback AvatarImage Badge Box Breadcrumb BreadcrumbEllipsis BreadcrumbItem BreadcrumbLink BreadcrumbList BreadcrumbPage BreadcrumbSeparator Button ButtonGroup ButtonGroupSeparator ButtonGroupText Calendar Card CardAction CardContent CardDescription CardFooter CardFrame CardFrameAction CardFrameDescription CardFrameFooter CardFrameHeader CardFrameTitle CardHeader CardPanel CardTitle Center Checkbox CheckboxGroup Collapsible CollapsibleContent CollapsiblePanel CollapsibleTrigger ComboboxChip ComboboxChipRemove ComboboxChips ComboboxChipsInput ComboboxClear ComboboxEmpty ComboboxGroup ComboboxGroupLabel ComboboxInput ComboboxItem ComboboxList ComboboxPopup ComboboxRow ComboboxSeparator ComboboxStatus ComboboxTrigger CommandDialogBackdrop CommandDialogPopup CommandDialogTrigger CommandDialogViewport CommandEmpty CommandFooter CommandGroup CommandGroupLabel CommandInput CommandItem CommandList CommandPanel CommandSeparator CommandShortcut ContextMenuCheckboxItem ContextMenuGroup ContextMenuGroupLabel ContextMenuItem ContextMenuLinkItem ContextMenuPopup ContextMenuRadioGroup ContextMenuRadioItem ContextMenuSeparator ContextMenuShortcut ContextMenuSubPopup ContextMenuSubTrigger ContextMenuTrigger CursorGrowIcon DialogBackdrop DialogClose DialogContent DialogDescription DialogFooter DialogHeader DialogOverlay DialogPanel DialogPopup DialogTitle DialogTrigger DialogViewport DrawerBackdrop DrawerBar DrawerClose DrawerContent DrawerDescription DrawerFooter DrawerHeader DrawerMenu DrawerMenuCheckboxItem DrawerMenuGroup DrawerMenuGroupLabel DrawerMenuItem DrawerMenuRadioGroup DrawerMenuRadioItem DrawerMenuSeparator DrawerMenuTrigger DrawerPanel DrawerPopup DrawerSwipeArea DrawerTitle DrawerTrigger DrawerViewport DropdownMenuCheckboxItem DropdownMenuContent DropdownMenuGroup DropdownMenuItem DropdownMenuLabel DropdownMenuRadioGroup DropdownMenuRadioItem DropdownMenuSeparator DropdownMenuShortcut DropdownMenuSubContent DropdownMenuSubTrigger DropdownMenuTrigger Empty EmptyContent EmptyDescription EmptyHeader EmptyMedia EmptyTitle Field FieldControl FieldDescription FieldError FieldItem FieldLabel Fieldset FieldsetLegend Flex Form Frame FrameDescription FrameFooter FrameHeader FramePanel FrameTitle Grid Group GroupSeparator GroupText HStack Heading HoverCardContent HoverCardTrigger Input InputGroup InputGroupAddon InputGroupInput InputGroupText InputGroupTextarea Kbd KbdGroup Label Link MenuCheckboxItem MenuGroup MenuGroupLabel MenuItem MenuLinkItem MenuPopup MenuRadioGroup MenuRadioItem MenuSeparator MenuShortcut MenuSubPopup MenuSubTrigger MenuTrigger Meter MeterIndicator MeterLabel MeterTrack MeterValue NumberField NumberFieldDecrement NumberFieldGroup NumberFieldIncrement NumberFieldInput NumberFieldScrubArea OTPField OTPFieldInput OTPFieldSeparator Pagination PaginationContent PaginationEllipsis PaginationItem PaginationLink PaginationNext PaginationPrevious Paragraph PopoverClose PopoverContent PopoverDescription PopoverPopup PopoverTitle PopoverTrigger PreviewCardPopup PreviewCardTrigger Progress ProgressIndicator ProgressLabel ProgressTrack ProgressValue Radio RadioGroup RadioGroupItem ScrollArea ScrollBar SelectButton SelectContent SelectGroup SelectGroupLabel SelectItem SelectLabel SelectPopup SelectSeparator SelectTrigger SelectValue Separator SheetBackdrop SheetClose SheetContent SheetDescription SheetFooter SheetHeader SheetOverlay SheetPanel SheetPopup SheetTitle SheetTrigger SheetViewport Sidebar SidebarContent SidebarFooter SidebarGroup SidebarGroupAction SidebarGroupContent SidebarGroupLabel SidebarHeader SidebarInput SidebarInset SidebarMenu SidebarMenuAction SidebarMenuBadge SidebarMenuButton SidebarMenuItem SidebarMenuSkeleton SidebarMenuSub SidebarMenuSubButton SidebarMenuSubItem SidebarMenuText SidebarProvider SidebarRail SidebarSeparator SidebarTrigger Skeleton Slider SliderValue Spinner Stack Switch Table TableBody TableCaption TableCell TableFooter TableHead TableHeader TableRow Tabs TabsContent TabsList TabsPanel TabsTab TabsTrigger Textarea ToastProvider Toggle ToggleGroup ToggleGroupItem ToggleGroupSeparator Toolbar ToolbarButton ToolbarGroup ToolbarInput ToolbarLink ToolbarSeparator TooltipContent TooltipPopup TooltipTrigger VStack".split(
    " ",
  )
const DEFAULT_STYLE_COMPONENTS = new Set(styleComponentNames)
const STYLE_METHODS: readonly StylingMethod[] = [
  "atoms",
  "className",
  "reactStyle",
  "stylexStyle",
  "xstyle",
]
const STYLE_PROP_ALIASES = new Set(
  "bg bgColor bgImage bgGradient bgSize bgPos bgPosition bgRepeat bgAttachment bgClip w h minW maxW minH maxH boxSize p px py pt pr pb pl ps pe paddingX paddingY paddingStart paddingEnd m mx my mt mr mb ml ms me marginX marginY marginStart marginEnd pos insetX insetY start end insetStart insetEnd flexDir rounded roundedTop roundedBottom roundedLeft roundedRight roundedStart roundedEnd roundedTopLeft roundedTopRight roundedBottomLeft roundedBottomRight borderX borderY borderXWidth borderYWidth borderXColor borderYColor borderXStyle borderYStyle roundedSS roundedSE roundedES roundedEE borderStart borderEnd borderStartWidth borderEndWidth borderStartColor borderEndColor borderStartStyle borderEndStyle shadow textDecor listStylePos listStyleImg spaceX spaceY".split(
    " ",
  ),
)
const PREFERRED_STYLE_PROPS: Readonly<Record<string, string>> = {
  background: "bg",
  backgroundColor: "bgColor",
  backgroundImage: "bgImage",
  backgroundPosition: "bgPos",
  backgroundSize: "bgSize",
  borderRadius: "rounded",
  boxShadow: "shadow",
  flexDirection: "flexDir",
  height: "h",
  margin: "m",
  marginBlock: "my",
  marginBottom: "mb",
  marginInline: "mx",
  marginLeft: "ml",
  marginRight: "mr",
  marginTop: "mt",
  maxHeight: "maxH",
  maxWidth: "maxW",
  minHeight: "minH",
  minWidth: "minW",
  padding: "p",
  paddingBlock: "py",
  paddingBottom: "pb",
  paddingInline: "px",
  paddingLeft: "pl",
  paddingRight: "pr",
  paddingTop: "pt",
  position: "pos",
  textDecoration: "textDecor",
  width: "w",
}
const UNSUPPORTED_STYLE_PROPS: Readonly<Record<string, string>> = {
  insetHorizontal: "insetX",
  insetVertical: "insetY",
  marginHorizontal: "mx",
  marginVertical: "my",
  paddingHorizontal: "px",
  paddingVertical: "py",
}

function isNode(value: unknown, type?: string): value is SourceNode {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof value.type === "string" &&
    (type === undefined || value.type === type)
  )
}

function getString(value: unknown) {
  return typeof value === "string" ? value : null
}

function hasProperty<Key extends PropertyKey>(
  value: unknown,
  key: Key,
): value is Record<Key, unknown> {
  return typeof value === "object" && value !== null && key in value
}

function getProperty(value: unknown, key: string): unknown {
  return hasProperty(value, key) ? value[key] : undefined
}

function getIdentifier(value: unknown) {
  return isNode(value) &&
    (value.type === "Identifier" || value.type === "JSXIdentifier")
    ? getString(getProperty(value, "name"))
    : null
}

function getLiteralString(value: unknown) {
  if (!isNode(value)) return null
  const literal = getProperty(value, "value")
  return typeof literal === "string" ? literal : null
}

function getPropertyName(value: unknown) {
  return getIdentifier(value) ?? getLiteralString(value)
}

function getImportSource(node: ImportDeclaration) {
  return getLiteralString(node.source)
}

function isMatchingSource(source: string, patterns: readonly string[]) {
  return patterns.some(
    (pattern) => source === pattern || source.startsWith(pattern),
  )
}

function getStringArray(value: unknown, fallback: Iterable<string>) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [...fallback]
}

function getStylingOptions(context: RuleContext): StylingOptions {
  const option = context.options[0]
  const record =
    typeof option === "object" && option !== null && !Array.isArray(option)
      ? option
      : {}
  const methodOption = getProperty(record, "methods")
  const methods = Object.fromEntries(
    STYLE_METHODS.map((method) => [
      method,
      typeof methodOption === "object" &&
      methodOption !== null &&
      typeof getProperty(methodOption, method) === "boolean"
        ? getProperty(methodOption, method)
        : true,
    ]),
  ) as Record<StylingMethod, boolean>

  return {
    atomsImports: getStringArray(
      getProperty(record, "atomsImports"),
      DEFAULT_ATOMS_IMPORTS,
    ),
    componentSources: getStringArray(
      getProperty(record, "componentSources"),
      DEFAULT_COMPONENT_SOURCES,
    ),
    methods,
    preferStyleProps: getProperty(record, "preferStyleProps") !== false,
    styleComponents: new Set(
      getStringArray(
        getProperty(record, "styleComponents"),
        DEFAULT_STYLE_COMPONENTS,
      ),
    ),
  }
}

function createImportBindings(): ImportBindings {
  return {
    atoms: new Set(),
    components: new Map(),
    componentNamespaces: new Set(),
    stylexCreate: new Set(),
    stylexNamespaces: new Set(),
    stylexProps: new Set(),
    stylexWhen: new Set(),
  }
}

function trackImports(
  node: ImportDeclaration,
  bindings: ImportBindings,
  options: StylingOptions,
) {
  const source = getImportSource(node)
  if (source === null || !Array.isArray(node.specifiers)) return

  for (const specifier of node.specifiers) {
    const local = getIdentifier(getProperty(specifier, "local"))
    if (local === null) continue
    const type = getString(getProperty(specifier, "type"))
    const imported =
      getPropertyName(getProperty(specifier, "imported")) ?? "default"

    if (isMatchingSource(source, options.componentSources)) {
      if (type === "ImportNamespaceSpecifier") {
        bindings.componentNamespaces.add(local)
      } else if (options.styleComponents.has(imported)) {
        bindings.components.set(local, imported)
      }
    }
    if (source === "@stylexjs/stylex") {
      if (type === "ImportNamespaceSpecifier" || imported === "default") {
        bindings.stylexNamespaces.add(local)
      }
      if (imported === "create") bindings.stylexCreate.add(local)
      if (imported === "props") bindings.stylexProps.add(local)
      if (imported === "when") bindings.stylexWhen.add(local)
    }
    if (
      isMatchingSource(source, options.atomsImports) &&
      imported === "default"
    ) {
      bindings.atoms.add(local)
    }
  }
}

function isImportBinding(
  node: JSXOpeningElement,
  name: string,
  context: RuleContext,
) {
  for (
    let scope: ReturnType<RuleContext["sourceCode"]["getScope"]> | null =
      context.sourceCode.getScope(node);
    scope !== null;
    scope = scope.upper
  ) {
    const variable = scope.variables.find(
      (candidate) => candidate.name === name,
    )
    if (variable !== undefined) {
      return variable.defs.some(
        (definition) => definition.type === "ImportBinding",
      )
    }
  }
  return false
}

function getComponent(
  name: unknown,
  node: JSXOpeningElement,
  bindings: ImportBindings,
  context: RuleContext,
  options: StylingOptions,
): string | null {
  const identifier = getIdentifier(name)
  if (identifier !== null) {
    return bindings.components.has(identifier) &&
      isImportBinding(node, identifier, context)
      ? (bindings.components.get(identifier) ?? null)
      : null
  }
  if (!isNode(name, "JSXMemberExpression")) return null
  const namespace = getIdentifier(getProperty(name, "object"))
  const property = getIdentifier(getProperty(name, "property"))
  return namespace !== null &&
    property !== null &&
    bindings.componentNamespaces.has(namespace) &&
    options.styleComponents.has(property) &&
    isImportBinding(node, namespace, context)
    ? property
    : null
}

function getAttributeName(attribute: unknown) {
  if (!isNode(attribute, "JSXAttribute")) return null
  return getIdentifier(getProperty(attribute, "name"))
}

function getAttributeExpression(attribute: unknown) {
  if (!isNode(attribute, "JSXAttribute")) return null
  const value = getProperty(attribute, "value")
  if (!isNode(value, "JSXExpressionContainer")) return null
  const expression = getProperty(value, "expression")
  return isNode(expression) ? expression : null
}

function isNamedCall(
  value: unknown,
  names: ReadonlySet<string>,
  namespaces: ReadonlySet<string>,
  method: string,
) {
  if (!isNode(value, "CallExpression")) return false
  const callee = getProperty(value, "callee")
  const direct = getIdentifier(callee)
  if (direct !== null && names.has(direct)) return true
  if (!isNode(callee, "MemberExpression")) return false
  const object = getIdentifier(getProperty(callee, "object"))
  return (
    object !== null &&
    namespaces.has(object) &&
    getPropertyName(getProperty(callee, "property")) === method
  )
}

function isStaticStylexCondition(value: unknown, bindings: ImportBindings) {
  if (!isNode(value, "CallExpression")) return false
  const callee = getProperty(value, "callee")
  if (!isNode(callee, "MemberExpression")) return false
  const condition = getPropertyName(getProperty(callee, "property"))
  if (condition !== "ancestor" && condition !== "descendant") return false
  const object = getProperty(callee, "object")
  const direct = getIdentifier(object)
  if (direct !== null) return bindings.stylexWhen.has(direct)
  if (!isNode(object, "MemberExpression")) return false
  const namespace = getIdentifier(getProperty(object, "object"))
  return (
    namespace !== null &&
    bindings.stylexNamespaces.has(namespace) &&
    getPropertyName(getProperty(object, "property")) === "when"
  )
}

function isStylexPropsCall(value: unknown, bindings: ImportBindings) {
  return isNamedCall(
    value,
    bindings.stylexProps,
    bindings.stylexNamespaces,
    "props",
  )
}

function getAtomMember(value: unknown) {
  const properties: { name: string; node: SourceNode }[] = []
  let current = value
  while (isNode(current, "MemberExpression")) {
    const property = getProperty(current, "property")
    const name = getPropertyName(property)
    if (name === null || !isNode(property)) return null
    properties.unshift({ name, node: property })
    current = getProperty(current, "object")
  }
  const root = getIdentifier(current)
  return root === null ? null : { properties, root }
}

function getAtomDeclaration(
  value: unknown,
  isAtomsRoot: (name: string) => boolean,
): StyleDeclaration | null {
  let member = value
  let dynamicValue: unknown
  if (isNode(value, "CallExpression")) {
    member = getProperty(value, "callee")
    dynamicValue = getCallArguments(value)[0]
  }
  const atom = getAtomMember(member)
  if (
    atom === null ||
    !isAtomsRoot(atom.root) ||
    atom.properties.length === 0
  ) {
    return null
  }
  const property = atom.properties[0]!.name
  if (dynamicValue !== undefined) {
    return isNode(dynamicValue)
      ? {
          name: PREFERRED_STYLE_PROPS[property] ?? property,
          value: dynamicValue,
        }
      : null
  }
  const atomValue = atom.properties[1]
  if (atomValue === undefined) return null
  const decodedValue = /^_\d/.test(atomValue.name)
    ? atomValue.name.slice(1)
    : atomValue.name
  return {
    name: PREFERRED_STYLE_PROPS[property] ?? property,
    value: atomValue.node,
    valueText: JSON.stringify(decodedValue),
  }
}

function getAtomDeclarations(
  value: unknown,
  isAtomsRoot: (name: string) => boolean,
): StyleDeclaration[] | null {
  const direct = getAtomDeclaration(value, isAtomsRoot)
  if (direct !== null) return [direct]
  const values = isNode(value, "ArrayExpression")
    ? getProperty(value, "elements")
    : isNode(value, "CallExpression")
      ? getCallArguments(value)
      : null
  if (!Array.isArray(values) || values.length === 0) return null
  const declarations = values.map((entry) =>
    getAtomDeclaration(entry, isAtomsRoot),
  )
  return declarations.every(
    (declaration): declaration is StyleDeclaration => declaration !== null,
  )
    ? declarations
    : null
}

function hasAtom(
  value: unknown,
  isAtomsRoot: (name: string) => boolean,
): boolean {
  if (getAtomDeclaration(value, isAtomsRoot) !== null) return true
  if (!isNode(value)) return false
  const children =
    value.type === "ArrayExpression"
      ? getProperty(value, "elements")
      : value.type === "CallExpression"
        ? getCallArguments(value)
        : value.type === "LogicalExpression"
          ? [getProperty(value, "left"), getProperty(value, "right")]
          : value.type === "ConditionalExpression"
            ? [
                getProperty(value, "consequent"),
                getProperty(value, "alternate"),
              ]
            : []
  return Array.isArray(children)
    ? children.some((child) => hasAtom(child, isAtomsRoot))
    : false
}

function getMemberParts(value: unknown) {
  if (!isNode(value, "MemberExpression")) return null
  const object = getIdentifier(getProperty(value, "object"))
  const property = getPropertyName(getProperty(value, "property"))
  return object !== null && property !== null ? { object, property } : null
}

function isStylePropValue(value: SourceNode) {
  if (!isNode(value, "ObjectExpression")) return true
  const properties = getProperty(value, "properties")
  if (!Array.isArray(properties)) return false
  return properties.every((property) => {
    if (!isNode(property, "Property")) return false
    const name = getPropertyName(getProperty(property, "key"))
    return (
      (name !== null &&
        /^(base|sm|md|lg|xl|2xl)(Only|Down|To[A-Z][a-z0-9]*)?$/.test(name)) ||
      name?.startsWith("_") === true
    )
  })
}

function getStyleDeclarations(value: unknown) {
  if (!isNode(value, "ObjectExpression")) return null
  const properties = getProperty(value, "properties")
  if (!Array.isArray(properties)) return null
  const declarations: StyleDeclaration[] = []

  for (const property of properties) {
    if (
      !isNode(property, "Property") ||
      getProperty(property, "computed") === true
    ) {
      return null
    }
    const name = getPropertyName(getProperty(property, "key"))
    const propertyValue = getProperty(property, "value")
    if (
      name === null ||
      !/^[A-Za-z][A-Za-z0-9]*$/.test(name) ||
      name === "base" ||
      name.startsWith("_") ||
      !isNode(propertyValue) ||
      !isStylePropValue(propertyValue)
    ) {
      return null
    }
    declarations.push({
      name: PREFERRED_STYLE_PROPS[name] ?? name,
      value: propertyValue,
    })
  }

  return declarations.length === 0 ? null : declarations
}

function getCallArguments(value: unknown) {
  const args = isNode(value, "CallExpression")
    ? getProperty(value, "arguments")
    : null
  return Array.isArray(args) ? args : []
}

function getMethodExpression(attribute: unknown) {
  return isNode(attribute, "JSXSpreadAttribute")
    ? getProperty(attribute, "argument")
    : getAttributeExpression(attribute)
}

function classifyMethod(
  attribute: unknown,
  node: JSXOpeningElement,
  bindings: ImportBindings,
  context: RuleContext,
): StylingMethod | null {
  const name = getAttributeName(attribute)
  const expression = getMethodExpression(attribute)
  const isAtomsRoot = (root: string) =>
    bindings.atoms.has(root) && isImportBinding(node, root, context)
  if (hasAtom(expression, isAtomsRoot)) return "atoms"
  if (name === "xstyle") return "xstyle"
  if (name === "className") return "className"
  if (name === "style") {
    if (
      isNode(expression, "MemberExpression") &&
      getPropertyName(getProperty(expression, "property")) === "style" &&
      isStylexPropsCall(getProperty(expression, "object"), bindings)
    ) {
      return "stylexStyle"
    }
    return "reactStyle"
  }
  if (
    isNode(attribute, "JSXSpreadAttribute") &&
    isStylexPropsCall(expression, bindings)
  ) {
    return "stylexStyle"
  }
  return null
}

function getMethodDeclarations(
  attribute: unknown,
  method: StylingMethod,
  staticStyles: Map<string, Map<string, StyleDeclaration[]>>,
  isAtomsRoot: (name: string) => boolean,
) {
  let expression = getMethodExpression(attribute)
  if (!isNode(expression)) return null
  if (method === "atoms") {
    const declarations = getAtomDeclarations(expression, isAtomsRoot)
    if (declarations === null) return null
    const names = declarations.map(({ name }) => name)
    if (new Set(names).size !== names.length) return null
    return {
      declarations,
      direct: isNode(attribute, "JSXAttribute"),
    }
  }
  if (method === "stylexStyle") {
    if (isNode(expression, "MemberExpression")) {
      expression = getProperty(expression, "object")
    }
    expression = getCallArguments(expression)[0]
  }
  if (!isNode(expression)) return null
  const direct = getStyleDeclarations(expression)
  if (direct !== null) return { declarations: direct, direct: true }
  const member = getMemberParts(expression)
  const declarations = member
    ? staticStyles.get(member.object)?.get(member.property)
    : null
  return declarations ? { declarations, direct: false } : null
}

function getStyleMethodAlternatives(options: StylingOptions) {
  const alternatives = ["style props"]
  for (const method of STYLE_METHODS) {
    if (options.methods[method]) alternatives.push(method)
  }
  return alternatives.join(", ")
}

function isSafeStylePropFix(
  node: JSXOpeningElement,
  attribute: unknown,
  declarations: readonly StyleDeclaration[],
) {
  if (!isNode(attribute)) return false
  const names = new Set(declarations.map(({ name }) => name))
  return node.attributes.every((candidate) => {
    if (candidate === attribute) return true
    const name = getAttributeName(candidate)
    return (
      name !== "css" &&
      name !== "xstyle" &&
      name !== "style" &&
      name !== "className" &&
      (name === null || !names.has(name))
    )
  })
}

const stylingRuleSchema = [
  {
    additionalProperties: false,
    properties: {
      atomsImports: { items: { type: "string" }, type: "array" },
      componentSources: { items: { type: "string" }, type: "array" },
      methods: {
        additionalProperties: false,
        properties: Object.fromEntries(
          STYLE_METHODS.map((method) => [method, { type: "boolean" }]),
        ),
        type: "object",
      },
      preferStyleProps: { type: "boolean" },
      styleComponents: { items: { type: "string" }, type: "array" },
    },
    type: "object",
  },
]

const HTML_ELEMENTS = new Set(
  "a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var video wbr script".split(
    " ",
  ),
)

const SVG_ELEMENTS = new Set(
  "a animate animateMotion animateTransform circle clipPath defs desc ellipse feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feDropShadow feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence filter foreignObject g image line linearGradient marker mask metadata mpath path pattern polygon polyline radialGradient rect script set stop style svg switch symbol text textPath title tspan use view".split(
    " ",
  ),
)

const MATHML_ELEMENTS = new Set(
  "annotation annotation-xml maction maligngroup malignmark math menclose merror mfenced mfrac mglyph mi mlabeledtr mmultiscripts mn mo mover mpadded mphantom mprescripts mroot mrow ms mscarries mscarry msline mspace msqrt msrow mstack mstyle msub msubsup msup mtable mtd mtext mtr munder munderover semantics".split(
    " ",
  ),
)

function getJsxTag(name: unknown) {
  if (typeof name !== "object" || name === null) return null
  return "type" in name &&
    name.type === "JSXIdentifier" &&
    "name" in name &&
    typeof name.name === "string"
    ? name.name
    : null
}

function getNamespace(
  node: JSXOpeningElement,
  context: RuleContext,
): Namespace {
  let namespace: Namespace = null

  for (const ancestor of context.sourceCode.getAncestors(node)) {
    if (
      !("type" in ancestor) ||
      ancestor.type !== "JSXElement" ||
      !("openingElement" in ancestor)
    )
      continue
    const opening = ancestor.openingElement
    if (typeof opening !== "object" || opening === null || !("name" in opening))
      continue
    const ancestorTag = getJsxTag(opening.name)
    if (ancestorTag === "svg") namespace = "svg"
    if (ancestorTag === "math") namespace = "math"
    if (ancestorTag === "foreignObject" && namespace === "svg") {
      namespace = null
    }
  }

  return namespace
}

function getAllowedElements(context: RuleContext) {
  const option = context.options[0]
  if (option === null || typeof option !== "object" || Array.isArray(option)) {
    return []
  }

  const allowElements = option.allowElements
  if (!Array.isArray(allowElements)) return []

  return allowElements.filter(
    (element): element is string => typeof element === "string",
  )
}

function isAllowedNamespaceElement(
  tag: string,
  node: JSXOpeningElement,
  context: RuleContext,
) {
  if (tag === "svg" || tag === "math") return true

  const namespace = getNamespace(node, context)
  if (namespace === "svg") return SVG_ELEMENTS.has(tag)
  if (namespace === "math") return MATHML_ELEMENTS.has(tag)
  return false
}

const enforceStylingMethodsRule: Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer component style props and control allowed JSX styling methods.",
    },
    fixable: "code",
    hasSuggestions: true,
    messages: {
      disallowedMethod:
        "{{method}} styling is disabled. Use {{alternatives}} instead.",
      preferStyleProps:
        "Prefer built-in style props ({{props}}) over {{method}} styling.",
      replaceWithStyleProps: "Replace with built-in style props.",
    },
    schema: stylingRuleSchema,
  },
  create(context: RuleContext) {
    const options = getStylingOptions(context)
    const bindings = createImportBindings()
    const staticStyles = new Map<string, Map<string, StyleDeclaration[]>>()

    return {
      ImportDeclaration(node: ImportDeclaration) {
        trackImports(node, bindings, options)
      },
      VariableDeclarator(node: VariableDeclarator) {
        const variable = getIdentifier(node.id)
        if (
          variable === null ||
          !isNamedCall(
            node.init,
            bindings.stylexCreate,
            bindings.stylexNamespaces,
            "create",
          )
        ) {
          return
        }
        const root = getCallArguments(node.init)[0]
        if (!isNode(root, "ObjectExpression")) return
        const properties = getProperty(root, "properties")
        if (!Array.isArray(properties)) return
        const styles = new Map<string, StyleDeclaration[]>()
        for (const property of properties) {
          if (!isNode(property, "Property")) continue
          const name = getPropertyName(getProperty(property, "key"))
          const declarations = getStyleDeclarations(
            getProperty(property, "value"),
          )
          if (name !== null && declarations !== null) {
            styles.set(name, declarations)
          }
        }
        staticStyles.set(variable, styles)
      },
      JSXOpeningElement(node: JSXOpeningElement) {
        if (
          getComponent(node.name, node, bindings, context, options) === null
        ) {
          return
        }

        for (const attribute of node.attributes) {
          const method = classifyMethod(attribute, node, bindings, context)
          if (method === null) continue
          if (!options.methods[method]) {
            context.report({
              data: {
                alternatives: getStyleMethodAlternatives(options),
                method,
              },
              messageId: "disallowedMethod",
              node: attribute,
            })
            continue
          }
          if (!options.preferStyleProps) continue
          const replacement = getMethodDeclarations(
            attribute,
            method,
            staticStyles,
            (root) =>
              bindings.atoms.has(root) && isImportBinding(node, root, context),
          )
          if (replacement === null) continue
          const existing = new Set(
            node.attributes
              .map(getAttributeName)
              .filter((name) => name !== null),
          )
          if (replacement.declarations.some(({ name }) => existing.has(name))) {
            continue
          }
          const text = replacement.declarations
            .map(
              ({ name, value, valueText }) =>
                `${name}={${valueText ?? context.sourceCode.getText(value)}}`,
            )
            .join(" ")
          const safe =
            replacement.direct &&
            isSafeStylePropFix(node, attribute, replacement.declarations)
          context.report({
            data: {
              method,
              props: replacement.declarations
                .map(({ name }) => name)
                .join(", "),
            },
            messageId: "preferStyleProps",
            node: attribute,
            fix: safe
              ? (fixer) => fixer.replaceText(attribute, text)
              : undefined,
            suggest: safe
              ? undefined
              : [
                  {
                    fix: (fixer) => fixer.replaceText(attribute, text),
                    messageId: "replaceWithStyleProps",
                  },
                ],
          })
        }
      },
    }
  },
}

const noUnsupportedStylePropsRule: Rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Reject known unsupported style-prop spellings.",
    },
    fixable: "code",
    messages: {
      unsupported:
        "Style prop {{name}} is unsupported. Use {{replacement}} instead.",
    },
    schema: stylingRuleSchema,
  },
  create(context: RuleContext) {
    const options = getStylingOptions(context)
    const bindings = createImportBindings()
    return {
      ImportDeclaration(node: ImportDeclaration) {
        trackImports(node, bindings, options)
      },
      JSXOpeningElement(node: JSXOpeningElement) {
        if (
          getComponent(node.name, node, bindings, context, options) === null
        ) {
          return
        }
        for (const attribute of node.attributes) {
          const name = getAttributeName(attribute)
          const replacement =
            name === null ? undefined : UNSUPPORTED_STYLE_PROPS[name]
          if (name === null || replacement === undefined) continue
          const nameNode = getProperty(attribute, "name")
          if (!isNode(nameNode)) continue
          context.report({
            data: { name, replacement },
            fix: (fixer) => fixer.replaceText(nameNode, replacement),
            messageId: "unsupported",
            node: attribute,
          })
        }
      },
    }
  },
}

const noLeakedDomStylePropsRule: Rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Prevent style props from leaking onto native DOM elements.",
    },
    messages: {
      leaked: "Style prop {{name}} is not a native <{{tag}}> attribute.",
    },
    schema: [],
  },
  create(context: RuleContext) {
    return {
      JSXOpeningElement(node: JSXOpeningElement) {
        const tag = getJsxTag(node.name)
        if (tag === null || !HTML_ELEMENTS.has(tag)) return
        for (const attribute of node.attributes) {
          const name = getAttributeName(attribute)
          if (name !== null && STYLE_PROP_ALIASES.has(name)) {
            context.report({
              data: { name, tag },
              messageId: "leaked",
              node: attribute,
            })
            continue
          }
          if (!isNode(attribute, "JSXSpreadAttribute")) continue
          const argument = getProperty(attribute, "argument")
          if (!isNode(argument, "ObjectExpression")) continue
          const properties = getProperty(argument, "properties")
          if (!Array.isArray(properties)) continue
          for (const property of properties) {
            const spreadName = isNode(property, "Property")
              ? getPropertyName(getProperty(property, "key"))
              : null
            if (spreadName === null || !STYLE_PROP_ALIASES.has(spreadName)) {
              continue
            }
            context.report({
              data: { name: spreadName, tag },
              messageId: "leaked",
              node: property,
            })
          }
        }
      },
    }
  },
}

const validPolymorphicAsRule: Rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require statically valid polymorphic as props.",
    },
    messages: {
      invalidHeading: "Heading as must be one of h1, h2, h3, h4, h5, or h6.",
      invalidIntrinsic: "{{component}} as must be a native JSX element string.",
    },
    schema: stylingRuleSchema,
  },
  create(context: RuleContext) {
    const options = getStylingOptions(context)
    const bindings = createImportBindings()
    return {
      ImportDeclaration(node: ImportDeclaration) {
        trackImports(node, bindings, options)
      },
      JSXOpeningElement(node: JSXOpeningElement) {
        const component = getComponent(
          node.name,
          node,
          bindings,
          context,
          options,
        )
        if (component !== "Box" && component !== "Heading") return
        const attribute = node.attributes.find(
          (candidate) => getAttributeName(candidate) === "as",
        )
        if (attribute === undefined) return
        const value = getProperty(attribute, "value")
        const tag = getLiteralString(value)
        if (component === "Heading") {
          if (tag === null || !/^h[1-6]$/.test(tag)) {
            context.report({ messageId: "invalidHeading", node: attribute })
          }
          return
        }
        if (tag === null || !HTML_ELEMENTS.has(tag)) {
          context.report({
            data: { component },
            messageId: "invalidIntrinsic",
            node: attribute,
          })
        }
      },
    }
  },
}

const staticStylexRule: Rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require statically analyzable StyleX create declarations.",
    },
    messages: {
      nonStatic:
        "StyleX create declarations must use static object shapes and keys.",
    },
    schema: [],
  },
  create(context: RuleContext) {
    const bindings = createImportBindings()
    const options = getStylingOptions(context)
    return {
      ImportDeclaration(node: ImportDeclaration) {
        trackImports(node, bindings, options)
      },
      VariableDeclarator(node: VariableDeclarator) {
        if (
          !isNamedCall(
            node.init,
            bindings.stylexCreate,
            bindings.stylexNamespaces,
            "create",
          )
        ) {
          return
        }
        const root = getCallArguments(node.init)[0]
        if (!isNode(root, "ObjectExpression")) {
          context.report({ messageId: "nonStatic", node })
          return
        }
        const stack: unknown[] = [root]
        while (stack.length > 0) {
          const current = stack.pop()
          if (!isNode(current, "ObjectExpression")) continue
          const properties = getProperty(current, "properties")
          if (!Array.isArray(properties)) continue
          for (const property of properties) {
            if (!isNode(property)) continue
            if (
              property.type !== "Property" ||
              (getProperty(property, "computed") === true &&
                !isStaticStylexCondition(
                  getProperty(property, "key"),
                  bindings,
                ))
            ) {
              context.report({ messageId: "nonStatic", node: property })
              continue
            }
            const value = getProperty(property, "value")
            if (isNode(value, "ObjectExpression")) stack.push(value)
          }
        }
      },
    }
  },
}

const preferUiPrimitivesRule: Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer UI primitives over known native HTML elements in JSX.",
    },
    messages: {
      preferPrimitive: "Prefer {{primitive}} over native <{{tag}}>.",
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          allowElements: {
            items: { type: "string" },
            type: "array",
          },
        },
        type: "object",
      },
    ],
  },
  create(context: RuleContext) {
    const allowedElements = new Set(getAllowedElements(context))

    return {
      JSXOpeningElement(node: JSXOpeningElement) {
        const tag = getJsxTag(node.name)
        if (
          tag === null ||
          !HTML_ELEMENTS.has(tag) ||
          tag.includes("-") ||
          allowedElements.has(tag) ||
          isAllowedNamespaceElement(tag, node, context)
        ) {
          return
        }

        context.report({
          data: {
            tag,
            primitive:
              tag === "a"
                ? "Link"
                : tag === "p"
                  ? "Paragraph"
                  : /^h[1-6]$/.test(tag)
                    ? `Heading as="${tag}"`
                    : tag === "div"
                      ? "Box, Flex, Grid, or Stack"
                      : `Box as="${tag}"`,
          },
          messageId: "preferPrimitive",
          node: node.name,
        })
      },
    }
  },
}

export const recommendedRules = {
  "yopem-ui/enforce-styling-methods": "error",
  "yopem-ui/no-leaked-dom-style-props": "error",
  "yopem-ui/no-unsupported-style-props": "error",
  "yopem-ui/prefer-ui-primitives": "error",
  "yopem-ui/static-stylex": "error",
  "yopem-ui/valid-polymorphic-as": "error",
} as const

const plugin: Plugin = {
  meta: {
    name: "yopem-ui",
  },
  configs: {
    recommended: { rules: recommendedRules },
    "strict-atoms": {
      rules: {
        ...recommendedRules,
        "yopem-ui/enforce-styling-methods": [
          "error",
          {
            methods: {
              className: false,
              reactStyle: false,
              stylexStyle: false,
              xstyle: false,
            },
            preferStyleProps: false,
          },
        ],
      },
    },
    "strict-stylex": {
      rules: {
        ...recommendedRules,
        "yopem-ui/enforce-styling-methods": [
          "error",
          {
            methods: {
              atoms: false,
              className: false,
              reactStyle: false,
              xstyle: false,
            },
            preferStyleProps: false,
          },
        ],
      },
    },
    "strict-xstyle": {
      rules: {
        ...recommendedRules,
        "yopem-ui/enforce-styling-methods": [
          "error",
          {
            methods: {
              atoms: false,
              className: false,
              reactStyle: false,
              stylexStyle: false,
            },
            preferStyleProps: false,
          },
        ],
      },
    },
  },
  rules: {
    "enforce-styling-methods": enforceStylingMethodsRule,
    "no-leaked-dom-style-props": noLeakedDomStylePropsRule,
    "no-unsupported-style-props": noUnsupportedStylePropsRule,
    "prefer-ui-primitives": preferUiPrimitivesRule,
    "static-stylex": staticStylexRule,
    "valid-polymorphic-as": validPolymorphicAsRule,
  },
}

export default plugin
