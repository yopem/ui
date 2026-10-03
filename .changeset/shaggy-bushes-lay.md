---
"@yopem-ui/cli": patch
---

refactor(cli): optimize async operations with Promise.all

Replaced sequential async calls with Promise.all for better performance and
readability. Updated multiple functions across init, install, and project
modules to use this approach.
