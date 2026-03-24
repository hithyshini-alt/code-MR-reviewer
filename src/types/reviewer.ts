export type RuleId = string

export type BuiltInRuleKey = 'noSx' | 'noDeprecatedTags' | 'optionalChaining'

export type RuleMatcherType = 'builtin' | 'regex'

export type RuleSeverity = 'error' | 'warning' | 'info'

export type ReviewRule = {
    id: RuleId
    key?: BuiltInRuleKey
    matcherType: RuleMatcherType
    title: string
    enabled: boolean
    comment: string
    severity: RuleSeverity
    pattern?: string
    category?: 'bestpractice' | 'security' | 'performance' | 'readability' | 'maintainability'
    suggestion?: string
}

export type Finding = {
    ruleId: RuleId
    ruleTitle: string
    severity: RuleSeverity
    category: 'bestpractice' | 'security' | 'performance' | 'readability' | 'maintainability'
    suggestion?: string
    filePath: string
    lineNumber: number | null
    snippet: string
    comment: string
}

export type MergeRequestTarget = {
    apiBaseUrl: string
    projectPath: string
    mergeRequestIid: number
}

export type GitLabChange = {
    new_path: string
    old_path: string
    diff: string
}

export type GitLabChangesResponse = {
    changes: GitLabChange[]
}

export type FindingsSummary = Record<RuleId, number>

export type BuiltInFindingsSummary = {
    noSx: number
    noDeprecatedTags: number
    optionalChaining: number
    custom: number
}

export type ReviewHistoryItem = {
    id: string
    mergeRequestUrl: string
    createdAt: string
    totalFindings: number
    summary: FindingsSummary
}
