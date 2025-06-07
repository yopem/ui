"use client"

import { createFormHook, createFormHookContexts } from "@tanstack/react-form"
import { cn } from "@yopem-ui/utils"

import {
  BaseField,
  CheckboxField,
  DatePickerField,
  FileUploadDropzoneField,
  PinInputField,
  RadioGroupField,
  SelectField,
  TextareaField,
} from "./form-elements"

export const { fieldContext, formContext, useFieldContext } =
  createFormHookContexts()

export const FormItem = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div className={cn("space-y-2", className)} {...props} />
)

export const FormLabel = ({
  className,
  ...props
}: React.ComponentProps<"label">) => {
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
}: React.ComponentProps<"div">) => (
  <div className={cn("form-control", className)} {...props}>
    {children}
  </div>
)

export const FormMessage = ({
  className,
  ...props
}: React.ComponentProps<"p">) => {
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
}: React.ComponentProps<"p">) => (
  <p className={cn("text-muted-foreground text-sm", className)} {...props} />
)

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    BaseField,
    RadioGroupField,
    PinInputField,
    TextareaField,
    CheckboxField,
    SelectField,
    FileUploadDropzoneField,
    DatePickerField,
  },
  formComponents: {
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
    FormControl,
  },
})
