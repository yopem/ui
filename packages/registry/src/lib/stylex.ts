import type {
  CompiledStyles,
  InlineStyles,
  StyleXArray,
} from "@stylexjs/stylex"

import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"

type StyleXStyle = StyleXArray<
  | null
  | undefined
  | CompiledStyles
  | boolean
  | Readonly<[CompiledStyles, InlineStyles]>
>

export function stylexProps<State>(
  className: string | ((state: State) => string | undefined) | undefined,
  ...styles: readonly StyleXStyle[]
) {
  const props = stylex.props(...styles)
  const style =
    props.style && Object.keys(props.style).length > 0 ? props.style : undefined
  return {
    ...props,
    style,
    className: clsx(
      props.className,
      typeof className === "string" ? className : undefined,
    ),
  }
}
