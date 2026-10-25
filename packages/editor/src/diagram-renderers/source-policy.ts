const mermaidResourceReference =
  /@\s*\{[^}]*\bimg\s*:|\burl\s*\(|@import\b|<\s*img\b|!\[[^\]]*\]\s*\([^)]*\)/isu

const mermaidConfigurationDirective = /%%\s*\{/u

const mermaidStyleDirective =
  /(?:^[\t ]*|;[\t ]*)(?:style|classDef|linkStyle)\b/imu

const plantUmlPreprocessorDirective = /^\uFEFF?[\t ]*!/mu

const plantUmlPreprocessorFunction = /%[\p{L}_][\p{L}\p{N}_]*\s*\(/iu

const plantUmlResourceReference = /<\s*img\b|\burl\s*\(|@import\b/iu

function assertSourceText(source: string) {
  if (/[\p{Cc}\p{Cs}]/u.test(source.replace(/[\t\n\r]/gu, "")))
    throw new Error("Diagram source contains unsupported characters.")
}

export function assertMermaidSourcePolicy(source: string): void {
  assertSourceText(source)

  if (mermaidResourceReference.test(source))
    throw new Error("Diagram source uses unsupported resource references.")

  const firstContentLine = source
    .replace(/^\uFEFF/u, "")
    .split(/\r\n|\r|\n/u)
    .find((line) => line.trim() !== "")

  if (
    mermaidConfigurationDirective.test(source) ||
    firstContentLine?.trim() === "---"
  )
    throw new Error("Diagram source uses unsupported configuration directives.")

  if (mermaidStyleDirective.test(source))
    throw new Error("Diagram source uses unsupported style directives.")
}

export function assertPlantUmlSourcePolicy(source: string): void {
  assertSourceText(source)

  if (plantUmlPreprocessorDirective.test(source))
    throw new Error("Diagram source uses unsupported resource directives.")

  if (
    plantUmlPreprocessorFunction.test(source) ||
    plantUmlResourceReference.test(source)
  )
    throw new Error("Diagram source uses unsupported resource references.")
}

export function assertFlowchartSourcePolicy(source: string): void {
  assertSourceText(source)

  if (source.includes("@>"))
    throw new Error("Flowchart source uses unsupported style directives.")

  if (source.includes(":$"))
    throw new Error("Flowchart source uses unsupported callback directives.")
}
