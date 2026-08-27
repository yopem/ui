// next/link replaced -> anchor
import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"
import {
  Card,
  CardAction,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/stylex/card"
import { Field, FieldLabel } from "@/components/ui/stylex/field"
import { Form } from "@/components/ui/stylex/form"
import { Input } from "@/components/ui/stylex/input"

export default function Particle() {
  return (
    <Card {...stylex.props(demoStyles.demo1)}>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardAction>
          <a {...stylex.props(demoStyles.demo2)} href="/">
            Sign up
          </a>
        </CardAction>
      </CardHeader>
      <CardPanel>
        <Form {...stylex.props(demoStyles.demo3)}>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input placeholder="Enter your email" type="email" />
          </Field>
          <Field>
            <FieldLabel>Password</FieldLabel>
            <Input placeholder="Enter your password" type="password" />
          </Field>
          <Button {...stylex.props(demoStyles.demo4)} type="submit">
            Login
          </Button>
        </Form>
      </CardPanel>
    </Card>
  )
}

const demoStyles = stylex.create({
  demo1: {
    inlineSize: "100%",
    maxInlineSize: "20rem",
  },
  demo2: {
    fontSize: "0.875rem",
    lineHeight: "calc(0.25rem * 4.5)",
    color: "var(--muted-foreground)",
    textDecorationLine: {
      default: null,
      ":hover": "underline",
    },
  },
  demo3: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  demo4: {
    inlineSize: "100%",
  },
})
