"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Box } from "@/components/ui/box"
import { Field, FieldItem, FieldLabel } from "@/components/ui/field"
import { Fieldset, FieldsetLegend } from "@/components/ui/fieldset"
import { Radio, RadioGroup } from "@/components/ui/radio-group"
const items = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
] as const

export default function Example() {
  const [value, setValue] = useState("system")

  return (
    <Field
      {...stylex.props(exampleStyles.example1)}
      name="theme"
      render={(props) => <Fieldset {...props} />}
    >
      <FieldsetLegend {...stylex.props(exampleStyles.example2)}>
        Choose a theme
      </FieldsetLegend>
      <RadioGroup
        {...stylex.props(exampleStyles.example3)}
        onValueChange={setValue}
        value={value}
      >
        {items.map((item) => (
          <FieldItem key={item.value}>
            <FieldLabel {...stylex.props(exampleStyles.example4)}>
              <Radio
                {...stylex.props(exampleStyles.report1)}
                value={item.value}
              />
              <Box
                as="span"
                {...stylex.props(
                  exampleStyles.report2,
                  value === item.value && exampleStyles.selectedPreview,
                )}
              >
                {themePreviews[item.value]}
              </Box>
              <Box
                as="span"
                {...stylex.props(
                  exampleStyles.report3,
                  value === item.value && exampleStyles.selectedLabel,
                )}
              >
                {item.label}
              </Box>
            </FieldLabel>
          </FieldItem>
        ))}
      </RadioGroup>
    </Field>
  )
}

const exampleStyles = stylex.create({
  example1: {
    gap: "calc(0.25rem * 4)",
  },
  example2: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  example3: {
    flexDirection: "row",
    gap: "calc(0.25rem * 4)",
  },
  example4: {
    cursor: "pointer",
    flexDirection: "column",
  },
  example5: {
    inlineSize: "100%",
    blockSize: "100%",
  },
  example6: {
    fill: "oklch(20.5% 0 none)",
  },
  example7: {
    fill: "oklch(26.9% 0 none)",
    boxShadow:
      "0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  },
  example8: {
    fill: "oklch(43.9% 0 none)",
  },
  example9: {
    fill: "oklch(37.1% 0 none)",
  },
  example10: {
    fill: "oklch(92.2% 0 none)",
  },
  example11: {
    fill: "#fff",
    boxShadow:
      "0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  },
  example12: {
    fill: "oklch(87% 0 none)",
  },
  report1: {
    position: "absolute",
    inlineSize: "1px",
    blockSize: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  },
  report2: {
    position: "relative",
    display: "block",
    blockSize: "70px",
    inlineSize: "88px",
    overflow: "hidden",
    borderRadius: "var(--radius)",
    boxShadow:
      "0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 2px 0 rgb(0 0 0 / 0.05)",
    transitionProperty: "box-shadow",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  report3: {
    color: "var(--muted-foreground)",
  },
  selectedPreview: {
    boxShadow:
      "0 0 0 2px color-mix(in oklab, var(--primary) 48%, transparent), 0 0 0 3px var(--background)",
    opacity: 1,
  },
  selectedLabel: {
    color: "var(--foreground)",
  },
})

const themePreviews = {
  dark: (
    <svg
      aria-hidden
      {...stylex.props(exampleStyles.example5)}
      fill="none"
      viewBox="0 0 88 70"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path {...stylex.props(exampleStyles.example6)} d="M0 0h88v70H0z" />
      <path
        {...stylex.props(exampleStyles.example7)}
        d="M10 12a4 4 0 0 1 4-4h74v62H10V12Z"
      />
      <circle {...stylex.props(exampleStyles.example8)} cx="28" cy="26" r="8" />
      <rect
        {...stylex.props(exampleStyles.example9)}
        height="4"
        rx="2"
        width="58"
        x="20"
        y="42"
      />
      <rect
        {...stylex.props(exampleStyles.example9)}
        height="4"
        rx="2"
        width="58"
        x="20"
        y="49"
      />
      <rect
        {...stylex.props(exampleStyles.example9)}
        height="4"
        rx="2"
        width="29"
        x="20"
        y="56"
      />
    </svg>
  ),
  light: (
    <svg
      aria-hidden
      {...stylex.props(exampleStyles.example5)}
      fill="none"
      viewBox="0 0 88 70"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path {...stylex.props(exampleStyles.example10)} d="M0 0h88v70H0z" />
      <path
        {...stylex.props(exampleStyles.example11)}
        d="M10 12a4 4 0 0 1 4-4h74v62H10V12Z"
      />
      <circle
        {...stylex.props(exampleStyles.example12)}
        cx="28"
        cy="26"
        r="8"
      />
      <rect
        {...stylex.props(exampleStyles.example10)}
        height="4"
        rx="2"
        width="58"
        x="20"
        y="42"
      />
      <rect
        {...stylex.props(exampleStyles.example10)}
        height="4"
        rx="2"
        width="58"
        x="20"
        y="49"
      />
      <rect
        {...stylex.props(exampleStyles.example10)}
        height="4"
        rx="2"
        width="29"
        x="20"
        y="56"
      />
    </svg>
  ),
  system: (
    <svg
      aria-hidden
      {...stylex.props(exampleStyles.example5)}
      fill="none"
      viewBox="0 0 88 70"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path {...stylex.props(exampleStyles.example10)} d="M0 0h44v70H0z" />
      <path {...stylex.props(exampleStyles.example6)} d="M44 0h44v70H44z" />
      <path
        {...stylex.props(exampleStyles.example11)}
        d="M10 12a4 4 0 0 1 4-4h30v62H10V12Z"
      />
      <circle
        {...stylex.props(exampleStyles.example12)}
        cx="28"
        cy="26"
        r="8"
      />
      <path
        {...stylex.props(exampleStyles.example10)}
        d="M20 44a2 2 0 0 1 2-2h22v4H22a2 2 0 0 1-2-2ZM20 51a2 2 0 0 1 2-2h22v4H22a2 2 0 0 1-2-2ZM20 58a2 2 0 0 1 2-2h22v4H22a2 2 0 0 1-2-2Z"
      />
      <path
        {...stylex.props(exampleStyles.example7)}
        d="M54 12a4 4 0 0 1 4-4h30v62H54V12Z"
      />
      <circle {...stylex.props(exampleStyles.example8)} cx="72" cy="26" r="8" />
      <path
        {...stylex.props(exampleStyles.example9)}
        d="M64 44a2 2 0 0 1 2-2h22v4H66a2 2 0 0 1-2-2ZM64 51a2 2 0 0 1 2-2h22v4H66a2 2 0 0 1-2-2ZM64 58a2 2 0 0 1 2-2h22v4H66a2 2 0 0 1-2-2Z"
      />
    </svg>
  ),
} as const
