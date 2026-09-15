import * as stylex from "@stylexjs/stylex"

import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/stylex/accordion"

export default function Example() {
  return (
    <Accordion {...stylex.props(exampleStyles.example1)}>
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
  )
}

const exampleStyles = stylex.create({
  example1: {
    inlineSize: "100%",
  },
})
