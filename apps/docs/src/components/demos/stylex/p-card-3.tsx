import * as stylex from "@stylexjs/stylex"
import { ShieldAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  Card,
  CardDescription,
  CardFooter,
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
      <CardHeader {...stylex.props(demoStyles.demo2)}>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>Enter email and password to login</CardDescription>
      </CardHeader>
      <CardPanel {...stylex.props(demoStyles.panel)}>
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
      <CardFooter {...stylex.props(demoStyles.demo5)}>
        <div {...stylex.props(demoStyles.demo6)}>
          <ShieldAlertIcon {...stylex.props(demoStyles.demo7)} />
          <p>The information you enter is encrypted and stored securely.</p>
        </div>
      </CardFooter>
    </Card>
  )
}

const demoStyles = stylex.create({
  panel: { paddingBlock: "1.5rem" },
  demo1: {
    inlineSize: "100%",
    maxInlineSize: "20rem",
  },
  demo2: {
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
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
  demo5: {
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
  },
  demo6: {
    display: "flex",
    gap: "0.25rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  demo7: {
    inlineSize: "calc(0.25rem * 3)",
    blockSize: "1lh",
    flexShrink: "0",
  },
})
