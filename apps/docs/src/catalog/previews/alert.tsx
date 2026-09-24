import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Paragraph } from "@/components/ui/paragraph"
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
