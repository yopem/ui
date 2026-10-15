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
      <AlertTitle>Trail access changed</AlertTitle>
      <AlertDescription>
        <Text xstyle={styles.text}>
          Use the east entrance while the river bridge is closed.
        </Text>
      </AlertDescription>
    </Alert>
  )
}
