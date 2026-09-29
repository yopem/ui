import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@registry/components/ui/alert"
import { Text } from "@registry/components/ui/text"

export function Preview() {
  return (
    <Alert>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        <Text>Describe what can be done about it here.</Text>
      </AlertDescription>
    </Alert>
  )
}
