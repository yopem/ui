import type { CSSProperties } from "react"

import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

import type { Condition } from "./style-props-config"
import type { StyleXProps, StyleXStyle } from "./stylex"

import {
  aliases,
  breakpoints,
  getConditions,
  scopes,
} from "./style-props-config"
import {
  conditionStyles,
  propertyStyles,
  scopedPropertyStyles,
  variableStyles,
} from "./style-props-styles"

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

export type StyleComponentProps<
  Props,
  Own extends object = object,
> = DistributiveOmit<Props, keyof StyleProps | keyof Own | keyof StyleXProps> &
  Omit<StyleProps, keyof Own> &
  StyleXProps &
  Own

interface Declaration {
  property: string
  value: string | number
  conditions: string[]
  scope: string
}

const conditions = getConditions()
const responsiveOrder = ["base", ...Object.keys(breakpoints)]
const spacing =
  /^(padding|margin|inset|gap$|rowGap$|columnGap$|space[XY]$|width$|height$|minWidth$|maxWidth$|minHeight$|maxHeight$|inlineSize$|blockSize$|minInlineSize$|maxInlineSize$|minBlockSize$|maxBlockSize$|top$|right$|bottom$|left$|flexBasis$|textIndent$|scrollMargin|scrollPadding)/
const negativeSpacing =
  /^(margin|inset|space[XY]$|top$|right$|bottom$|left$|textIndent$|scrollMargin)/

function hasKey<ObjectType extends object>(
  object: ObjectType,
  key: PropertyKey,
): key is keyof ObjectType {
  return Object.hasOwn(object, key)
}

export function isStyleProp(name: string) {
  return (
    name === "css" ||
    name === "base" ||
    hasKey(propertyStyles, name) ||
    hasKey(aliases, name) ||
    Object.hasOwn(conditions, name) ||
    hasKey(scopes, name) ||
    name.startsWith("_") ||
    /^(sm|md|lg|xl|2xl)(Only|Down|To)/.test(name) ||
    name.startsWith("--")
  )
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function isCompiledStyle(value: unknown): value is stylex.CompiledStyles {
  return (
    isObject(value) &&
    value.$$css === true &&
    Object.entries(value).every(
      ([key, entry]) =>
        key === "$$css" || entry === null || typeof entry === "string",
    )
  )
}

function isStyleXStyle(
  value: unknown,
  ancestors = new Set<unknown>(),
): value is StyleXStyle {
  if (value == null || typeof value === "boolean") return true
  if (isCompiledStyle(value)) return true
  if (!Array.isArray(value)) return false
  const inline = value.at(-1)
  if (
    value.length >= 2 &&
    value.slice(0, -1).every(isCompiledStyle) &&
    isObject(inline) &&
    Object.values(inline).every(
      (entry) => typeof entry === "string" || typeof entry === "number",
    )
  )
    return true
  if (ancestors.has(value)) return false
  ancestors.add(value)
  const valid = value.every((entry: unknown) => isStyleXStyle(entry, ancestors))
  ancestors.delete(value)
  return valid
}

function normalizeValue(property: string, value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new TypeError(`Style prop ${property} must be a string or number`)
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new TypeError(`Style prop ${property} must be finite`)
  }
  if (typeof value === "number" && spacing.test(property)) {
    if (value < 0 && !negativeSpacing.test(property)) {
      throw new RangeError(
        `Style prop ${property} does not accept negative spacing`,
      )
    }
    return `calc(${tokens["--spacing"]} * ${value})`
  }
  if (typeof value === "number" && hasKey(propertyStyles, property)) {
    const generated = stylex.props(propertyStyles[property](value)).style
    const normalized = Object.values(generated ?? {})[0]
    if (typeof normalized === "string" || typeof normalized === "number")
      return normalized
  }
  return value
}

