import {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
} from "@yopem-ui/react"

const accordionComponent = {
  name: "Accordion",
  description: "A collapsible content component with multiple sections.",
  code: `
    <div className="max-w-md rounded border p-4">
      <Accordion collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionItemTrigger>Is it accessible?</AccordionItemTrigger>
          <AccordionItemContent>
            Yes. It adheres to the WAI-ARIA design pattern.
          </AccordionItemContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionItemTrigger>Is it styled?</AccordionItemTrigger>
          <AccordionItemContent>
            Yes. It comes with default styles that matches the other
            components&apos; aesthetic.
          </AccordionItemContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionItemTrigger>Is it animated?</AccordionItemTrigger>
          <AccordionItemContent>
            Yes. It&apos;s animated by default, but you can disable it if you
            prefer.
          </AccordionItemContent>
        </AccordionItem>
      </Accordion>
    </div>
  `,
  preview: (
    <div className="max-w-md rounded border p-4">
      <Accordion collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionItemTrigger>Is it accessible?</AccordionItemTrigger>
          <AccordionItemContent>
            Yes. It adheres to the WAI-ARIA design pattern.
          </AccordionItemContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionItemTrigger>Is it styled?</AccordionItemTrigger>
          <AccordionItemContent>
            Yes. It comes with default styles that matches the other
            components&apos; aesthetic.
          </AccordionItemContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionItemTrigger>Is it animated?</AccordionItemTrigger>
          <AccordionItemContent>
            Yes. It&apos;s animated by default, but you can disable it if you
            prefer.
          </AccordionItemContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}

export default accordionComponent
