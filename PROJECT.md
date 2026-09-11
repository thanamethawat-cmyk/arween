# Project: ARWEEN Superior Operations Management Cycle — Full-Cycle Completion & Verification

## Architecture
ARWEEN is an outcome-driven daily operations management and AI merit evaluation platform built on Next.js 14 (App Router), Tailwind CSS, Prisma ORM, SQLite/PostgreSQL, NextAuth, and Google Gemini API.

### Data Flow & Multi-Agent Architecture
1. **Evidence Logging**: Team members submit EvidenceEvents linked to WorkItems under the Anchor Framework (Objectives -> Milestones -> KPIs).
2. **AI Multi-Agent Evaluation**:
   - **Agent 1 (Impact Scoring)**: Scores submitted evidence 0–10 based on KPI alignment, depth, and milestone impact.
   - **Agent 2 (Contribution Normalization)**: Computes fair, normalized member contribution shares strictly summing to 100.00% using Largest Remainder algorithm.
   - **Agent 3 (Anti-Gaming & Dispute)**: Detects spam, routine acknowledgments ("โอเคครับ", "รับทราบครับ"), duplicate submissions, and flags anomalies.
3. **Lead Confirmation & Dispute Resolution**:
   - Project leads review, confirm, adjust scores (`updateScore`), or dismiss flags (`dismissScoreFlag`).
   - Members can raise Disputes; leads resolve disputes with score adjustments and unflagging.
4. **Period Closing & Merit-to-Earn Bonus Pool**:
   - Closed evaluation periods lock confirmed scores and freeze 100.00% contribution shares.
   - Bonus pool allocation calculates exact monetary payouts with CSV export for payroll/audit.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Lead Score Editing & Flag Dismissal | Allow team leads to adjust scores (`updateScore`) and unflag flagged scores (`dismissScoreFlag`) with reasons | M1 | Survey R1 |
| 2 | Evaluation Period Score Association | Ensure `server/evaluate.ts:saveScore` associates newly created scores with the active `evaluationPeriodId` | M1 | Survey R1 |
| 3 | Full Dispute Resolution Lifecycle | Update `resolveDispute` to accept adjusted scores/unflagging and update score table; include score details in dispute query UI | M1 | Survey R1 |
| 4 | Stale Dispute Notification Idempotency | Guard `flagStaleDisputes` against duplicate notification spam on repeated page renders | M1 | Survey R1 |
| 5 | Evaluation UI Modularization | Refactor monolithic `evaluation-client.tsx` into clean modular components in `components/evaluation/` | M1 | Survey R1 |
| 6 | Gemini Model Configuration Fix | Change `GEMINI_MODEL=gemini-3.6-flash` to valid `gemini-2.0-flash` across `.env`, `.env.example`, and `lib/gemini.ts` | M2 | Survey R2 |
| 7 | Zero-Score Falsy Coalescing Fix | Fix `Number(data.impactScore) || 5` in `agent1.ts` and `lib/gemini.ts` so score 0 does not become 5 | M2 | Survey R2 |
| 8 | Thai Acknowledgment Regex Expansion | Expand Agent 3 regex and Agent 1 heuristic to detect polite particles ("โอเคครับ", "รับทราบครับ") and short ack messages | M2 | Survey R2 |
| 9 | Zero-Score Member Normalization Handling | Include 0-impact members in Agent 2 `ContributionShare` with 0.00% for full audit trail and CSV export | M2 | Survey R2 |
| 10 | AI Calibration Benchmark Suite Enhancement | Add exit code 1 on failure, same-day repeat spam test cases, and pass benchmark in `scripts/calibrate-ai-prompts.ts` | M2 | Survey R2 |
| 11 | Pilot Simulation Crash Fix | Fix `ReferenceError: opsTotalRatio is not defined` in `scripts/run-pilot-simulation.ts:296` | M3 | Survey R3 |
| 12 | End-to-End Pilot Teams Simulation | Execute full simulation for `pilot-team-eng` and `pilot-team-ops` with complete DB records across all 5 steps | M3 | Survey R3 |
| 13 | Anchor Objective Weights Consistency | Ensure single-objective weights sum to 100 in `prisma/seed.ts` (engObj1: 100, opsObj1: 100) | M3 | Survey R3 |
| 14 | Verification Script Alias Wrapper | Provide `scripts/verify-cycle.ts` wrapper calling `scripts/verify-full-cycle.ts` for command parity | M4 | Survey R4 |
| 15 | Next.js 14 Page Params Typing Fix | Support `Promise<{ id: string }> | { id: string }` union in `evidence/page.tsx`, `notifications/page.tsx`, and `export/route.ts` | M4 | Survey R4 |
| 16 | Google Cloud Staging Project ID Update | Update hardcoded `gen-lang-client-0740402744` to `gen-lang-client-0084061289` in deploy scripts and docs | M4 | Survey R4 |
| 17 | Cloud Staging & ADC Documentation | Document ADC setup command, GCP Credentials URL, AI Studio Applet URL, and Git remote in staging docs | M4 | Survey R4 |
| 18 | Standalone Build Compilation | Verify `npm run build` compiles clean with zero TypeScript/lint errors and generates `.next/standalone` | M4 | Survey R4 |
| 19 | Dual-Track E2E Test Infrastructure | Independent opaque-box test runner and test cases across Tiers 1–4 derived from user requirements | E2E | Dual Track |
| 20 | Final Milestone Verification & Coverage Hardening | 100% pass of E2E test suite + `verify:cycle` + `pilot:simulate` + `ai:calibrate` + Tier 5 adversarial testing | M5 | Final Phase |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Independent opaque-box test runner and test cases (Tiers 1-4) | None | DONE |
| M1 | Core Platform & Evaluation Engine (R1) | Features 1–5: Lead score editing, period association, dispute lifecycle, notification idempotency, evaluation UI | None | DONE |
| M2 | Gemini AI Reliability & Calibration (R2) | Features 6–10: Model name fix, zero-score bug fix, Thai regex expansion, zero-score shares, calibration script | None | DONE |
| M3 | Pilot Teams End-to-End Simulation (R3) | Features 11–13: Fix `opsTotalRatio` crash, complete 2-team pilot simulation, fix seed weights | M1, M2 | DONE |
| M4 | Build, Deploy & Staging Readiness (R4) | Features 14–18: `verify-cycle.ts` alias, Next.js params typing, GCP Project ID update, ADC docs, standalone build | M1, M2, M3 | DONE |
| M5 | Final Verification & Adversarial Hardening | Feature 20: 100% pass of E2E test suite, `verify:cycle`, `pilot:simulate`, `ai:calibrate`, build + Tier 5 hardening | E2E, M1-M4 | DONE |