export function normalizeStyleProps(input: unknown) {
  const declarations: Declaration[] = []
  const ancestors = new Set<object>()
  function guard(value: object, visit: () => void) {
    if (ancestors.has(value)) throw new TypeError("Cyclic style props")
    ancestors.add(value)
    try {
      visit()
    } finally {
      ancestors.delete(value)
    }
  }
  function condition(
    name: string,
    path: string[],
    scope: string,
    visit: (next: string[], nextScope: string) => void,
  ) {
    if (name === "base") {
      visit(path, scope)
      return
    }
    if (hasKey(scopes, name)) {
      if (scope) throw new TypeError("Pseudo-elements cannot be nested")
      visit(path, name)
      return
    }
    if (!hasKey(conditions, name))
      throw new TypeError(`Unknown style condition: ${name}`)
    visit([...new Set([...path, name])].sort(), scope)
  }
  function property(
    name: string,
    value: unknown,
    path: string[],
    scope: string,
  ) {
    if (value == null) return
    if (Array.isArray(value)) {
      if (value.length > responsiveOrder.length)
        throw new RangeError("Too many responsive array entries")
      guard(value, () =>
        value.forEach((entry: unknown, index) => {
          if (entry == null) return
          condition(responsiveOrder[index]!, path, scope, (next, nextScope) =>
            property(name, entry, next, nextScope),
          )
        }),
      )
      return
    }
    if (isObject(value)) {
      guard(value, () => {
        for (const [key, entry] of Object.entries(value)) {
          condition(key, path, scope, (next, nextScope) =>
            property(name, entry, next, nextScope),
          )
        }
      })
      return
    }
    const names = hasKey(aliases, name) ? aliases[name] : [name]
    for (const canonical of names) {
      declarations.push({
        property: canonical,
        value: normalizeValue(canonical, value),
        conditions: path,
        scope,
      })
    }
  }
  function object(value: unknown, path: string[], scope: string) {
    if (value == null) return
    if (!isObject(value)) throw new TypeError("Style objects must be objects")
    guard(value, () => {
      if (hasKey(value, "css")) {
        if (!isStyleXStyle(value.css)) object(value.css, path, scope)
        else if (value !== input)
          throw new TypeError("Compiled css must be a top-level style prop")
      }
      for (const [name, entry] of Object.entries(value)) {
        if (name === "css" || entry == null) continue
        if (
          name === "base" ||
          Object.hasOwn(conditions, name) ||
          hasKey(scopes, name)
        ) {
          condition(name, path, scope, (next, nextScope) =>
            object(entry, next, nextScope),
          )
        } else if (name.startsWith("_")) {
          throw new TypeError(`Unknown style condition: ${name}`)
        } else if (isStyleProp(name)) {
          property(name, entry, path, scope)
        } else {
          throw new TypeError(`Unknown style property: ${name}`)
        }
      }
    })
  }
  object(input, [], "")
  return declarations
}

function priority(path: string[]) {
  return path.reduce((total, name) => {
    const index = Object.keys(conditions).indexOf(name)
    return total + (name.startsWith("_") ? 1000 : 100) + index
  }, path.length * 10000)
}

export function resolveStyleProps(input: unknown): StyleXStyle {
  const declarations = normalizeStyleProps(input)
  const groups = new Map<string, Declaration[]>()
  for (const declaration of declarations) {
    const key = `${declaration.scope}_${declaration.property}`
    const group = groups.get(key) ?? []
    const previous = group.findIndex(
      (entry) => entry.conditions.join() === declaration.conditions.join(),
    )
    if (previous !== -1) group.splice(previous, 1)
    group.push(declaration)
    groups.set(key, group)
  }
  const result: StyleXStyle[] =
    isObject(input) && isStyleXStyle(input.css) ? [input.css] : []
  const gates = new Set<string>()
  const variables: Record<string, string | number> = {}
  for (const [key, group] of groups) {
    group.sort(
      (left, right) => priority(left.conditions) - priority(right.conditions),
    )
    // Missing base values reset the property; compiled StyleX defaults are opaque.
    let fallback: string | number = "unset"
    for (const [index, declaration] of group.entries()) {
      if (declaration.conditions.length === 0) {
        fallback = declaration.value
        continue
      }
      const variable = `--ysp-value-${key}-${index}`
      const guards = declaration.conditions.map((name) => {
        gates.add(name)
        return `var(--ysp-${name})`
      })
      variables[variable] = `${guards.join(" ")} ${declaration.value}`
      fallback = `var(${variable}, ${fallback})`
    }
    const { property, scope } = group[0]!
    if (property.startsWith("--")) {
      if (scope)
        throw new TypeError(
          "Custom properties on pseudo-elements are not supported",
        )
      variables[property] = fallback
    } else if (scope) {
      const scopedStyle = scopedPropertyStyles[key]
      if (!scopedStyle)
        throw new TypeError(`Unsupported scoped property: ${property}`)
      variables[`--ysp-${scope}-${property}`] = fallback
      result.push(scopedStyle)
    } else if (hasKey(propertyStyles, property)) {
      result.push(propertyStyles[property](fallback))
    } else {
      throw new TypeError(`Unsupported style property: ${property}`)
    }
  }
  for (const gate of gates) {
    if (hasKey(conditionStyles, gate)) result.push(conditionStyles[gate])
  }
  if (Object.keys(variables).length) {
    const carrier = variableStyles.carrier(" ")
    result.push([carrier[0], { ...carrier[1], ...variables }])
  }
  return result
}

export function splitStyleProps<Props extends object>(props: Props) {
  const entries = Object.entries(props)
  const domProps = Object.fromEntries(
    entries.filter(([name]) => !isStyleProp(name)),
  )
  const styleProps = Object.fromEntries(
    entries.filter(([name]) => isStyleProp(name)),
  )
  return {
    domProps: domProps as DistributiveOmit<Props, keyof StyleProps>,
    xstyle: resolveStyleProps(styleProps),
  }
}
