"use client"

import * as stylex from "@stylexjs/stylex"
import { CheckIcon, CopyIcon } from "lucide-react"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/stylex/input-group"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/stylex/tooltip"

const languages = [
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "Python", value: "python" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
]

export default function Example() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const content = textareaRef.current?.value || ""
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <InputGroup>
      <InputGroupTextarea
        {...stylex.props(exampleStyles.example1)}
        placeholder="Paste your code here…"
        ref={textareaRef}
        rows={6}
      />
      <InputGroupAddon
        align="block-start"
        {...stylex.props(exampleStyles.example2)}
      >
        <Select defaultValue="javascript" items={languages}>
          <SelectTrigger {...stylex.props(exampleStyles.example3)} size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {languages.map(({ label, value }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label={copied ? "Copied" : "Copy code"}
                onClick={handleCopy}
                size="icon-sm"
                variant="ghost"
              />
            }
          >
            {copied ? (
              <CheckIcon {...stylex.props(exampleStyles.icon)} />
            ) : (
              <CopyIcon {...stylex.props(exampleStyles.icon)} />
            )}
          </TooltipTrigger>
          <TooltipPopup>
            {copied ? "Copied!" : "Copy to clipboard"}
          </TooltipPopup>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  example1: {
    fontFamily: '"Geist Mono", ui-monospace, monospace',
  },
  example2: {
    justifyContent: "space-between",
    borderTopLeftRadius: "var(--radius)",
    borderTopRightRadius: "var(--radius)",
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    backgroundColor: {
      default: "var(--muted)",
      "@supports (color: color-mix(in lab, red, red))":
        "color-mix(in oklab, var(--muted) 72%, transparent)",
    },
    padding: "calc(0.25rem * 2)",
  },
  example3: {
    inlineSize: "fit-content",
  },
})
