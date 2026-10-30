# Agent Instructions (`AGENTS.md`)

All AI coding agents (Antigravity, Claude Code, Cursor, Codex, Cline) operating in this repository MUST follow the rules in [`GEMINI.md`](./GEMINI.md) and activate the skills installed in `.agents/skills/`:

| Task Scope | Mandatory Skill to Read First | Required Verification |
| :--- | :--- | :--- |
| **Frontend (`client/**`)** | `.agents/skills/ui-ux-pro-max/SKILL.md` + `design-system/paid-client-portal/MASTER.md` | `cd client && pnpm run build` |
| **Backend & DB (`server/**`, `supabase/**`)** | `.agents/skills/ponytail/SKILL.md` + `.agents/skills/paid-client-portal-ops/SKILL.md` | `cd server && npm run build && npm run test:integration` |
| **Architecture Diagrams (`.archify/**`)** | `.agents/skills/archify/SKILL.md` | `node .agents/skills/archify/bin/archify.mjs finalize ... --quality showcase --json` |

## Directory-Specific Rules

- See [`client/GEMINI.md`](./client/GEMINI.md) when working in `client/`.
- See [`server/GEMINI.md`](./server/GEMINI.md) when working in `server/`.
