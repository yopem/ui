import type { ComponentType, LazyExoticComponent } from "react"

import { lazy } from "react"

export interface CatalogPreview {
  component: LazyExoticComponent<ComponentType>
  title: string
}

export interface CatalogItem {
  name: string
  preview?: CatalogPreview
  slug: string
  title: string
}

const modules = import.meta.glob<{ Preview: ComponentType }>("./previews/*.tsx")
const compositionOverrides: Record<
  string,
  Pick<CatalogItem, "name" | "title">
> = {
  "date-picker": {
    name: "DatePicker",
    title: "Date Picker",
  },
  navigation: {
    name: "SegmentedControl",
    title: "Segmented Control",
  },
}

const previewDescriptions: Record<string, string> = {
  accordion: "Expandable sections",
  "absolute-center": "Centered overlay content",
  bleed: "Full-bleed content within padding",
  blockquote: "Quoted passage",
  codeblock: "Formatted source code with copy action",
  em: "Stress emphasis in text",
  float: "Corner badge over a card",
  highlight: "Search term highlighted in text",
  mark: "Marked text",
  prose: "Readable long-form content",
  wrap: "Wrapping tag list",
  alert: "Informational alert with guidance",
  "alert-dialog": "Confirmation dialog",
  autocomplete: "Searchable fruit selection",
  avatar: "Profile image with initials fallback",
  badge: "Compact status badge",
  box: "Padded semantic section",
  breadcrumb: "Page trail with overflow menu",
  button: "Clickable default action",
  calendar: "Date selection",
  card: "Project creation card",
  center: "Centered content block",
  container: "Centered page-width wrapper",
  checkbox: "Checkbox with label",
  checkmark: "Decorative success icon",
  "checkbox-group": "Multiple choice selection",
  collapsible: "Expandable details list",
  combobox: "Searchable options",
  command: "Keyboard command menu",
  "context-menu": "Right-click actions",
  "date-picker": "Popover calendar selection",
  dialog: "Edit profile form",
  drawer: "Notification drawer",
  empty: "Empty meetings state",
  field: "Profile name field with help text",
  fieldset: "Billing details fields",
  flex: "Aligned items with spacing",
  form: "Email validation form",
  frame: "Section header and content frame",
  grid: "Two-column team grid",
  group: "Separated file action buttons",
  heading: "Hierarchical page headings",
  hstack: "Inbox with unread count",
  input: "Single-line text entry",
  "input-group": "Search field with icon addon",
  kbd: "Keyboard shortcut keycaps",
  layout: "Composable layout primitives",
  link: "Link to component catalog",
  menu: "Playback actions menu",
  meter: "Storage usage meter",
  navigation: "Segmented navigation",
  "number-field": "Quantity stepper",
  "otp-field": "One-time password entry",
  pagination: "Page navigation",
  text: "Constrained reading-width text",
  popover: "Feedback form popover",
  "preview-card": "Link preview card",
  progress: "Upload progress indicator",
  "radio-group": "Single choice selection",
  "scroll-area": "Scrollable content list",
  select: "Dropdown selection",
  separator: "Section heading and divider",
  sheet: "Edit profile sheet",
  skeleton: "Loading profile cards",
  slider: "Adjustable range",
  spinner: "Indeterminate loading spinner",
  stack: "Vertically stacked status",
  switch: "Labeled on/off switch",
  table: "Projects data table",
  tabs: "Switchable content panels",
  textarea: "Multiline message input",
  toast: "Notification toast",
  toggle: "Toggleable button state",
  "toggle-group": "Rich-text formatting toggles",
  toolbar: "Formatting controls",
  tooltip: "Helpful hint on hover",
  vstack: "Vertical account status",
}

export const catalog: CatalogItem[] = Object.entries(modules)
  .map(([path, load]): CatalogItem => {
    const slug =
      path
        .split("/")
        .at(-1)
        ?.replace(/\.tsx$/, "") ?? path
    const override = compositionOverrides[slug]
    const title = override?.title ?? titleCase(slug)
    return {
      name: override?.name ?? componentIdentifier(slug),
      preview: {
        component: lazy(() =>
          load().then((module) => ({ default: module.Preview })),
        ),
        title: previewDescriptions[slug] ?? `${title} in use`,
      },
      slug,
      title,
    }
  })
  .concat(
    { name: "Label", slug: "label", title: "Label" },
    { name: "Sidebar", slug: "sidebar", title: "Sidebar" },
  )
  .toSorted((left, right) => left.title.localeCompare(right.title))

export function getCatalogItem(slug: string) {
  return catalog.find((item) => item.slug === slug)
}

function titleCase(value: string) {
  if (value === "hstack") return "HStack"
  if (value === "vstack") return "VStack"
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function componentIdentifier(value: string) {
  return titleCase(value).replaceAll(" ", "")
}
