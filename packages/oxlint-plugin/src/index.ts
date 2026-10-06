import type { RuleTester } from "oxlint/plugins-dev"

type Rule = Parameters<RuleTester["run"]>[1]

type CreateRule = Extract<Rule, { create: (...args: never[]) => void }>

type RuleContext = Parameters<CreateRule["create"]>[0]

type RuleVisitor = ReturnType<CreateRule["create"]>

type JSXOpeningElement = Parameters<
  NonNullable<RuleVisitor["JSXOpeningElement"]>
>[0]

interface Plugin {
  meta: {
    name: string
  }
  configs: { recommended: { rules: typeof recommendedRules } }
  rules: Record<string, Rule>
}

type ImportDeclaration = Parameters<
  NonNullable<RuleVisitor["ImportDeclaration"]>
>[0]

type VariableDeclarator = Parameters<
  NonNullable<RuleVisitor["VariableDeclarator"]>
>[0]

type ScopedVariable = ReturnType<
  RuleContext["sourceCode"]["getScope"]
>["variables"][number]

type SourceNode = NonNullable<
  Parameters<RuleContext["sourceCode"]["getText"]>[0]
> & { type: string }

type JsonValue = boolean | null | number | string | JsonObject | JsonValue[]

interface JsonObject {
  [key: string]: JsonValue | undefined
}

type PluginValue = JsonValue | SourceNode | undefined

type StylingMethod =
  | "className"
  | "css"
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
}

interface StylingOptions {
  componentSources: string[]
  methods: Record<StylingMethod, boolean>
  styleComponents: Set<string>
}

interface StylePolicy {
  allow?: string[]
  deny?: string[]
  message?: string
}

interface StyleContract extends StylePolicy {
  pattern: string
}

interface RestyleOptions extends StylePolicy {
  contracts?: StyleContract[]
  exclude?: string[]
  componentSources?: string[]
  styleComponents?: string[]
}

const DEFAULT_COMPONENT_SOURCES = [
  "@/components/ui/",
  "@registry/components/ui/",
  "@yopem-ui/ui",
]

