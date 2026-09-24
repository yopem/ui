import type { CSSProperties, ComponentPropsWithRef, ElementType } from "react"

import { createElement } from "react"

import type { Condition } from "./style-props-config"
import type { aliases, scopes } from "./style-props-config"
import type { StyleXProps, StyleXStyle } from "./stylex"

import { mergeStyleProps, stylexProps } from "./stylex"

export type ResponsiveValue<Value> =
  | Value
  | readonly (Value | null | undefined)[]
  | ConditionalValue<Value>

interface ConditionalValue<Value> extends Partial<
  Record<Exclude<Condition, keyof typeof scopes>, ResponsiveValue<Value>>
> {
  base?: ResponsiveValue<Value>
}

type CSSStyleProps = {
  [Key in keyof CSSProperties]?: ResponsiveValue<CSSProperties[Key]>
}
type AliasStyleProps = {
  [Key in keyof typeof aliases]?: ResponsiveValue<
    CSSProperties[Extract<(typeof aliases)[Key][number], keyof CSSProperties>]
  >
}

export interface StyleObject
  extends
    CSSStyleProps,
    AliasStyleProps,
    Partial<Record<Condition, StyleObject>>,
    Partial<Record<`--${string}`, ResponsiveValue<string | number>>> {
  spaceX?: ResponsiveValue<string | number>
  spaceY?: ResponsiveValue<string | number>
}

export type StyleProps = StyleObject & {
  /** Applied after defaults/variants, before direct style props and xstyle. */
  css?: StyleObject | StyleXStyle
}

type DistributiveOmit<Props, Keys extends PropertyKey> = {
  [Key in keyof Props as Key extends Keys ? never : Key]: Props[Key]
}

export function createStyleProps<Component extends ElementType>(
  Component: Component,
  _options?: {
    preserve?: readonly (keyof ComponentPropsWithRef<Component> & string)[]
  },
) {
  type Props = ComponentPropsWithRef<Component>
  type AdaptedProps = Props & Omit<StyleProps, keyof Props> & StyleXProps

  return function StyledComponent({
    xstyle,
    className,
    style,
    ...props
  }: AdaptedProps) {
    return createElement(
      Component,
      mergeStyleProps(stylexProps(className, xstyle), { ...props, style }),
    )
  }
}

export type StyleComponentProps<
  Props,
  Own extends object = object,
> = DistributiveOmit<Props, keyof StyleProps | keyof Own | keyof StyleXProps> &
  Omit<StyleProps, keyof Own> &
  StyleXProps &
  Own
