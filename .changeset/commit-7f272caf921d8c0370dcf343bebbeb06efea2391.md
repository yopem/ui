---
"@yopem-ui/oxlint-plugin": patch
---

fix(oxlint): recognize styled components

Add the missing layout and text components to default detection. Check the
public StyleX inventory and cover named, aliased, and namespace imports with
real Oxlint runs.