export const styleComponentNames =
  "AbsoluteCenter Accordion AccordionContent AccordionItem AccordionPanel AccordionTrigger Alert AlertAction AlertDescription AlertDialogBackdrop AlertDialogClose AlertDialogContent AlertDialogDescription AlertDialogFooter AlertDialogHeader AlertDialogOverlay AlertDialogPopup AlertDialogTitle AlertDialogTrigger AlertDialogViewport AlertTitle AnchoredToastProvider AutocompleteClear AutocompleteEmpty AutocompleteGroup AutocompleteGroupLabel AutocompleteInput AutocompleteItem AutocompleteList AutocompletePopup AutocompleteRow AutocompleteSeparator AutocompleteStatus AutocompleteTrigger Avatar AvatarFallback AvatarImage Badge Bleed Blockquote Box Breadcrumb BreadcrumbEllipsis BreadcrumbItem BreadcrumbLink BreadcrumbList BreadcrumbPage BreadcrumbSeparator Button ButtonGroup ButtonGroupSeparator ButtonGroupText Calendar Card CardAction CardContent CardDescription CardFooter CardFrame CardFrameAction CardFrameDescription CardFrameFooter CardFrameHeader CardFrameTitle CardHeader CardPanel CardTitle Center Checkbox CheckboxGroup Checkmark Clipboard Codeblock Collapsible CollapsibleContent CollapsiblePanel CollapsibleTrigger ComboboxChip ComboboxChipRemove ComboboxChips ComboboxChipsInput ComboboxClear ComboboxEmpty ComboboxGroup ComboboxGroupLabel ComboboxInput ComboboxItem ComboboxList ComboboxPopup ComboboxRow ComboboxSeparator ComboboxStatus ComboboxTrigger CommandDialogBackdrop CommandDialogPopup CommandDialogTrigger CommandDialogViewport CommandEmpty CommandFooter CommandGroup CommandGroupLabel CommandInput CommandItem CommandList CommandPanel CommandSeparator CommandShortcut ContextMenuCheckboxItem ContextMenuGroup ContextMenuGroupLabel ContextMenuItem ContextMenuLinkItem ContextMenuPopup ContextMenuRadioGroup ContextMenuRadioItem ContextMenuSeparator ContextMenuShortcut ContextMenuSubPopup ContextMenuSubTrigger ContextMenuTrigger CursorGrowIcon DialogBackdrop DialogClose DialogContent DialogDescription DialogFooter DialogHeader DialogOverlay DialogPanel DialogPopup DialogTitle DialogTrigger DialogViewport DrawerBackdrop DrawerBar DrawerClose DrawerContent DrawerDescription DrawerFooter DrawerHeader DrawerMenu DrawerMenuCheckboxItem DrawerMenuGroup DrawerMenuGroupLabel DrawerMenuItem DrawerMenuRadioGroup DrawerMenuRadioItem DrawerMenuSeparator DrawerMenuTrigger DrawerPanel DrawerPopup DrawerSwipeArea DrawerTitle DrawerTrigger DrawerViewport DropdownMenuCheckboxItem DropdownMenuContent DropdownMenuGroup DropdownMenuItem DropdownMenuLabel DropdownMenuRadioGroup DropdownMenuRadioItem DropdownMenuSeparator DropdownMenuShortcut DropdownMenuSubContent DropdownMenuSubTrigger DropdownMenuTrigger Em Empty EmptyContent EmptyDescription EmptyHeader EmptyMedia EmptyTitle Field FieldControl FieldDescription FieldError FieldItem FieldLabel Fieldset FieldsetLegend Flex Float Form Frame FrameDescription FrameFooter FrameHeader FramePanel FrameTitle Grid Group GroupSeparator GroupText HStack Heading Highlight HoverCardContent HoverCardTrigger Input InputGroup InputGroupAddon InputGroupInput InputGroupText InputGroupTextarea Kbd KbdGroup Label Mark Marquee MenuCheckboxItem MenuGroup MenuGroupLabel MenuItem MenuLinkItem MenuPopup MenuRadioGroup MenuRadioItem MenuSeparator MenuShortcut MenuSubPopup MenuSubTrigger MenuTrigger Meter MeterIndicator MeterLabel MeterTrack MeterValue NativeSelect NumberField NumberFieldDecrement NumberFieldGroup NumberFieldIncrement NumberFieldInput NumberFieldScrubArea OTPField OTPFieldInput OTPFieldSeparator Pagination PaginationContent PaginationEllipsis PaginationItem PaginationLink PaginationNext PaginationPrevious PopoverClose PopoverContent PopoverDescription PopoverPopup PopoverTitle PopoverTrigger PreviewCardPopup PreviewCardTrigger Progress ProgressIndicator ProgressLabel ProgressTrack ProgressValue Prose Radio RadioGroup RadioGroupItem Rating ScrollArea ScrollBar SelectButton SelectContent SelectGroup SelectGroupLabel SelectItem SelectLabel SelectPopup SelectSeparator SelectTrigger SelectValue Separator SheetBackdrop SheetClose SheetContent SheetDescription SheetFooter SheetHeader SheetOverlay SheetPanel SheetPopup SheetTitle SheetTrigger SheetViewport Sidebar SidebarContent SidebarFooter SidebarGroup SidebarGroupAction SidebarGroupContent SidebarGroupLabel SidebarHeader SidebarInput SidebarInset SidebarMenu SidebarMenuAction SidebarMenuBadge SidebarMenuButton SidebarMenuItem SidebarMenuSkeleton SidebarMenuSub SidebarMenuSubButton SidebarMenuSubItem SidebarMenuText SidebarProvider SidebarRail SidebarSeparator SidebarTrigger Skeleton Slider SliderValue Spinner Stack Stat StatDescription StatLabel StatValue Steps StepsItem Switch Table TableBody TableCaption TableCell TableFooter TableHead TableHeader TableRow Tabs TabsContent TabsList TabsPanel TabsTab TabsTrigger Text Textarea ToastProvider Toggle ToggleGroup ToggleGroupItem ToggleGroupSeparator Toolbar ToolbarButton ToolbarGroup ToolbarInput ToolbarLink ToolbarSeparator TooltipContent TooltipPopup TooltipTrigger VStack Wrap".split(
    " ",
  )

const DEFAULT_STYLE_COMPONENTS = new Set(styleComponentNames)

