"use client"

import * as stylex from "@stylexjs/stylex"

import { Field, FieldLabel, FieldValidity } from "@/components/ui/stylex/field"
import { Input } from "@/components/ui/stylex/input"

export default function FieldWithValidityDemo() {
  return (
    <Field>
      <FieldLabel>Email</FieldLabel>
      <Input placeholder="Enter your email" required type="email" />
      <FieldValidity>
        {(validity) => (
          <div {...stylex.props(demoStyles.demo1)}>
            {validity.error && (
              <p {...stylex.props(demoStyles.demo2)}>{validity.error}</p>
            )}
            <div {...stylex.props(demoStyles.demo3)}>
              <pre {...stylex.props(demoStyles.demo4)}>
                {JSON.stringify(validity, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </FieldValidity>
    </Field>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  demo2: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--destructive-foreground)",
  },
  demo3: {
    inlineSize: "100%",
    borderRadius: "calc(var(--radius) - 2px)",
    backgroundColor: "var(--muted)",
    padding: "calc(0.25rem * 2)",
  },
  demo4: {
    maxBlockSize: "calc(0.25rem * 60)",
    scrollbarWidth: "none",
    overflowY: "auto",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
  },
})
