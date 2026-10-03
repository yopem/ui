---
"@yopem-ui/cli": patch
---

Skip package-manager commands when dependencies already satisfy registry
requirements, preserve compatible dependency specs, and keep runtime dependency
precedence across installer and init plans.

Support `init --dry-run` for every supported framework and shared UI workspace,
previewing validated file, configuration, manifest, and dependency changes
without writing files or running a package manager.

Track registry URLs and item versions in backward-compatible `ui.json` manifests
and warn before applying files from a different known registry while preserving
provenance for skipped files.

Reject registry redirects, including injected redirect responses, without
exposing response bodies, credentials, or redirect destinations in errors.
