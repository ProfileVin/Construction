#!/usr/bin/env node
/**
 * Stop hook. Non-blocking reminder to keep the trackers current.
 * Always exits 0 — this must never interrupt or loop the session.
 */
try {
  process.stderr.write(
    [
      '[AI workflow] Before moving on, if code changed this turn:',
      '  - update docs/FEATURES.md and/or docs/BUGS.md status',
      '  - append an entry to docs/DEVELOPMENT_HISTORY.md (date, what/why, files, FEAT/BUG/ADR refs, verification)',
      '  - add an ADR to docs/DECISIONS.md for any notable decision',
      '',
    ].join('\n'),
  )
} catch {
  // ignore
}
process.exit(0)