const STYLE_METHODS: readonly StylingMethod[] = [
  "className",
  "css",
  "reactStyle",
  "stylexStyle",
  "xstyle",
]

function isObject<Value>(value: Value): value is Value & object {
  // oxlint-disable-next-line quality/no-runtime-typeof -- SAFETY: AST and options inputs must be objects before property access.
  return typeof value === "object" && value !== null
}

function isString<Value>(value: Value): value is Value & string {
  // oxlint-disable-next-line quality/no-runtime-typeof -- SAFETY: AST string fields must be validated before use.
  return typeof value === "string"
}

function isBoolean<Value>(value: Value): value is Value & boolean {
  // oxlint-disable-next-line quality/no-runtime-typeof -- SAFETY: rule options must be validated before use.
  return typeof value === "boolean"
}

function isNode(value: PluginValue, type?: string): value is SourceNode {
  if (!isObject(value)) return false

  const nodeType = getProperty(value, "type")

  return isString(nodeType) && (type === undefined || nodeType === type)
}

function getProperty(value: PluginValue, key: string): PluginValue {
  if (!isObject(value)) return undefined

  const property: PluginValue = Object.getOwnPropertyDescriptor(
    value,
    key,
  )?.value

  return property
}

function getIdentifier(value: PluginValue) {
  if (
    !isNode(value) ||
    (value.type !== "Identifier" && value.type !== "JSXIdentifier")
  )
    return null

  const name = getProperty(value, "name")

  return isString(name) ? name : null
}

function getLiteralString(value: PluginValue) {
  if (!isNode(value)) return null
  const literal = getProperty(value, "value")

  return isString(literal) ? literal : null
}

