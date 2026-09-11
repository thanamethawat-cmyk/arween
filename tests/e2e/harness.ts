/**
 * ARWEEN E2E Test Harness & Execution Registry
 * Provides assertion helpers, test registration, execution lifecycle,
 * and reporting for opaque-box E2E testing.
 */

export type TestStatus = "PASSED" | "FAILED" | "SKIPPED";

export interface TestCaseResult {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  feature?: string;
  status: TestStatus;
  durationMs: number;
  error?: Error;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  tierBreakdown: Record<number, { total: number; passed: number; failed: number }>;
  featureBreakdown: Record<string, { total: number; passed: number; failed: number }>;
  results: TestCaseResult[];
}

export type TestFn = () => void | Promise<void>;

interface RegisteredTest {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  feature?: string;
  fn: TestFn;
}

export class TestHarness {
  private static instance: TestHarness;
  private tests: RegisteredTest[] = [];

  public static getInstance(): TestHarness {
    if (!TestHarness.instance) {
      TestHarness.instance = new TestHarness();
    }
    return TestHarness.instance;
  }

  public register(
    tier: 1 | 2 | 3 | 4,
    feature: string,
    name: string,
    fn: TestFn
  ): void {
    const id = `T${tier}-${feature ? feature.replace(/\s+/g, "_") + "-" : ""}${this.tests.length + 1}`;
    this.tests.push({ id, name, tier, feature, fn });
  }

  public getTests(): RegisteredTest[] {
    return [...this.tests];
  }

  public clear(): void {
    this.tests = [];
  }

  public async run(filterTier?: number): Promise<TestSuiteSummary> {
    const startTime = Date.now();
    const results: TestCaseResult[] = [];
    const tierBreakdown: Record<number, { total: number; passed: number; failed: number }> = {
      1: { total: 0, passed: 0, failed: 0 },
      2: { total: 0, passed: 0, failed: 0 },
      3: { total: 0, passed: 0, failed: 0 },
      4: { total: 0, passed: 0, failed: 0 },
    };
    const featureBreakdown: Record<string, { total: number; passed: number; failed: number }> = {};

    const testsToRun = filterTier
      ? this.tests.filter((t) => t.tier === filterTier)
      : this.tests;

    for (const test of testsToRun) {
      const feat = test.feature || "General";
      if (!featureBreakdown[feat]) {
        featureBreakdown[feat] = { total: 0, passed: 0, failed: 0 };
      }
      featureBreakdown[feat].total++;
      tierBreakdown[test.tier].total++;

      const testStart = Date.now();
      try {
        await test.fn();
        const duration = Date.now() - testStart;
        results.push({
          id: test.id,
          name: test.name,
          tier: test.tier,
          feature: test.feature,
          status: "PASSED",
          durationMs: duration,
        });
        tierBreakdown[test.tier].passed++;
        featureBreakdown[feat].passed++;
      } catch (err: unknown) {
        const duration = Date.now() - testStart;
        const error = err instanceof Error ? err : new Error(String(err));
        results.push({
          id: test.id,
          name: test.name,
          tier: test.tier,
          feature: test.feature,
          status: "FAILED",
          durationMs: duration,
          error,
        });
        tierBreakdown[test.tier].failed++;
        featureBreakdown[feat].failed++;
      }
    }

    const totalDuration = Date.now() - startTime;
    const passed = results.filter((r) => r.status === "PASSED").length;
    const failed = results.filter((r) => r.status === "FAILED").length;
    const skipped = testsToRun.length - (passed + failed);

    return {
      total: testsToRun.length,
      passed,
      failed,
      skipped,
      durationMs: totalDuration,
      tierBreakdown,
      featureBreakdown,
      results,
    };
  }
}

// ---------------------------------------------------------------------------
// Assertion Utilities
// ---------------------------------------------------------------------------

export function assert(condition: boolean, message: string = "Assertion failed"): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILURE]: ${message}`);
  }
}

export function assertEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      `[ASSERTION EQUALITY FAILURE]: ${message || "Expected values to be strictly equal"}\n  Expected: ${JSON.stringify(expected)}\n  Actual:   ${JSON.stringify(actual)}`
    );
  }
}

export function assertDeepEquals<T>(actual: T, expected: T, message?: string): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `[ASSERTION DEEP EQUALITY FAILURE]: ${message || "Expected objects to be deeply equal"}\n  Expected: ${expectedJson}\n  Actual:   ${actualJson}`
    );
  }
}

export function assertCloseTo(actual: number, expected: number, tolerance: number = 0.01, message?: string): void {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(
      `[ASSERTION APPROXIMATION FAILURE]: ${message || `Expected ${actual} to be close to ${expected} within ±${tolerance}`}\n  Diff: ${diff}`
    );
  }
}

export function assertTrue(actual: boolean, message?: string): void {
  assertEquals(actual, true, message || "Expected value to be true");
}

export function assertFalse(actual: boolean, message?: string): void {
  assertEquals(actual, false, message || "Expected value to be false");
}

export async function assertThrows(
  fn: () => unknown | Promise<unknown>,
  expectedSubstring?: string,
  message?: string
): Promise<void> {
  let threw = false;
  let errorMsg = "";
  try {
    await fn();
  } catch (err: unknown) {
    threw = true;
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  if (!threw) {
    throw new Error(`[ASSERTION EXCEPTION FAILURE]: ${message || "Expected function to throw an exception, but it succeeded"}`);
  }

  if (expectedSubstring && !errorMsg.includes(expectedSubstring)) {
    throw new Error(
      `[ASSERTION ERROR MESSAGE MISMATCH]: ${message || `Expected error to include "${expectedSubstring}"`}\n  Actual error: "${errorMsg}"`
    );
  }
}

// ---------------------------------------------------------------------------
// Test Registration DSL Helper
// ---------------------------------------------------------------------------

export const test = (
  tier: 1 | 2 | 3 | 4,
  feature: string,
  name: string,
  fn: TestFn
): void => {
  TestHarness.getInstance().register(tier, feature, name, fn);
};
