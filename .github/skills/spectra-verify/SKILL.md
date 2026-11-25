---
name: spectra-verify
description: "Verify an identified Spectra change against its artifacts (specs, tasks, design). Use when an identified Spectra change needs task, requirement, and design conformance checked before archiving"
argument-hint: "[change-name]"
license: MIT
compatibility: Requires spectra CLI.
metadata:
  author: spectra
  version: "1.0"
  generatedBy: "Spectra"
---

Load the complete `verify` workflow for this tool at runtime.

**Prerequisites**: the `spectra` CLI. When `spectra` is not found, check its install location: `%LOCALAPPDATA%\Spectra\spectra.exe` on Windows, `~/.local/bin/spectra` on macOS. When that file runs, use its full path in place of `spectra` for every remaining command, and tell the user once that `spectra` is not on this agent's PATH: fully quitting and reopening the agent (closing its window can leave it running) makes it read the current PATH. When neither runs, report the error and STOP.

1. Run `spectra instructions --skill verify --agent github-copilot`.
2. If the command fails, report the error and STOP.
3. Follow the returned workflow in the current session. Treat any argument supplied with this skill invocation as the workflow input.

Do not run this loader again from the returned workflow.
