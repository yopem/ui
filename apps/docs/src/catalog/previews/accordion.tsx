import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@registry/components/ui/accordion"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({ accordion: { inlineSize: "100%" } })

const previewDefaultValue = ["3"]

export function Preview() {
  const items = [
    {
      content:
        "The field station lends binoculars, audio recorders, and trail maps.",
      id: "1",
      title: "What can I borrow?",
    },
    {
      content:
        "Choose an available kit and a collection date. Staff will confirm your reservation.",
      id: "2",
      title: "How do I reserve equipment?",
    },
    {
      content:
        "Yes. Contact the station before your return date to check availability.",
      id: "3",
      title: "Can I extend a loan?",
    },
  ]

  return (
    <Accordion xstyle={styles.accordion} defaultValue={previewDefaultValue}>
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionPanel>{item.content}</AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
