"use client"

import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Form } from "@/components/ui/form"
import {
  Popover,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
export default function Example() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        Open Popover
      </PopoverTrigger>
      <PopoverPopup {...stylex.props(exampleStyles.example1)}>
        <Box {...stylex.props(exampleStyles.example2)}>
          <PopoverTitle {...stylex.props(exampleStyles.example3)}>
            Send us feedback
          </PopoverTitle>
          <PopoverDescription>
            Let us know how we can improve.
          </PopoverDescription>
        </Box>
        <Form {...stylex.props(exampleStyles.example4)}>
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

const exampleStyles = stylex.create({
  example1: {
    inlineSize: "calc(0.25rem * 80)",
  },
  example2: {
    marginBlockEnd: "calc(0.25rem * 4)",
  },
  example3: {
    fontSize: "1rem",
    lineHeight: "calc(1.5 / 1)",
  },
  example4: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
})
