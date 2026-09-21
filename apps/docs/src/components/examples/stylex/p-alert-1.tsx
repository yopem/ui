import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/stylex/alert"
import { Paragraph } from "@/components/ui/stylex/paragraph"
export default function Example() {
  return (
    <Alert>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        <Paragraph>Describe what can be done about it here.</Paragraph>
      </AlertDescription>
    </Alert>
  )
}
