import { Container } from "@registry/components/ui/container"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  narrow: { maxInlineSize: "32rem" },
})

export function Preview() {
  return (
    <Container xstyle={styles.narrow}>
      Content stays centered and readable as the viewport grows.
    </Container>
  )
}
