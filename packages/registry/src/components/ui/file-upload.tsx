"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type {
  ChangeEvent,
  ComponentPropsWithRef,
  DragEvent,
  MouseEvent,
} from "react"

import { Button } from "@registry/components/ui/button"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { UploadIcon, XIcon } from "lucide-react"
import { useId, useRef, useState } from "react"

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: `calc(${tokens["--spacing"]} * 3)`,
    minInlineSize: 0,
    borderWidth: 0,
    padding: 0,
    margin: 0,
  },
  dropzone: {
    alignItems: "center",
    backgroundColor: tokens["--control-background"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius"],
    borderStyle: "dashed",
    borderWidth: 1,
    color: tokens["--foreground"],
    display: "flex",
    flexDirection: "column",
    gap: `calc(${tokens["--spacing"]} * 3)`,
    padding: `calc(${tokens["--spacing"]} * 6)`,
    textAlign: "center",
  },
  dragging: {
    backgroundColor: tokens["--accent"],
    borderColor: tokens["--ring"],
  },
  disabled: { opacity: 0.64 },
  input: { display: "none" },
  label: { fontSize: "0.875rem", fontWeight: 500 },
  hint: {
    color: tokens["--muted-foreground"],
    fontSize: "0.875rem",
    margin: 0,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: `calc(${tokens["--spacing"]} * 2)`,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  item: {
    alignItems: "center",
    display: "flex",
    gap: `calc(${tokens["--spacing"]} * 2)`,
    minInlineSize: 0,
  },
  filename: {
    flex: 1,
    fontSize: "0.875rem",
    minInlineSize: 0,
    overflowWrap: "anywhere",
  },
  status: { color: tokens["--muted-foreground"], fontSize: "0.875rem" },
  error: {
    color: tokens["--destructive-foreground"],
    fontSize: "0.875rem",
    margin: 0,
  },
})

export type FileUploadProps = StyleXComponentProps<
  ComponentPropsWithRef<"div">,
  {
    accept?: string
    defaultValue?: readonly File[]
    disabled?: boolean
    label?: string
    maxFiles?: number
    maxSize?: number
    multiple?: boolean
    onValueChange?: (files: File[]) => void
    value?: readonly File[]
  }
>

function fileIdentity(file: File) {
  return JSON.stringify([file.name, file.size, file.lastModified, file.type])
}

function countFilenames(files: readonly File[]) {
  const counts = new Map<string, number>()

  for (const file of files)
    counts.set(file.name, (counts.get(file.name) ?? 0) + 1)

  return counts
}

function removalLabel(file: File, index: number, counts: Map<string, number>) {
  const position =
    (counts.get(file.name) ?? 0) > 1 ? ` (file ${index + 1})` : ""

  return `Remove ${file.name}${position}`
}

function acceptsFile(file: File, accept: string) {
  const specifiers = accept
    .toLowerCase()
    .split(",")
    .map((specifier) => specifier.trim())
    .filter(Boolean)

  return (
    specifiers.length === 0 ||
    specifiers.some((specifier) => {
      if (specifier.startsWith("."))
        return file.name.toLowerCase().endsWith(specifier)

      if (specifier.endsWith("/*"))
        return file.type.toLowerCase().startsWith(specifier.slice(0, -1))

      return file.type.toLowerCase() === specifier
    })
  )
}

function selectUploadFiles(
  files: readonly File[],
  incoming: File[],
  {
    accept,
    multiple,
    maxFiles,
    maxSize,
  }: { accept: string; multiple: boolean; maxFiles?: number; maxSize?: number },
) {
  const fileLimit = multiple
    ? maxFiles !== undefined && Number.isInteger(maxFiles) && maxFiles > 0
      ? maxFiles
      : Infinity
    : 1

  const nextFiles = multiple ? [...files] : []
  const identities = new Set(nextFiles.map(fileIdentity))

  for (const file of incoming) {
    if (!acceptsFile(file, accept)) {
      return { error: `${file.name}: file type is not allowed.`, files: [] }
    }

    if (
      maxSize !== undefined &&
      Number.isFinite(maxSize) &&
      maxSize >= 0 &&
      file.size > maxSize
    ) {
      return {
        error: `${file.name}: file exceeds the ${maxSize} byte limit.`,
        files: [],
      }
    }

    const identity = fileIdentity(file)

    if (!identities.has(identity)) {
      identities.add(identity)
      nextFiles.push(file)
    }
  }

  if (nextFiles.length > fileLimit) {
    return {
      error: `Select no more than ${fileLimit} ${fileLimit === 1 ? "file" : "files"}.`,
      files: [],
    }
  }

  return { error: "", files: nextFiles }
}

