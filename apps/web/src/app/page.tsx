import {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  Badge,
  Button,
} from "@yopem-ui/react"

export default function Home() {
  return (
    <main className="mx-auto my-8 flex flex-col space-y-4 px-20">
      <h1 className="text-4xl">Hello, World!</h1>
      <div>
        <Button>Click me</Button>
      </div>
      <div>
        <Badge>Badge</Badge>
      </div>
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
    </main>
  )
}
