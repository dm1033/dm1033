// `knownBug` marks a test that asserts the CORRECT behaviour for a defect that is confirmed
// to exist today. It is registered with `it.fails`, so the suite stays green while the bug is
// open and turns red the moment the bug is fixed (then swap `knownBug` for `it`).
// Run with CPP_STRICT_BUGS=1 to see every open defect fail with its real assertion message.
import { it } from 'vitest'

export const knownBug: typeof it.fails = process.env.CPP_STRICT_BUGS ? (it as unknown as typeof it.fails) : it.fails
