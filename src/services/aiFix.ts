import type { Finding } from '../types/reviewer'

export type AiFixRequest = {
    finding: Finding
    contextLines: string[]
}

export type AiFixResult = {
    fixedCode: string
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
