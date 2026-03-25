import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { makeStyles } from '../hooks/makeStyles'
import type { BuiltInFindingsSummary, Finding, GitLabChange } from '../types/reviewer'
import { requestAiFix, type AiFixResult } from '../services/aiFix'

type FindingsSummaryProps = {
    findings: Finding[]
    summary: BuiltInFindingsSummary
    reviewedChanges: GitLabChange[]
    aiApiKey: string
}

type ParsedDiffLine = {
    kind: 'meta' | 'context' | 'add' | 'remove'
    text: string
    oldLine: number | null
    newLine: number | null
}

type DiffPreviewLine = {
    kind: 'meta' | 'context' | 'add' | 'remove'
    text: string
    oldLine: number | null
    newLine: number | null
    highlight?: boolean
}

const useStyles = makeStyles((theme) => ({
    chips: {
        display: 'flex',
        gap: theme.spacing(1),
        flexWrap: 'wrap',
    },
    chip: {
        borderRadius: theme.spacing(1),
        backgroundColor: theme.palette.background.default,
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.5),
    },
    finding: {
        borderRadius: theme.spacing(1.5),
        border: `1px solid ${theme.palette.warning.light}`,
    },
    codeLabel: {
        marginTop: theme.spacing(1),
        fontWeight: 600,
        color: theme.palette.text.primary,
    },
    diffBlock: {
        marginTop: theme.spacing(0.5),
        borderRadius: theme.spacing(1),
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.default,
        overflowX: 'auto',
    },
    diffLine: {
        display: 'grid',
        gridTemplateColumns: '46px 46px 22px 1fr',
        alignItems: 'start',
        gap: theme.spacing(0.75),
        padding: theme.spacing(0.375, 1),
        fontFamily: 'Consolas, monospace',
        fontSize: '0.8rem',
        lineHeight: 1.45,
    },
    diffLineMeta: {
        backgroundColor: 'rgba(15, 23, 42, 0.05)',
        color: theme.palette.text.secondary,
    },
    diffLineAdd: {
        backgroundColor: 'rgba(34, 197, 94, 0.13)',
    },
    diffLineRemove: {
        backgroundColor: 'rgba(239, 68, 68, 0.13)',
    },
    diffLineHighlight: {
        outline: `1px solid ${theme.palette.warning.main}`,
        backgroundColor: 'rgba(245, 158, 11, 0.16)',
    },
    diffLineNumber: {
        textAlign: 'right',
        color: theme.palette.text.secondary,
        userSelect: 'none',
    },
    diffSign: {
        textAlign: 'center',
        color: theme.palette.text.secondary,
        userSelect: 'none',
    },
    diffCode: {
        fontFamily: 'Consolas, monospace',
        whiteSpace: 'pre',
        wordBreak: 'break-word',
    },
    aiActionRow: {
        marginTop: theme.spacing(1.25),
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        flexWrap: 'wrap',
    },
    aiResultWrap: {
        marginTop: theme.spacing(1),
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: theme.spacing(1),
        [theme.breakpoints.down('md')]: {
            gridTemplateColumns: '1fr',
        },
    },
    aiPanelOriginal: {
        borderRadius: theme.spacing(1),
        border: '1px solid rgba(239, 68, 68, 0.25)',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        padding: theme.spacing(1),
    },
    aiPanelFixed: {
        borderRadius: theme.spacing(1),
        border: '1px solid rgba(34, 197, 94, 0.25)',
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        padding: theme.spacing(1),
    },
    aiPanelTitle: {
        fontWeight: 700,
        marginBottom: theme.spacing(0.5),
    },
    aiCodeBlock: {
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: 'Consolas, monospace',
        fontSize: '0.8rem',
        lineHeight: 1.45,
    },
    aiExplanation: {
        marginTop: theme.spacing(0.75),
        color: theme.palette.text.secondary,
    },
}))

function parseDiff(diffText: string): ParsedDiffLine[] {
    const lines = diffText.split('\n')
    const parsed: ParsedDiffLine[] = []

    let oldLine = 0
    let newLine = 0

    for (const line of lines) {
        const hunkMatch = line.match(/^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/)

        if (hunkMatch) {
            oldLine = Number(hunkMatch[1])
            newLine = Number(hunkMatch[2])
            parsed.push({ kind: 'meta', text: line, oldLine: null, newLine: null })
            continue
        }

        if (line.startsWith('+') && !line.startsWith('+++')) {
            parsed.push({ kind: 'add', text: line.slice(1), oldLine: null, newLine })
            newLine += 1
            continue
        }

        if (line.startsWith('-') && !line.startsWith('---')) {
            parsed.push({ kind: 'remove', text: line.slice(1), oldLine, newLine: null })
            oldLine += 1
            continue
        }

        if (line.startsWith(' ')) {
            parsed.push({ kind: 'context', text: line.slice(1), oldLine, newLine })
            oldLine += 1
            newLine += 1
            continue
        }

        parsed.push({ kind: 'meta', text: line, oldLine: null, newLine: null })
    }

    return parsed
}

