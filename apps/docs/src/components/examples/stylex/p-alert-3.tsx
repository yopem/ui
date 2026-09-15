import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { InfoIcon } from "lucide-react"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/stylex/alert"
import { Button } from "@/components/ui/stylex/button"

export default function Example() {
  return (
    <Alert>
      <InfoIcon {...stylex.props(exampleStyles.icon)} />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        Describe what can be done about it here.
      </AlertDescription>
      <AlertAction>
        <Button size="xs" variant="ghost">
          Dismiss
        </Button>
        <Button size="xs">Ok</Button>
      </AlertAction>
    </Alert>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: "1lh",
    inlineSize: "1rem",
    color: tokens["--muted-foreground"],
  },
})
