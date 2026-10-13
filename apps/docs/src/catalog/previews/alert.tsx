import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@registry/components/ui/alert"
import { Text } from "@registry/components/ui/text"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { fontSize: "inherit", lineHeight: "inherit", color: "inherit" },
})

export function Preview() {
  return (
    <Alert>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        <Text xstyle={styles.text}>
          Describe what can be done about it here.
        </Text>
      </AlertDescription>
    </Alert>
  )
}
