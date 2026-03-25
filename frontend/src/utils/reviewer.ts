import type {
    BuiltInFindingsSummary,
    Finding,
    GitLabChange,
    MergeRequestTarget,
    ReviewRule,
} from '../types/reviewer'

export const defaultRules: ReviewRule[] = [
    {
        id: 'noSx',
        key: 'noSx',
        matcherType: 'builtin',
        title: 'No sx prop usage',
        enabled: true,
        comment: 'Sx tags are there.',
        severity: 'error',
        category: 'maintainability',
        suggestion: 'Use styled components or CSS modules instead of sx prop.',
    },
    {
        id: 'noDeprecatedTags',
        key: 'noDeprecatedTags',
        matcherType: 'builtin',
        title: 'No deprecated HTML tags',
        enabled: true,
        comment: 'Deprecated tags are there.',
        severity: 'error',
        category: 'maintainability',
        suggestion: 'Replace deprecated HTML tags with modern semantic equivalents.',
    },
    {
        id: 'optionalChaining',
        key: 'optionalChaining',
        matcherType: 'builtin',
        title: 'Optional chaining must be used',
        enabled: true,
        comment: 'Optional chaining must be there.',
        severity: 'warning',
        category: 'bestpractice',
        suggestion: 'Use optional chaining (`?.`) when accessing nested properties.',
    },
    {
        id: 'warn-no-console-log',
        matcherType: 'regex',
        title: 'Avoid console.log',
        enabled: true,
        comment: 'Avoid console.log in committed code.',
        severity: 'warning',
        pattern: '\\bconsole\\.log\\s*\\(',
        category: 'readability',
        suggestion: 'Replace console.log with application logger or remove debug output.',
    },
    {
        id: 'warn-no-debugger',
        matcherType: 'regex',
        title: 'Avoid debugger statements',
        enabled: true,
        comment: 'Debugger statement found. Remove it before merge.',
        severity: 'warning',
        pattern: '\\bdebugger\\b',
        category: 'bestpractice',
        suggestion: 'Remove debugger statements from production code.',
    },
    {
        id: 'warn-no-any',
        matcherType: 'regex',
        title: 'Avoid any type',
        enabled: true,
        comment: 'Avoid using any. Prefer a specific type.',
        severity: 'warning',
        pattern: ':\\s*any\\b|<\\s*any\\s*>',
        category: 'maintainability',
        suggestion: 'Use explicit interfaces/types instead of any.',
    },
    {
        id: 'warn-no-ts-ignore',
        matcherType: 'regex',
        title: 'Avoid @ts-ignore',
        enabled: true,
        comment: 'Avoid @ts-ignore. Fix the type issue properly.',
        severity: 'warning',
        pattern: '@ts-ignore',
        category: 'maintainability',
        suggestion: 'Resolve the type issue instead of suppressing it with @ts-ignore.',
    },
    {
        id: 'warn-non-null-assertion',
        matcherType: 'regex',
        title: 'Avoid non-null assertion',
        enabled: true,
        comment: 'Non-null assertion used. Prefer safe checks.',
        severity: 'warning',
        pattern: '\\b[A-Za-z_$][\\w$]*!\\.',
    },
    {
        id: 'warn-no-var',
        matcherType: 'regex',
        title: 'Avoid var keyword',
        enabled: true,
        comment: 'Use let/const instead of var.',
        severity: 'warning',
        pattern: '\\bvar\\s+',
    },
    {
        id: 'warn-let-prefer-const',
        matcherType: 'regex',
        title: 'Review let usage',
        enabled: false,
        comment: 'Consider const if variable is not reassigned.',
        severity: 'warning',
        pattern: '\\blet\\s+',
    },
    {
        id: 'warn-no-nested-ternary',
        matcherType: 'regex',
        title: 'Avoid nested ternary',
        enabled: true,
        comment: 'Nested ternary reduces readability.',
        severity: 'warning',
        pattern: '\\?.*\\?.*:',
    },
    {
        id: 'warn-loose-equality',
        matcherType: 'regex',
        title: 'Avoid loose equality',
        enabled: true,
        comment: 'Use strict equality operators (=== / !==).',
        severity: 'warning',
        pattern: '(^|[^=!])==([^=]|$)|(^|[^!])!=([^=]|$)',
    },
    {
        id: 'warn-promise-then',
        matcherType: 'regex',
        title: 'Prefer async/await over .then',
        enabled: false,
        comment: 'Consider async/await for better readability.',
        severity: 'warning',
        pattern: '\\.then\\s*\\(',
    },
    {
        id: 'warn-settimeout-no-delay',
        matcherType: 'regex',
        title: 'setTimeout missing delay',
        enabled: true,
        comment: 'Explicit delay is recommended for setTimeout.',
        severity: 'warning',
        pattern: 'setTimeout\\s*\\([^,\\)]*\\)',
    },
    {
        id: 'warn-inline-style-prop',
        matcherType: 'regex',
        title: 'Avoid inline style prop',
        enabled: true,
        comment: 'Avoid inline style prop for maintainability.',
        severity: 'warning',
        pattern: '\\bstyle\\s*=\\s*\\{',
    },
    {
        id: 'perf-003',
        matcherType: 'regex',
        title: 'Avoid inline function in JSX',
        enabled: true,
        comment:
            'Inline functions in JSX cause re-renders on every render. Use useCallback.',
        severity: 'info',
        pattern: 'on[A-Z]\w+=\{(?:\s*\(|\s*function\s*\()',
        category: 'performance',
        suggestion: 'Extract the handler and memoize it with useCallback when needed.',
    },
    {
        id: 'warn-dangerously-set-inner-html',
        matcherType: 'regex',
        title: 'Avoid dangerouslySetInnerHTML',
        enabled: true,
        comment: 'dangerouslySetInnerHTML can introduce XSS risk.',
        severity: 'warning',
        pattern: 'dangerouslySetInnerHTML',
        category: 'security',
        suggestion: 'Sanitize content or avoid using dangerouslySetInnerHTML.',
    },
    {
        id: 'warn-innerhtml-assignment',
        matcherType: 'regex',
        title: 'Avoid innerHTML assignment',
        enabled: true,
        comment: 'Direct innerHTML assignment can introduce XSS risk.',
        severity: 'warning',
        pattern: '\\.innerHTML\\s*=',
        category: 'security',
        suggestion: 'Avoid direct innerHTML assignment; use safe rendering APIs.',
    },
    {
        id: 'warn-document-write',
        matcherType: 'regex',
        title: 'Avoid document.write',
        enabled: true,
        comment: 'document.write is deprecated for modern apps.',
        severity: 'warning',
        pattern: 'document\\.write\\s*\\(',
    },
    {
        id: 'warn-no-eval',
        matcherType: 'regex',
        title: 'Avoid eval',
        enabled: true,
        comment: 'eval is unsafe and should not be used.',
        severity: 'warning',
        pattern: '\\beval\\s*\\(',
        category: 'security',
        suggestion: 'Replace eval with explicit parsing or safe function mapping.',
    },
    {
        id: 'warn-delete-operator',
        matcherType: 'regex',
        title: 'Avoid delete operator',
        enabled: true,
        comment: 'delete operator can hurt performance and predictability.',
        severity: 'warning',
        pattern: '\\bdelete\\s+',
    },
    {
        id: 'warn-empty-catch',
        matcherType: 'regex',
        title: 'Avoid empty catch block',
        enabled: true,
        comment: 'Empty catch blocks hide runtime problems.',
        severity: 'warning',
        pattern: 'catch\\s*\\([^\\)]*\\)\\s*\\{\\s*\\}',
    },
    {
        id: 'warn-for-in',
        matcherType: 'regex',
        title: 'Review for...in usage',
        enabled: false,
        comment: 'for...in may iterate prototype keys unexpectedly.',
        severity: 'warning',
        pattern: '\\bfor\\s*\\([^\\)]*\\bin\\b',
    },
    {
        id: 'warn-array-index-key',
        matcherType: 'regex',
        title: 'Avoid index as React key',
        enabled: true,
        comment: 'Using index as key can cause unstable list rendering.',
        severity: 'warning',
        pattern: 'key\\s*=\\s*\\{\\s*index\\s*\\}',
        category: 'bestpractice',
        suggestion: 'Use a stable unique identifier for React key props.',
    },
    {
        id: 'warn-direct-date-now',
        matcherType: 'regex',
        title: 'Review Date.now usage',
        enabled: false,
        comment: 'Prefer injecting time source for testability where possible.',
        severity: 'warning',
        pattern: 'Date\\.now\\s*\\(',
    },
    {
        id: 'warn-alert-usage',
        matcherType: 'regex',
        title: 'Avoid alert usage',
        enabled: true,
        comment: 'alert is intrusive and not suitable for production UX.',
        severity: 'warning',
        pattern: '\\balert\\s*\\(',
        category: 'bestpractice',
        suggestion: 'Use app-level notifications or dialogs instead of alert.',
    },
    {
        id: 'warn-confirm-usage',
        matcherType: 'regex',
        title: 'Avoid confirm usage',
        enabled: true,
        comment: 'confirm blocks execution and creates inconsistent UX.',
        severity: 'warning',
        pattern: '\\bconfirm\\s*\\(',
        category: 'bestpractice',
        suggestion: 'Use a custom confirmation modal/dialog component.',
    },
    {
        id: 'warn-prompt-usage',
        matcherType: 'regex',
        title: 'Avoid prompt usage',
        enabled: true,
        comment: 'prompt is blocking and hard to validate safely.',
        severity: 'warning',
        pattern: '\\bprompt\\s*\\(',
        category: 'bestpractice',
        suggestion: 'Collect input through a controlled form/modal flow.',
    },
    {
        id: 'warn-localstorage-token',
        matcherType: 'regex',
        title: 'Review localStorage token usage',
        enabled: true,
        comment: 'Sensitive auth values in localStorage can increase XSS risk.',
        severity: 'warning',
        pattern: 'localStorage\\.(setItem|getItem)\\s*\\(\\s*["\'`]\\s*(token|auth|jwt)',
        category: 'security',
        suggestion:
            'Prefer secure cookies or scoped storage strategy for auth material.',
    },
    {
        id: 'warn-innertext-assignment',
        matcherType: 'regex',
        title: 'Review direct innerText assignment',
        enabled: false,
        comment: 'Direct DOM text assignment may indicate imperative UI updates.',
        severity: 'info',
        pattern: '\\.innerText\\s*=',
        category: 'maintainability',
        suggestion: 'Prefer framework rendering/state updates when possible.',
    },
    {
        id: 'warn-window-global',
        matcherType: 'regex',
        title: 'Review direct window usage',
        enabled: false,
        comment: 'Direct window access can break SSR and tests.',
        severity: 'warning',
        pattern: '\\bwindow\\.',
    },
]

