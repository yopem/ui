"use client"

import * as stylex from "@stylexjs/stylex"
import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from "lucide-react"
import { useId, useMemo, useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/stylex/input-group"
import { Label } from "@/components/ui/stylex/label"

const requirements = [
  { regex: /.{8,}/, text: "At least 8 characters" },
  { regex: /[0-9]/, text: "At least 1 number" },
  { regex: /[a-z]/, text: "At least 1 lowercase letter" },
  { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
]

export default function Particle() {
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
    <div {...stylex.props(demoStyles.demo1)}>
      <div {...stylex.props(demoStyles.demo2)}>
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
                <EyeOffIcon aria-hidden="true" />
              ) : (
                <EyeIcon aria-hidden="true" />
              )}
            </Button>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <progress
        aria-label="Password strength"
        {...stylex.props(demoStyles.strength, strengthStyles[strengthScore])}
        max={4}
        value={strengthScore}
      />

      <p {...stylex.props(demoStyles.demo3)} id={`${id}-description`}>
        {getStrengthText(strengthScore)}. Must contain:
      </p>

      <ul
        aria-label="Password requirements"
        {...stylex.props(demoStyles.demo4)}
      >
        {strength.map((req) => (
          <li {...stylex.props(demoStyles.demo5)} key={req.text}>
            {req.met ? (
              <CheckIcon
                aria-hidden="true"
                {...stylex.props(demoStyles.demo6)}
              />
            ) : (
              <XIcon aria-hidden="true" {...stylex.props(demoStyles.demo7)} />
            )}
            <span
              {...stylex.props(
                demoStyles.requirement,
                req.met ? demoStyles.met : demoStyles.unmet,
              )}
            >
              {req.text}
              <span {...stylex.props(demoStyles.demo8)}>
                {req.met ? " - Requirement met" : " - Requirement not met"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 3)",
  },
  demo2: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  demo3: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
    color: "var(--foreground)",
  },
  demo4: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 1.5)",
  },
  demo5: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  demo6: {
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
    color: "oklch(69.6% 0.17 162.48)",
  },
  demo7: {
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
  demo8: {
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
  demoStyles.empty,
  demoStyles.weak,
  demoStyles.fair,
  demoStyles.medium,
  demoStyles.strong,
]
