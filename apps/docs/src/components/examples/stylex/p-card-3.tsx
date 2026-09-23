import * as stylex from "@stylexjs/stylex"
import { ShieldAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Flex } from "@/components/ui/flex"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Paragraph } from "@/components/ui/paragraph"
export default function Example() {
  return (
    <Card {...stylex.props(exampleStyles.example1)}>
      <CardHeader {...stylex.props(exampleStyles.example2)}>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>Enter email and password to login</CardDescription>
      </CardHeader>
      <CardPanel {...stylex.props(exampleStyles.panel)}>
        <Form {...stylex.props(exampleStyles.example3)}>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input placeholder="Enter your email" type="email" />
          </Field>
          <Field>
            <FieldLabel>Password</FieldLabel>
            <Input placeholder="Enter your password" type="password" />
          </Field>
          <Button {...stylex.props(exampleStyles.example4)} type="submit">
            Login
          </Button>
        </Form>
      </CardPanel>
      <CardFooter {...stylex.props(exampleStyles.example5)}>
        <Flex {...stylex.props(exampleStyles.example6)}>
          <ShieldAlertIcon {...stylex.props(exampleStyles.example7)} />
          <Paragraph>
            The information you enter is encrypted and stored securely.
          </Paragraph>
        </Flex>
      </CardFooter>
    </Card>
  )
}

const exampleStyles = stylex.create({
  panel: { paddingBlock: "1.5rem" },
  example1: {
    inlineSize: "100%",
    maxInlineSize: "20rem",
  },
  example2: {
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
  },
  example3: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  example4: {
    inlineSize: "100%",
  },
  example5: {
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
  },
  example6: {
    display: "flex",
    gap: "0.25rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  example7: {
    inlineSize: "calc(0.25rem * 3)",
    blockSize: "1lh",
    flexShrink: "0",
  },
})
