import { themeClasses } from "@registry/theme/theme-root"

const STORAGE_KEY = "yopem-ui-theme"
const MEDIA_QUERY = "(prefers-color-scheme: dark)"

export function ThemeScript({ nonce }: { nonce?: string }) {
  const script = `(()=>{try{const k=${JSON.stringify(STORAGE_KEY)},q=${JSON.stringify(MEDIA_QUERY)},l=${JSON.stringify(themeClasses.light)},d=${JSON.stringify(themeClasses.dark)},m=${JSON.stringify(themeClasses.marker)},r=document.documentElement,t=localStorage.getItem(k)||"system",v=t==="system"?(matchMedia(q).matches?"dark":"light"):t;r.classList.remove(...l,...d);r.classList.add(...m,...(v==="dark"?d:l));r.dataset.theme=v}catch{}})()`
  return <script dangerouslySetInnerHTML={{ __html: script }} nonce={nonce} />
}
