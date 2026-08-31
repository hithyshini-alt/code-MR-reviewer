import type { BuiltInRuleKey, ReviewRule } from '../types/reviewer'

const API_BASE_URL =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
    'http://localhost:3001/api'

type BackendRule = {
    id: string
    title: string
    severity: 'error' | 'warning' | 'info'
    type: 'builtin' | 'regex'
    pattern: string | null
    comment: string
    category: 'bestpractice' | 'security' | 'performance' | 'readability' | 'maintainability' | null
    suggestion: string | null
    enabled: boolean
}

type RulesResponse = {
    rules: BackendRule[]
}

type RuleResponse = {
    rule: BackendRule
}

const BUILTIN_KEYS: BuiltInRuleKey[] = ['noSx', 'noDeprecatedTags', 'optionalChaining']

function parseBuiltInKey(input?: string | null): BuiltInRuleKey | undefined {
    if (!input) {
        return undefined
    }

    return BUILTIN_KEYS.find((key) => key === input)
}

function toReviewRule(rule: BackendRule): ReviewRule {
    const matcherType = rule.type === 'builtin' ? 'builtin' : 'regex'
    const key = matcherType === 'builtin' ? parseBuiltInKey(rule.pattern) : undefined

    return {
        id: rule.id,
        matcherType,
        key,
        title: rule.title,
        enabled: rule.enabled,
        comment: rule.comment,
        severity: rule.severity,
        pattern: rule.pattern || undefined,
        category: rule.category || undefined,
        suggestion: rule.suggestion || undefined,
    }
}

function fromReviewRule(rule: ReviewRule): Omit<BackendRule, 'id'> {
    const isBuiltIn = rule.matcherType === 'builtin'

    return {
        title: rule.title,
        severity: rule.severity,
        type: isBuiltIn ? 'builtin' : 'regex',
        pattern: isBuiltIn ? rule.key || null : rule.pattern || null,
        comment: rule.comment,
        category: rule.category || null,
        suggestion: rule.suggestion || null,
        enabled: rule.enabled,
    }
}

async function parseError(response: Response): Promise<string> {
    try {
        const data = (await response.json()) as { error?: string }
        if (data.error) {
            return data.error
        }
    } catch {
        // ignore
    }

    return `Request failed with status ${response.status}`
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(init?.headers || {}),
        },
    })

    if (!response.ok) {
        throw new Error(await parseError(response))
    }

    if (response.status === 204) {
        return undefined as T
    }

    return (await response.json()) as T
}

export async function fetchUserRules(token: string): Promise<ReviewRule[]> {
    const result = await request<RulesResponse>('/rules', token, { method: 'GET' })
    return result.rules.map(toReviewRule)
}

export async function createUserRule(token: string, rule: ReviewRule): Promise<ReviewRule> {
    const payload = fromReviewRule(rule)
    const result = await request<RuleResponse>('/rules', token, {
        method: 'POST',
        body: JSON.stringify(payload),
    })

    return toReviewRule(result.rule)
}

export async function updateUserRule(
    token: string,
    ruleId: string,
    updates: Partial<Pick<ReviewRule, 'title' | 'comment' | 'severity' | 'enabled' | 'pattern'>>,
): Promise<ReviewRule> {
    const result = await request<RuleResponse>(`/rules/${ruleId}`, token, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    })

    return toReviewRule(result.rule)
}

export function deleteUserRule(token: string, ruleId: string): Promise<void> {
    return request<void>(`/rules/${ruleId}`, token, { method: 'DELETE' })
}

export async function seedDefaultRules(token: string, defaults: ReviewRule[]): Promise<ReviewRule[]> {
    const created: ReviewRule[] = []

    for (const rule of defaults) {
        const createdRule = await createUserRule(token, rule)
        created.push(createdRule)
    }

    return created
}
