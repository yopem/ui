"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Field } from "@registry/components/ui/field"
import { Form } from "@registry/components/ui/form"
import {
  Popover,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@registry/components/ui/popover"
import { Textarea } from "@registry/components/ui/textarea"
import * as stylex from "@stylexjs/stylex"
const styles = stylex.create({
  popoverPopup: { inlineSize: "calc(0.25rem * 80)" },
  box: { marginBlockEnd: "calc(0.25rem * 4)" },
  popoverTitle: { fontSize: "1rem", lineHeight: "calc(1.5 / 1)" },
  form: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
})
export function Preview() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        Open Popover
      </PopoverTrigger>
      <PopoverPopup xstyle={styles.popoverPopup}>
        <Box xstyle={styles.box}>
          <PopoverTitle xstyle={styles.popoverTitle}>
            Send us feedback
          </PopoverTitle>
          <PopoverDescription>
            Let us know how we can improve.
          </PopoverDescription>
        </Box>
        <Form xstyle={styles.form}>
          <Field>
            <Textarea
              aria-label="Send feedback"
              id="feedback"
              placeholder="How can we improve?"
            />
          </Field>
          <Button type="submit">Send feedback</Button>
        </Form>
      </PopoverPopup>
    </Popover>
  )
}
