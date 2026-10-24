export const editorTypeaheadParts = [
  {
    name: "EditorInlineCombobox",
    slug: "inline-combobox",
    item: "editor-typeahead",
    description:
      "Provide one stable native suggestion controller to composed parts.",
  },
  {
    name: "EditorInlineComboboxInput",
    slug: "inline-combobox-input",
    item: "editor-typeahead",
    description:
      "Render EditorContent as the native editable surface. Do not add a second search input.",
  },
  {
    name: "EditorInlineComboboxContent",
    slug: "inline-combobox-content",
    item: "editor-typeahead",
    description:
      "Anchor suggestions to the native selection without moving focus.",
  },
  {
    name: "EditorInlineComboboxList",
    slug: "inline-combobox-list",
    item: "editor-typeahead",
    description:
      "Connect the listbox and active option to the editable surface.",
  },
  {
    name: "EditorInlineComboboxItem",
    slug: "inline-combobox-item",
    item: "editor-typeahead",
    description:
      "Render a current controller item. Preserve its pointer selection and keyboard identity.",
  },
  {
    name: "EditorInlineComboboxEmpty",
    slug: "inline-combobox-empty",
    item: "editor-typeahead",
    description: "Show content when search has no results.",
  },
  {
    name: "EditorInlineComboboxStatus",
    slug: "inline-combobox-status",
    item: "editor-typeahead",
    description:
      "Announce loading and failure states without exposing backend errors.",
  },
  {
    name: "EditorInlineComboboxGroup",
    slug: "inline-combobox-group",
    item: "editor-typeahead",
    description: "Group current results with the house CommandGroup.",
  },
  {
    name: "EditorInlineComboboxGroupLabel",
    slug: "inline-combobox-group-label",
    item: "editor-typeahead",
    description: "Name a result group with the house CommandGroupLabel.",
  },
  {
    name: "EditorInlineComboboxRow",
    slug: "inline-combobox-row",
    item: "editor-typeahead",
    description:
      "Arrange custom option content in a house HStack without extra ARIA roles.",
  },
  {
    name: "EditorTypeahead",
    slug: "typeahead",
    item: "editor-typeahead",
    description:
      "Render the editable surface and default suggestions with the compound parts.",
  },
  {
    name: "EditorEmojiPopover",
    slug: "emoji-popover",
    item: "editor-typeahead",
    description:
      "Provide a stable picker controller and capture the editor selection when the popup opens.",
  },
  {
    name: "EditorEmojiToolbarButton",
    slug: "emoji-toolbar-button",
    item: "editor-typeahead",
    description:
      "Open the picker through a house ToolbarButton. Put it inside EditorToolbar.",
  },
  {
    name: "EditorEmojiPopoverContent",
    slug: "emoji-popover-content",
    item: "editor-typeahead",
    description: "Render the house popup with dismissal and focus return.",
  },
  {
    name: "EditorEmojiPicker",
    slug: "emoji-picker",
    item: "editor-typeahead",
    description:
      "Render a searchable picker panel inside EditorEmojiPopoverContent. Supply children to change its controls.",
  },
  {
    name: "EditorEmojiSearch",
    slug: "emoji-search",
    item: "editor-typeahead",
    description:
      "Search English names and aliases through the house CommandInput.",
  },
  {
    name: "EditorEmojiCategory",
    slug: "emoji-category",
    item: "editor-typeahead",
    description:
      "Select a category or frequently used emoji through NativeSelect.",
  },
  {
    name: "EditorEmojiList",
    slug: "emoji-list",
    item: "editor-typeahead",
    description:
      "Render the current page. Supply children for custom item content.",
  },
  {
    name: "EditorEmojiItem",
    slug: "emoji-item",
    item: "editor-typeahead",
    description:
      "Insert one current Unicode candidate at the captured selection.",
  },
  {
    name: "EditorEmojiEmpty",
    slug: "emoji-empty",
    item: "editor-typeahead",
    description: "Show content when the picker has no results.",
  },
  {
    name: "EditorEmojiPrevious",
    slug: "emoji-previous",
    item: "editor-typeahead",
    description: "Move to the previous page of results.",
  },
  {
    name: "EditorEmojiNext",
    slug: "emoji-next",
    item: "editor-typeahead",
    description: "Move to the next page of results.",
  },
  {
    name: "EditorEmojiClearHistory",
    slug: "emoji-clear-history",
    item: "editor-typeahead",
    description: "Clear the bounded in-memory frequency history.",
  },
  {
    name: "EditorEmojiMenu",
    slug: "emoji-menu",
    item: "editor-typeahead",
    description:
      "Compose the default toolbar trigger, popup, and picker panel.",
  },
  {
    name: "EditorEmojiClearSearch",
    slug: "emoji-clear-search",
    item: "editor-typeahead",
    description: "Clear the popup search without changing document content.",
  },
  {
    name: "EditorEmojiPreview",
    slug: "emoji-preview",
    item: "editor-typeahead",
    description: "Show the highlighted Unicode emoji, name, and aliases.",
  },
] as const
