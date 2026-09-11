# ARWEEN Superior Operations Management Cycle — E2E Test Infrastructure Specification

## 1. Executive Summary & Test Strategy
ARWEEN is an outcome-driven daily operations management and AI merit evaluation platform integrating:
- **Anchor Framework**: Objectives -> Milestones -> Key Performance Indicators (KPIs)
- **WorkItem Hub & Evidence Logging**: Real-world operational artifacts and progress tracking
- **Multi-Agent Evaluation Engine**:
  - **Agent 1**: Impact Scoring (0–10) with Anchor Context relevance
  - **Agent 2**: Contribution Normalization (strictly summing to 100.00% via Largest Remainder)
  - **Agent 3**: Anti-Gaming & Anomaly Detection (spam, routine acknowledgment, duplicate detection)
- **Governance & Financial Settlement**:
  - Lead Score Review, Adjustment, and Flag Dismissal
  - Full Dispute Resolution Lifecycle
  - Evaluation Period Closing & Automatic Succession
  - Merit-to-Earn Bonus Pool Budget Allocation & UTF-8 BOM CSV Export

The E2E Testing Track provides **independent, opaque-box test infrastructure** verifying platform behavior strictly against user requirements and interface contracts defined in `ORIGINAL_REQUEST.md` and `PROJECT.md`.

---

## 2. Test Methodology Framework

### 2.1 Category-Partition (CP) Method
System behavior is partitioned into functional categories, input parameters, and equivalence classes:
- **User Roles**: `LEAD`, `MEMBER`, `ADMIN`, `NON_MEMBER` (unauthorized).
- **Evidence Sources**: `WORK_ITEM`, `DAILY_LOG`, `COMMENT`, `STATUS_UPDATE`, `DOCUMENT`, `PRIVATE_MESSAGE` (disallowed).
- **Action Depth & Content**:
  - High Impact (Architectural breakthrough, critical bug fix, enterprise client onboarding).
  - Moderate Routine (Meeting attendance, status sync, sprint housekeeping).
  - Polite Acknowledgment ("รับทราบ", "ขอบคุณ", "โอเค", "ครับ", "ค่ะ").
  - Repetitive Spam (Same-day identical submissions, repeated short acks).
- **Score Scales**: Valid integer range `[0, 10]`, invalid `< 0`, invalid `> 10`, non-integer decimals.
- **Score Suggestion Source**: `AI`, `LEAD`.
- **Anti-Gaming Flag Status**: `flagged: false`, `flagged: true` (with specific audit reason).
- **Dispute Statuses**: `PENDING`, `RESOLVED`, `REJECTED`.
- **Period Statuses**: `OPEN`, `CLOSED`.
- **Merit Settlement Statuses**: `NONE`, `DRAFT`, `APPROVED`.
- **Bonus Pool Currencies**: `THB`, `USD`.

### 2.2 Boundary Value Analysis (BVA)
Critical boundaries subjected to verification:
| Parameter / Condition | Minimum Valid | Nominal | Maximum Valid | Lower Boundary Violation | Upper Boundary Violation |
|-----------------------|---------------|---------|---------------|--------------------------|--------------------------|
| Score Value | `0` | `5` | `10` | `-1` | `11` |
| Text Character Length | `1` (or 8 for clean) | `50` | `2000` | `0` (empty) | `2001` |
| Short Ack Flag Threshold | `4` chars | `15` chars | `2000` chars | `< 4` (flagged) | N/A |
| Same-Day Ack Count | `1` | `2` (forced=1) | `3` (forced=0, flag)| N/A | `>= 3` |
| Team Member Count | `1` member | `5` members | `100` members | `0` members | N/A |
| Contribution Normalization | `100.00%` | `100.00%` | `100.00%` | `< 99.99%` | `> 100.01%` |
| Bonus Pool Amount | `0.00` | `50,000.00` | `10,000,000.00` | `< 0.00` (error) | N/A |
| Stale Dispute Window | `72` hours | `100` hours | N/A | `< 72` hours | N/A |

### 2.3 Pairwise Combinatorial Testing
Interaction matrix validating orthogonal features in combination:
- **Matrix 1**: Evidence Source x Action Impact x Agent 1 Score x Agent 3 Gaming Flag.
- **Matrix 2**: Lead Score Modification x Dispute Generation x Dispute Resolution x Period Association.
- **Matrix 3**: Zero-Score Member Inclusion x Multi-Member Fractional Weights x 100.00% Largest Remainder Normalization.
- **Matrix 4**: Period Closing x Bonus Pool Setting x Share Confirmation x CSV Export Encoding (UTF-8 BOM).

### 2.4 Real-World Workload Scenarios
Faithful full-cycle operational simulation covering:
- **Pilot Team 1 (`pilot-team-eng`)**: Platform Engineering & Core Architecture.
- **Pilot Team 2 (`pilot-team-ops`)**: Growth Operations & Corporate Onboarding with Dispute Escalation.

