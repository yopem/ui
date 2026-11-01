import "@registry/styles/styles.css"
import { getRootThemeProps } from "@registry/theme/theme"
import { createRoot } from "react-dom/client"

import { ToolbarPressedFixture } from "./toolbar-pressed-fixture"

const theme =
  document.documentElement.dataset.theme === "dark" ? "dark" : "light"

document.documentElement.className = getRootThemeProps(theme).className ?? ""

const root = document.getElementById("root")

if (!root) throw new Error("Missing fixture root")

createRoot(root).render(<ToolbarPressedFixture />)
