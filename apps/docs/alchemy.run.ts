import * as Alchemy from "alchemy"
import * as Cloudflare from "alchemy/Cloudflare"
import * as Output from "alchemy/Output"
import { localState } from "alchemy/State/LocalState"
import * as Effect from "effect/Effect"

const buildEnvironment = {
  envVars: {
    BUN_VERSION: { value: "1.4.2" },
    NODE_VERSION: { value: "24" },
  },
}

export default Alchemy.Stack(
  "yopem-ui-docs",
  { providers: Cloudflare.providers(), state: localState() },
  Effect.gen(function* () {
    const project = yield* Cloudflare.Pages.Project("docs", {
      name: "ui",
      productionBranch: "main",
      buildConfig: {
        buildCommand: "bun run build",
        destinationDir: "apps/docs/.output/public",
        rootDir: "",
      },
      deploymentConfigs: {
        production: buildEnvironment,
        preview: buildEnvironment,
      },
    })

    return { url: Output.interpolate`https://${project.subdomain}` }
  }),
)
