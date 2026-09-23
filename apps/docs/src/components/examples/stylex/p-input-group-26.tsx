"use client"

import * as stylex from "@stylexjs/stylex"
import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from "lucide-react"
import { useId, useMemo, useState } from "react"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Paragraph } from "@/components/ui/paragraph"
const requirements = [
  { regex: /.{8,}/, text: "At least 8 characters" },
  { regex: /[0-9]/, text: "At least 1 number" },
  { regex: /[a-z]/, text: "At least 1 lowercase letter" },
  { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
]

export default function Example() {
  const id = useId()
  const [password, setPassword] = useState("")
  const [isVisible, setIsVisible] = useState(false)

  const strength = requirements.map((req) => ({
    met: req.regex.test(password),
    text: req.text,
  }))

  const strengthScore = useMemo(() => {
    return strength.filter((req) => req.met).length
  }, [strength])

  const getStrengthText = (score: number) => {
    if (score === 0) return "Enter a password"
    if (score <= 2) return "Weak password"
    if (score === 3) return "Medium password"
    return "Strong password"
  }

  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Flex {...stylex.props(exampleStyles.example2)}>
        <Label htmlFor={id}>Password</Label>
        <InputGroup>
          <InputGroupInput
            aria-describedby={`${id}-description`}
            id={id}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type={isVisible ? "text" : "password"}
            value={password}
          />
          <InputGroupAddon align="inline-end">
            <Button
              aria-label={isVisible ? "Hide password" : "Show password"}
              onClick={() => setIsVisible(!isVisible)}
              size="icon-xs"
              variant="ghost"
            >
              {isVisible ? (
                <EyeOffIcon
                  {...stylex.props(exampleStyles.icon)}
                  aria-hidden="true"
                />
              ) : (
                <EyeIcon
                  {...stylex.props(exampleStyles.icon)}
                  aria-hidden="true"
                />
              )}
            </Button>
          </InputGroupAddon>
        </InputGroup>
      </Flex>

      <Box
        as="progress"
        aria-label="Password strength"
        {...stylex.props(exampleStyles.strength, strengthStyles[strengthScore])}
        max={4}
        value={strengthScore}
      />

      <Paragraph
        {...stylex.props(exampleStyles.example3)}
        id={`${id}-description`}
      >
        {getStrengthText(strengthScore)}. Must contain:
      </Paragraph>

      <Box
        as="ul"
        aria-label="Password requirements"
        {...stylex.props(exampleStyles.example4)}
      >
        {strength.map((req) => (
          <Box as="li" {...stylex.props(exampleStyles.example5)} key={req.text}>
            {req.met ? (
              <CheckIcon
                aria-hidden="true"
                {...stylex.props(exampleStyles.example6)}
              />
            ) : (
              <XIcon
                aria-hidden="true"
                {...stylex.props(exampleStyles.example7)}
              />
            )}
            <Box
              as="span"
              {...stylex.props(
                exampleStyles.requirement,
                req.met ? exampleStyles.met : exampleStyles.unmet,
              )}
            >
              {req.text}
              <Box as="span" {...stylex.props(exampleStyles.example8)}>
                {req.met ? " - Requirement met" : " - Requirement not met"}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Flex>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  example1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 3)",
  },
  example2: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  example3: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
    color: "var(--foreground)",
  },
  example4: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 1.5)",
  },
  example5: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  example6: {
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
    color: "oklch(69.6% 0.17 162.48)",
  },
  example7: {
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
    color: {
      default: "var(--muted-foreground)",
      "@supports (color: color-mix(in lab, red, red))":
        "color-mix(in oklab, var(--muted-foreground) 80%, transparent)",
    },
  },
  strength: {
    backgroundColor: "var(--border)",
    blockSize: "0.25rem",
    borderRadius: "9999px",
    inlineSize: "100%",
    overflow: "hidden",
    "::-webkit-progress-bar": { backgroundColor: "transparent" },
    "::-webkit-progress-value": {
      backgroundColor: "currentColor",
      transition: "all 500ms",
    },
    "::-moz-progress-bar": {
      backgroundColor: "currentColor",
      transition: "all 150ms",
    },
  },
  empty: { color: "var(--border)" },
  weak: { color: "oklch(63.7% 0.237 25.331)" },
  fair: { color: "oklch(70.5% 0.213 47.604)" },
  medium: { color: "oklch(76.9% 0.188 70.08)" },
  strong: { color: "oklch(69.6% 0.17 162.48)" },
  requirement: {
    fontSize: "0.75rem",
    lineHeight: "1rem",
  },
  met: { color: "oklch(59.6% 0.145 163.225)" },
  unmet: { color: "var(--muted-foreground)" },
  example8: {
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
})

const strengthStyles = [
  exampleStyles.empty,
  exampleStyles.weak,
  exampleStyles.fair,
  exampleStyles.medium,
  exampleStyles.strong,
]
