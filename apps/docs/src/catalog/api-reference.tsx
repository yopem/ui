import type { ApiPart, ApiProp } from "@registry/docs"

import { ScrollArea } from "@registry/components/ui/scroll-area"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Box } from "@/components/ui/box"
import { Heading } from "@/components/ui/heading"
import { Link } from "@/components/ui/link"
import { Paragraph } from "@/components/ui/paragraph"

import { CopyableCode } from "./code-block"
const styles = stylex.create({
  scrollArea: {
    marginBlock: "1rem",
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-lg"],
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
    paddingBlock: "0.75rem",
    paddingInline: "0.75rem",
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    backgroundColor: tokens["--muted"],
    color: tokens["--foreground"],
    fontWeight: 600,
  },
  th2: {
    textAlign: "start",
    verticalAlign: "top",
    paddingBlock: "0.75rem",
    paddingInline: "0.75rem",
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    backgroundColor: tokens["--muted"],
    color: tokens["--foreground"],
    fontWeight: 600,
  },
  th3: {
    textAlign: "start",
    verticalAlign: "top",
    paddingBlock: "0.75rem",
    paddingInline: "0.75rem",
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    backgroundColor: tokens["--muted"],
    color: tokens["--foreground"],
    fontWeight: 600,
  },
  th4: {
    textAlign: "start",
    verticalAlign: "top",
    paddingBlock: "0.75rem",
    paddingInline: "0.75rem",
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    backgroundColor: tokens["--muted"],
    color: tokens["--foreground"],
    fontWeight: 600,
  },
  th5: {
    textAlign: "start",
    verticalAlign: "top",
    paddingBlock: "0.75rem",
    paddingInline: "0.75rem",
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    backgroundColor: tokens["--muted"],
    color: tokens["--foreground"],
    fontWeight: 600,
  },
  td: {
    textAlign: "start",
    verticalAlign: "top",
    paddingBlock: "0.75rem",
    paddingInline: "0.75rem",
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    minInlineSize: "7rem",
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
  },
  code: {
    fontFamily: tokens["--font-mono"],
    overflowWrap: "anywhere",
    fontSize: "0.8125rem",
  },
  td2: {
    textAlign: "start",
    verticalAlign: "top",
    paddingBlock: "0.75rem",
    paddingInline: "0.75rem",
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    minInlineSize: "7rem",
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
  },
  details: { marginBlock: "1rem", minInlineSize: "calc(var(--spacing) * 0)" },
  summary: {
    cursor: "pointer",
    overflowWrap: "anywhere",
    paddingBlock: "0.375rem",
    fontWeight: 500,
    outlineColor: {
      ":is(:focus-visible, [data-focus-visible])": tokens["--ring"],
    },
    outlineStyle: { ":is(:focus-visible, [data-focus-visible])": "solid" },
    outlineWidth: { ":is(:focus-visible, [data-focus-visible])": 2 },
    outlineOffset: { ":is(:focus-visible, [data-focus-visible])": -2 },
  },
  code2: {
    fontFamily: tokens["--font-mono"],
    overflowWrap: "anywhere",
    fontSize: "0.8125rem",
  },
  pre: {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    maxInlineSize: "36rem",
    marginBlock: "0.75rem",
    paddingBlock: "0.75rem",
    paddingInline: "0.75rem",
    backgroundColor: tokens["--code"],
    color: tokens["--code-foreground"],
    borderRadius: tokens["--radius-sm"],
  },
  code3: {
    fontFamily: tokens["--font-mono"],
    overflowWrap: "anywhere",
    fontSize: "0.8125rem",
  },
  code4: {
    fontFamily: tokens["--font-mono"],
    overflowWrap: "anywhere",
    fontSize: "0.8125rem",
  },
  td3: {
    textAlign: "start",
    verticalAlign: "top",
    paddingBlock: "0.75rem",
    paddingInline: "0.75rem",
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    minInlineSize: "7rem",
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
  },
  code5: {
    fontFamily: tokens["--font-mono"],
    overflowWrap: "anywhere",
    fontSize: "0.8125rem",
  },
  td4: {
    textAlign: "start",
    verticalAlign: "top",
    paddingBlock: "0.75rem",
    paddingInline: "0.75rem",
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    minInlineSize: "7rem",
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
  },
  td5: {
    textAlign: "start",
    verticalAlign: "top",
    paddingBlock: "0.75rem",
    paddingInline: "0.75rem",
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    minInlineSize: "7rem",
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
  },
  section: {
    marginBlock: "2rem",
    minInlineSize: "calc(var(--spacing) * 0)",
    color: tokens["--foreground"],
  },
  h3: {
    fontFamily: tokens["--font-heading"],
    fontSize: "1.25rem",
    fontWeight: 650,
    marginBlock: "1.5rem 0.75rem",
    scrollMarginBlockStart: "6rem",
  },
  paragraph: {
    marginBlock: "0.75rem",
    lineHeight: 1.7,
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
  },
  link: {
    color: tokens["--primary"],
    textDecorationLine: "underline",
    textUnderlineOffset: "0.2em",
    outlineColor: {
      ":is(:focus-visible, [data-focus-visible])": tokens["--ring"],
    },
    outlineStyle: { ":is(:focus-visible, [data-focus-visible])": "solid" },
    outlineWidth: { ":is(:focus-visible, [data-focus-visible])": 2 },
    outlineOffset: { ":is(:focus-visible, [data-focus-visible])": -2 },
  },
  section2: {
    marginBlock: "2rem",
    minInlineSize: "calc(var(--spacing) * 0)",
    color: tokens["--foreground"],
  },
  h32: {
    fontFamily: tokens["--font-heading"],
    fontSize: "1.25rem",
    fontWeight: 650,
    marginBlock: "1.5rem 0.75rem",
    scrollMarginBlockStart: "6rem",
  },
  paragraph2: {
    marginBlock: "0.75rem",
    lineHeight: 1.7,
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
  },
  h4: { fontSize: "1rem", fontWeight: 650, marginBlock: "1.25rem 0.5rem" },
  h42: { fontSize: "1rem", fontWeight: 650, marginBlock: "1.25rem 0.5rem" },
  h43: { fontSize: "1rem", fontWeight: 650, marginBlock: "1.25rem 0.5rem" },
  details2: { marginBlock: "1rem", minInlineSize: "calc(var(--spacing) * 0)" },
  summary2: {
    cursor: "pointer",
    overflowWrap: "anywhere",
    paddingBlock: "0.375rem",
    fontWeight: 500,
    outlineColor: {
      ":is(:focus-visible, [data-focus-visible])": tokens["--ring"],
    },
    outlineStyle: { ":is(:focus-visible, [data-focus-visible])": "solid" },
    outlineWidth: { ":is(:focus-visible, [data-focus-visible])": 2 },
    outlineOffset: { ":is(:focus-visible, [data-focus-visible])": -2 },
  },
  h44: { fontSize: "1rem", fontWeight: 650, marginBlock: "1.25rem 0.5rem" },
  paragraph3: {
    marginBlock: "0.75rem",
    lineHeight: 1.7,
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
  },
  details3: { marginBlock: "1rem", minInlineSize: "calc(var(--spacing) * 0)" },
  summary3: {
    cursor: "pointer",
    overflowWrap: "anywhere",
    paddingBlock: "0.375rem",
    fontWeight: 500,
    outlineColor: {
      ":is(:focus-visible, [data-focus-visible])": tokens["--ring"],
    },
    outlineStyle: { ":is(:focus-visible, [data-focus-visible])": "solid" },
    outlineWidth: { ":is(:focus-visible, [data-focus-visible])": 2 },
    outlineOffset: { ":is(:focus-visible, [data-focus-visible])": -2 },
  },
})
function PropertiesTable({
  properties,
  label = "Prop",
}: {
  properties: ApiProp[]
  label?: string
}) {
  return (
    <ScrollArea
      xstyle={styles.scrollArea}
      aria-label={`${label} reference`}
      clampContentMinWidth={false}
      overscrollContain
    >
      <Box as="table" xstyle={styles.table}>
        <Box as="thead">
          <Box as="tr">
            <Box as="th" xstyle={styles.th} scope="col">
              {label}
            </Box>
            <Box as="th" xstyle={styles.th2} scope="col">
              Type
            </Box>
            <Box as="th" xstyle={styles.th3} scope="col">
              Default
            </Box>
            <Box as="th" xstyle={styles.th4} scope="col">
              Required
            </Box>
            <Box as="th" xstyle={styles.th5} scope="col">
              Description
            </Box>
          </Box>
        </Box>
        <Box as="tbody">
          {properties.map((prop) => (
            <Box as="tr" key={prop.name}>
              <Box as="td" xstyle={styles.td}>
                <Box as="code" xstyle={styles.code}>
                  {prop.name}
                </Box>
              </Box>
              <Box as="td" xstyle={styles.td2} aria-label={`${prop.name} type`}>
                {prop.type.length > 140 ? (
                  <Box as="details" xstyle={styles.details}>
                    <Box as="summary" xstyle={styles.summary}>
                      <Box as="code" xstyle={styles.code2}>
                        {prop.type.slice(0, 100)}…
                      </Box>
                    </Box>
                    <Box as="pre" xstyle={styles.pre}>
                      <Box as="code" xstyle={styles.code3}>
                        {prop.type}
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box as="code" xstyle={styles.code4}>
                    {prop.type}
                  </Box>
                )}
              </Box>
              <Box as="td" xstyle={styles.td3}>
                <Box as="code" xstyle={styles.code5}>
                  {prop.default ?? "Not specified"}
                </Box>
              </Box>
              <Box as="td" xstyle={styles.td4}>
                {prop.required ? "Yes" : "No"}
              </Box>
              <Box as="td" xstyle={styles.td5}>
                {prop.description}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </ScrollArea>
  )
}

function PartReference({
  part,
  alias,
}: {
  part: ApiPart & { id: string }
  alias: string | null
}) {
  const [showVariants, setShowVariants] = useState(false)
  const [showSignatures, setShowSignatures] = useState(false)
  if (alias)
    return (
      <Box
        as="section"
        xstyle={styles.section}
        aria-labelledby={`api-${part.name}`}
      >
        <Heading as="h3" xstyle={styles.h3} id={`api-${part.name}`}>
          {part.name}
        </Heading>
        <Paragraph xstyle={styles.paragraph}>
          Alias for{" "}
          <Link xstyle={styles.link} href={`#api-${alias}`}>
            {alias}
          </Link>
          . Uses the same props and defaults.
        </Paragraph>
      </Box>
    )
  const specific = part.props
  return (
    <Box
      as="section"
      xstyle={styles.section2}
      aria-labelledby={`api-${part.name}`}
    >
      <Heading as="h3" xstyle={styles.h32} id={`api-${part.name}`}>
        {part.name}
      </Heading>
      <Paragraph xstyle={styles.paragraph2}>{part.description}</Paragraph>
      {part.parameters.length ? (
        <>
          <Heading as="h4" xstyle={styles.h4}>
            Arguments
          </Heading>
          <PropertiesTable
            label="Argument"
            properties={part.parameters.map((parameter) => ({
              ...parameter,
              default: parameter.default ?? undefined,
            }))}
          />
          {part.parameters.map((parameter) =>
            parameter.properties.length ? (
              <Box key={parameter.name}>
                <Heading as="h4" xstyle={styles.h42}>
                  {parameter.name} properties
                </Heading>
                <PropertiesTable properties={parameter.properties} />
              </Box>
            ) : null,
          )}
        </>
      ) : null}
      {specific.length && part.kind !== "function" ? (
        <PropertiesTable properties={specific} />
      ) : null}
      {part.returns ? (
        <>
          <Heading as="h4" xstyle={styles.h43}>
            Returns
          </Heading>
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
      {part.propVariants.length ? (
        <Box
          as="details"
          xstyle={styles.details2}
          onToggle={(event) => setShowVariants(event.currentTarget.open)}
        >
          <Box as="summary" xstyle={styles.summary2}>
            Accepted prop combinations
          </Box>
          {showVariants
            ? part.propVariants.map((variant, index) => (
                <Box key={variant.type + index}>
                  <Heading as="h4" xstyle={styles.h44}>
                    Combination {index + 1}
                  </Heading>
                  <Paragraph xstyle={styles.paragraph3}>
                    Required: {variant.required.join(", ") || "None"}.
                  </Paragraph>
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
                </Box>
              ))
            : null}
        </Box>
      ) : null}
      <Box
        as="details"
        xstyle={styles.details3}
        onToggle={(event) => setShowSignatures(event.currentTarget.open)}
      >
        <Box as="summary" xstyle={styles.summary3}>
          Type signature
        </Box>
        {showSignatures
          ? part.signatures.map((signature) => (
              <CopyableCode
                key={signature}
                title={`${part.name} signature`}
                code={signature}
              />
            ))
          : null}
      </Box>
    </Box>
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
