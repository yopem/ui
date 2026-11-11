import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@registry/components/ui/number-field"
import { VStack } from "@registry/components/ui/vstack"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  container: { inlineSize: "min(100%, 24rem)" },
})

export function Preview() {
  return (
    <VStack xstyle={styles.container}>
      <NumberField defaultValue={0}>
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput aria-label="Quantity" />
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
      <NumberField defaultValue={1} min={1} max={2} fullWidth>
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput aria-label="Full-width quantity" />
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
    </VStack>
  )
}
