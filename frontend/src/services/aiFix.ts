import type { Finding } from '../types/reviewer'

export type AiFixRequest = {
    finding: Finding
    contextLines: string[]
}

export type AiFixResult = {
    fixedCode: string
    explanation: string
}

export type RegexSuggestionRequest = {
    ruleTitle: string
    ruleComment: string
}

export type RegexSuggestionResult = {
    regexPattern: string
    explanation: string
}

type GroqChatResponse = {
    choices?: Array<{
        message?: {
            content?: string
        }
    }>
}

function stripCodeFences(input: string): string {
    return input
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()
}

function sanitizeRegexPattern(input: string): string {
    let pattern = stripCodeFences(input).trim()

    // Remove JS-style delimiters if the model returns /pattern/gi form.
    const delimitedMatch = pattern.match(/^\/(.*)\/([a-z]*)$/i)
    if (delimitedMatch?.[1]) {
        pattern = delimitedMatch[1].trim()
    }

    return pattern
}

function isTooGenericPattern(pattern: string): boolean {
    const normalized = pattern.replace(/\s+/g, '')
    return normalized === '.*' || normalized === '.+' || normalized === '[\\s\\S]*'
}

function isValidRegexPattern(pattern: string): boolean {
    if (!pattern.trim() || isTooGenericPattern(pattern)) {
        return false
    }

    try {
        // Must be valid when used by the app with new RegExp(pattern, 'i').
        void new RegExp(pattern, 'i')
        return true
    } catch {
        return false
    }
}

function getFallbackRegexFromIntent(title: string, comment: string): string | null {
    const intent = `${title} ${comment}`.toLowerCase()

    if (intent.includes('console.log')) return '\\bconsole\\.log\\s*\\('
    if (intent.includes('debugger')) return '\\bdebugger\\b'
    if (intent.includes('any type') || intent.includes('avoid any') || intent.includes('no any')) {
        return ':\\s*any\\b|<\\s*any\\s*>'
    }
    if (intent.includes('ts-ignore')) return '@ts-ignore'
    if (intent.includes('var keyword') || intent.includes('avoid var')) return '\\bvar\\s+'
    if (intent.includes('eval')) return '\\beval\\s*\\('
    if (intent.includes('innerhtml')) return '\\.innerHTML\\s*='
    if (intent.includes('dangerouslysetinnerhtml')) return 'dangerouslySetInnerHTML'
    if (intent.includes('document.write')) return 'document\\.write\\s*\\('
    if (intent.includes('settimeout') && intent.includes('delay')) return 'setTimeout\\s*\\([^,\\)]*\\)'
    if (intent.includes('loose equality') || intent.includes('==') || intent.includes('!=')) {
        return '(^|[^=!])==([^=]|$)|(^|[^!])!=([^=]|$)'
    }

    return null
}

function tryParseJson(input: string): AiFixResult | null {
    try {
        const parsed = JSON.parse(stripCodeFences(input)) as Partial<AiFixResult>

        if (!parsed.fixedCode || !parsed.explanation) {
            return null
        }

        return {
            fixedCode: String(parsed.fixedCode).trim(),
            explanation: String(parsed.explanation).trim(),
        }
    } catch {
        return null
    }
}

function tryParseRegexJson(input: string): RegexSuggestionResult | null {
    try {
        const parsed = JSON.parse(stripCodeFences(input)) as Partial<RegexSuggestionResult>

        const rawPattern = parsed.regexPattern ? String(parsed.regexPattern) : ''
        const cleanedPattern = sanitizeRegexPattern(rawPattern)

        if (!cleanedPattern) {
            return null
        }

        return {
            regexPattern: cleanedPattern,
            explanation: String(parsed.explanation ?? '').trim(),
        }
    } catch {
        return null
    }
}

