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
  rules: Record<string, Rule>
}

type Namespace = "svg" | "math" | null

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

const plugin: Plugin = {
  meta: {
    name: "yopem-ui",
  },
  rules: {
    "prefer-ui-primitives": preferUiPrimitivesRule,
  },
}

export default plugin
