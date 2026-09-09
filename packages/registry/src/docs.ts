import type { compactDocs } from "./docs-extract"

import { delegatedDefaults, ownPropNotes, usageNotes } from "./docs-notes"
import generated from "./docs.generated.json"
import { sourceItems } from "./items/index"
export { sourceImportReplacements } from "./source-files"

export const apiNotes = [
  "Props are extracted from canonical source and the installed dependency declarations. Inherited HTML and React props are included; source identifies where each property is declared.",
  "An omitted default means no default was found in the declaration or wrapper, not that the value is false. Defaults from parameter initializers and upstream JSDoc are supplemented by reviewed wrapper defaults.",
  "required means required in every props branch. propVariants lists branch-specific requirements for union APIs such as Calendar. Named dependency types in signatures retain their TypeScript names.",
  "Copy every file listed on the component page, including shared source dependencies, into src/yopem. Install the listed npm dependencies and configure the @registry/* alias as shown in the installation guide.",
]

export interface ApiProp {
  name: string
  type: string
  required: boolean
  description: string
  default?: string
  source: string
}

const partPurposes: Record<string, string> = {
  Trigger: "Control that opens or toggles the associated content.",
  Popup:
    "Visible popup content with Yopem styling and the wrapper's positioning or modal composition.",
  Portal:
    "Renders content into a portal container outside the normal DOM parent.",
  Backdrop: "Layer behind the popup that separates it from the page.",
  Overlay: "Alias for the backdrop part.",
  Viewport: "Layout container for the popup within the viewport.",
  Close: "Control that closes the associated popup.",
  Title: "Title for this section or overlay.",
  Description: "Supporting description for this section or control.",
  Header: "Layout for the heading and supporting content.",
  Footer: "Layout for trailing actions or supporting content.",
  Panel: "Content region belonging to this component.",
  List: "Container for the component's items.",
  Item: "One item in the component's collection.",
  Group: "Groups related items or controls.",
  GroupLabel: "Labels a group of related items.",
  Separator: "Divides adjacent items or sections.",
  Input: "Editable control connected to the parent component.",
  Value:
    "Displays the current value, with render support where the type allows it.",
  Label: "Label associated with the component.",
  Provider: "Provides shared state or configuration to descendants.",
  Content:
    "Content part. See the component notes for aliases and composition requirements.",
  CreateHandle:
    "Creates a handle for connecting detached triggers and a component root.",
}

function describePart(name: string, kind: string, description: string) {
  if (description) return description
  if (kind === "namespace")
    return "Unstyled Base UI exports for custom composition. Dotted API entries below document its exported parts."
  if (kind === "type")
    return "Exported TypeScript type. Its signature and property table describe the accepted values."
  if (name.endsWith("Context"))
    return "Shared React context used by this component's parts. Prefer the public provider and hook for normal composition."
  if (name.endsWith("Variants"))
    return "Returns the class name for the requested visual variants."
  const leaf = name.split(".").at(-1)!
  if (leaf.startsWith("use"))
    return "Hook for accessing this component's state or filtering helpers. Call it at the top level of a React component."
  if (kind === "function" && name.includes(".")) {
    const owner = name.slice(0, name.lastIndexOf("."))
    return /^(use|create)|CreateHandle$/.test(owner.split(".").at(-1)!)
      ? `Method on the value returned by ${owner}(). Call it with the arguments below.`
      : `Method on ${owner}. Call it with the arguments below.`
  }
  if (kind === "value")
    return "Exported value. The signature and members below describe its shape."
  const suffix = Object.keys(partPurposes)
    .sort((a, b) => b.length - a.length)
    .find((key) => name.endsWith(key))
  return suffix
    ? partPurposes[suffix]!
    : "Component part. Compose it as described in the usage notes; its accepted props are listed below."
}

function describeProperty(prop: ApiProp) {
  return {
    ...prop,
    description:
      prop.description ||
      (/^(components|theme|styles|lib)\//.test(prop.source)
        ? ownPropNotes[prop.name]
        : undefined) ||
      (prop.source.startsWith("@types/react")
        ? `React/HTML ${prop.name} attribute or event handler.`
        : `${prop.name} member. See its type for accepted values.`),
  }
}

/** Browser-safe documentation. Generation never runs when this module is imported. */
export function createComponentDocs(
  data: ReturnType<typeof compactDocs> = generated,
) {
  const properties = data.properties.map(describeProperty)
  return sourceItems.map((item) => {
    const extracted = data.items.find((entry) => entry.name === item.name)
    const notes = usageNotes[item.name]
    if (!extracted || !notes)
      throw new Error(`Missing documentation for ${item.name}`)
    return {
      name: item.name,
      title: item.title,
      description: item.description,
      usage: notes[0],
      notes: notes.slice(1),
      parts: extracted.parts.map((part) => ({
        ...part,
        parameters: part.parameters.map((parameter) => ({
          ...parameter,
          properties: parameter.properties.map(describeProperty),
        })),
        returns: part.returns
          ? {
              ...part.returns,
              properties: part.returns.properties.map(describeProperty),
            }
          : null,
        description: part.aliasOf
          ? `Alias for ${part.aliasOf}. Accepts the same props.`
          : describePart(
              part.name,
              part.kind,
              part.description ||
                (part.name.toLowerCase() === item.name.replaceAll("-", "")
                  ? item.description
                  : ""),
            ),
        importPath:
          item.files
            .find(
              (file) =>
                file.path === part.source ||
                file.path.endsWith(`${item.name}.tsx`),
            )
            ?.target.replace(/\.tsx?$/, "") ?? null,
        props: part.props.map((index) => {
          const prop = properties[index]!
          const defaultValue =
            delegatedDefaults[part.aliasOf ?? part.name]?.[prop.name]
          return defaultValue === undefined || defaultValue === prop.default
            ? prop
            : { ...prop, default: defaultValue }
        }),
      })),
      installation: {
        dependencies: item.dependencies,
        devDependencies: item.devDependencies,
        peerDependencies: item.peerDependencies,
        registryDependencies: item.registryDependencies,
        files: item.files.map(({ path, target }) => ({ path, target })),
      },
    }
  })
}

export const componentDocs = createComponentDocs()

export type ComponentDoc = (typeof componentDocs)[number]
export type ApiPart = ComponentDoc["parts"][number]