export async function requestAiFix(
    apiKey: string,
    payload: AiFixRequest,
): Promise<AiFixResult> {
    const trimmedKey = apiKey.trim()

    if (!trimmedKey) {
        throw new Error('AI API key is required to generate fixes.')
    }

    const contextText = payload.contextLines.join('\n')

    const systemPrompt = [
        'You are a senior TypeScript reviewer.',
        'Fix only the flagged code issue while preserving behavior unless the rule requires behavior change.',
        'Return strict JSON with keys: fixedCode, explanation.',
        'fixedCode must be only the corrected code snippet with no markdown fences.',
        'explanation must be 1-2 short sentences.',
    ].join(' ')

    const userPrompt = [
        `Rule violated: ${payload.finding.ruleTitle}`,
        `Rule comment: ${payload.finding.comment}`,
        `Severity: ${payload.finding.severity}`,
        `File: ${payload.finding.filePath}`,
        `Line: ${payload.finding.lineNumber ?? 'N/A'}`,
        `Flagged line: ${payload.finding.snippet}`,
        '',
        'Code context (5 lines before and after):',
        contextText,
    ].join('\n')

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${trimmedKey}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
        }),
    })

    if (!response.ok) {
        throw new Error(`AI fix request failed with status ${response.status}.`)
    }

    const data = (await response.json()) as GroqChatResponse
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
        throw new Error('AI returned an empty response.')
    }

    const parsed = tryParseJson(content)
    if (parsed) {
        return parsed
    }

    return {
        fixedCode: content,
        explanation: 'AI fix generated. Please review before applying.',
    }
}

export async function requestRegexPattern(
    apiKey: string,
    payload: RegexSuggestionRequest,
): Promise<RegexSuggestionResult> {
    const trimmedKey = apiKey.trim()

    if (!trimmedKey) {
        throw new Error('AI API key is required to generate regex patterns.')
    }

    const systemPrompt = [
        'You are an expert at writing precise JavaScript regex for static code review rules.',
        'Your goal is high precision first, then recall.',
        'Return strict JSON with keys: regexPattern, explanation.',
        "regexPattern must be valid for new RegExp(regexPattern, 'i').",
        'regexPattern must be raw text only: NO /.../ delimiters, NO inline flags, NO markdown.',
        'The pattern is tested against one code line at a time; do not design for multi-line matches.',
        'Match the violation signal directly from the rule intent. Avoid broad catch-all patterns.',
        'Do not return generic patterns such as .*, .+, [\\s\\S]*, or patterns that match nearly any line.',
        'Prefer escaped literals, word boundaries, and optional whitespace around syntax tokens.',
        'Avoid catastrophic backtracking; keep the regex simple and deterministic.',
        'Keep explanation to one short sentence.',
    ].join(' ')

    const userPrompt = [
        `Rule title: ${payload.ruleTitle || 'Custom rule'}`,
        `Rule intent/comment: ${payload.ruleComment || 'No extra comment provided.'}`,
        'Generate exactly one regex that matches the problematic code pattern for this rule.',
        'Focus on source code tokens and syntax that indicate this issue.',
        'If multiple variants exist, include them in a single concise regex using alternation.',
        'Avoid matching unrelated lines.',
        '',
        'Output format example:',
        '{"regexPattern":"\\\\bconsole\\\\.log\\\\s*\\\\(","explanation":"Matches console.log calls."}',
    ].join('\n')

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${trimmedKey}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
        }),
    })

    if (!response.ok) {
        throw new Error(`Regex suggestion request failed with status ${response.status}.`)
    }

    const data = (await response.json()) as GroqChatResponse
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
        throw new Error('AI returned an empty regex response.')
    }

    const parsed = tryParseRegexJson(content)
    if (parsed && isValidRegexPattern(parsed.regexPattern)) {
        return {
            ...parsed,
            regexPattern: sanitizeRegexPattern(parsed.regexPattern),
        }
    }

    const cleanedRaw = sanitizeRegexPattern(content)
    if (isValidRegexPattern(cleanedRaw)) {
        return {
            regexPattern: cleanedRaw,
            explanation: 'AI-generated regex pattern. Please validate before saving.',
        }
    }

    const fallback = getFallbackRegexFromIntent(payload.ruleTitle, payload.ruleComment)
    if (fallback && isValidRegexPattern(fallback)) {
        return {
            regexPattern: fallback,
            explanation: 'Used a deterministic fallback regex for this rule intent.',
        }
    }

    throw new Error('AI returned an invalid regex pattern. Try refining the rule title/comment.')
}
