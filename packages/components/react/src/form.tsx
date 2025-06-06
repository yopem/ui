"use client"

import type { InputHTMLAttributes } from "react"
import { createFormHook, createFormHookContexts } from "@tanstack/react-form"
import { cn } from "@yopem-ui/utils"

import { Checkbox } from "./checkbox"
import { Input } from "./input"
import {
  PinInput,
  PinInputControl,
  PinInputGroup,
  PinInputHiddenInput,
  PinInputInput,
  PinInputLabel,
} from "./pin-input"
import { RadioGroup, RadioGroupItem, RadioGroupLabel } from "./radio-group"

export const { fieldContext, formContext, useFieldContext } =
  createFormHookContexts()

export const FormItem = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-2", className)} {...props} />
)

export const FormLabel = ({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => {
  const field = useFieldContext()
  return (
    <label
      htmlFor={field.name}
      className={cn("block text-sm font-semibold", className)}
      {...props}
    />
  )
}

export const FormControl = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("form-control", className)} {...props}>
    {children}
  </div>
)

export const FormMessage = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => {
  const field = useFieldContext()
  const { meta } = field.state
  const shouldShowError = meta.isTouched || meta.isDirty
  const rawError = Array.isArray(meta.errors) ? meta.errors[0] : undefined

  const errorMessage =
    typeof rawError === "string"
      ? rawError
      : typeof rawError === "object" && rawError?.message
        ? rawError.message
        : undefined

  if (!shouldShowError || !errorMessage) return null

  return (
    <p className={cn("text-destructive text-sm", className)} {...props}>
      {errorMessage}
    </p>
  )
}

export const FormDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-muted-foreground text-sm", className)} {...props} />
)

interface BaseFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  type?: string
}

export const BaseField = ({
  label,
  type = "text",
  ...props
}: BaseFieldProps) => {
  const field = useFieldContext<string>()
  return (
    <label>
      <div className="mb-1 font-medium">{label}</div>
      <Input
        type={type}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        {...props}
      />
    </label>
  )
}

export const CheckboxField = ({ label }: { label: string }) => {
  const field = useFieldContext<boolean>()

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        name={field.name}
        checked={field.state.value}
        onChange={(e) =>
          field.handleChange((e.target as HTMLInputElement).checked)
        }
      />
      <label
        htmlFor={field.name}
        className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>
    </div>
  )
}

interface RadioGroupFieldProps {
  label?: string
  options: string[]
}

export const RadioGroupField = ({ label, options }: RadioGroupFieldProps) => {
  const field = useFieldContext<string>()

  return (
    <RadioGroup
      value={field.state.value}
      onValueChange={(e) => field.handleChange(e.value ?? "")}
    >
      {label && <RadioGroupLabel>{label}</RadioGroupLabel>}
      {options.map((option) => (
        <RadioGroupItem id={option} key={option} value={option}>
          {option}
        </RadioGroupItem>
      ))}
    </RadioGroup>
  )
}

interface PinInputFieldProps {
  label?: string
  length?: number
}

export const PinInputField = ({ label, length = 6 }: PinInputFieldProps) => {
  const field = useFieldContext<string[]>()
  const safeValue = Array.isArray(field.state.value)
    ? field.state.value.slice(0, length)
    : Array(length).fill("")

  return (
    <PinInput
      value={safeValue}
      onValueChange={(e) => field.handleChange(e.value)}
    >
      <PinInputGroup>
        {label && <PinInputLabel>{label}</PinInputLabel>}
        <PinInputControl>
          {Array.from({ length }).map((_, index) => (
            <PinInputInput key={index} index={index} />
          ))}
        </PinInputControl>
        <PinInputHiddenInput />
      </PinInputGroup>
    </PinInput>
  )
}

interface TextareaFieldProps {
  label?: string
  placeholder?: string
  rows?: number
  className?: string
}

interface TextareaFieldProps {
  label?: string
  placeholder?: string
  rows?: number
  className?: string
}

export const TextareaField = ({
  label,
  placeholder,
  rows = 4,
  className,
}: TextareaFieldProps) => {
  const field = useFieldContext<string>()

  return (
    <div className="grid gap-1.5">
      {label && <label className="text-sm font-medium">{label}</label>}
      <textarea
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        data-slot="textarea"
        aria-invalid={
          Array.isArray(field.state.meta.errors) &&
          field.state.meta.errors.length > 0
            ? "true"
            : "false"
        }
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
      />
    </div>
  )
}

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    BaseField,
    RadioGroupField,
    PinInputField,
    TextareaField,
    CheckboxField,
  },
  formComponents: {
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
    FormControl,
  },
})
