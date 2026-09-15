import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { CircleCheckIcon } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/stylex/alert"

export default function Particle() {
  return (
    <Alert variant="success">
      <CircleCheckIcon {...stylex.props(exampleStyles.icon)} />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        Describe what can be done about it here.
      </AlertDescription>
    </Alert>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: "1lh",
    inlineSize: "1rem",
    color: tokens["--success"],
  },
})
