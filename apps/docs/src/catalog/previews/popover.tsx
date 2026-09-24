"use client"

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
export function Preview() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        Open Popover
      </PopoverTrigger>
      <PopoverPopup inlineSize={"calc(0.25rem * 80)"}>
        <Box marginBlockEnd={"calc(0.25rem * 4)"}>
          <PopoverTitle fontSize={"1rem"} lineHeight={"calc(1.5 / 1)"}>
            Send us feedback
          </PopoverTitle>
          <PopoverDescription>
            Let us know how we can improve.
          </PopoverDescription>
        </Box>
        <Form
          display={"flex"}
          inlineSize={"100%"}
          flexDirection={"column"}
          gap={"calc(0.25rem * 4)"}
        >
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
