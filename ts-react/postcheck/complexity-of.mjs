#!/usr/bin/env node
// complexity-of.mjs — one function's complexity out of an ESLint JSON report.
//
//   node complexity-of.mjs <eslint-json-report> <function> cognitive|cyclomatic
//
// postcheck/lib.sh runs ESLint with `--no-inline-config` and the measuring rule
// at threshold 0 (`sonarjs/cognitive-complexity` for cognitive, the core
// `complexity` rule for cyclomatic), so every function in scope draws one
// message carrying its number:
//   "Refactor this function to reduce its Cognitive Complexity from 23 to the 0 allowed."
//   "Function 'pick' has a complexity of 7. Maximum allowed is 0."
// ESLint anchors the message on the function's head: its name for a
// declaration or a method, the `=>` (or the parameter list) of an arrow. This
// script reads each reported file, lists every function-shaped declaration
// with its name and start line, and attributes a message to the nearest
// declaration that starts at or above it; the messages attributed to
// <function> give its complexity, the highest when it is defined more than
// once in scope. Prints that number. A function that is declared in scope but
// drew no message has complexity 0 (the rules report only above the
// threshold); a function declared nowhere in scope prints nothing and exits 1.
import { readFileSync } from 'node:fs'

const [reportPath, target, kind] = process.argv.slice(2)
if (!reportPath || !target || !['cognitive', 'cyclomatic'].includes(kind)) {
  console.error('usage: complexity-of.mjs <eslint-json-report> <function> cognitive|cyclomatic')
  process.exit(2)
}

const RULE = kind === 'cognitive' ? 'sonarjs/cognitive-complexity' : 'complexity'
const NUMBER = kind === 'cognitive' ? /Cognitive Complexity from (\d+) to/ : /complexity of (\d+)\./

const ID = '[A-Za-z_$][\\w$]*'
const KEYWORDS = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'typeof', 'await',
  'new', 'throw', 'else', 'do', 'try', 'import', 'export', 'super', 'void', 'delete'
])
// Each pattern captures the declared name; a line may start more than one.
const DECLARATIONS = [
  new RegExp(`\\bfunction\\s*\\*?\\s*(${ID})\\s*[<(]`, 'g'),
  // const name = (…) =>, = async (…) =>, = function, = <T>(…) =>, = x =>
  new RegExp(`\\b(?:const|let|var)\\s+(${ID})\\s*(?::[^=]*)?=\\s*(?:async\\s+)?(?:\\(|function\\b|<|${ID}\\s*=>)`, 'g'),
  // class or object method: the line opens with modifiers and the name, then "("
  new RegExp(`^\\s*(?:(?:public|private|protected|static|readonly|async|override|get|set|\\*)\\s+)*(${ID})\\s*(?:<[^>]*>)?\\(`),
  // object-literal property holding a function
  new RegExp(`^\\s*(${ID})\\s*:\\s*(?:async\\s+)?(?:\\(|function\\b)`)
]

function declarations(lines) {
  const out = [] // { line, name }
  lines.forEach((text, i) => {
    for (const re of DECLARATIONS) {
      re.lastIndex = 0
      let m
      if (re.global) {
        while ((m = re.exec(text)) !== null) {
          if (!KEYWORDS.has(m[1])) out.push({ line: i + 1, name: m[1] })
        }
      } else if ((m = re.exec(text)) !== null && !KEYWORDS.has(m[1])) {
        out.push({ line: i + 1, name: m[1] })
      }
    }
  })
  return out
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'))
let declared = false
let best = -1
for (const file of report) {
  let lines
  try {
    lines = readFileSync(file.filePath, 'utf8').split('\n')
  } catch {
    continue
  }
  const decls = declarations(lines)
  if (decls.some((d) => d.name === target)) declared = true
  for (const msg of file.messages ?? []) {
    if (msg.ruleId !== RULE) continue
    const n = NUMBER.exec(msg.message ?? '')
    if (!n) continue
    let owner = null
    for (const d of decls) {
      if (d.line <= msg.line && (owner === null || d.line >= owner.line)) owner = d
    }
    if (owner && owner.name === target) best = Math.max(best, Number(n[1]))
  }
}
if (best >= 0) {
  console.log(best)
} else if (declared) {
  console.log(0)
} else {
  process.exit(1)
}
