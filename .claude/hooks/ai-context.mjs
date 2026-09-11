#!/usr/bin/env node
/**
 * UserPromptSubmit hook.
 * Prints a digest of the project trackers so every prompt is evaluated against
 * the current feature/bug state and recent development history.
 *
 * Contract: stdout on UserPromptSubmit is added to the model's context.
 * This script must NEVER exit non-zero and must NEVER throw — a missing tracker
 * file cannot be allowed to block prompt submission.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const HISTORY_TAIL_LINES = 120

function readSafe(relPath) {
  try {
    return readFileSync(resolve(root, relPath), 'utf8').trim()
  } catch {
    return null
  }
}

function tail(text, n) {
  const lines = text.split(/\r?\n/)
  if (lines.length <= n) return text
  return `... (${lines.length - n} earlier lines omitted — see docs/DEVELOPMENT_HISTORY.md)\n` +
    lines.slice(-n).join('\n')
}

try {
  const features = readSafe('docs/FEATURES.md')
  const bugs = readSafe('docs/BUGS.md')
  const history = readSafe('docs/DEVELOPMENT_HISTORY.md')

  if (!features && !bugs && !history) {
    // Nothing to inject yet; stay silent.
    process.exit(0)
  }

  const out = []
  out.push('=== PROJECT TRACKING (auto-injected — full history in docs/DEVELOPMENT_HISTORY.md) ===')
  out.push('Read docs/ARCHITECTURE.md and docs/DECISIONS.md before non-trivial work.')
  out.push('After any code change: update FEATURES.md / BUGS.md, append a DEVELOPMENT_HISTORY.md entry.')
  out.push('')

  if (features) {
    out.push('--- docs/FEATURES.md ---')
    out.push(features)
    out.push('')
  }
  if (bugs) {
    out.push('--- docs/BUGS.md ---')
    out.push(bugs)
    out.push('')
  }
  if (history) {
    out.push('--- docs/DEVELOPMENT_HISTORY.md (recent) ---')
    out.push(tail(history, HISTORY_TAIL_LINES))
  }
  out.push('=== END PROJECT TRACKING ===')

  process.stdout.write(out.join('\n') + '\n')
  process.exit(0)
} catch {
  // Never block prompt submission.
  process.exit(0)
}
