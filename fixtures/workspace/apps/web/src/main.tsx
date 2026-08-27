import { createRoot } from "react-dom/client"

const root = document.querySelector("#root")
if (!root) throw new Error("Missing #root element")

createRoot(root).render(<main>Workspace fixture</main>)