function buildDiffPreviewForFinding(
    finding: Finding,
    change: GitLabChange | undefined,
): DiffPreviewLine[] {
    if (!change?.diff?.trim()) {
        return [
            {
                kind: 'context',
                text: finding.snippet.trim() || 'No code snippet available for this issue.',
                oldLine: null,
                newLine: finding.lineNumber,
                highlight: true,
            },
        ]
    }

    const parsed = parseDiff(change.diff)
    if (parsed.length === 0) {
        return [
            {
                kind: 'context',
                text: finding.snippet.trim() || 'No code snippet available for this issue.',
                oldLine: null,
                newLine: finding.lineNumber,
                highlight: true,
            },
        ]
    }

    const targetByLine =
        finding.lineNumber !== null
            ? parsed.findIndex(
                (line) => line.kind === 'add' && line.newLine === finding.lineNumber,
            )
            : -1

    const normalizedSnippet = finding.snippet.trim()
    const targetBySnippet =
        targetByLine >= 0
            ? targetByLine
            : parsed.findIndex(
                (line) =>
                    line.kind === 'add' && normalizedSnippet.length > 0 && line.text.trim() === normalizedSnippet,
            )

    const targetIndex = targetBySnippet >= 0 ? targetBySnippet : -1

    if (targetIndex < 0) {
        return [
            {
                kind: 'context',
                text: finding.snippet.trim() || 'No matching diff hunk found for this issue.',
                oldLine: null,
                newLine: finding.lineNumber,
                highlight: true,
            },
        ]
    }

    let start = Math.max(0, targetIndex - 3)
    let end = Math.min(parsed.length - 1, targetIndex + 3)

    while (start > 0 && parsed[start].kind !== 'meta' && parsed[start - 1].kind === 'meta') {
        start -= 1
    }

    while (end < parsed.length - 1 && parsed[end].kind !== 'meta' && parsed[end + 1].kind === 'meta') {
        end += 1
    }

    return parsed.slice(start, end + 1).map((line, index) => ({
        kind: line.kind,
        text: line.text,
        oldLine: line.oldLine,
        newLine: line.newLine,
        highlight: start + index === targetIndex,
    }))
}

function findTargetAddLineIndex(finding: Finding, parsed: ParsedDiffLine[]): number {
    const targetByLine =
        finding.lineNumber !== null
            ? parsed.findIndex(
                (line) => line.kind === 'add' && line.newLine === finding.lineNumber,
            )
            : -1

    const normalizedSnippet = finding.snippet.trim()
    const targetBySnippet =
        targetByLine >= 0
            ? targetByLine
            : parsed.findIndex(
                (line) =>
                    line.kind === 'add' && normalizedSnippet.length > 0 && line.text.trim() === normalizedSnippet,
            )

    return targetBySnippet
}

function buildContextWindowLines(finding: Finding, change: GitLabChange | undefined): string[] {
    if (!change?.diff?.trim()) {
        return [finding.snippet]
    }

    const parsed = parseDiff(change.diff)
    const targetIndex = findTargetAddLineIndex(finding, parsed)

    if (targetIndex < 0) {
        return [finding.snippet]
    }

    const start = Math.max(0, targetIndex - 5)
    const end = Math.min(parsed.length - 1, targetIndex + 5)

    return parsed.slice(start, end + 1).map((line) => {
        const sign = line.kind === 'add' ? '+' : line.kind === 'remove' ? '-' : ' '
        const lineNo = line.newLine ?? line.oldLine ?? 0
        return `${String(lineNo).padStart(4, ' ')} ${sign} ${line.text}`
    })
}