function getPropertyName(value: PluginValue) {
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

function getStringArray(value: PluginValue, fallback: Iterable<string>) {
  return Array.isArray(value) ? value.filter(isString) : [...fallback]
}

function getStylingOptions(context: RuleContext): StylingOptions {
  const option = context.options[0]

  const record = isObject(option) && !Array.isArray(option) ? option : {}

  const methodOption = getProperty(record, "methods")

  // SAFETY: STYLE_METHODS lists every StylingMethod before building this record.
  const methods = Object.fromEntries(
    STYLE_METHODS.map((method) => [
      method,
      isObject(methodOption) &&
      !Array.isArray(methodOption) &&
      isBoolean(getProperty(methodOption, method))
        ? getProperty(methodOption, method)
        : method === "className" || method === "xstyle",
    ]),
  ) as Record<StylingMethod, boolean>

  return {
    componentSources: getStringArray(
      getProperty(record, "componentSources"),
      DEFAULT_COMPONENT_SOURCES,
    ),
    methods,
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
    const typeValue = getProperty(specifier, "type")
    const type = isString(typeValue) ? typeValue : null

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
  }
}

function getVariable(
  node: JSXOpeningElement | VariableDeclarator,
  name: string,
  context: RuleContext,
): ScopedVariable | undefined {
  for (
    let scope: ReturnType<RuleContext["sourceCode"]["getScope"]> | null =
      context.sourceCode.getScope(node);
    scope !== null;
    scope = scope.upper
  ) {
    const variable = scope.variables.find(
      (candidate) => candidate.name === name,
    )

    if (variable !== undefined) return variable
  }

  return undefined
}

function isImportBinding(
  node: JSXOpeningElement,
  name: string,
  context: RuleContext,
) {
  return (
    getVariable(node, name, context)?.defs.some(
      (definition) => definition.type === "ImportBinding",
    ) ?? false
  )
}

function getComponent(
  name: PluginValue,
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

function getAttributeName(attribute: PluginValue) {
  if (!isNode(attribute, "JSXAttribute")) return null

  return getIdentifier(getProperty(attribute, "name"))
}

function getAttributeExpression(attribute: PluginValue) {
  if (!isNode(attribute, "JSXAttribute")) return null
  const value = getProperty(attribute, "value")

  if (!isNode(value, "JSXExpressionContainer")) return null
  const expression = getProperty(value, "expression")

  return isNode(expression) ? expression : null
}

function isNamedCall(
  value: PluginValue,
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

function isStaticStylexCondition(value: PluginValue, bindings: ImportBindings) {
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

function isStylexPropsCall(value: PluginValue, bindings: ImportBindings) {
  return isNamedCall(
    value,
    bindings.stylexProps,
    bindings.stylexNamespaces,
    "props",
  )
}

function getCallArguments(value: PluginValue) {
  const args = isNode(value, "CallExpression")
    ? getProperty(value, "arguments")
    : null

  return Array.isArray(args) ? args : []
}

function getRestyleOptions(context: RuleContext): RestyleOptions {
  const option = context.options[0]

  return isObject(option) && !Array.isArray(option) ? option : {}
}

function matchesPattern(value: string, pattern: string) {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  return new RegExp(`^${escaped.replaceAll("\\*", ".*")}$`).test(value)
}

const PROPERTY_CATEGORIES = {
  background: "color",
  borderColor: "color",
  color: "color",
  fill: "color",
  stroke: "color",
  margin: "layout",
  inlineSize: "layout",
  blockSize: "layout",
  width: "layout",
  height: "layout",
  padding: "spacing",
  gap: "spacing",
  font: "typography",
  text: "typography",
  lineHeight: "typography",
  borderRadius: "shape",
  boxShadow: "effects",
  opacity: "effects",
  animation: "motion",
  transition: "motion",
}

function categoryOf(property: string) {
  return (
    Object.entries(PROPERTY_CATEGORIES).find(([prefix]) =>
      property.startsWith(prefix),
    )?.[1] ?? "unclassified"
  )
}

function policyAllows(property: string, policy: StylePolicy) {
  const matches = (entry: string) =>
    entry === categoryOf(property) || matchesPattern(property, entry)

  return (
    (policy.allow === undefined || policy.allow.some(matches)) &&
    !policy.deny?.some(matches)
  )
}

const COMPONENT_PROPS = new Map<string, { variant?: boolean; size?: boolean }>([
  ["Button", { variant: true, size: true }],
  ["Badge", { variant: true, size: true }],
  ["Toggle", { variant: true, size: true }],
  ["Tabs", { variant: true, size: true }],
  ["TabsTab", { size: true }],
  ["Table", { variant: true }],
  ["Input", { size: true }],
  ["Textarea", { size: true }],
  ["NumberField", { size: true }],
  ["SidebarMenuButton", { variant: true, size: true }],
  ["Alert", { variant: true }],
  ["Sidebar", { variant: true }],
])

function defaultRestyleMessage(component: string, property: string) {
  const category = categoryOf(property)
  const props = COMPONENT_PROPS.get(component)

  const alternative =
    category === "spacing" && props?.size
      ? "size"
      : (category === "color" ||
            category === "shape" ||
            category === "effects") &&
          props?.variant
        ? "variant"
        : null

  return alternative === null
    ? `${property} cannot restyle ${component}. Use a component prop or approved StyleX property.`
    : `${property} cannot restyle ${component}. Use its ${alternative} prop first.`
}

function getPolicy(component: string, options: RestyleOptions): StylePolicy {
  const contract = options.contracts?.findLast((entry) => {
    try {
      return new RegExp(entry.pattern).test(component)
    } catch {
      return false
    }
  })

  return {
    allow: contract?.allow ?? options.allow ?? ["layout"],
    deny: contract?.deny ?? options.deny,
    message: contract?.message ?? options.message,
  }
}

function visitStyleProperties(
  value: PluginValue,
  onProperty: (property: string, node: SourceNode) => void,
) {
  if (!isNode(value, "ObjectExpression")) return
  const properties = getProperty(value, "properties")

  if (!Array.isArray(properties)) return

  for (const item of properties) {
    if (!isNode(item, "Property")) continue
    const property = getPropertyName(getProperty(item, "key"))
    const child = getProperty(item, "value")

    if (
      property !== null &&
      !property.startsWith(":") &&
      !property.startsWith("@")
    ) {
      onProperty(property, item)
    } else if (isNode(child, "ObjectExpression")) {
      visitStyleProperties(child, onProperty)
    }
  }
}

function getStyleLiterals(value: PluginValue): string[] {
  const literal = getLiteralString(value)

  if (literal !== null) return [literal]

  if (!isNode(value, "ObjectExpression")) return []
  const properties = getProperty(value, "properties")

  return Array.isArray(properties)
    ? properties.flatMap((property) =>
        getStyleLiterals(getProperty(property, "value")),
      )
    : []
}

function resolveStyle(
  value: PluginValue,
  declarations: Map<ScopedVariable, Map<string, SourceNode>>,
  node: JSXOpeningElement,
  context: RuleContext,
  onStyle: (style: SourceNode) => void,
) {
  if (!isNode(value)) return

  if (value.type === "ArrayExpression") {
    const elements = getProperty(value, "elements")

    if (Array.isArray(elements)) {
      for (const element of elements)
        resolveStyle(element, declarations, node, context, onStyle)
    }
  } else if (value.type === "ConditionalExpression") {
    resolveStyle(
      getProperty(value, "consequent"),
      declarations,
      node,
      context,
      onStyle,
    )
    resolveStyle(
      getProperty(value, "alternate"),
      declarations,
      node,
      context,
      onStyle,
    )
  } else if (value.type === "LogicalExpression") {
    resolveStyle(
      getProperty(value, "right"),
      declarations,
      node,
      context,
      onStyle,
    )
  } else if (value.type === "ObjectExpression") {
    onStyle(value)
  } else if (value.type === "MemberExpression") {
    const name = getIdentifier(getProperty(value, "object"))
    const key = getPropertyName(getProperty(value, "property"))

    if (
      name !== null &&
      key !== null &&
      getProperty(value, "computed") !== true
    ) {
      const variable = getVariable(node, name, context)
      const style = variable && declarations.get(variable)?.get(key)

      if (style !== undefined) onStyle(style)
    }
  }
}

function trackStyleDeclaration(
  node: VariableDeclarator,
  bindings: ImportBindings,
  declarations: Map<ScopedVariable, Map<string, SourceNode>>,
  context: RuleContext,
) {
  const name = getIdentifier(node.id)
  const variable = name === null ? undefined : getVariable(node, name, context)

  if (
    variable === undefined ||
    !isNamedCall(
      node.init,
      bindings.stylexCreate,
      bindings.stylexNamespaces,
      "create",
    )
  )
    return
  const root = getCallArguments(node.init)[0]

  if (!isNode(root, "ObjectExpression")) return
  const styles = new Map<string, SourceNode>()
  const properties = getProperty(root, "properties")

  if (Array.isArray(properties)) {
    for (const item of properties) {
      if (!isNode(item, "Property")) continue
      const key = getPropertyName(getProperty(item, "key"))

      const style = getProperty(item, "value")

      if (key !== null && isNode(style)) styles.set(key, style)
    }
  }

  declarations.set(variable, styles)
}

function classifyMethod(
  attribute: PluginValue,
  bindings: ImportBindings,
): StylingMethod | null {
  const name = getAttributeName(attribute)

  const expression = isNode(attribute, "JSXSpreadAttribute")
    ? getProperty(attribute, "argument")
    : getAttributeExpression(attribute)

  if (name === "xstyle") return "xstyle"

  if (name === "className") return "className"

  if (name === "css") return "css"

  if (name === "style") {
    if (
      isNode(expression, "MemberExpression") &&
      getPropertyName(getProperty(expression, "property")) === "style" &&
      isStylexPropsCall(getProperty(expression, "object"), bindings)
    )
      return "stylexStyle"

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

function getStyleMethodAlternatives(options: StylingOptions) {
  return STYLE_METHODS.filter((method) => options.methods[method]).join(" or ")
}

const stylingRuleSchema = [
  {
    additionalProperties: false,
    properties: {
      componentSources: { items: { type: "string" }, type: "array" },
      methods: {
        additionalProperties: false,
        properties: Object.fromEntries(
          STYLE_METHODS.map((method) => [method, { type: "boolean" }]),
        ),
        type: "object",
      },
      styleComponents: { items: { type: "string" }, type: "array" },
    },
    type: "object",
  },
]

const policySchema = {
  additionalProperties: false,
  properties: {
    allow: { items: { type: "string" }, type: "array" },
    deny: { items: { type: "string" }, type: "array" },
    message: { type: "string" },
  },
  type: "object",
}

const nativePrimitiveRecommendations = new Map<string, string>([
  [
    "div",
    "Box (or Flex, Stack, HStack, VStack, Grid, Center, Container, AbsoluteCenter, Bleed, Float, or Wrap for its layout purpose)",
  ],
  ..."span main section article aside header footer nav address figure figcaption search hgroup ul ol li dl dt dd pre"
    .split(" ")
    .map((tag): [string, string] => [tag, `Box render={<${tag} />}`]),
  ["p", "Text"],
  ["blockquote", "Blockquote"],
  ["em", "Em"],
  ["mark", "Mark (or Highlight for matching words)"],
  ..."h1 h2 h3 h4 h5 h6"
    .split(" ")
    .map((tag): [string, string] => [tag, `Heading render={<${tag} />}`]),
])

const preferLayoutPrimitivesRule: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Prefer design-system layout and typography primitives while preserving native semantics.",
    },
    messages: {
      nativeElement:
        "Use {{replacement}} instead of <{{element}}>. Preserve native props and refs; use xstyle for visual overrides.",
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          elements: { items: { type: "string" }, type: "array" },
        },
        type: "object",
      },
    ],
  },
  create(context: RuleContext) {
    const elements = new Set(
      getStringArray(
        getProperty(context.options[0], "elements"),
        nativePrimitiveRecommendations.keys(),
      ),
    )

    return {
      JSXOpeningElement(node: JSXOpeningElement) {
        const element = getIdentifier(node.name)

        let ancestor = getProperty(node, "parent")

        while (isNode(ancestor)) {
          if (isNode(ancestor, "JSXAttribute")) {
            if (getAttributeName(ancestor) === "render") return

            break
          }

          ancestor = getProperty(ancestor, "parent")
        }

        if (element !== null && elements.has(element)) {
          context.report({
            data: {
              element,
              replacement:
                nativePrimitiveRecommendations.get(element) ??
                `Box render={<${element} />}`,
            },
            messageId: "nativeElement",
            node: node.name,
          })
        }
      },
    }
  },
}

const noRestyleRule: Rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Restrict StyleX properties passed to UI components.",
    },
    messages: {
      disallowed: "{{message}}",
    },
    schema: [
      {
        ...policySchema,
        properties: {
          ...policySchema.properties,
          componentSources: { items: { type: "string" }, type: "array" },
          styleComponents: { items: { type: "string" }, type: "array" },
          exclude: { items: { type: "string" }, type: "array" },
          contracts: {
            type: "array",
            items: {
              ...policySchema,
              properties: {
                ...policySchema.properties,
                pattern: { type: "string" },
              },
              required: ["pattern"],
            },
          },
        },
      },
    ],
  },
  create(context: RuleContext) {
    const policyOptions = getRestyleOptions(context)
    const options = getStylingOptions(context)
    const bindings = createImportBindings()
    const declarations = new Map<ScopedVariable, Map<string, SourceNode>>()
    const elements: JSXOpeningElement[] = []

    return {
      ImportDeclaration(node: ImportDeclaration) {
        trackImports(node, bindings, options)
      },
      VariableDeclarator(node: VariableDeclarator) {
        trackStyleDeclaration(node, bindings, declarations, context)
      },
      JSXOpeningElement(node: JSXOpeningElement) {
        elements.push(node)
      },
      "Program:exit"() {
        for (const node of elements) {
          const component = getComponent(
            node.name,
            node,
            bindings,
            context,
            options,
          )

          if (
            component === null ||
            policyOptions.exclude?.some((pattern) => {
              try {
                return new RegExp(pattern).test(component)
              } catch {
                return false
              }
            })
          )
            continue
          const policy = getPolicy(component, policyOptions)

          for (const attribute of node.attributes) {
            if (getAttributeName(attribute) !== "xstyle") continue
            resolveStyle(
              getAttributeExpression(attribute),
              declarations,
              node,
              context,
              (style) => {
                visitStyleProperties(style, (property, propertyNode) => {
                  if (policyAllows(property, policy)) return

                  const message = (
                    policy.message ?? defaultRestyleMessage(component, property)
                  )
                    .replaceAll("{{property}}", property)
                    .replaceAll("{{component}}", component)

                  context.report({
                    messageId: "disallowed",
                    data: { message },
                    node: propertyNode,
                  })
                })
              },
            )
          }
        }
      },
    }
  },
}

