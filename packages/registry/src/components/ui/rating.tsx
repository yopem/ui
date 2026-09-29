"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"

import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { StarIcon } from "lucide-react"
import { useState } from "react"

const styles = stylex.create({
  root: { display: "flex", gap: "0.125rem" },
  item: {
    alignItems: "center",
    appearance: "none",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: tokens["--radius-sm"],
    color: tokens["--muted-foreground"],
    cursor: { default: "pointer", "[data-disabled]": "not-allowed" },
    display: "inline-flex",
    justifyContent: "center",
    minBlockSize: "2.5rem",
    minInlineSize: "2.5rem",
    opacity: { default: 1, "[data-disabled]": 0.64 },
    outline: "none",
    padding: 0,
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  star: {
    blockSize: "1.25rem",
    fill: "none",
    inlineSize: "1.25rem",
    strokeWidth: 1.5,
  },
  starFilled: {
    color: tokens["--primary"],
    fill: "currentColor",
  },
})

export type RatingProps = StyleXComponentProps<
  Omit<
    RadioGroupPrimitive.Props<string>,
    "children" | "defaultValue" | "onValueChange" | "value"
  >,
  {
    defaultValue?: number
    max?: number
    onValueChange?: (value: number) => void
    value?: number
  }
>

export function Rating({
  xstyle: consumerXstyle,
  className,
  defaultValue,
  max = 5,
  onValueChange,
  value,
  "aria-label": ariaLabel = "Rating",
  ...props
}: RatingProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? 0)
  const currentValue = value ?? uncontrolledValue
  const ratingCount = Number.isFinite(max) ? Math.max(1, Math.floor(max)) : 5

  function handleValueChange(nextValue: string) {
    const nextRating = Number(nextValue)

    if (value === undefined) setUncontrolledValue(nextRating)
    onValueChange?.(nextRating)
  }

  return (
    <RadioGroupPrimitive<string>
      aria-label={ariaLabel}
      data-slot="rating"
      onValueChange={handleValueChange}
      value={currentValue ? String(currentValue) : ""}
      {...mergeStylexProps(
        stylexProps(className, styles.root, consumerXstyle),
        props,
      )}
    >
      {Array.from({ length: ratingCount }, (_, index) => {
        const rating = index + 1

        return (
          <RadioPrimitive.Root
            aria-label={`${rating} ${rating === 1 ? "star" : "stars"}`}
            data-slot="rating-item"
            key={rating}
            value={String(rating)}
            {...stylex.props(styles.item)}
          >
            <StarIcon
              aria-hidden="true"
              {...stylex.props(
                styles.star,
                rating <= currentValue && styles.starFilled,
              )}
            />
          </RadioPrimitive.Root>
        )
      })}
    </RadioGroupPrimitive>
  )
}