function FindingsSummary({ findings, summary, reviewedChanges, aiApiKey }: FindingsSummaryProps) {
    const classes = useStyles()
    const [loadingKey, setLoadingKey] = useState<string | null>(null)
    const [errorByKey, setErrorByKey] = useState<Record<string, string>>({})
    const [aiByKey, setAiByKey] = useState<Record<string, AiFixResult>>({})

    const diffByPath = useMemo(
        () => new Map(reviewedChanges.map((change) => [change.new_path || change.old_path, change])),
        [reviewedChanges],
    )

    const getFindingKey = (finding: Finding, index: number) => `${finding.ruleId}|${finding.filePath}|${finding.lineNumber ?? 'na'}|${index}`

    const handleGetAiFix = async (finding: Finding, index: number) => {
        const key = getFindingKey(finding, index)
        const change = diffByPath.get(finding.filePath)

        setLoadingKey(key)
        setErrorByKey((previous) => ({ ...previous, [key]: '' }))

        try {
            const contextLines = buildContextWindowLines(finding, change)
            const result = await requestAiFix(aiApiKey, { finding, contextLines })
            setAiByKey((previous) => ({ ...previous, [key]: result }))
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch AI fix.'
            setErrorByKey((previous) => ({ ...previous, [key]: message }))
        } finally {
            setLoadingKey(null)
        }
    }

    const handleCopyFix = async (fixedCode: string) => {
        await navigator.clipboard.writeText(fixedCode)
    }

    return (
        <Stack spacing={2}>
            <Stack className={classes.chips} direction="row">
                <Chip className={classes.chip} label={`No sx: ${summary.noSx}`} />
                <Chip className={classes.chip} label={`No deprecated tags: ${summary.noDeprecatedTags}`} />
                <Chip className={classes.chip} label={`Optional chaining: ${summary.optionalChaining}`} />
                <Chip className={classes.chip} label={`Custom: ${summary.custom}`} />
            </Stack>

            {findings.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    No findings yet.
                </Typography>
            ) : (
                <Stack className={classes.list}>
                    {findings.map((finding, index) => {
                        const change = diffByPath.get(finding.filePath)
                        const previewLines = buildDiffPreviewForFinding(finding, change)
                        const findingKey = getFindingKey(finding, index)
                        const aiResult = aiByKey[findingKey]
                        const aiError = errorByKey[findingKey]
                        const isLoading = loadingKey === findingKey

                        return (
                            <Alert
                                severity="warning"
                                className={classes.finding}
                                key={`${finding.ruleId}-${finding.filePath}-${index}`}
                            >
                                <strong>{finding.comment}</strong>
                                <br />
                                File: {finding.filePath}
                                <br />
                                Line: {finding.lineNumber ?? 'N/A'}

                                <Typography variant="body2" className={classes.codeLabel}>
                                    Code changes
                                </Typography>
                                <Box className={classes.diffBlock}>
                                    {previewLines.map((line, lineIndex) => {
                                        const sign =
                                            line.kind === 'add'
                                                ? '+'
                                                : line.kind === 'remove'
                                                    ? '-'
                                                    : line.kind === 'meta'
                                                        ? '@'
                                                        : ' '

                                        const lineClassName = [
                                            classes.diffLine,
                                            line.kind === 'meta' ? classes.diffLineMeta : '',
                                            line.kind === 'add' ? classes.diffLineAdd : '',
                                            line.kind === 'remove' ? classes.diffLineRemove : '',
                                            line.highlight ? classes.diffLineHighlight : '',
                                        ]
                                            .filter(Boolean)
                                            .join(' ')

                                        return (
                                            <Box key={`${finding.ruleId}-${index}-${lineIndex}`} className={lineClassName}>
                                                <Box className={classes.diffLineNumber}>{line.oldLine ?? ''}</Box>
                                                <Box className={classes.diffLineNumber}>{line.newLine ?? ''}</Box>
                                                <Box className={classes.diffSign}>{sign}</Box>
                                                <Box className={classes.diffCode}>{line.text || ' '}</Box>
                                            </Box>
                                        )
                                    })}
                                </Box>

                                <Box className={classes.aiActionRow}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => void handleGetAiFix(finding, index)}
                                        disabled={isLoading}
                                        startIcon={isLoading ? <CircularProgress size={14} /> : undefined}
                                    >
                                        {isLoading ? 'Generating Fix...' : 'Get AI Fix'}
                                    </Button>
                                    {aiResult && (
                                        <Button
                                            variant="contained"
                                            onClick={() => void handleCopyFix(aiResult.fixedCode)}
                                        >
                                            Copy Fix
                                        </Button>
                                    )}
                                </Box>

                                {aiError && (
                                    <Typography variant="body2" color="error" sx={{ mt: 0.75 }}>
                                        {aiError}
                                    </Typography>
                                )}

                                {aiResult && (
                                    <>
                                        <Box className={classes.aiResultWrap}>
                                            <Box className={classes.aiPanelOriginal}>
                                                <Typography variant="body2" className={classes.aiPanelTitle}>
                                                    Original (flagged)
                                                </Typography>
                                                <pre className={classes.aiCodeBlock}>{finding.snippet.trim()}</pre>
                                            </Box>
                                            <Box className={classes.aiPanelFixed}>
                                                <Typography variant="body2" className={classes.aiPanelTitle}>
                                                    AI Suggested Fix
                                                </Typography>
                                                <pre className={classes.aiCodeBlock}>{aiResult.fixedCode}</pre>
                                            </Box>
                                        </Box>
                                        <Typography variant="body2" className={classes.aiExplanation}>
                                            {aiResult.explanation}
                                        </Typography>
                                    </>
                                )}
                            </Alert>
                        )
                    })}
                </Stack>
            )}
        </Stack>
    )
}

export default FindingsSummary