const deprecatedHtmlTagPattern =
    /<\s*(acronym|applet|basefont|big|blink|center|dir|font|frame|frameset|isindex|marquee|noframes|s|strike|tt|u)\b/i

export function parseMergeRequestUrl(inputUrl: string): MergeRequestTarget {
    const parsedUrl = new URL(inputUrl.trim())
    const match = parsedUrl.pathname.match(/^\/(.+)\/-\/merge_requests\/(\d+)\/?$/)

    if (!match) {
        throw new Error('Invalid Merge Request URL format.')
    }

    return {
        apiBaseUrl: `${parsedUrl.protocol}//${parsedUrl.host}/api/v4`,
        projectPath: match[1],
        mergeRequestIid: Number(match[2]),
    }
}

function getAddedLineNumber(diffLine: string): number | null {
    const match = diffLine.match(/^@@\s+-\d+(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/)
    if (!match) {
        return null
    }

    return Number(match[1])
}

export function analyzeDiff(changes: GitLabChange[], rules: ReviewRule[]): Finding[] {
    const findings: Finding[] = []

    const activeRules = rules.filter((rule) => rule.enabled)

    for (const change of changes) {
        const filePath = change.new_path || change.old_path
        const diffLines = change.diff.split('\n')
        let currentAddedLineNumber: number | null = null

        for (const diffLine of diffLines) {
            if (diffLine.startsWith('@@')) {
                currentAddedLineNumber = getAddedLineNumber(diffLine)
                continue
            }

            if (diffLine.startsWith('+') && !diffLine.startsWith('+++')) {
                const codeLine = diffLine.slice(1)
                const lineNumber = currentAddedLineNumber

                for (const rule of activeRules) {
                    let matched = false

                    if (rule.matcherType === 'builtin') {
                        if (rule.key === 'noSx') {
                            matched = /\bsx\s*=\s*\{/.test(codeLine)
                        }

                        if (rule.key === 'noDeprecatedTags') {
                            matched = deprecatedHtmlTagPattern.test(codeLine)
                        }

                        if (rule.key === 'optionalChaining') {
                            matched =
                                /\b[A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*/.test(codeLine) &&
                                !codeLine.includes('?.')
                        }
                    }

                    if (rule.matcherType === 'regex') {
                        if (!rule.pattern?.trim()) {
                            continue
                        }

                        try {
                            const regex = new RegExp(rule.pattern, 'i')
                            matched = regex.test(codeLine)
                        } catch {
                            matched = false
                        }
                    }

                    if (!matched) {
                        continue
                    }

                    findings.push({
                        ruleId: rule.id,
                        ruleTitle: rule.title,
                        severity: rule.severity,
                        category: rule.category || 'bestpractice',
                        suggestion: rule.suggestion,
                        filePath,
                        lineNumber,
                        snippet: codeLine,
                        comment: rule.comment.trim() || 'Review rule violated.',
                    })
                }

                if (currentAddedLineNumber !== null) {
                    currentAddedLineNumber += 1
                }
            }

            if (diffLine.startsWith(' ') && currentAddedLineNumber !== null) {
                currentAddedLineNumber += 1
            }
        }
    }

    return findings
}

export function summarizeFindings(
    findings: Finding[],
    rules: ReviewRule[],
): BuiltInFindingsSummary {
    const builtInById = new Map(
        rules
            .filter((rule) => rule.matcherType === 'builtin' && rule.key)
            .map((rule) => [rule.id, rule.key]),
    )

    const summary: BuiltInFindingsSummary = {
        noSx: 0,
        noDeprecatedTags: 0,
        optionalChaining: 0,
        custom: 0,
    }

    for (const finding of findings) {
        const builtInKey = builtInById.get(finding.ruleId)

        if (builtInKey === 'noSx') {
            summary.noSx += 1
            continue
        }

        if (builtInKey === 'noDeprecatedTags') {
            summary.noDeprecatedTags += 1
            continue
        }

        if (builtInKey === 'optionalChaining') {
            summary.optionalChaining += 1
            continue
        }

        summary.custom += 1
    }

    return summary
}
