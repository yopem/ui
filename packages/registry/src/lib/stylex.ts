import type {
  CompiledStyles,
  InlineStyles,
  StyleXArray,
} from "@stylexjs/stylex"
import type { CSSProperties } from "react"

import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"

export type StyleXStyle = StyleXArray<
  | null
  | undefined
  | CompiledStyles
  | boolean
  | Readonly<[CompiledStyles, InlineStyles]>
>

type InlineStyle = CSSProperties | ((state: never) => CSSProperties | undefined)
type ClassName = string | ((state: never) => string | undefined)
interface StyleProps {
  style?: InlineStyle
  className?: ClassName
}

type PropValue<Props, Key extends PropertyKey> = Key extends keyof Props
  ? Props[Key]
  : undefined

type MergedClassName<Class> = [Class] extends [never]
  ? string
  : Class extends (state: infer State) => unknown
    ? (state: State) => string
    : string

type MergedStyle<Style> = Style extends (state: infer State) => unknown
  ? (state: State) => CSSProperties
  : CSSProperties

export function mergeStyleProps<
  Generated extends { style?: CSSProperties; className?: ClassName },
  Props extends object,
>(
  generated: Generated,
  props: Props & StyleProps,
): Omit<Generated, keyof Props | "style" | "className"> &
  Omit<Props, "style" | "className"> & {
    style: MergedStyle<PropValue<Props, "style">>
    className: MergedClassName<
      | Extract<Generated["className"], ClassName>
      | Extract<PropValue<Props, "className">, ClassName>
    >
  }
export function mergeStyleProps(
  generated: { style?: CSSProperties; className?: ClassName },
  props: StyleProps,
) {
  const { style, className } = props
  const generatedClassName = generated.className
  return {
    ...generated,
    ...props,
    className:
      typeof generatedClassName === "function" ||
      typeof className === "function"
        ? function mergedClassName(state: never) {
            return clsx(
              typeof generatedClassName === "function"
                ? generatedClassName(state)
                : generatedClassName,
              typeof className === "function" ? className(state) : className,
            )
          }
        : clsx(generatedClassName, className),
    style:
      typeof style === "function"
        ? function mergedStyle(state: never) {
            return { ...generated.style, ...style(state) }
          }
        : { ...generated.style, ...style },
  }
}

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
