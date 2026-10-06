import type { compactDocs } from "./docs-extract"

import { delegatedDefaults, ownPropNotes, usageNotes } from "./docs-notes"
import generated from "./docs.generated.json"
import { sourceItems } from "./items/index"

export { sourceImportReplacements } from "./source-files"

export const apiNotes = [
  "The generator extracts props from canonical source and installed dependency declarations. It includes inherited HTML and React props. source identifies each property's declaration.",
  "An omitted default means the declaration or wrapper has no identified default. It does not mean the value is false. Reviewed wrapper defaults supplement defaults from parameter initializers and upstream JSDoc.",
  "required means required in every props branch. propVariants lists requirements for each branch of union APIs, such as Calendar. Named dependency types in signatures keep their TypeScript names.",
  "Copy every file listed on the component page into src. Include shared source dependencies. Run the listed npm install command. Configure the standard @/* alias as shown in the installation guide.",
]

export interface ApiProp {
  name: string
  type: string
  required: boolean
  description: string
  default?: string
  source: string
}

const partPurposes = {
  Trigger: "Control that opens or toggles the associated content.",
  Popup:
    "Shows popup content with Yopem styles. The wrapper provides positioning or modal composition.",
  Portal:
    "Renders content in a portal container outside the normal DOM parent.",
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
    "Contains component content. See the component notes for aliases and composition requirements.",
  CreateHandle:
    "Creates a handle for connecting detached triggers and a component root.",
}

function describePart(name: string, kind: string, description: string) {
  if (description) return description

  if (kind === "namespace")
    return "Provides unstyled Base UI exports for custom composition. API entries with dotted names below describe the exported parts."

  if (kind === "type")
    return "Exported TypeScript type. Its signature and property table describe the accepted values."

  if (name.endsWith("Context"))
    return "Provides shared React context for this component's parts. Use the public provider and hook for normal composition."

  if (name.endsWith("Variants"))
    return "Returns the class name for the requested visual variants."
  const leaf = name.split(".").at(-1)!

  if (leaf.startsWith("use"))
    return "Provides access to component state or filtering helpers. Call this hook at the top level of a React component."

  if (kind === "function" && name.includes(".")) {
    const owner = name.slice(0, name.lastIndexOf("."))

    return /^(use|create)|CreateHandle$/.test(owner.split(".").at(-1)!)
      ? `Method on the value returned by ${owner}(). Call it with the arguments below.`
      : `Method on ${owner}. Call it with the arguments below.`
  }

  if (kind === "value")
    return "Exports a value. The signature and members below describe its structure."

  const purpose = Object.entries(partPurposes)
    .sort(([a], [b]) => b.length - a.length)
    .find(([suffix]) => name.endsWith(suffix))?.[1]

  return (
    purpose ??
    "Provides a component part. Combine it with other parts as described in the usage notes. See accepted props below."
  )
}

function describeProperty(prop: ApiProp) {
  return {
    ...prop,
    description:
      prop.description ||
      (/^(components|theme|styles|lib)\//.test(prop.source)
        ? ownPropNotes.get(prop.name)
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
    const notes = usageNotes.get(item.name)

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
          ? `Alias for ${part.aliasOf}. It accepts the same props.`
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

          const defaultValue = delegatedDefaults
            .get(part.aliasOf ?? part.name)
            ?.get(prop.name)

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