export function FileUpload({
  accept = "",
  children,
  className,
  defaultValue = [],
  disabled = false,
  label = "Upload files",
  maxFiles,
  maxSize,
  multiple = false,
  onValueChange,
  value,
  xstyle,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  ...props
}: FileUploadProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const browseRef = useRef<HTMLButtonElement>(null)
  const dragDepth = useRef(0)

  const [internalValue, setInternalValue] =
    useState<readonly File[]>(defaultValue)

  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState("")
  const files = value ?? internalValue
  const filenameCounts = countFilenames(files)

  const updateFiles = useEventCallback((nextFiles: File[]) => {
    if (disabled) return

    if (value === undefined) setInternalValue(nextFiles)
    setError("")
    onValueChange?.(nextFiles)
  })

  const selectFiles = useEventCallback((incoming: File[]) => {
    if (disabled || incoming.length === 0) return

    const result = selectUploadFiles(files, incoming, {
      accept,
      multiple,
      maxFiles,
      maxSize,
    })

    if (result.error) {
      setError(result.error)

      return
    }

    updateFiles(result.files)
  })

  const handleInputChange = useEventCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const incoming = Array.from(event.currentTarget.files ?? [])
      event.currentTarget.value = ""
      selectFiles(incoming)
    },
  )

  const openFilePicker = useEventCallback(() => inputRef.current?.click())

  const removeFile = useEventCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      updateFiles(
        files.filter(
          (file) => fileIdentity(file) !== event.currentTarget.dataset.fileId,
        ),
      )
      browseRef.current?.focus()
    },
  )

  const clearFiles = useEventCallback(() => {
    updateFiles([])
    browseRef.current?.focus()
  })

  const resetDrag = useEventCallback(() => {
    dragDepth.current = 0
    setDragging(false)
  })

  const handleDragEnter = useEventCallback(
    (event: DragEvent<HTMLDivElement>) => {
      onDragEnter?.(event)

      if (
        event.defaultPrevented ||
        disabled ||
        !event.dataTransfer.types.includes("Files")
      )
        return
      event.preventDefault()
      dragDepth.current += 1
      setDragging(true)
    },
  )

  const handleDragLeave = useEventCallback(
    (event: DragEvent<HTMLDivElement>) => {
      onDragLeave?.(event)

      if (event.defaultPrevented) return
      dragDepth.current = Math.max(0, dragDepth.current - 1)

      if (dragDepth.current === 0) setDragging(false)
    },
  )

  const handleDragOver = useEventCallback(
    (event: DragEvent<HTMLDivElement>) => {
      onDragOver?.(event)

      if (event.defaultPrevented || !event.dataTransfer.types.includes("Files"))
        return
      event.preventDefault()
      event.dataTransfer.dropEffect = disabled ? "none" : "copy"
    },
  )

  const handleDrop = useEventCallback((event: DragEvent<HTMLDivElement>) => {
    onDrop?.(event)
    resetDrag()

    if (event.defaultPrevented || !event.dataTransfer.types.includes("Files"))
      return
    event.preventDefault()

    if (disabled) return

    if (
      Array.from(event.dataTransfer.items).some(
        (item) => item.webkitGetAsEntry?.()?.isDirectory,
      )
    ) {
      setError("Select files, not folders.")

      return
    }

    selectFiles(Array.from(event.dataTransfer.files))
  })

  return (
    <div
      role="presentation"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <fieldset
        aria-label={label}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        data-slot="file-upload"
        data-dragging={!disabled && dragging ? "true" : undefined}
        {...stylex.props(styles.root)}
      >
        <div
          data-slot="file-upload-dropzone"
          {...stylex.props(
            styles.dropzone,
            !disabled && dragging && styles.dragging,
            disabled && styles.disabled,
          )}
        >
          <UploadIcon aria-hidden="true" size={24} />
          <span {...stylex.props(styles.label)}>{label}</span>
          <p id={`${id}-hint`} {...stylex.props(styles.hint)}>
            {children ?? "Drag and drop files here, or browse your device."}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            aria-label={`${label}: choose files`}
            aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
            aria-invalid={Boolean(error)}
            data-slot="file-upload-input"
            {...stylex.props(styles.input)}
            onChange={handleInputChange}
          />
          <Button
            disabled={disabled}
            onClick={openFilePicker}
            ref={browseRef}
            aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
            variant="outline"
          >
            Browse files
          </Button>
        </div>
        {files.length > 0 ? (
          <>
            <ul aria-label="Selected files" {...stylex.props(styles.list)}>
              {files.map((file, index) => (
                <li key={fileIdentity(file)} {...stylex.props(styles.item)}>
                  <span {...stylex.props(styles.filename)}>{file.name}</span>
                  <Button
                    aria-label={removalLabel(file, index, filenameCounts)}
                    disabled={disabled}
                    size="icon-sm"
                    variant="ghost"
                    data-file-id={fileIdentity(file)}
                    onClick={removeFile}
                  >
                    <XIcon aria-hidden="true" size={16} />
                  </Button>
                </li>
              ))}
            </ul>
            <Button disabled={disabled} variant="ghost" onClick={clearFiles}>
              Clear files
            </Button>
          </>
        ) : null}
        <output
          aria-live="polite"
          aria-atomic="true"
          {...stylex.props(styles.status)}
        >
          {files.length} {files.length === 1 ? "file" : "files"} selected
        </output>
        {error ? (
          <p id={`${id}-error`} role="alert" {...stylex.props(styles.error)}>
            {error}
          </p>
        ) : null}
      </fieldset>
    </div>
  )
}