---

## 3. Requirements & Feature Inventory Traceability

| Feature ID | Feature Name | Milestone | Scope / Source | Primary Verification Target |
|------------|--------------|-----------|----------------|-----------------------------|
| F1 | Lead Score Editing & Flag Dismissal | M1 | R1 | `updateScore()`, `dismissScoreFlag()`, audit trail |
| F2 | Evaluation Period Score Association | M1 | R1 | `saveScore()` with active `evaluationPeriodId` |
| F3 | Full Dispute Resolution Lifecycle | M1 | R1 | `createDispute()`, `resolveDispute()`, score update |
| F4 | Stale Dispute Notification Idempotency | M1 | R1 | `flagStaleDisputes()`, notification deduplication |
| F5 | Evaluation UI & Data Query | M1 | R1 | `getEvaluationData()`, period listing, member summaries |
| F6 | Gemini Model Configuration | M2 | R2 | `GEMINI_MODEL=gemini-2.0-flash` validation |
| F7 | Zero-Score Falsy Coalescing Fix | M2 | R2 | Score `0` preserved, not coalesced to default `5` |
| F8 | Thai Acknowledgment Regex Expansion | M2 | R2 | Polite particles ("ครับ", "ค่ะ", "โอเคครับ", "รับทราบครับ") |
| F9 | Zero-Score Member Normalization Handling | M2 | R2 | Members with 0 score get `0.00%`, total strictly `100.00%` |
| F10 | AI Calibration Benchmark Suite | M2 | R2 | Benchmark test suite with proper exit code 0/1 |
| F11 | Pilot Simulation Crash Fix | M3 | R3 | `opsTotalRatio` reference fix in simulation |
| F12 | End-to-End Pilot Teams Simulation | M3 | R3 | Full 2-team multi-step execution |
| F13 | Anchor Objective Weights Consistency | M3 | R3 | Objectives sum strictly to 100% |
| F14 | Verification Script Alias Wrapper | M4 | R4 | `scripts/verify-cycle.ts` parity |
| F15 | Next.js 14 Page Params Typing | M4 | R4 | Promise-based params in Next.js 14 App Router |
| F16 | Google Cloud Staging Project ID Update | M4 | R4 | Target project `gen-lang-client-0084061289` |
| F17 | Cloud Staging & ADC Documentation | M4 | R4 | ADC script and console credentials URLs |
| F18 | Standalone Build Compilation | M4 | R4 | Next.js standalone build readiness |
| F19 | Dual-Track E2E Test Infrastructure | E2E | All | Independent opaque-box test runner & suites |
| F20 | Final Milestone Verification & Hardening | M5 | All | 100% pass across all verification harnesses |

---

## 4. Test Suite Architecture & Tiers

The test suite is structured into 4 executable tiers under `tests/e2e/`:

```
tests/e2e/
├── harness.ts                     # Assertions, test runner registry, mock helpers & data fixtures
├── tier1-feature-coverage.ts      # Tier 1: >= 5 tests per feature (11 features = 55+ tests)
├── tier2-boundary-corner.ts       # Tier 2: Boundary value & stress tests (0-scores, 100%, Thai unicode, extremes)
├── tier3-cross-feature-pairwise.ts# Tier 3: Multi-feature end-to-end combinatorial workflows
└── tier4-real-world-workload.ts   # Tier 4: Real-world operational cycles for pilot-team-eng & pilot-team-ops
scripts/
└── run-e2e-tests.ts               # Master executable CLI test runner with ANSI reporting & exit codes
```

### 4.1 Coverage Thresholds
- **Tier 1 (Feature Coverage)**: 100% of the 11 designated features must be covered with **at least 5 automated tests each** (minimum 55 tests).
- **Tier 2 (Boundary & Corner Cases)**: 100% of identified mathematical, linguistic, and structural boundaries covered (minimum 8 tests).
- **Tier 3 (Cross-Feature Combinations)**: Complete multi-stage workflow combinations (minimum 6 tests).
- **Tier 4 (Real-World Workload Scenarios)**: Complete pilot cycle execution for both `pilot-team-eng` and `pilot-team-ops` (minimum 2 comprehensive scenarios).

---

## 5. Execution Instructions

### Running the Test Suite
```bash
# Execute full E2E test suite across all 4 tiers
npx tsx scripts/run-e2e-tests.ts

# Execute specific tier via CLI filter
npx tsx scripts/run-e2e-tests.ts --tier=1
npx tsx scripts/run-e2e-tests.ts --tier=2
npx tsx scripts/run-e2e-tests.ts --tier=3
npx tsx scripts/run-e2e-tests.ts --tier=4
```

### Exit Codes & CI/CD Semantics
- **Exit Code `0`**: All test cases across all executed tiers passed without regression.
- **Exit Code `1`**: One or more test assertions failed, or an unhandled runtime error occurred.