const noRawStylexColorsRule: Rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Prefer design tokens to raw colors in StyleX declarations.",
    },
    messages: {
      rawColor: "Use a design token instead of raw {{property}} color.",
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
        )
          return
        const root = getCallArguments(node.init)[0]

        if (!isNode(root, "ObjectExpression")) return
        const styles = getProperty(root, "properties")

        if (!Array.isArray(styles)) return

        for (const style of styles) {
          if (!isNode(style, "Property")) continue
          visitStyleProperties(
            getProperty(style, "value"),
            (property, propertyNode) => {
              if (
                !/^(?:color|background(?:Color)?|border.*Color|outlineColor|textDecorationColor|fill|stroke)$/.test(
                  property,
                )
              )
                return

              const values = getStyleLiterals(
                getProperty(propertyNode, "value"),
              )

              if (
                values.some((value) =>
                  /^(?:#[\da-f]{3,8}|(?:rgb|hsl|oklch|oklab|lab|lch|color)\()/i.test(
                    value,
                  ),
                )
              ) {
                context.report({
                  messageId: "rawColor",
                  data: { property },
                  node: propertyNode,
                })
              }
            },
          )
        }
      },
    }
  },
}

function containsAtom(value: PluginValue, atoms: ReadonlySet<string>): boolean {
  if (!isNode(value)) return false

  if (value.type === "Identifier") return atoms.has(getIdentifier(value) ?? "")

  if (value.type === "MemberExpression") {
    return containsAtom(getProperty(value, "object"), atoms)
  }

  if (value.type === "CallExpression") {
    return containsAtom(getProperty(value, "callee"), atoms)
  }

  if (value.type === "ArrayExpression") {
    const elements = getProperty(value, "elements")

    return (
      Array.isArray(elements) &&
      elements.some((entry) => containsAtom(entry, atoms))
    )
  }

  if (value.type === "ConditionalExpression") {
    return (
      containsAtom(getProperty(value, "consequent"), atoms) ||
      containsAtom(getProperty(value, "alternate"), atoms)
    )
  }

  if (value.type === "LogicalExpression") {
    return (
      containsAtom(getProperty(value, "left"), atoms) ||
      containsAtom(getProperty(value, "right"), atoms)
    )
  }

  return false
}