---

## Interface Contracts
### Evaluation Actions (`server/evaluate.ts`)
- `updateScore(scoreId: string, projectId: string, value: number, reason: string): Promise<Score>`
  - Requires lead permission (`requireLead(projectId)`)
  - Validates `value` is integer between 0 and 10
  - Updates score, logs to `AuditLog`, revalidates `/projects/[id]/evaluation`
- `dismissScoreFlag(scoreId: string, projectId: string, note?: string): Promise<Score>`
  - Requires lead permission
  - Sets `flagged: false`, `flagReason: null`, logs unflagging to `AuditLog`
- `resolveDispute(disputeId: string, projectId: string, newScoreValue?: number, resolutionNote?: string): Promise<Dispute>`
  - Requires lead permission
  - If `newScoreValue` provided: updates associated `Score.value`, sets `Score.flagged = false`, `Score.confirmed = true`
  - Sets `Dispute.status = "RESOLVED"`, `Dispute.resolvedAt = new Date()`
  - Revalidates path

### Agent 2 Normalization (`server/agents/agent2.ts`)
- `runAgent2(rows: ImpactRow[]): ContributionRow[]`
  - Input: `rows` array of `{ userId: string, impactSum: number }`
  - Output: `ContributionRow[]` array of `{ userId: string, ratioPercent: number }`
  - Sum of `ratioPercent` MUST strictly equal `100.00%` when sum of impacts > 0
  - When all scores are 0, distributes equally or assigns 0.00% without throwing exceptions
  - Includes all members in output rows (0-score members receive 0.00%)

### AI Calibration Runner (`scripts/calibrate-ai-prompts.ts`)
- CLI execution via `npm run ai:calibrate`
- Benchmark cases must evaluate:
  1. High-impact engineering architecture (score >= 7)
  2. Critical security bug fix (score >= 8)
  3. Routine acknowledgment "รับทราบครับ" / "โอเค" / "โอเคครับ" (score <= 2)
  4. Same-day repeated spam submissions (flagged = true, score = 0)
- Exits with status code 0 on all passes; exits with status code 1 on any benchmark failure.

---

## Code Layout & Write Boundaries
- `server/evaluate.ts`, `components/evaluation/`: Owned by Milestone 1 Worker
- `server/agents/agent1.ts`, `server/agents/agent2.ts`, `server/agents/agent3.ts`, `lib/gemini.ts`, `scripts/calibrate-ai-prompts.ts`, `.env`, `.env.example`: Owned by Milestone 2 Worker
- `scripts/run-pilot-simulation.ts`, `prisma/seed.ts`: Owned by Milestone 3 Worker
- `scripts/verify-cycle.ts`, `scripts/deploy-cloud-staging.*`, `docs/cloud-staging-deploy.md`, `app/projects/[id]/evidence/page.tsx`, `app/projects/[id]/notifications/page.tsx`, `app/api/projects/[id]/periods/[periodId]/export/route.ts`: Owned by Milestone 4 Worker
- `e2e/`, `tests/e2e/`, `scripts/run-e2e-tests.ts`: Owned by E2E Testing Track Worker
- Concurrent workers MUST NOT edit overlapping files.
