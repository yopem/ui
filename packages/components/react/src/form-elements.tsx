"use client"

import * as React from "react"
import {
  createListCollection,
  type DatePickerValueChangeDetails,
  type ListCollection,
} from "@ark-ui/react"
import { Icon } from "@yopem-ui/react-icons"
import { cn } from "@yopem-ui/utils"

import { Checkbox } from "./checkbox"
import { DatePicker } from "./date-picker"
import { useFieldContext } from "./form"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemGroup,
  SelectLabel,
  SelectTrigger,
  SelectValueText,
} from "./select"

export interface BaseFieldProps extends React.ComponentProps<"input"> {
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

export interface RadioGroupFieldProps {
  label?: string
  options: {
    label: string
    value: string
    disabled?: boolean
  }[]
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
        <RadioGroupItem
          id={option.value}
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </RadioGroupItem>
      ))}
    </RadioGroup>
  )
}

export interface PinInputFieldProps {
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

export interface TextareaFieldProps extends React.ComponentProps<"textarea"> {
  label?: string
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

export interface SelectFieldProps {
  label?: string
  placeholder?: string
  options: {
    label: string
    value: string
    disabled?: boolean
  }[]
}

export const SelectField = ({
  label,
  placeholder = "Select...",
  options,
}: SelectFieldProps) => {
  const field = useFieldContext<string>()

  const collection: ListCollection = createListCollection({
    items: options,
  })

  return (
    <Select
      value={[field.state.value]}
      collection={collection}
      onValueChange={(e) => {
        field.handleChange(e.value[0])
      }}
    >
      {label && <SelectLabel>{label}</SelectLabel>}

      <div className="w-full">
        <SelectTrigger className="w-full">
          <SelectValueText placeholder={placeholder} />
        </SelectTrigger>
      </div>

      <SelectContent className="w-full">
        <SelectItemGroup>
          {collection.items.map((item) => (
            <SelectItem key={item.value} item={item}>
              {item.label}
            </SelectItem>
          ))}
        </SelectItemGroup>
      </SelectContent>
    </Select>
  )
}

type FileCategory = "image" | "document" | "any"

const ACCEPTS: Record<FileCategory, string> = {
  image: "image/*",
  document:
    "application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  any: "*/*",
}

export interface FileUploadDropzoneFieldProps {
  label?: string
  description?: string
  category?: FileCategory
  maxSizeMb?: number
  multiple?: boolean
}

export const FileUploadDropzoneField = ({
  label,
  description,
  category = "any",
  maxSizeMb = 2,
  multiple = false,
}: FileUploadDropzoneFieldProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const field = useFieldContext<File[]>()

  const handleFiles = (files: FileList | null) => {
    if (!files) return

    const validFiles = Array.from(files).filter(
      (file) => file.size <= maxSizeMb * 1024 * 1024,
    )
    // Fix Later: handle upload
    const newFiles = multiple
      ? [...field.state.value, ...validFiles]
      : validFiles.slice(0, 1)

    field.handleChange(newFiles)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const handleClick = () => inputRef.current?.click()

  const removeFile = (index: number) => {
    const updated = [...field.state.value]
    updated.splice(index, 1)
    field.handleChange(updated)
  }

  const selectedFiles = field.state.value

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          "flex h-32 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 text-center text-sm text-gray-500 transition hover:bg-gray-100",
        )}
      >
        Drop files here or click to browse
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTS[category]}
          multiple={multiple}
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {description && (
        <p className="text-muted-foreground text-xs">{description}</p>
      )}

      {selectedFiles.length > 0 && (
        <ul className="mt-2 space-y-2">
          {selectedFiles.map((file, idx) => (
            <li
              key={idx}
              className="bg-muted flex items-center justify-between rounded p-2"
            >
              <div className="truncate text-sm">{file.name}</div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="text-destructive hover:text-destructive/70"
              >
                <Icon name="Trash" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const DatePickerField = ({ label }: { label?: string }) => {
  const field = useFieldContext<string | null>()
  const handleOnValueChange = (e: DatePickerValueChangeDetails) => {
    field.handleChange(e.valueAsString[0])
  }

  return <DatePicker label={label} handleOnValueChange={handleOnValueChange} />
}
