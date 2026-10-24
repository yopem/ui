export const editorCodeParts = [
  {
    name: "EditorCode",
    slug: "code-preset",
    item: "editor-code",
    description:
      "Provide a code editor preset with language, copy, view, history, and optional host formatting controls.",
  },
  {
    name: "EditorCodeToolbar",
    slug: "code-toolbar",
    item: "editor-code",
    description: "Provide code selection state to code controls.",
  },
  {
    name: "EditorCodeLanguage",
    slug: "code-language",
    item: "editor-code",
    description: "Set the language of the selected code block.",
  },
  {
    name: "EditorCodeCopyButton",
    slug: "code-copy-button",
    item: "editor-code",
    description: "Copy the selected code block as plain text.",
  },
  {
    name: "EditorCodeFormatButton",
    slug: "code-format-button",
    item: "editor-code",
    description:
      "Format the selected code block with an explicit host formatter. Omit the control when no formatter is supplied.",
  },
  {
    name: "EditorCodeToggle",
    slug: "code-toggle",
    item: "editor-code",
    description: "Switch wrapping or line numbers for selected code.",
  },
  {
    name: "EditorCodeStatus",
    slug: "code-status",
    item: "editor-code",
    description: "Announce code control results.",
  },
] as const
