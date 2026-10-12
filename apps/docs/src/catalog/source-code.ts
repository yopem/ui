const standaloneBlockComment = /^[\t ]*\/\*[\s\S]*?\*\/[\t ]*(?:\r?\n|$)/gm

const standaloneLineComment = /^[\t ]*\/\/[^\r\n]*(?:\r?\n|$)/gm

export function stripStandaloneComments(code: string) {
  return code
    .replace(standaloneBlockComment, "")
    .replace(standaloneLineComment, "")
}

export const packageManagers = ["Bun", "npm", "pnpm", "Yarn"] as const

export type PackageManager = (typeof packageManagers)[number]

const commandPattern =
  /^(\s*)(bunx(?:\s+--(?:bun|no-install))?|npx(?:\s+--no-install)?|npm exec(?:\s+--no)?(?:\s+--)?|(?:bun|npm|pnpm|yarn) (?:add|install|i|run)|(?:pnpm|yarn) (?:dlx|exec))(?=\s|$)(.*)$/

export function isPackageManagerCommand(code: string) {
  return code.split("\n").some((line) => commandPattern.test(line))
}

export function convertPackageManagerCommand(
  code: string,
  manager: PackageManager,
) {
  const runner = {
    Bun: "bunx",
    npm: "npx",
    pnpm: "pnpm dlx",
    Yarn: "yarn dlx",
  }[manager]

  const add = {
    Bun: "bun add",
    npm: "npm install",
    pnpm: "pnpm add",
    Yarn: "yarn add",
  }[manager]

  const executable = manager.toLowerCase()

  return code
    .split("\n")
    .map((line) => {
      const match = commandPattern.exec(line)

      if (!match) return line
      const [, indent, source, argumentsText] = match

      if (!source || argumentsText === undefined) return line

      if (source.endsWith(" run"))
        return `${indent}${executable} run${argumentsText}`

      if (/ (?:add|install|i)$/.test(source)) {
        const args = argumentsText.replace(
          /(^|\s)(?:-d|-D|--dev|--save-dev)(?=\s|$)/g,
          (_, space: string) => `${space}${manager === "Bun" ? "-d" : "-D"}`,
        )

        const hasPackages = /(?:^|\s)[^-\s]\S*/.test(args)

        return `${indent}${hasPackages || source.endsWith(" add") ? add : `${executable} install`}${args}`
      }

      if (
        /^(?:pnpm|yarn) exec$|^npm exec --no(?: --)?$| --no-install$/.test(
          source,
        )
      ) {
        const localRunner = {
          Bun: "bunx --no-install",
          npm: "npx --no-install",
          pnpm: "pnpm exec",
          Yarn: "yarn exec",
        }[manager]

        return `${indent}${localRunner}${argumentsText}`
      }

      const selectedRunner =
        manager === "Bun" && /^\s+@yopem-ui\/cli(?=\s|$)/.test(argumentsText)
          ? "bunx --bun"
          : runner

      return `${indent}${selectedRunner}${argumentsText}`
    })
    .join("\n")
}
