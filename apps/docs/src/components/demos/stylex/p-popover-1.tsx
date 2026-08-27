"use client"

import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"
import { Field } from "@/components/ui/stylex/field"
import { Form } from "@/components/ui/stylex/form"
import {
  Popover,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/stylex/popover"
import { Textarea } from "@/components/ui/stylex/textarea"

export default function Particle() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        Open Popover
      </PopoverTrigger>
      <PopoverPopup {...stylex.props(demoStyles.demo1)}>
        <div {...stylex.props(demoStyles.demo2)}>
          <PopoverTitle {...stylex.props(demoStyles.demo3)}>
            Send us feedback
          </PopoverTitle>
          <PopoverDescription>
            Let us know how we can improve.
          </PopoverDescription>
        </div>
        <Form {...stylex.props(demoStyles.demo4)}>
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

const demoStyles = stylex.create({
  demo1: {
    inlineSize: "calc(0.25rem * 80)",
  },
  demo2: {
    marginBlockEnd: "calc(0.25rem * 4)",
  },
  demo3: {
    fontSize: "1rem",
    lineHeight: "calc(1.5 / 1)",
  },
  demo4: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
})
