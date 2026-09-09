import type {
  CompiledStyles,
  InlineStyles,
  StyleXArray,
} from "@stylexjs/stylex"

import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"

export type StyleXStyle = StyleXArray<
  | null
  | undefined
  | CompiledStyles
  | boolean
  | Readonly<[CompiledStyles, InlineStyles]>
>

export interface StyleXProps {
  /** StyleX styles applied after component defaults and variants. */
  xstyle?: StyleXStyle
}

export function stylexProps(
  className: string | undefined,
  ...styles: readonly StyleXStyle[]
): {
  className: string
  style: ReturnType<typeof stylex.props>["style"] | undefined
}
export function stylexProps<State>(
  className: string | ((state: State) => string | undefined) | undefined,
  ...styles: readonly StyleXStyle[]
): {
  className: string | ((state: State) => string)
  style: ReturnType<typeof stylex.props>["style"] | undefined
}
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
    className:
      typeof className === "function"
        ? (state: State) => clsx(props.className, className(state))
        : clsx(props.className, className),
  }
}
