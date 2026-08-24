// next/link replaced -> anchor
import { Button } from "@/components/ui/tailwind/button"
import {
  Card,
  CardAction,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/tailwind/card"
import { Field, FieldLabel } from "@/components/ui/tailwind/field"
import { Form } from "@/components/ui/tailwind/form"
import { Input } from "@/components/ui/tailwind/input"

export default function Particle() {
  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardAction>
          <a
            className="text-muted-foreground text-sm leading-4.5 hover:underline"
            href="#"
          >
            Sign up
          </a>
        </CardAction>
      </CardHeader>
      <CardPanel>
        <Form className="flex w-full flex-col gap-4">
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input placeholder="Enter your email" type="email" />
          </Field>
          <Field>
            <FieldLabel>Password</FieldLabel>
            <Input placeholder="Enter your password" type="password" />
          </Field>
          <Button className="w-full" type="submit">
            Login
          </Button>
        </Form>
      </CardPanel>
    </Card>
  )
}
