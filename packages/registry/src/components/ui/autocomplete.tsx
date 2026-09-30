"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"

import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete"
import { Input } from "@registry/components/ui/input"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import {
  isCallback,
  isString,
  mergeStylexProps,
  stylexProps,
} from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { ChevronsUpDownIcon, XIcon } from "lucide-react"
import * as React from "react"

export const autocompleteSlotStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
  },
})

const styles = stylex.create({
  inputPadding: {
    paddingInlineStart: {
      default: null,
      ':is([data-slot="autocomplete-input-group"][data-has-start-addon] input)':
        "calc(2.125rem - 1px)",
    },
    paddingInlineEnd: {
      default: null,
      ':is([data-slot="autocomplete-input-group"]:has([data-slot$="trigger"], [data-slot$="clear"]) input)':
        "1.75rem",
      ':is([data-slot="autocomplete-input-group"][data-size="sm"]:has([data-slot$="trigger"], [data-slot$="clear"]) input)':
        "1.625rem",
    },
  },
  trigger: {
    display: {
      default: null,
      ':has(+ [data-slot$="clear"])': "none",
    },
  },
  group: {
    marginBlockStart: {
      default: null,
      ':is(:where([data-slot="autocomplete-group"], [data-slot="combobox-group"]) + *)':
        "0.375rem",
    },
  },
  inputGroup: {
    opacity: {
      default: null,
      ":has(:disabled)": 0.64,
    },
    color: tokens["--foreground"],
    inlineSize: "100%",
    position: "relative",
  },
  addon: {
    alignItems: "center",
    display: "flex",
    insetBlock: 0,
    insetInlineStart: 1,
    opacity: 0.8,
    paddingInlineStart: "calc(0.75rem - 1px)",
    pointerEvents: "none",
    position: "absolute",
    zIndex: 10,
  },
  control: {
    alignItems: "center",
    blockSize: { default: "2rem", "@media (min-width: 640px)": "1.75rem" },
    borderColor: "transparent",
    borderRadius: tokens["--radius-md"],
    borderStyle: "solid",
    borderWidth: 1,
    cursor: "pointer",
    display: "inline-flex",
    inlineSize: { default: "2rem", "@media (min-width: 640px)": "1.75rem" },
    insetBlockStart: "50%",
    justifyContent: "center",
    opacity: 0.8,
    outline: "none",
    position: "absolute",
    transform: "translateY(-50%)",
    transitionProperty: "color, background-color, box-shadow, opacity",
    ":hover": { opacity: 1 },
    "::after": {
      content: { default: null, "@media (pointer: coarse)": '""' },
      minBlockSize: { default: null, "@media (pointer: coarse)": "2.75rem" },
      minInlineSize: { default: null, "@media (pointer: coarse)": "2.75rem" },
      position: { default: null, "@media (pointer: coarse)": "absolute" },
    },
  },
  controlDefault: { insetInlineEnd: "0.125rem" },
  controlSmall: { insetInlineEnd: 0 },
  positioner: { userSelect: "none", zIndex: 50 },
  surface: {
    backgroundClip: "padding-box",
    backgroundColor: tokens["--popover"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-lg"],
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 10px 15px -3px color-mix(in oklab, #000 5%, transparent)",
    display: "flex",
    maxBlockSize: "100%",
    maxInlineSize: "var(--available-width)",
    minInlineSize: "var(--anchor-width)",
    position: "relative",
    transformOrigin: "var(--transform-origin)",
    transitionProperty: "scale, opacity",
    "::before": {
      borderRadius: "calc(var(--radius-lg, 0.625rem) - 1px)",
      boxShadow: {
        default: "0 1px rgb(0 0 0 / 0.04)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "0 -1px rgb(255 255 255 / 0.06)",
      },
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
  },
  popup: {
    color: tokens["--foreground"],
    display: "flex",
    flex: 1,
    flexDirection: "column",
    maxBlockSize: "min(var(--available-height), 23rem)",
  },
  item: {
    alignItems: "center",
    borderRadius: tokens["--radius-sm"],
    cursor: "default",
    display: "flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    minBlockSize: { default: "2rem", "@media (min-width: 640px)": "1.75rem" },
    outline: "none",
    paddingBlock: "0.25rem",
    paddingInline: "0.5rem",
    userSelect: "none",
    "[data-highlighted]": {
      backgroundColor: tokens["--accent"],
      color: tokens["--accent-foreground"],
    },
    "[data-disabled]": { opacity: 0.64, pointerEvents: "none" },
  },
  separator: {
    backgroundColor: tokens["--border"],
    blockSize: 1,
    marginBlock: "0.25rem",
    marginInline: "0.5rem",
    ":last-child": { display: "none" },
  },
  groupLabel: {
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    fontWeight: 500,
    paddingBlock: "0.375rem",
    paddingInline: "0.5rem",
  },
  empty: {
    color: tokens["--muted-foreground"],
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    textAlign: "center",
    ":not(:empty)": { padding: "0.5rem" },
  },
  list: {
    "[data-has-overflow-y]": { paddingInlineEnd: "0.75rem" },
    ":not(:empty)": { padding: "0.25rem", scrollPaddingBlock: "0.25rem" },
  },
  status: {
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    fontWeight: 500,
    paddingBlock: "0.5rem",
    paddingInline: "0.75rem",
    ":empty": { margin: 0, padding: 0 },
  },
})

export const Autocomplete: typeof AutocompletePrimitive.Root =
  AutocompletePrimitive.Root

type AutocompleteInputProps = StyleXComponentProps<
  Omit<AutocompletePrimitive.Input.Props, "ref" | "size">,
  {
    showTrigger?: boolean
    showClear?: boolean
    startAddon?: React.ReactNode
    size?: "sm" | "default" | "lg" | number
    triggerProps?: AutocompletePrimitive.Trigger.Props
    clearProps?: AutocompletePrimitive.Clear.Props
  }
>

export const AutocompleteInput = React.forwardRef<
  HTMLInputElement,
  AutocompleteInputProps
>(function AutocompleteInput(
  {
    xstyle: consumerXstyle,
    className,
    showTrigger = false,
    showClear = false,
    startAddon,
    size,
    triggerProps,
    clearProps,
    ...restProps
  },
  ref,
) {
  const props = restProps
  const xstyle = consumerXstyle

  const sizeValue = size ?? "default"

  return (
    <AutocompletePrimitive.InputGroup
      {...stylex.props(styles.inputGroup)}
      data-has-start-addon={startAddon ? "" : undefined}
      data-size={isString(sizeValue) ? sizeValue : undefined}
      data-slot="autocomplete-input-group"
    >
      {startAddon ? (
        <div
          aria-hidden="true"
          {...stylex.props(styles.addon)}
          data-slot="autocomplete-start-addon"
        >
          {startAddon}
        </div>
      ) : null}
      <AutocompletePrimitive.Input
        className={className}
        data-slot="autocomplete-input"
        ref={ref}
        render={
          <Input
            nativeInput
            size={sizeValue}
            xstyle={[styles.inputPadding, xstyle]}
          />
        }
        {...props}
      />
      {showTrigger ? (
        <AutocompleteTrigger
          {...stylex.props(
            styles.control,
            sizeValue === "sm" ? styles.controlSmall : styles.controlDefault,
          )}
          {...triggerProps}
        >
          <AutocompletePrimitive.Icon data-slot="autocomplete-icon">
            <ChevronsUpDownIcon
              {...stylex.props(autocompleteSlotStyles.icon)}
            />
          </AutocompletePrimitive.Icon>
        </AutocompleteTrigger>
      ) : null}
      {showClear ? (
        <AutocompleteClear
          {...stylex.props(
            styles.control,
            sizeValue === "sm" ? styles.controlSmall : styles.controlDefault,
          )}
          {...clearProps}
        >
          <XIcon {...stylex.props(autocompleteSlotStyles.icon)} />
        </AutocompleteClear>
      ) : null}
    </AutocompletePrimitive.InputGroup>
  )
})

export function AutocompletePopup({
  xstyle: consumerXstyle,
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  alignOffset,
  align = "start",
  anchor,
  portalProps,
  ...restProps
}: StyleXComponentProps<
  AutocompletePrimitive.Popup.Props,
  {
    align?: AutocompletePrimitive.Positioner.Props["align"]
    sideOffset?: AutocompletePrimitive.Positioner.Props["sideOffset"]
    alignOffset?: AutocompletePrimitive.Positioner.Props["alignOffset"]
    side?: AutocompletePrimitive.Positioner.Props["side"]
    anchor?: AutocompletePrimitive.Positioner.Props["anchor"]
    portalProps?: AutocompletePrimitive.Portal.Props
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AutocompletePrimitive.Portal {...portalProps}>
      <AutocompletePrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        {...stylex.props(styles.positioner)}
        data-slot="autocomplete-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <span
          {...stylexProps(
            isString(className) ? className : undefined,
            styles.surface,
          )}
        >
          <AutocompletePrimitive.Popup
            data-slot="autocomplete-popup"
            {...mergeStylexProps(
              stylexProps(
                isCallback(className) ? className : undefined,
                styles.popup,
                xstyle,
              ),
              props,
            )}
          >
            {children}
          </AutocompletePrimitive.Popup>
        </span>
      </AutocompletePrimitive.Positioner>
    </AutocompletePrimitive.Portal>
  )
}

export function AutocompleteItem({
  xstyle: consumerXstyle,
  className,
  children,
  ...restProps
}: StyleXComponentProps<AutocompletePrimitive.Item.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AutocompletePrimitive.Item
      data-slot="autocomplete-item"
      {...mergeStylexProps(stylexProps(className, styles.item, xstyle), props)}
    >
      {children}
    </AutocompletePrimitive.Item>
  )
}

export function AutocompleteSeparator({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<AutocompletePrimitive.Separator.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AutocompletePrimitive.Separator
      data-slot="autocomplete-separator"
      {...mergeStylexProps(
        stylexProps(className, styles.separator, xstyle),
        props,
      )}
    />
  )
}

export function AutocompleteGroup({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<AutocompletePrimitive.Group.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AutocompletePrimitive.Group
      data-slot="autocomplete-group"
      {...mergeStylexProps(stylexProps(className, styles.group, xstyle), props)}
    />
  )
}

export function AutocompleteGroupLabel({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<AutocompletePrimitive.GroupLabel.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AutocompletePrimitive.GroupLabel
      data-slot="autocomplete-group-label"
      {...mergeStylexProps(
        stylexProps(className, styles.groupLabel, xstyle),
        props,
      )}
    />
  )
}

export function AutocompleteEmpty({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<AutocompletePrimitive.Empty.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AutocompletePrimitive.Empty
      data-slot="autocomplete-empty"
      {...mergeStylexProps(stylexProps(className, styles.empty, xstyle), props)}
    />
  )
}

export function AutocompleteRow({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<AutocompletePrimitive.Row.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AutocompletePrimitive.Row
      data-slot="autocomplete-row"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export const AutocompleteValue: typeof AutocompletePrimitive.Value =
  AutocompletePrimitive.Value

export function AutocompleteList({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<AutocompletePrimitive.List.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ScrollArea overscrollContain scrollbarGutter scrollFade>
      <AutocompletePrimitive.List
        data-slot="autocomplete-list"
        {...mergeStylexProps(
          stylexProps(className, styles.list, xstyle),
          props,
        )}
      />
    </ScrollArea>
  )
}

export function AutocompleteClear({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<AutocompletePrimitive.Clear.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AutocompletePrimitive.Clear
      data-slot="autocomplete-clear"
      {...mergeStylexProps(
        stylexProps(className, styles.control, xstyle),
        props,
      )}
    >
      <XIcon {...stylex.props(autocompleteSlotStyles.icon)} />
    </AutocompletePrimitive.Clear>
  )
}

export function AutocompleteStatus({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<AutocompletePrimitive.Status.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AutocompletePrimitive.Status
      data-slot="autocomplete-status"
      {...mergeStylexProps(
        stylexProps(className, styles.status, xstyle),
        props,
      )}
    />
  )
}

export const AutocompleteCollection: typeof AutocompletePrimitive.Collection =
  AutocompletePrimitive.Collection

export function AutocompleteTrigger({
  xstyle: consumerXstyle,
  className,
  children,
  ...restProps
}: StyleXComponentProps<AutocompletePrimitive.Trigger.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AutocompletePrimitive.Trigger
      data-slot="autocomplete-trigger"
      {...mergeStylexProps(
        stylexProps(className, styles.trigger, xstyle),
        props,
      )}
    >
      {children}
    </AutocompletePrimitive.Trigger>
  )
}

export const useAutocompleteFilter: typeof AutocompletePrimitive.useFilter =
  AutocompletePrimitive.useFilter

export { AutocompletePrimitive }
