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
              {...stylex.props(demoStyles.report1)}
            />
          </output>
        ) : (
          <SearchIcon aria-hidden="true" />
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
            <MicIcon aria-hidden="true" />
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

const demoStyles = stylex.create({
  report1: {
    animation: `${spin} 1s linear infinite`,
  },
})
