"use client"

import { createFormHook, createFormHookContexts } from "@tanstack/react-form"
import { cn } from "@yopem-ui/utils"

import { Input } from "./input"

export const { fieldContext, formContext, useFieldContext } =
  createFormHookContexts()
export function FormItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />
}

export function FormLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const field = useFieldContext()
  return (
    <label
      htmlFor={field.name}
      className={cn("block font-medium", className)}
      {...props}
    />
  )
}

export function FormControl({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("form-control", className)} {...props}>
      {children}
    </div>
  )
}

export function FormMessage({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
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
    <p className={cn("text-sm text-red-600", className)} {...props}>
      {errorMessage}
    </p>
  )
}

export function FormDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-muted-foreground text-sm", className)} {...props} />
  )
}

export function TextField({ label }: { label: string }) {
  const field = useFieldContext<string>()
  return (
    <label>
      <div className="mb-1 font-medium">{label}</div>
      <Input
        type="text"
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />
    </label>
  )
}
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    FormControl,
  },
  formComponents: {
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
  },
})
