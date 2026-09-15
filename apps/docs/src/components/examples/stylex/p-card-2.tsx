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

function LoginFields() {
  return (
    <>
      <Field>
        <FieldLabel>Email</FieldLabel>
        <Input placeholder="Enter your email" type="email" />
      </Field>
      <Field>
        <FieldLabel>Password</FieldLabel>
        <Input placeholder="Enter your password" type="password" />
      </Field>
    </>
  )
}

export default function Particle() {
  return (
    <Card {...stylex.props(exampleStyles.example1)}>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardAction>
          <a {...stylex.props(exampleStyles.example2)} href="/">
            Sign up
          </a>
        </CardAction>
      </CardHeader>
      <CardPanel>
        <Form {...stylex.props(exampleStyles.example3)}>
          <LoginFields />
          <Button {...stylex.props(exampleStyles.example4)} type="submit">
            Login
          </Button>
        </Form>
      </CardPanel>
    </Card>
  )
}

const exampleStyles = stylex.create({
  example1: {
    inlineSize: "100%",
    maxInlineSize: "20rem",
  },
  example2: {
    fontSize: "0.875rem",
    lineHeight: "calc(0.25rem * 4.5)",
    color: "var(--muted-foreground)",
    textDecorationLine: {
      default: null,
      ":hover": "underline",
    },
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
})
