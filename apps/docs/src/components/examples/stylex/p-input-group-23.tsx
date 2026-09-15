"use client"

import * as stylex from "@stylexjs/stylex"
import { LoaderCircleIcon, MicIcon, SearchIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/stylex/input-group"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/stylex/tooltip"

export default function Particle() {
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (value) {
      setIsLoading(true)
      timeoutRef.current = setTimeout(() => setIsLoading(false), 500)
    } else {
      setIsLoading(false)
    }
  }

  return (
    <InputGroup>
      <InputGroupAddon>
        {isLoading ? (
          <output aria-label="Loading...">
            <LoaderCircleIcon
              aria-hidden="true"
              {...stylex.props(exampleStyles.icon, exampleStyles.report1)}
            />
          </output>
        ) : (
          <SearchIcon
            {...stylex.props(exampleStyles.icon)}
            aria-hidden="true"
          />
        )}
      </InputGroupAddon>
      <InputGroupInput
        aria-label="Search"
        onChange={handleChange}
        placeholder="Search..."
        type="search"
        value={inputValue}
      />
      <InputGroupAddon align="inline-end">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Voice search"
                size="icon-xs"
                variant="ghost"
              />
            }
          >
            <MicIcon
              {...stylex.props(exampleStyles.icon2)}
              aria-hidden="true"
            />
          </TooltipTrigger>
          <TooltipPopup>Voice search</TooltipPopup>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  )
}

const spin = stylex.keyframes({
  to: { transform: "rotate(360deg)" },
})

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
  icon2: {
    blockSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  report1: {
    animation: `${spin} 1s linear infinite`,
  },
})
