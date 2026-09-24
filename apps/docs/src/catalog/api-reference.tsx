import type { ApiPart, ApiProp } from "@registry/docs"

import { ScrollArea } from "@registry/components/ui/scroll-area"
import { tokens } from "@registry/styles/tokens.stylex"
import { useState } from "react"

import { Box } from "@/components/ui/box"
import { Heading } from "@/components/ui/heading"
import { Link } from "@/components/ui/link"
import { Paragraph } from "@/components/ui/paragraph"

import { CopyableCode } from "./code-block"
function PropertiesTable({
  properties,
  label = "Prop",
}: {
  properties: ApiProp[]
  label?: string
}) {
  return (
    <ScrollArea
      marginBlock={"1rem"}
      borderColor={tokens["--border"]}
      borderStyle={"solid"}
      borderWidth={1}
      borderRadius={tokens["--radius-lg"]}
      aria-label={`${label} reference`}
      clampContentMinWidth={false}
      overscrollContain
    >
      <Box
        as="table"
        inlineSize={"100%"}
        borderCollapse={"collapse"}
        fontSize={"0.8125rem"}
        lineHeight={1.6}
      >
        <Box as="thead">
          <Box as="tr">
            <Box
              as="th"
              textAlign={"start"}
              verticalAlign={"top"}
              padding={"0.75rem"}
              borderBlockEndColor={tokens["--border"]}
              borderBlockEndStyle={"solid"}
              borderBlockEndWidth={1}
              backgroundColor={tokens["--muted"]}
              color={tokens["--foreground"]}
              fontWeight={600}
              scope="col"
            >
              {label}
            </Box>
            <Box
              as="th"
              textAlign={"start"}
              verticalAlign={"top"}
              padding={"0.75rem"}
              borderBlockEndColor={tokens["--border"]}
              borderBlockEndStyle={"solid"}
              borderBlockEndWidth={1}
              backgroundColor={tokens["--muted"]}
              color={tokens["--foreground"]}
              fontWeight={600}
              scope="col"
            >
              Type
            </Box>
            <Box
              as="th"
              textAlign={"start"}
              verticalAlign={"top"}
              padding={"0.75rem"}
              borderBlockEndColor={tokens["--border"]}
              borderBlockEndStyle={"solid"}
              borderBlockEndWidth={1}
              backgroundColor={tokens["--muted"]}
              color={tokens["--foreground"]}
              fontWeight={600}
              scope="col"
            >
              Default
            </Box>
            <Box
              as="th"
              textAlign={"start"}
              verticalAlign={"top"}
              padding={"0.75rem"}
              borderBlockEndColor={tokens["--border"]}
              borderBlockEndStyle={"solid"}
              borderBlockEndWidth={1}
              backgroundColor={tokens["--muted"]}
              color={tokens["--foreground"]}
              fontWeight={600}
              scope="col"
            >
              Required
            </Box>
            <Box
              as="th"
              textAlign={"start"}
              verticalAlign={"top"}
              padding={"0.75rem"}
              borderBlockEndColor={tokens["--border"]}
              borderBlockEndStyle={"solid"}
              borderBlockEndWidth={1}
              backgroundColor={tokens["--muted"]}
              color={tokens["--foreground"]}
              fontWeight={600}
              scope="col"
            >
              Description
            </Box>
          </Box>
        </Box>
        <Box as="tbody">
          {properties.map((prop) => (
            <Box as="tr" key={prop.name}>
              <Box
                as="td"
                textAlign={"start"}
                verticalAlign={"top"}
                padding={"0.75rem"}
                borderBlockEndColor={tokens["--border"]}
                borderBlockEndStyle={"solid"}
                borderBlockEndWidth={1}
                minInlineSize={"7rem"}
                overflowWrap={"anywhere"}
                whiteSpace={"pre-wrap"}
              >
                <Box
                  as="code"
                  fontFamily={tokens["--font-mono"]}
                  overflowWrap={"anywhere"}
                  fontSize={"0.8125rem"}
                >
                  {prop.name}
                </Box>
              </Box>
              <Box
                as="td"
                textAlign={"start"}
                verticalAlign={"top"}
                padding={"0.75rem"}
                borderBlockEndColor={tokens["--border"]}
                borderBlockEndStyle={"solid"}
                borderBlockEndWidth={1}
                minInlineSize={"7rem"}
                overflowWrap={"anywhere"}
                whiteSpace={"pre-wrap"}
                aria-label={`${prop.name} type`}
              >
                {prop.type.length > 140 ? (
                  <Box as="details" marginBlock={"1rem"} minInlineSize={0}>
                    <Box
                      as="summary"
                      cursor={"pointer"}
                      overflowWrap={"anywhere"}
                      paddingBlock={"0.375rem"}
                      fontWeight={500}
                      _focusVisible={{
                        outlineColor: tokens["--ring"],
                        outlineStyle: "solid",
                        outlineWidth: 2,
                        outlineOffset: -2,
                      }}
                    >
                      <Box
                        as="code"
                        fontFamily={tokens["--font-mono"]}
                        overflowWrap={"anywhere"}
                        fontSize={"0.8125rem"}
                      >
                        {prop.type.slice(0, 100)}…
                      </Box>
                    </Box>
                    <Box
                      as="pre"
                      whiteSpace={"pre-wrap"}
                      overflowWrap={"anywhere"}
                      maxInlineSize={"36rem"}
                      marginBlock={"0.75rem"}
                      padding={"0.75rem"}
                      backgroundColor={tokens["--code"]}
                      color={tokens["--code-foreground"]}
                      borderRadius={tokens["--radius-sm"]}
                    >
                      <Box
                        as="code"
                        fontFamily={tokens["--font-mono"]}
                        overflowWrap={"anywhere"}
                        fontSize={"0.8125rem"}
                      >
                        {prop.type}
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    as="code"
                    fontFamily={tokens["--font-mono"]}
                    overflowWrap={"anywhere"}
                    fontSize={"0.8125rem"}
                  >
                    {prop.type}
                  </Box>
                )}
              </Box>
              <Box
                as="td"
                textAlign={"start"}
                verticalAlign={"top"}
                padding={"0.75rem"}
                borderBlockEndColor={tokens["--border"]}
                borderBlockEndStyle={"solid"}
                borderBlockEndWidth={1}
                minInlineSize={"7rem"}
                overflowWrap={"anywhere"}
                whiteSpace={"pre-wrap"}
              >
                <Box
                  as="code"
                  fontFamily={tokens["--font-mono"]}
                  overflowWrap={"anywhere"}
                  fontSize={"0.8125rem"}
                >
                  {prop.default ?? "Not specified"}
                </Box>
              </Box>
              <Box
                as="td"
                textAlign={"start"}
                verticalAlign={"top"}
                padding={"0.75rem"}
                borderBlockEndColor={tokens["--border"]}
                borderBlockEndStyle={"solid"}
                borderBlockEndWidth={1}
                minInlineSize={"7rem"}
                overflowWrap={"anywhere"}
                whiteSpace={"pre-wrap"}
              >
                {prop.required ? "Yes" : "No"}
              </Box>
              <Box
                as="td"
                textAlign={"start"}
                verticalAlign={"top"}
                padding={"0.75rem"}
                borderBlockEndColor={tokens["--border"]}
                borderBlockEndStyle={"solid"}
                borderBlockEndWidth={1}
                minInlineSize={"7rem"}
                overflowWrap={"anywhere"}
                whiteSpace={"pre-wrap"}
              >
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
        marginBlock={"2rem"}
        minInlineSize={0}
        color={tokens["--foreground"]}
        aria-labelledby={`api-${part.name}`}
      >
        <Heading
          as="h3"
          fontFamily={tokens["--font-heading"]}
          fontSize={"1.25rem"}
          fontWeight={650}
          marginBlock={"1.5rem 0.75rem"}
          scrollMarginBlockStart={"6rem"}
          id={`api-${part.name}`}
        >
          {part.name}
        </Heading>
        <Paragraph
          marginBlock={"0.75rem"}
          lineHeight={1.7}
          overflowWrap={"anywhere"}
          whiteSpace={"pre-wrap"}
        >
          Alias for{" "}
          <Link
            color={tokens["--primary"]}
            textDecorationLine={"underline"}
            textUnderlineOffset={"0.2em"}
            _focusVisible={{
              outlineColor: tokens["--ring"],
              outlineStyle: "solid",
              outlineWidth: 2,
              outlineOffset: -2,
            }}
            href={`#api-${alias}`}
          >
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
      marginBlock={"2rem"}
      minInlineSize={0}
      color={tokens["--foreground"]}
      aria-labelledby={`api-${part.name}`}
    >
      <Heading
        as="h3"
        fontFamily={tokens["--font-heading"]}
        fontSize={"1.25rem"}
        fontWeight={650}
        marginBlock={"1.5rem 0.75rem"}
        scrollMarginBlockStart={"6rem"}
        id={`api-${part.name}`}
      >
        {part.name}
      </Heading>
      <Paragraph
        marginBlock={"0.75rem"}
        lineHeight={1.7}
        overflowWrap={"anywhere"}
        whiteSpace={"pre-wrap"}
      >
        {part.description}
      </Paragraph>
      {part.parameters.length ? (
        <>
          <Heading
            as="h4"
            fontSize={"1rem"}
            fontWeight={650}
            marginBlock={"1.25rem 0.5rem"}
          >
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
                <Heading
                  as="h4"
                  fontSize={"1rem"}
                  fontWeight={650}
                  marginBlock={"1.25rem 0.5rem"}
                >
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
          <Heading
            as="h4"
            fontSize={"1rem"}
            fontWeight={650}
            marginBlock={"1.25rem 0.5rem"}
          >
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
          marginBlock={"1rem"}
          minInlineSize={0}
          onToggle={(event) => setShowVariants(event.currentTarget.open)}
        >
          <Box
            as="summary"
            cursor={"pointer"}
            overflowWrap={"anywhere"}
            paddingBlock={"0.375rem"}
            fontWeight={500}
            _focusVisible={{
              outlineColor: tokens["--ring"],
              outlineStyle: "solid",
              outlineWidth: 2,
              outlineOffset: -2,
            }}
          >
            Accepted prop combinations
          </Box>
          {showVariants
            ? part.propVariants.map((variant, index) => (
                <Box key={variant.type + index}>
                  <Heading
                    as="h4"
                    fontSize={"1rem"}
                    fontWeight={650}
                    marginBlock={"1.25rem 0.5rem"}
                  >
                    Combination {index + 1}
                  </Heading>
                  <Paragraph
                    marginBlock={"0.75rem"}
                    lineHeight={1.7}
                    overflowWrap={"anywhere"}
                    whiteSpace={"pre-wrap"}
                  >
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
        marginBlock={"1rem"}
        minInlineSize={0}
        onToggle={(event) => setShowSignatures(event.currentTarget.open)}
      >
        <Box
          as="summary"
          cursor={"pointer"}
          overflowWrap={"anywhere"}
          paddingBlock={"0.375rem"}
          fontWeight={500}
          _focusVisible={{
            outlineColor: tokens["--ring"],
            outlineStyle: "solid",
            outlineWidth: 2,
            outlineOffset: -2,
          }}
        >
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
