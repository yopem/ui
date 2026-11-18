"use client"

import type { ChangeEvent } from "react"

import { Box } from "@registry/components/ui/box"
import { Input } from "@registry/components/ui/input"
import { Pre } from "@registry/components/ui/pre"
import { Textarea } from "@registry/components/ui/textarea"
import { VStack } from "@registry/components/ui/vstack"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { useHighlightedCode } from "@registry/hooks/use-highlighted-code"
import { Fragment, useState } from "react"

export function Preview() {
  const [code, setCode] = useState("const answer = 42")
  const [language, setLanguage] = useState("typescript")

  const lines = useHighlightedCode(code, language).map((content, offset) => ({
    content,
    number: offset + 1,
  }))

  const changeCode = useEventCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setCode(event.target.value)
    },
  )

  const changeLanguage = useEventCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setLanguage(event.target.value)
    },
  )

  return (
    <VStack>
      <Textarea aria-label="Code" value={code} onChange={changeCode} />
      <Input aria-label="Language" value={language} onChange={changeLanguage} />
      <Pre aria-label="Highlighted code">
        {lines.map((line) => (
          <Fragment key={line.number}>
            <Box render={<span />} data-testid="highlighted-line">
              {line.content}
            </Box>
            {line.number < lines.length ? "\n" : null}
          </Fragment>
        ))}
      </Pre>
    </VStack>
  )
}
