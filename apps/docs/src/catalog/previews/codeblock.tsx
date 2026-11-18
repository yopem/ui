"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import {
  Codeblock,
  CodeblockActions,
  CodeblockContent,
  CodeblockCopyButton,
  CodeblockHeader,
  CodeblockLine,
  CodeblockTitle,
} from "@registry/components/ui/codeblock"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { useHighlightedCode } from "@registry/hooks/use-highlighted-code"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { DownloadIcon, FileCodeIcon, WrapTextIcon } from "lucide-react"
import { useState } from "react"

const source = [
  "export async function GET(request: Request) {",
  "  const { searchParams } = new URL(request.url)",
  '  const city = searchParams.get("city") ?? "Portland"',
  "",
  "  const response = await fetch(`https://weather.example.com/v1/forecast?city=${encodeURIComponent(city)}&units=metric&include=hourly,wind,humidity`, {",
  '    headers: { Accept: "application/json" },',
  "  })",
  "  const forecast = await response.json()",
  "",
  "  return Response.json({ city, forecast, updatedAt: new Date().toISOString() })",
  "}",
].join("\n")

const lineNumbers = source.split("\n").map((_line, index) => index + 1)

const styles = stylex.create({
  demo: { contain: "inline-size", maxInlineSize: "36rem" },
  title: {
    alignItems: "center",
    display: "flex",
    gap: `calc(2 * ${tokens["--spacing"]})`,
  },
  filename: { minInlineSize: 0, overflow: "hidden", textOverflow: "ellipsis" },
})

export function Preview() {
  const [wrap, setWrap] = useState(false)
  const lines = useHighlightedCode(source, "typescript")

  const toggleWrap = useEventCallback(() => {
    setWrap(!wrap)
  })

  return (
    <Codeblock xstyle={styles.demo}>
      <CodeblockHeader>
        <CodeblockTitle xstyle={styles.title}>
          <FileCodeIcon aria-hidden="true" size={16} />
          <Box render={<span />} xstyle={styles.filename}>
            app/api/weather/route.ts
          </Box>
        </CodeblockTitle>
        <CodeblockActions>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Wrap lines"
            aria-pressed={wrap}
            onClick={toggleWrap}
          >
            <WrapTextIcon aria-hidden="true" size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Download"
            render={
              <a
                aria-label="Download"
                download="route.ts"
                href={`data:text/typescript;charset=utf-8,${encodeURIComponent(source)}`}
              />
            }
          >
            <DownloadIcon aria-hidden="true" size={16} />
          </Button>
          <CodeblockCopyButton value={source} />
        </CodeblockActions>
      </CodeblockHeader>
      <CodeblockContent lineNumbers wrap={wrap}>
        {lineNumbers.map((number) => (
          <CodeblockLine
            key={number}
            variant={number >= 5 && number <= 8 ? "highlighted" : "default"}
          >
            {lines[number - 1]}
          </CodeblockLine>
        ))}
      </CodeblockContent>
    </Codeblock>
  )
}
