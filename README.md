# software-engineering-productivity

## Hostinger MCP server

This repo configures the [Hostinger API MCP server](https://www.npmjs.com/package/hostinger-api-mcp)
for both Claude Code ([`.mcp.json`](./.mcp.json)) and VS Code
([`.vscode/mcp.json`](./.vscode/mcp.json)).

In both cases the API token is **not** stored in the repo — the config files
only reference it, so nothing secret is committed.

### Claude Code

The server reads its credential from the `HOSTINGER_API_TOKEN` environment
variable, referenced in `.mcp.json` as `${HOSTINGER_API_TOKEN}`.

1. Generate an API token in hPanel → **Account → API**.
2. Make it available to Claude Code as `HOSTINGER_API_TOKEN`:
   - **Claude Code on the web:** add it as an environment variable in your
     environment's configuration
     (see https://code.claude.com/docs/en/claude-code-on-the-web).
   - **Local Claude Code:** export it in your shell, e.g.
     `export HOSTINGER_API_TOKEN=...` (add it to your shell profile to persist).
3. Start a new Claude Code session and approve the `hostinger-mcp` server when prompted.

### VS Code

`.vscode/mcp.json` defines a secure `promptString` input. The first time the
server starts, VS Code prompts for the token and stores it in its encrypted
secret storage — it is never written to the file.

1. Generate an API token in hPanel → **Account → API**.
2. Open `.vscode/mcp.json` and click **Start** on the `hostinger-mcp` server
   (or use the Command Palette → **MCP: List Servers**).
3. Paste the token when prompted.

Requires a recent version of VS Code with MCP support (agent mode).
