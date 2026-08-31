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
    const fileMatch =
        noteBody.match(/\*\*File:\*\*\s*(.+)/i) || noteBody.match(/(?:^|\n)File:\s*(.+)/i)
    const lineMatch =
        noteBody.match(/\*\*Line:\*\*\s*(.+)/i) || noteBody.match(/(?:^|\n)Line:\s*(.+)/i)

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

function buildFindingNoteBody(finding: Finding): string {
    const severity = (finding.severity || 'warning').toUpperCase()

    return [
        `🔵 **MR Code Review Bot · ${finding.ruleTitle}**`,
        '',
        `${finding.comment}`,
        '',
        `Severity: ${severity}`,
        `File: ${finding.filePath}`,
        `Line: ${finding.lineNumber ?? 'N/A'}`,
        '',
        'Code:',
        '```ts',
        finding.snippet.trim() || '// Snippet unavailable',
        '```',
        '',
        buildFindingKeyMarker(finding),
    ].join('\n')
}

function buildHeaders(
    accessToken: string,
    includeJson = false,
    provider: MergeRequestTarget['provider'] = 'gitlab',
): HeadersInit {
    if (provider === 'github') {
        let headers: HeadersInit = {
            Authorization: `token ${accessToken.trim()}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        }

        if (includeJson) {
            headers = {
                ...headers,
                'Content-Type': 'application/json',
            }
        }

        return headers
    }

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

function getGitHubRepoParts(projectPath: string): { owner: string; repo: string } {
    const [owner, ...repoParts] = projectPath.split('/')
    const repo = repoParts.join('/')

    if (!owner || !repo) {
        throw new Error('Invalid GitHub repository path.')
    }

    return { owner, repo }
}

export async function fetchMergeRequestChanges(
    target: MergeRequestTarget,
    accessToken: string,
): Promise<GitLabChangesResponse> {
    if (target.provider === 'github') {
        const { owner, repo } = getGitHubRepoParts(target.projectPath)
        const response = await fetch(
            `${target.apiBaseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${target.mergeRequestIid}/files`,
            {
                method: 'GET',
                headers: buildHeaders(accessToken, false, 'github'),
            },
        )

        if (!response.ok) {
            const bodyText = await response.text().catch(() => '')
            const detail = bodyText ? ` GitHub responded: ${bodyText}` : ''

            if (response.status === 401) {
                throw new Error(`GitHub rejected the token. Use a valid GitHub PAT with access to this repository.${detail}`)
            }

            throw new Error(
                `GitHub API request failed with status ${response.status}. Confirm URL, token scope, and CORS settings.${detail}`,
            )
        }

        const files = (await response.json()) as Array<{ filename?: string; previous_filename?: string; patch?: string }>

        return {
            changes: files.map((file) => ({
                new_path: file.filename || file.previous_filename || '',
                old_path: file.previous_filename || file.filename || '',
                diff: file.patch || '',
            })),
        }
    }

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
        const endpoint = target.provider === 'github'
            ? (() => {
                const { owner, repo } = getGitHubRepoParts(target.projectPath)
                return `${target.apiBaseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${target.mergeRequestIid}/comments?per_page=100&page=${page}`
            })()
            : `${target.apiBaseUrl}/projects/${encodeURIComponent(target.projectPath)}/merge_requests/${target.mergeRequestIid}/notes?per_page=100&page=${page}`

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: buildHeaders(accessToken, false, target.provider),
        })

        if (!response.ok) {
            const bodyText = await response.text().catch(() => '')
            const detail = bodyText ? ` GitHub responded: ${bodyText}` : ''

            if (response.status === 401 && target.provider === 'github') {
                throw new Error(`GitHub rejected the token while fetching PR comments. Use a valid GitHub PAT with repo access.${detail}`)
            }

            throw new Error(
                target.provider === 'github'
                    ? `GitHub notes request failed with status ${response.status}. Confirm token scope and PR visibility.${detail}`
                    : `GitLab notes request failed with status ${response.status}. Confirm token scope and MR visibility.`,
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
        const endpoint = target.provider === 'github'
            ? (() => {
                const { owner, repo } = getGitHubRepoParts(target.projectPath)
                return `${target.apiBaseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${target.mergeRequestIid}/comments`
            })()
            : `${target.apiBaseUrl}/projects/${encodeURIComponent(target.projectPath)}/merge_requests/${target.mergeRequestIid}/notes`

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: buildHeaders(accessToken, true, target.provider),
            body: JSON.stringify({ body }),
        })

        if (!response.ok) {
            const bodyText = await response.text().catch(() => '')
            const detail = bodyText ? ` GitHub responded: ${bodyText}` : ''

            if (response.status === 401 && target.provider === 'github') {
                throw new Error(`GitHub rejected the token while posting comments. Use a valid GitHub PAT with repo access.${detail}`)
            }

            throw new Error(
                target.provider === 'github'
                    ? `Failed to post comments. GitHub returned status ${response.status}.${detail}`
                    : `Failed to post comments. GitLab returned status ${response.status}.`,
            )
        }

        existingKeys.add(dedupKey)
        postedCount += 1
    }

    return { postedCount, skippedCount }
}
