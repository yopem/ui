"use client"

import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/stylex/box"
import { Field, FieldLabel, FieldValidity } from "@/components/ui/stylex/field"
import { Flex } from "@/components/ui/stylex/flex"
import { Input } from "@/components/ui/stylex/input"
import { Paragraph } from "@/components/ui/stylex/paragraph"
export default function FieldWithValidityExample() {
  return (
    <Field>
      <FieldLabel>Email</FieldLabel>
      <Input placeholder="Enter your email" required type="email" />
      <FieldValidity>
        {(validity) => (
          <Flex {...stylex.props(exampleStyles.example1)}>
            {validity.error && (
              <Paragraph {...stylex.props(exampleStyles.example2)}>
                {validity.error}
              </Paragraph>
            )}
            <Box {...stylex.props(exampleStyles.example3)}>
              <Box
                as="textarea"
                aria-label="Field validity details"
                readOnly
                rows={12}
                value={JSON.stringify(validity, null, 2)}
                {...stylex.props(exampleStyles.example4)}
              />
            </Box>
          </Flex>
        )}
      </FieldValidity>
    </Field>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  example2: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--destructive-foreground)",
  },
  example3: {
    inlineSize: "100%",
    borderRadius: "calc(var(--radius) - 2px)",
    backgroundColor: "var(--muted)",
    padding: "calc(0.25rem * 2)",
  },
  example4: {
    backgroundColor: "transparent",
    borderWidth: 0,
    color: "inherit",
    inlineSize: "100%",
    maxBlockSize: "calc(0.25rem * 60)",
    padding: 0,
    resize: "none",
    scrollbarWidth: "none",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
  },
})