const atomsRule: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Allow, disallow, or require StyleX atoms instead of local declarations.",
    },
    messages: {
      disallowed: "StyleX atoms are disallowed here.",
      required:
        "Use @stylexjs/atoms instead of stylex.create for inline styles.",
      requiredJsx:
        "Use @stylexjs/atoms in xstyle or sx instead of local styles.",
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          mode: { enum: ["allow", "disallow", "enforce"] },
          source: { type: "string" },
        },
        type: "object",
      },
    ],
  },
  create(context: RuleContext) {
    const option = context.options[0]
    const mode = getProperty(option, "mode") ?? "allow"
    const source = getProperty(option, "source") ?? "@stylexjs/atoms"
    const bindings = createImportBindings()
    const options = getStylingOptions(context)
    const atoms = new Set<string>()

    return {
      ImportDeclaration(node: ImportDeclaration) {
        trackImports(node, bindings, options)

        if (getImportSource(node) === source) {
          for (const specifier of node.specifiers) {
            const name = getIdentifier(getProperty(specifier, "local"))

            if (name !== null) atoms.add(name)
          }

          if (mode === "disallow")
            context.report({ messageId: "disallowed", node })
        }
      },
      VariableDeclarator(node: VariableDeclarator) {
        if (
          mode === "enforce" &&
          isNamedCall(
            node.init,
            bindings.stylexCreate,
            bindings.stylexNamespaces,
            "create",
          )
        ) {
          context.report({ messageId: "required", node: node.init ?? node })
        }
      },
      JSXOpeningElement(node: JSXOpeningElement) {
        if (mode !== "enforce") return

        for (const attribute of node.attributes) {
          const name = getAttributeName(attribute)

          if (name !== "xstyle" && name !== "sx") continue
          const expression = getAttributeExpression(attribute)

          if (expression !== null && !containsAtom(expression, atoms)) {
            context.report({ messageId: "requiredJsx", node: attribute })
          }
        }
      },
    }
  },
}

