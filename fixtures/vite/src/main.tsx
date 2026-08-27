import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

function App() {
  return <main>Vite fixture</main>
}

const root = document.querySelector("#root")
if (!root) throw new Error("Missing #root element")

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
