interface DocumentedPart {
  name: string
  props: {
    default?: string
    name: string
    source: string
    type: string
  }[]
}

export interface ExampleSource {
  name: string
  source: string
}

interface SelectedExample extends ExampleSource {
  label: string
}

export interface SelectedExampleGroup {
  examples: SelectedExample[]
  label: string
}

export function selectExamples(
  parts: DocumentedPart[],
  examples: ExampleSource[],
): SelectedExampleGroup[] {
  const first = examples[0]
  if (!first) return []

  const groups: SelectedExampleGroup[] = [
    { examples: [{ ...first, label: "Default" }], label: "Default" },
  ]

  for (const part of parts) {
    const partName = part.name.split(".").at(-1) ?? part.name
    const partExamples = examples.filter((example) =>
      new RegExp(`<${escapeRegex(partName)}(?:\\s|>)`).test(example.source),
    )

    for (const prop of part.props) {
      if (prop.source.startsWith("@types/react")) continue

      const values = [...prop.type.matchAll(/"([^"]+)"/g)].map(
        (match) => match[1] ?? "",
      )
      const candidates = values.length ? values : [null]
      const selected = new Map<string, SelectedExample>()

      for (const value of candidates) {
        const matching = partExamples
          .filter((example) => hasProp(example.source, prop.name, value))
          .toSorted((left, right) => left.source.length - right.source.length)
        const fallback =
          value !== null && isDefaultValue(value, prop.default)
            ? partExamples
                .filter((example) => !hasProp(example.source, prop.name, null))
                .toSorted(
                  (left, right) => left.source.length - right.source.length,
                )[0]
            : undefined
        const example = matching[0] ?? fallback
        if (example)
          selected.set(example.name, {
            ...example,
            label: value ?? humanize(prop.name),
          })
      }

      if (selected.size)
        groups.push({
          examples: [...selected.values()],
          label: `${humanize(partName)} ${humanize(prop.name)}`,
        })
    }
  }

  return groups
}

function hasProp(source: string, name: string, value: string | null) {
  const prop = escapeRegex(name)
  if (value === null)
    return new RegExp(`\\b${prop}(?:\\s*=|(?=\\s|/?>))`).test(source)

  const literal = escapeRegex(value)
  return new RegExp(
    `\\b${prop}\\s*=\\s*(?:["']${literal}["']|\\{["']${literal}["']\\})`,
  ).test(source)
}

function isDefaultValue(value: string, defaultValue?: string) {
  return defaultValue?.replaceAll(/["']/g, "") === value
}

function humanize(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2")
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
