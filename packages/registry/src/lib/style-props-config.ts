export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const

export const selectors = {
  _hover:
    ":is(:hover, [data-hover]):not(:disabled, [disabled], [aria-disabled=true], [data-disabled])",
  _active:
    ":is(:active, [data-active]):not(:disabled, [disabled], [aria-disabled=true], [data-disabled])",
  _focus: ":is(:focus, [data-focus])",
  _focusVisible: ":is(:focus-visible, [data-focus-visible])",
  _focusWithin: ":focus-within",
  _disabled:
    ":is(:disabled, [disabled], [aria-disabled=true], [data-disabled])",
  _enabled:
    ":not(:disabled, [disabled], [aria-disabled=true], [data-disabled])",
  _checked: ":is(:checked, [aria-checked=true], [data-checked])",
  _indeterminate:
    ":is(:indeterminate, [aria-checked=mixed], [data-indeterminate])",
  _invalid: ":is([aria-invalid=true], [data-invalid])",
  _required: ":is(:required, [aria-required=true])",
  _readOnly: ":is([readonly], [aria-readonly=true])",
  _expanded: ":is([aria-expanded=true], [data-expanded])",
  _selected: ":is([aria-selected=true], [data-selected])",
  _pressed: ":is([aria-pressed=true], [data-pressed])",
  _open: ":is([open], [data-open], [data-state=open])",
  _closed: ":is([data-closed], [data-state=closed])",
  _loading: ":is([aria-busy=true], [data-loading])",
  _first: ":first-child",
  _last: ":last-child",
  _only: ":only-child",
  _odd: ":nth-child(odd)",
  _even: ":nth-child(even)",
  _empty: ":empty",
  _placeholderShown: ":placeholder-shown",
  _autofill: ":autofill",
  _dark: ":where([data-theme=dark], [data-theme=dark] *)",
  _light: ":where([data-theme=light], [data-theme=light] *)",
  _rtl: ":dir(rtl)",
  _ltr: ":dir(ltr)",
} as const

export const mediaConditions = {
  _moreContrast: "@media (prefers-contrast: more)",
  _lessContrast: "@media (prefers-contrast: less)",
  _motionReduce: "@media (prefers-reduced-motion: reduce)",
  _motionSafe: "@media (prefers-reduced-motion: no-preference)",
  _portrait: "@media (orientation: portrait)",
  _landscape: "@media (orientation: landscape)",
  _print: "@media print",
  _osDark: "@media (prefers-color-scheme: dark)",
  _osLight: "@media (prefers-color-scheme: light)",
} as const

export const scopes = {
  _before: "::before",
  _after: "::after",
  _placeholder: "::placeholder",
  _selection: "::selection",
  _marker: "::marker",
  _firstLetter: "::first-letter",
  _firstLine: "::first-line",
  _file: "::file-selector-button",
} as const

