"use client"

import { LoaderCircleIcon, MicIcon, SearchIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/tailwind/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/tailwind/input-group"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/tailwind/tooltip"

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
            <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
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
