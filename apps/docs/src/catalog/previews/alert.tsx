import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@registry/components/ui/alert"
import { Paragraph } from "@registry/components/ui/paragraph"
export function Preview() {
  return (
    <Alert>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        <Paragraph>Describe what can be done about it here.</Paragraph>
      </AlertDescription>
    </Alert>
  )
}
