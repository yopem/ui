const standaloneBlockComment = /^[\t ]*\/\*[\s\S]*?\*\/[\t ]*(?:\r?\n|$)/gm
const standaloneLineComment = /^[\t ]*\/\/[^\r\n]*(?:\r?\n|$)/gm

export function stripStandaloneComments(code: string) {
  return code
    .replace(standaloneBlockComment, "")
    .replace(standaloneLineComment, "")
}