export const aliases = {
  bg: ["background"],
  bgColor: ["backgroundColor"],
  bgImage: ["backgroundImage"],
  bgGradient: ["backgroundImage"],
  bgSize: ["backgroundSize"],
  bgPos: ["backgroundPosition"],
  bgPosition: ["backgroundPosition"],
  bgRepeat: ["backgroundRepeat"],
  bgAttachment: ["backgroundAttachment"],
  bgClip: ["backgroundClip"],
  w: ["width"],
  h: ["height"],
  minW: ["minWidth"],
  maxW: ["maxWidth"],
  minH: ["minHeight"],
  maxH: ["maxHeight"],
  boxSize: ["width", "height"],
  p: ["padding"],
  px: ["paddingInline"],
  py: ["paddingBlock"],
  pt: ["paddingTop"],
  pr: ["paddingRight"],
  pb: ["paddingBottom"],
  pl: ["paddingLeft"],
  ps: ["paddingInlineStart"],
  pe: ["paddingInlineEnd"],
  paddingX: ["paddingInline"],
  paddingY: ["paddingBlock"],
  paddingStart: ["paddingInlineStart"],
  paddingEnd: ["paddingInlineEnd"],
  m: ["margin"],
  mx: ["marginInline"],
  my: ["marginBlock"],
  mt: ["marginTop"],
  mr: ["marginRight"],
  mb: ["marginBottom"],
  ml: ["marginLeft"],
  ms: ["marginInlineStart"],
  me: ["marginInlineEnd"],
  marginX: ["marginInline"],
  marginY: ["marginBlock"],
  marginStart: ["marginInlineStart"],
  marginEnd: ["marginInlineEnd"],
  pos: ["position"],
  insetX: ["insetInline"],
  insetY: ["insetBlock"],
  start: ["insetInlineStart"],
  end: ["insetInlineEnd"],
  insetStart: ["insetInlineStart"],
  insetEnd: ["insetInlineEnd"],
  flexDir: ["flexDirection"],
  rounded: ["borderRadius"],
  roundedTop: ["borderTopLeftRadius", "borderTopRightRadius"],
  roundedBottom: ["borderBottomLeftRadius", "borderBottomRightRadius"],
  roundedLeft: ["borderTopLeftRadius", "borderBottomLeftRadius"],
  roundedRight: ["borderTopRightRadius", "borderBottomRightRadius"],
  roundedStart: ["borderStartStartRadius", "borderEndStartRadius"],
  roundedEnd: ["borderStartEndRadius", "borderEndEndRadius"],
  roundedTopLeft: ["borderTopLeftRadius"],
  roundedTopRight: ["borderTopRightRadius"],
  roundedBottomLeft: ["borderBottomLeftRadius"],
  roundedBottomRight: ["borderBottomRightRadius"],
  borderX: ["borderInline"],
  borderY: ["borderBlock"],
  borderXWidth: ["borderInlineWidth"],
  borderYWidth: ["borderBlockWidth"],
  borderXColor: ["borderInlineColor"],
  borderYColor: ["borderBlockColor"],
  borderXStyle: ["borderInlineStyle"],
  borderYStyle: ["borderBlockStyle"],
  roundedSS: ["borderStartStartRadius"],
  roundedSE: ["borderStartEndRadius"],
  roundedES: ["borderEndStartRadius"],
  roundedEE: ["borderEndEndRadius"],
  borderStart: ["borderInlineStart"],
  borderEnd: ["borderInlineEnd"],
  borderStartWidth: ["borderInlineStartWidth"],
  borderEndWidth: ["borderInlineEndWidth"],
  borderStartColor: ["borderInlineStartColor"],
  borderEndColor: ["borderInlineEndColor"],
  borderStartStyle: ["borderInlineStartStyle"],
  borderEndStyle: ["borderInlineEndStyle"],
  shadow: ["boxShadow"],
  textDecor: ["textDecoration"],
  listStylePos: ["listStylePosition"],
  listStyleImg: ["listStyleImage"],
} as const

export type Breakpoint = keyof typeof breakpoints
export type ResponsiveCondition =
  | "base"
  | Breakpoint
  | `${Breakpoint}Only`
  | `${Breakpoint}Down`
  | `${Breakpoint}To${Capitalize<Breakpoint>}`
export type Condition =
  | ResponsiveCondition
  | keyof typeof selectors
  | keyof typeof mediaConditions
  | keyof typeof scopes

export function getConditions() {
  const conditions: Record<string, string> = {
    ...selectors,
    ...mediaConditions,
  }
  const entries = Object.entries(breakpoints)
  for (const [index, [name, minimum]] of entries.entries()) {
    const next = entries[index + 1]?.[1]
    conditions[name] = `@media (min-width: ${minimum}px)`
    conditions[`${name}Down`] = `@media (max-width: ${minimum - 0.02}px)`
    conditions[`${name}Only`] = next
      ? `@media (min-width: ${minimum}px) and (max-width: ${next - 0.02}px)`
      : conditions[name]!
    for (const [endIndex, [end]] of entries.entries()) {
      if (endIndex < index) continue
      const after = entries[endIndex + 1]?.[1]
      const range = `${name}To${end[0]!.toUpperCase()}${end.slice(1)}`
      conditions[range] = after
        ? `@media (min-width: ${minimum}px) and (max-width: ${after - 0.02}px)`
        : conditions[name]!
    }
  }
  return conditions
}
