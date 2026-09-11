#!/usr/bin/env tsx
/**
 * ARWEEN Superior Operations Management Cycle
 * CLI Runner for Adversarial Challenger Test Suite
 *
 * Usage:
 *   npx tsx scripts/run-adversarial-tests.ts
 */

import { config } from "dotenv";
config();

import { runAdversarialTestSuite } from "../tests/adversarial-challenger";

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

async function main() {
  console.log(`\n${c.bold}${c.magenta}======================================================================${c.reset}`);
  console.log(`${c.bold}${c.magenta}   ⚔️  ARWEEN ADVERSARIAL CHALLENGER STRESS SUITE (challenger_1)     ${c.reset}`);
  console.log(`${c.bold}${c.magenta}======================================================================${c.reset}`);
  console.log(`${c.dim}Timestamp:  ${new Date().toISOString()}${c.reset}`);
  console.log(`${c.dim}Target:     AI Scoring, Anti-Gaming Detection & Contribution Normalization${c.reset}`);
  console.log(`${c.dim}Focus:      Thai Diacritics, Largest Remainder Invariant, Zero Preservation${c.reset}\n`);

  const { total, passed, failed, results } = await runAdversarialTestSuite();

  // Group and print results
  const groups = Array.from(new Set(results.map((r) => r.group)));

  for (const group of groups) {
    console.log(`${c.bold}${c.cyan}--- ${group} ---${c.reset}`);
    const groupTests = results.filter((r) => r.group === group);
    for (const test of groupTests) {
      const icon = test.passed ? `${c.green}✅ PASS${c.reset}` : `${c.red}❌ FAIL${c.reset}`;
      console.log(`  ${icon}  ${test.name}`);
      if (!test.passed && test.error) {
        console.log(`      ${c.red}Error: ${test.error}${c.reset}`);
      }
    }
    console.log("");
  }

  console.log(`${c.bold}======================================================================${c.reset}`);
  if (failed === 0) {
    console.log(
      `${c.bold}${c.green}   🎉 ALL ${total} ADVERSARIAL STRESS TESTS PASSED SUCCESSFULLY!${c.reset}`
    );
    console.log(`${c.dim}   Strict Invariants Verified: Sum = 100.00%, Zero-Coercion Immune, Thai Robust${c.reset}`);
    console.log(`${c.bold}======================================================================\n${c.reset}`);
    process.exit(0);
  } else {
    console.log(
      `${c.bold}${c.red}   🚨 ${failed} OF ${total} ADVERSARIAL STRESS TESTS FAILED!${c.reset}`
    );
    console.log(`${c.bold}======================================================================\n${c.reset}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${c.red}Fatal Error in Adversarial Runner:${c.reset}`, err);
  process.exit(1);
});
