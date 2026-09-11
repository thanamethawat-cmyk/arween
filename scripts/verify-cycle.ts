/**
 * ARWEEN Superior Operations Management Cycle
 * Verification Script Wrapper
 *
 * This wrapper aliases scripts/verify-cycle.ts to scripts/verify-full-cycle.ts,
 * ensuring both direct script invocation (`tsx scripts/verify-cycle.ts`) and
 * `npm run verify:cycle` execute the complete 8-stage verification pipeline seamlessly.
 */
import "./verify-full-cycle";