const enforceStylingMethodsRule: Rule = {
  meta: {
    type: "problem",
    docs: { description: "Allow only supported component styling methods." },
    messages: {
      disallowedMethod:
        "{{method}} styling is disabled. Use {{alternatives}} instead.",
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
        if (getComponent(node.name, node, bindings, context, options) === null)
          return

        for (const attribute of node.attributes) {
          const method = classifyMethod(attribute, bindings)

          if (method === null || options.methods[method]) continue
          context.report({
            data: { alternatives: getStyleMethodAlternatives(options), method },
            messageId: "disallowedMethod",
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

        const stack: PluginValue[] = [root]

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

const noUnusedStylexStylesRule: Rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Report unused local styles declared with StyleX create.",
    },
    messages: {
      unused: 'StyleX style "{{name}}" is unused.',
    },
    schema: [],
  },
  create(context: RuleContext) {
    const bindings = createImportBindings()
    const options = getStylingOptions(context)
    const nodes: VariableDeclarator[] = []

    return {
      ImportDeclaration(node: ImportDeclaration) {
        trackImports(node, bindings, options)
      },
      VariableDeclarator(node: VariableDeclarator) {
        nodes.push(node)
      },
      "Program:exit"() {
        for (const node of nodes) {
          const callee = getProperty(node.init, "callee")

          const importName =
            getIdentifier(callee) ??
            getIdentifier(getProperty(callee, "object"))

          if (
            importName === null ||
            (getProperty(callee, "computed") === true &&
              getLiteralString(getProperty(callee, "property")) !== "create") ||
            !getVariable(node, importName, context)?.defs.some(
              (definition) => definition.type === "ImportBinding",
            )
          )
            continue

          const declarations = new Map<
            ScopedVariable,
            Map<string, SourceNode>
          >()

          trackStyleDeclaration(node, bindings, declarations, context)
          const root = getCallArguments(node.init)[0]
          const properties = getProperty(root, "properties")

          if (
            !Array.isArray(properties) ||
            properties.some(
              (property) =>
                !isNode(property, "Property") ||
                getProperty(property, "computed") === true,
            ) ||
            isNode(
              getProperty(getProperty(node, "parent"), "parent"),
              "ExportNamedDeclaration",
            )
          )
            continue

          for (const [variable, styles] of declarations) {
            const used = new Set<string>()
            let escapes = false

            for (const reference of variable.references) {
              if (!reference.isRead()) continue
              const parent = getProperty(reference.identifier, "parent")

              if (
                !isNode(parent, "MemberExpression") ||
                getProperty(parent, "object") !== reference.identifier
              ) {
                escapes = true
                break
              }

              const property = getProperty(parent, "property")

              const name =
                getProperty(parent, "computed") === true
                  ? getLiteralString(property)
                  : getIdentifier(property)

              if (name === null) {
                escapes = true
                break
              }

              used.add(name)
            }

            if (escapes) continue

            for (const property of properties) {
              const name = getPropertyName(getProperty(property, "key"))
              const key = getProperty(property, "key")

              if (
                name !== null &&
                styles.has(name) &&
                !used.has(name) &&
                isNode(key)
              ) {
                context.report({
                  data: { name },
                  messageId: "unused",
                  node: key,
                })
              }
            }
          }
        }
      },
    }
  },
}

export const recommendedRules = {
  "yopem-ui/enforce-styling-methods": "error",
  "yopem-ui/no-restyle": "error",
  "yopem-ui/prefer-layout-primitives": "error",
  "yopem-ui/static-stylex": "error",
} as const

const plugin: Plugin = {
  meta: { name: "yopem-ui" },
  configs: {
    recommended: { rules: recommendedRules },
  },
  rules: {
    atoms: atomsRule,
    "no-raw-stylex-colors": noRawStylexColorsRule,
    "no-unused-stylex-styles": noUnusedStylexStylesRule,
    "no-restyle": noRestyleRule,
    "prefer-layout-primitives": preferLayoutPrimitivesRule,
    "enforce-styling-methods": enforceStylingMethodsRule,
    "static-stylex": staticStylexRule,
  },
}

export default plugin
