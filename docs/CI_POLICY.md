# Storefront CI scheduling

Feature/UAT PRs run Deals unit tests, type checks, scoped lint and build. Feature pushes do not duplicate those runs. Browser installation, browser tests and browser artifacts run only on PRs targeting main, pushes to main, or a manually dispatched Deals workflow.

The existing main CI and isolated UAT deployment checks remain enabled. Superseded PR checks are cancelled. The obsolete workflow for the removed feat/deals branch is removed; manual checks use the current Customer deals checks workflow.

Application code and deployment targets are unchanged. These settings take effect after this branch is merged; they do not alter already running workflows.
