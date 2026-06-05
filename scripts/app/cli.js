#!/usr/bin/env node
// Compatibility shim: the real CLI lives at dist/cli/index.js (compiled from
// src/cli/index.ts). This root entry is kept so existing Claude Code hooks in
// ~/.claude/settings.json that point at /Users/.../claude-pets/cli.js continue
// to work without a reload. Run `npm run build` to (re)generate dist/.
require("./dist/cli/index.js");
