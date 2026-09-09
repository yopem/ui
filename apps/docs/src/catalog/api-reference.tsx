import type { ApiPart, ApiProp } from "@registry/docs"

import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { CopyableCode, KeyboardScrollArea } from "./code-block"

function PropertiesTable({
  properties,
  label = "Prop",
}: {
  properties: ApiProp[]
  label?: string
}) {
  return (
    <KeyboardScrollArea
      {...stylex.props(styles.tableWrapper, styles.focus)}
      aria-label={`${label} reference`}
    >
      <table {...stylex.props(styles.table)}>
        <thead>
          <tr>
            <th {...stylex.props(styles.th)} scope="col">
              {label}
            </th>
            <th {...stylex.props(styles.th)} scope="col">
              Type
            </th>
            <th {...stylex.props(styles.th)} scope="col">
              Default
            </th>
            <th {...stylex.props(styles.th)} scope="col">
              Required
            </th>
            <th {...stylex.props(styles.th)} scope="col">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {properties.map((prop) => (
            <tr key={prop.name}>
              <td {...stylex.props(styles.td)}>
                <code {...stylex.props(styles.code)}>{prop.name}</code>
              </td>
              <td {...stylex.props(styles.td)} aria-label={`${prop.name} type`}>
                {prop.type.length > 140 ? (
                  <details {...stylex.props(styles.details)}>
                    <summary {...stylex.props(styles.summary, styles.focus)}>
                      <code {...stylex.props(styles.code)}>
                        {prop.type.slice(0, 100)}…
                      </code>
                    </summary>
                    <pre {...stylex.props(styles.pre)}>
                      <code {...stylex.props(styles.code)}>{prop.type}</code>
                    </pre>
                  </details>
                ) : (
                  <code {...stylex.props(styles.code)}>{prop.type}</code>
                )}
              </td>
              <td {...stylex.props(styles.td)}>
                <code {...stylex.props(styles.code)}>
                  {prop.default ?? "Not specified"}
                </code>
              </td>
              <td {...stylex.props(styles.td)}>
                {prop.required ? "Yes" : "No"}
              </td>
              <td {...stylex.props(styles.td)}>{prop.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </KeyboardScrollArea>
  )
}

function PartReference({
  part,
  alias,
}: {
  part: ApiPart & { id: string }
  alias: string | null
}) {
  const [showInherited, setShowInherited] = useState(false)
  const [showVariants, setShowVariants] = useState(false)
  if (alias)
    return (
      <section
        {...stylex.props(styles.section)}
        aria-labelledby={`api-${part.name}`}
      >
        <h3 {...stylex.props(styles.h3)} id={`api-${part.name}`}>
          {part.name}
        </h3>
        <p {...stylex.props(styles.p)}>
          Alias for{" "}
          <a
            {...stylex.props(styles.link, styles.focus)}
            href={`#api-${alias}`}
          >
            {alias}
          </a>
          . Uses the same props and defaults.
        </p>
      </section>
    )
  const inherited = part.props.filter((prop) =>
    prop.source.startsWith("@types/react"),
  )
  const specific = part.props.filter(
    (prop) => !prop.source.startsWith("@types/react"),
  )
  return (
    <section
      {...stylex.props(styles.section)}
      aria-labelledby={`api-${part.name}`}
    >
      <h3 {...stylex.props(styles.h3)} id={`api-${part.name}`}>
        {part.name}
      </h3>
      <p {...stylex.props(styles.p)}>{part.description}</p>
      {part.parameters.length ? (
        <>
          <h4 {...stylex.props(styles.h4)}>Arguments</h4>
          <PropertiesTable
            label="Argument"
            properties={part.parameters.map((parameter) => ({
              ...parameter,
              default: parameter.default ?? undefined,
            }))}
          />
          {part.parameters.map((parameter) =>
            parameter.properties.length ? (
              <div key={parameter.name}>
                <h4 {...stylex.props(styles.h4)}>
                  {parameter.name} properties
                </h4>
                <PropertiesTable properties={parameter.properties} />
              </div>
            ) : null,
          )}
        </>
      ) : null}
      {specific.length && part.kind !== "function" ? (
        <PropertiesTable properties={specific} />
      ) : null}
      {part.returns ? (
        <>
          <h4 {...stylex.props(styles.h4)}>Returns</h4>
          <CopyableCode
            title={`${part.name} return type`}
            code={part.returns.type}
          />
          {part.returns.properties.length ? (
            <PropertiesTable
              label="Member"
              properties={part.returns.properties}
            />
          ) : null}
        </>
      ) : null}
      {inherited.length ? (
        <details
          {...stylex.props(styles.details)}
          onToggle={(event) => setShowInherited(event.currentTarget.open)}
        >
          <summary {...stylex.props(styles.summary, styles.focus)}>
            {inherited.length} inherited React and HTML properties
          </summary>
          {showInherited ? <PropertiesTable properties={inherited} /> : null}
        </details>
      ) : null}
      {part.propVariants.length ? (
        <details
          {...stylex.props(styles.details)}
          onToggle={(event) => setShowVariants(event.currentTarget.open)}
        >
          <summary {...stylex.props(styles.summary, styles.focus)}>
            Accepted prop combinations
          </summary>
          {showVariants
            ? part.propVariants.map((variant, index) => (
                <div key={variant.type + index}>
                  <h4 {...stylex.props(styles.h4)}>Combination {index + 1}</h4>
                  <p {...stylex.props(styles.p)}>
                    Required: {variant.required.join(", ") || "None"}.
                  </p>
                  <PropertiesTable
                    properties={variant.props.map((prop) => ({
                      ...part.props.find((entry) => entry.name === prop.name),
                      ...prop,
                      description:
                        part.props.find((entry) => entry.name === prop.name)
                          ?.description ?? "",
                      source: part.source,
                    }))}
                  />
                </div>
              ))
            : null}
        </details>
      ) : null}
      <details {...stylex.props(styles.details)}>
        <summary {...stylex.props(styles.summary, styles.focus)}>
          Type signature
        </summary>
        {part.signatures.map((signature) => (
          <CopyableCode
            key={signature}
            title={`${part.name} signature`}
            code={signature}
          />
        ))}
      </details>
    </section>
  )
}

export function ApiReference({
  parts,
}: {
  parts: (ApiPart & { id: string })[]
}) {
  const names = new Set(parts.map((part) => part.name))
  return parts.map((part) => (
    <PartReference
      key={part.id}
      part={part}
      alias={part.aliasOf && names.has(part.aliasOf) ? part.aliasOf : null}
    />
  ))
}

const styles = stylex.create({
  section: { marginBlock: "2rem", minInlineSize: 0, color: tokens.foreground },
  h3: {
    fontFamily: tokens.fontHeading,
    fontSize: "1.25rem",
    fontWeight: 650,
    marginBlock: "1.5rem 0.75rem",
    scrollMarginBlockStart: "6rem",
  },
  h4: { fontSize: "1rem", fontWeight: 650, marginBlock: "1.25rem 0.5rem" },
  p: {
    marginBlock: "0.75rem",
    lineHeight: 1.7,
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
  },
  link: {
    color: tokens.primary,
    textDecorationLine: "underline",
    textUnderlineOffset: "0.2em",
  },
  details: { marginBlock: "1rem", minInlineSize: 0 },
  summary: {
    cursor: "pointer",
    overflowWrap: "anywhere",
    paddingBlock: "0.375rem",
    fontWeight: 500,
  },
  focus: {
    ":focus-visible": {
      outlineColor: tokens.ring,
      outlineStyle: "solid",
      outlineWidth: 2,
      outlineOffset: -2,
    },
  },
  tableWrapper: {
    overflowX: "auto",
    marginBlock: "1rem",
    borderColor: tokens.border,
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens.radiusLarge,
  },
  table: {
    inlineSize: "100%",
    borderCollapse: "collapse",
    fontSize: "0.8125rem",
    lineHeight: 1.6,
  },
  th: {
    textAlign: "start",
    verticalAlign: "top",
    padding: "0.75rem",
    borderBlockEndColor: tokens.border,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    backgroundColor: tokens.muted,
    color: tokens.foreground,
    fontWeight: 600,
  },
  td: {
    textAlign: "start",
    verticalAlign: "top",
    padding: "0.75rem",
    borderBlockEndColor: tokens.border,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    minInlineSize: "7rem",
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
  },
  code: {
    fontFamily: tokens.fontMono,
    overflowWrap: "anywhere",
    fontSize: "0.8125rem",
  },
  pre: {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    maxInlineSize: "36rem",
    marginBlock: "0.75rem",
    padding: "0.75rem",
    backgroundColor: tokens.code,
    color: tokens.codeForeground,
    borderRadius: tokens.radiusSmall,
  },
})
