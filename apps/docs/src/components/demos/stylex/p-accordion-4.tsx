"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/stylex/accordion"
import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  const [value, setValue] = useState<string[]>([])

  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Accordion
        {...stylex.props(demoStyles.demo2)}
        onValueChange={setValue}
        value={value}
      >
        <AccordionItem value="item-1">
          <AccordionTrigger>What is Base UI?</AccordionTrigger>
          <AccordionPanel>
            Base UI is a library of high-quality unstyled React components for
            design systems and web apps.
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>How do I get started?</AccordionTrigger>
          <AccordionPanel>
            Head to the "Quick start" guide in the docs. If you've used unstyled
            libraries before, you'll feel at home.
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Can I use it for my project?</AccordionTrigger>
          <AccordionPanel>
            Of course! Base UI is free and open source.
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      <div {...stylex.props(demoStyles.demo3)}>
        <Button
          onClick={() => setValue(["item-1", "item-2"])}
          variant="outline"
        >
          Open First Two
        </Button>
        <p {...stylex.props(demoStyles.demo4)}>
          Open items: {value.length > 0 ? value.join(", ") : "None"}
        </p>
      </div>
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  demo2: {
    inlineSize: "100%",
  },
  demo3: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "calc(0.25rem * 4)",
  },
  demo4: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
})
