#!/usr/bin/env tsx
/**
 * ARWEEN Superior Operations Management Cycle
 * Master Executable E2E Test Runner
 *
 * Usage:
 *   npx tsx scripts/run-e2e-tests.ts
 *   npx tsx scripts/run-e2e-tests.ts --tier=1
 *   npx tsx scripts/run-e2e-tests.ts --tier=2
 *   npx tsx scripts/run-e2e-tests.ts --tier=3
 *   npx tsx scripts/run-e2e-tests.ts --tier=4
 */

import { config } from "dotenv";
config();

import { TestHarness, type TestSuiteSummary } from "../tests/e2e/harness";

// Import all test suites to register tests
import "../tests/e2e/tier1-feature-coverage";
import "../tests/e2e/tier2-boundary-corner";
import "../tests/e2e/tier3-cross-feature-pairwise";
import "../tests/e2e/tier4-real-world-workload";

// ANSI Color Helpers
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

function parseArgs(): { tierFilter?: number } {
  const args = process.argv.slice(2);
  let tierFilter: number | undefined;

  for (const arg of args) {
    if (arg.startsWith("--tier=")) {
      const val = parseInt(arg.replace("--tier=", ""), 10);
      if ([1, 2, 3, 4].includes(val)) {
        tierFilter = val;
      }
    }
  }

  return { tierFilter };
}

function printBanner(filterTier?: number) {
  console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   🛡️  ARWEEN SUPERIOR OPERATIONS MANAGEMENT CYCLE — E2E TEST RUNNER  ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.dim}Timestamp:  ${new Date().toISOString()}${colors.reset}`);
  console.log(`${colors.dim}Mode:       Opaque-Box E2E Requirements Verification${colors.reset}`);
  console.log(`${colors.dim}Scope:      ${filterTier ? `Tier ${filterTier} Only` : "All Tiers (Tiers 1–4)"}${colors.reset}\n`);
}

function printResultsTable(summary: TestSuiteSummary) {
  console.log(`${colors.bold}--- 📋 TIER BREAKDOWN ---${colors.reset}`);
  console.log(`----------------------------------------------------------------------`);
  console.log(` Tier    Name                                   Total   Pass   Fail `);
  console.log(`----------------------------------------------------------------------`);

  const tierNames: Record<number, string> = {
    1: "Feature Coverage (>=5 per feature)        ",
    2: "Boundary Values & Corner Cases            ",
    3: "Cross-Feature Pairwise Combinations       ",
    4: "Real-World Workload Scenarios             ",
  };

  for (let t = 1; t <= 4; t++) {
    const data = summary.tierBreakdown[t] || { total: 0, passed: 0, failed: 0 };
    if (data.total === 0) continue;
    const passColor = data.failed === 0 ? colors.green : colors.yellow;
    const failColor = data.failed > 0 ? colors.red : colors.dim;
    console.log(
      ` Tier ${t}  ${tierNames[t]}  ` +
      `${String(data.total).padStart(5)}   ` +
      `${passColor}${String(data.passed).padStart(4)}${colors.reset}   ` +
      `${failColor}${String(data.failed).padStart(4)}${colors.reset}`
    );
  }
  console.log(`----------------------------------------------------------------------\n`);

  console.log(`${colors.bold}--- 🎯 TIER 1 FEATURE COVERAGE CHECKLIST (Min >= 5 tests) ---${colors.reset}`);
  console.log(`----------------------------------------------------------------------`);
  console.log(` Feature Name                      Tests   Pass   Fail   Coverage Status`);
  console.log(`----------------------------------------------------------------------`);

  for (const [feat, stats] of Object.entries(summary.featureBreakdown)) {
    if (feat === "Boundary & Corner" || feat === "Cross-Feature Pairwise" || feat === "Real-World Workload") {
      continue;
    }
    const isTargetMet = stats.total >= 5 && stats.failed === 0;
    const statusLabel = isTargetMet
      ? `${colors.green}✓ SUFFICIENT (>=5)${colors.reset}`
      : `${colors.red}✗ INSUFFICIENT${colors.reset}`;
    console.log(
      ` ${feat.padEnd(32)}  ` +
      `${String(stats.total).padStart(5)}   ` +
      `${colors.green}${String(stats.passed).padStart(4)}${colors.reset}   ` +
      `${stats.failed > 0 ? colors.red : colors.dim}${String(stats.failed).padStart(4)}${colors.reset}   ` +
      `${statusLabel}`
    );
  }
  console.log(`----------------------------------------------------------------------\n`);
}

function printFailures(summary: TestSuiteSummary) {
  const failures = summary.results.filter((r) => r.status === "FAILED");
  if (failures.length === 0) return;

  console.log(`${colors.bold}${colors.red}--- ❌ TEST FAILURES (${failures.length}) ---${colors.reset}`);
  for (const fail of failures) {
    console.log(`\n${colors.red}[FAIL] ${fail.id}: ${fail.name}${colors.reset}`);
    if (fail.error) {
      console.log(`  ${colors.dim}${fail.error.message}${colors.reset}`);
      if (fail.error.stack) {
        const stackLines = fail.error.stack.split("\n").slice(1, 4).join("\n");
        console.log(`  ${colors.dim}${stackLines}${colors.reset}`);
      }
    }
  }
  console.log("");
}

async function main() {
  const { tierFilter } = parseArgs();
  printBanner(tierFilter);

  const harness = TestHarness.getInstance();
  const summary = await harness.run(tierFilter);

  printResultsTable(summary);

  if (summary.failed > 0) {
    printFailures(summary);
  }

  const allPassed = summary.failed === 0 && summary.total > 0;
  console.log(`${colors.bold}======================================================================${colors.reset}`);
  if (allPassed) {
    console.log(
      `${colors.bold}${colors.green}   🎉 ALL ${summary.total} E2E TESTS PASSED SUCCESSFULLY (${summary.durationMs} ms)${colors.reset}`
    );
    console.log(`${colors.bold}======================================================================\n${colors.reset}`);
    process.exit(0);
  } else {
    console.log(
      `${colors.bold}${colors.red}   🚨 ${summary.failed} OF ${summary.total} E2E TESTS FAILED (${summary.durationMs} ms)${colors.reset}`
    );
    console.log(`${colors.bold}======================================================================\n${colors.reset}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${colors.red}FATAL ERROR IN TEST RUNNER:${colors.reset}`, err);
  process.exit(1);
});
