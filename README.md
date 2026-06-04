# software-engineering-productivity

## Hostinger MCP server

This repo configures the [Hostinger API MCP server](https://www.npmjs.com/package/hostinger-api-mcp)
for Claude Code in [`.mcp.json`](./.mcp.json).

### Setup

The server reads its credential from the `HOSTINGER_API_TOKEN` environment variable.
The token is **not** stored in this repo — `.mcp.json` only references it via
`${HOSTINGER_API_TOKEN}`, so nothing secret is committed.

1. Generate an API token in hPanel → **Account → API**.
2. Make it available to Claude Code as `HOSTINGER_API_TOKEN`:
   - **Claude Code on the web:** add it as an environment variable in your
     environment's configuration
     (see https://code.claude.com/docs/en/claude-code-on-the-web).
   - **Local Claude Code:** export it in your shell, e.g.
     `export HOSTINGER_API_TOKEN=...` (add it to your shell profile to persist).
3. Start a new Claude Code session and approve the `hostinger-mcp` server when prompted.
