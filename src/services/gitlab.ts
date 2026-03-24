import type {
    Finding,
    GitLabChangesResponse,
    MergeRequestTarget,
} from '../types/reviewer'

type GitLabMergeRequestNote = {
    body?: string
}

type PostFindingsResult = {
    postedCount: number
    skippedCount: number
}

const FINDING_KEY_PREFIX = 'mr-reviewer-key:'

function normalizeForKey(input: string): string {
    return input.trim().toLowerCase()
}

function buildFindingDedupKey(finding: Finding): string {
    const normalizedTitle = normalizeForKey(finding.ruleTitle)
    const normalizedPath = normalizeForKey(finding.filePath.replace(/\\/g, '/'))
    const normalizedLine = `${finding.lineNumber ?? 'na'}`

    return `${normalizedTitle}|${normalizedPath}|${normalizedLine}`
}

function extractEmbeddedDedupKey(noteBody: string): string | null {
    const match = noteBody.match(/<!--\s*mr-reviewer-key:([^\s>]+)\s*-->/i)
    if (!match?.[1]) {
        return null
    }

    return decodeURIComponent(match[1])
}

function extractLegacyDedupKey(noteBody: string): string | null {
    const titleMatch = noteBody.match(/\*\*Code Review Bot ·\s*([^*]+)\*\*/i)
    const fileMatch = noteBody.match(/\*\*File:\*\*\s*(.+)/i)
    const lineMatch = noteBody.match(/\*\*Line:\*\*\s*(.+)/i)

    const title = titleMatch?.[1]?.trim()
    const filePath = fileMatch?.[1]?.trim()
    const rawLine = lineMatch?.[1]?.trim()

    if (!title || !filePath || !rawLine) {
        return null
    }

    const lineNumber = rawLine.toLowerCase() === 'n/a' ? 'na' : rawLine
    return `${normalizeForKey(title)}|${normalizeForKey(filePath.replace(/\\/g, '/'))}|${lineNumber}`
}

function extractDedupKeyFromNote(noteBody: string): string | null {
    return extractEmbeddedDedupKey(noteBody) || extractLegacyDedupKey(noteBody)
}

function buildFindingKeyMarker(finding: Finding): string {
    const encoded = encodeURIComponent(buildFindingDedupKey(finding))
    return `<!-- ${FINDING_KEY_PREFIX}${encoded} -->`
}

function buildSuggestion(finding: Finding): string {
    if (finding.suggestion?.trim()) {
        return finding.suggestion.trim()
    }

    if (finding.ruleId === 'warn-let-prefer-const') {
        return 'Use `const` for variables that are never reassigned.'
    }

    if (finding.ruleId === 'warn-no-console-log') {
        return 'Use structured logger utilities instead of `console.log`.'
    }

    if (finding.ruleId === 'noSx') {
        return 'Move style definitions to styled components/CSS modules for consistency.'
    }

    return 'Refactor this line to follow project best practices.'
}

function buildFindingNoteBody(finding: Finding): string {
    const severity = finding.severity || 'warning'
    const category = finding.category || 'bestpractice'
    const suggestion = buildSuggestion(finding)

    return [
        `🔵 **Code Review Bot · ${finding.ruleTitle}**`,
        '',
        `[${category.toUpperCase()}] ${finding.comment}`,
        '',
        `> Suggestion: ${suggestion}`,
        '',
        `**Severity:** ${severity} · **Category:** ${category}`,
        '',
        `**File:** ${finding.filePath}`,
        `**Line:** ${finding.lineNumber ?? 'N/A'}`,
        `**Code:** \`${finding.snippet.trim()}\``,
        '',
        buildFindingKeyMarker(finding),
    ].join('\n')
}

function buildHeaders(accessToken: string, includeJson = false): HeadersInit {
    let headers: HeadersInit = {
        'PRIVATE-TOKEN': accessToken.trim(),
    }

    if (includeJson) {
        headers = {
            ...headers,
            'Content-Type': 'application/json',
        }
    }

    return headers
}

export async function fetchMergeRequestChanges(
    target: MergeRequestTarget,
    accessToken: string,
): Promise<GitLabChangesResponse> {
    const response = await fetch(
        `${target.apiBaseUrl}/projects/${encodeURIComponent(target.projectPath)}/merge_requests/${target.mergeRequestIid}/changes`,
        {
            method: 'GET',
            headers: buildHeaders(accessToken),
        },
    )

    if (!response.ok) {
        throw new Error(
            `GitLab API request failed with status ${response.status}. Confirm URL, token scope, and CORS settings.`,
        )
    }

    return (await response.json()) as GitLabChangesResponse
}

async function fetchMergeRequestNotes(
    target: MergeRequestTarget,
    accessToken: string,
): Promise<GitLabMergeRequestNote[]> {
    const notes: GitLabMergeRequestNote[] = []
    let page = 1

    while (true) {
        const response = await fetch(
            `${target.apiBaseUrl}/projects/${encodeURIComponent(target.projectPath)}/merge_requests/${target.mergeRequestIid}/notes?per_page=100&page=${page}`,
            {
                method: 'GET',
                headers: buildHeaders(accessToken),
            },
        )

        if (!response.ok) {
            throw new Error(
                `GitLab notes request failed with status ${response.status}. Confirm token scope and MR visibility.`,
            )
        }

        const pageNotes = (await response.json()) as GitLabMergeRequestNote[]
        notes.push(...pageNotes)

        if (pageNotes.length < 100) {
            break
        }

        page += 1
    }

    return notes
}

export async function postFindingsAsNotes(
    target: MergeRequestTarget,
    accessToken: string,
    findings: Finding[],
): Promise<PostFindingsResult> {
    const existingNotes = await fetchMergeRequestNotes(target, accessToken)
    const existingKeys = new Set(
        existingNotes
            .map((note) => (note.body ? extractDedupKeyFromNote(note.body) : null))
            .filter((key): key is string => Boolean(key)),
    )

    let postedCount = 0
    let skippedCount = 0

    for (const finding of findings) {
        const dedupKey = buildFindingDedupKey(finding)
        if (existingKeys.has(dedupKey)) {
            skippedCount += 1
            continue
        }

        const body = buildFindingNoteBody(finding)

        const response = await fetch(
            `${target.apiBaseUrl}/projects/${encodeURIComponent(target.projectPath)}/merge_requests/${target.mergeRequestIid}/notes`,
            {
                method: 'POST',
                headers: buildHeaders(accessToken, true),
                body: JSON.stringify({ body }),
            },
        )

        if (!response.ok) {
            throw new Error(`Failed to post comments. GitLab returned status ${response.status}.`)
        }

        existingKeys.add(dedupKey)
        postedCount += 1
    }

    return { postedCount, skippedCount }
}
