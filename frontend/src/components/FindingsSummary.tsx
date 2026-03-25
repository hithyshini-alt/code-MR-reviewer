import { Alert, Box, Button, Chip, CircularProgress, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded'
import { makeStyles } from '../hooks/makeStyles'
import type { BuiltInFindingsSummary, Finding, GitLabChange } from '../types/reviewer'
import { requestAiFix, type AiFixResult } from '../services/aiFix'

type FindingsSummaryProps = {
    findings: Finding[]
    summary: BuiltInFindingsSummary
    reviewedChanges: GitLabChange[]
    aiApiKey: string
    recurringSignatures: string[]
    onPostableFindingsChange: (findings: Finding[]) => void
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

type FindingLifecycleStatus = 'active' | 'dismissed'
type SeverityFilter = 'all' | 'error' | 'warning' | 'info'

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
        '& .MuiAlert-message': {
            width: '100%',
        },
    },
    controlsWrap: {
        padding: theme.spacing(1.25),
        borderRadius: theme.spacing(1.25),
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.default,
    },
    controlsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
        gap: theme.spacing(1),
    },
    bulkRow: {
        marginTop: theme.spacing(1),
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: theme.spacing(1),
    },
    smallButton: {
        minWidth: 0,
    },
    findingHeaderRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.spacing(1),
        flexWrap: 'wrap',
        width: '100%',
    },
    findingSelectWrap: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing(0.5),
        marginLeft: 'auto',
        flexShrink: 0,
    },
    selectToggleButton: {
        borderRadius: theme.spacing(3),
        textTransform: 'none',
        fontWeight: 700,
        paddingInline: theme.spacing(1.25),
        minWidth: 0,
    },
    findingMetaRow: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.75),
        flexWrap: 'wrap',
        marginTop: theme.spacing(0.25),
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
            ? parsed.findIndex((line) => line.kind === 'add' && line.newLine === finding.lineNumber)
            : -1

    const normalizedSnippet = finding.snippet.trim()
    const targetBySnippet =
        targetByLine >= 0
            ? targetByLine
            : parsed.findIndex(
                (line) => line.kind === 'add' && normalizedSnippet.length > 0 && line.text.trim() === normalizedSnippet,
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

    const start = Math.max(0, targetIndex - 3)
    const end = Math.min(parsed.length - 1, targetIndex + 3)

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
            ? parsed.findIndex((line) => line.kind === 'add' && line.newLine === finding.lineNumber)
            : -1

    const normalizedSnippet = finding.snippet.trim()
    const targetBySnippet =
        targetByLine >= 0
            ? targetByLine
            : parsed.findIndex(
                (line) => line.kind === 'add' && normalizedSnippet.length > 0 && line.text.trim() === normalizedSnippet,
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

function buildFindingRecurrenceSignature(finding: Finding): string {
    const normalizedPath = finding.filePath.trim().toLowerCase().replace(/\\/g, '/')
    const normalizedSnippet = finding.snippet.trim().toLowerCase().replace(/\s+/g, ' ')
    return `${normalizedPath}|${finding.ruleId}|${normalizedSnippet}`
}

function FindingsSummary({
    findings,
    summary,
    reviewedChanges,
    aiApiKey,
    recurringSignatures,
    onPostableFindingsChange,
}: FindingsSummaryProps) {
    const classes = useStyles()
    const [loadingKey, setLoadingKey] = useState<string | null>(null)
    const [errorByKey, setErrorByKey] = useState<Record<string, string>>({})
    const [aiByKey, setAiByKey] = useState<Record<string, AiFixResult>>({})
    const [selectedByKey, setSelectedByKey] = useState<Record<string, boolean>>({})
    const [statusByKey, setStatusByKey] = useState<Record<string, FindingLifecycleStatus>>({})
    const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')

    const diffByPath = useMemo(
        () => new Map(reviewedChanges.map((change) => [change.new_path || change.old_path, change])),
        [reviewedChanges],
    )

    const getFindingKey = (finding: Finding, index: number) =>
        `${finding.ruleId}|${finding.filePath}|${finding.lineNumber ?? 'na'}|${index}`

    const findingEntries = useMemo(
        () => findings.map((finding, index) => ({ finding, index, key: getFindingKey(finding, index) })),
        [findings],
    )
    const recurringSignatureSet = useMemo(
        () => new Set(recurringSignatures),
        [recurringSignatures],
    )

    useEffect(() => {
        setSelectedByKey((previous) => {
            const next: Record<string, boolean> = {}
            for (const entry of findingEntries) {
                next[entry.key] = previous[entry.key] ?? true
            }
            return next
        })

        setStatusByKey((previous) => {
            const next: Record<string, FindingLifecycleStatus> = {}
            for (const entry of findingEntries) {
                next[entry.key] = previous[entry.key] ?? 'active'
            }
            return next
        })
    }, [findingEntries])

    const filteredSortedEntries = useMemo(() => {
        const filtered = findingEntries.filter((entry) => {
            const status = statusByKey[entry.key] ?? 'active'

            if (severityFilter !== 'all' && entry.finding.severity !== severityFilter) return false
            if (status !== 'active') return false

            return true
        })

        return filtered
    }, [findingEntries, severityFilter, statusByKey])

    const postableFindings = useMemo(
        () =>
            findingEntries
                .filter((entry) => (statusByKey[entry.key] ?? 'active') === 'active' && (selectedByKey[entry.key] ?? true))
                .map((entry) => entry.finding),
        [findingEntries, selectedByKey, statusByKey],
    )

    useEffect(() => {
        onPostableFindingsChange(postableFindings)
    }, [onPostableFindingsChange, postableFindings])

    const selectedVisibleCount = useMemo(
        () => filteredSortedEntries.filter((entry) => selectedByKey[entry.key] ?? true).length,
        [filteredSortedEntries, selectedByKey],
    )

    const applyDismissToSelected = () => {
        const selectedKeys = filteredSortedEntries
            .filter((entry) => selectedByKey[entry.key] ?? true)
            .map((entry) => entry.key)

        if (selectedKeys.length === 0) {
            return
        }

        setStatusByKey((previous) => {
            const next = { ...previous }
            for (const key of selectedKeys) {
                next[key] = 'dismissed'
            }
            return next
        })
    }

    const toggleSelectAllVisible = () => {
        const allVisibleSelected =
            filteredSortedEntries.length > 0 &&
            filteredSortedEntries.every((entry) => selectedByKey[entry.key] ?? true)

        setSelectedByKey((previous) => {
            const next = { ...previous }
            for (const entry of filteredSortedEntries) {
                next[entry.key] = !allVisibleSelected
            }
            return next
        })
    }

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
                <Chip className={classes.chip} label={`Postable selected: ${postableFindings.length}`} />
            </Stack>

            {findings.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    No findings yet.
                </Typography>
            ) : (
                <Stack className={classes.list}>
                    <Box className={classes.controlsWrap}>
                        <Box className={classes.controlsGrid}>
                            <TextField
                                select
                                size="small"
                                label="Severity"
                                value={severityFilter}
                                onChange={(event) => setSeverityFilter(event.target.value as SeverityFilter)}
                            >
                                <MenuItem value="all">All severities</MenuItem>
                                <MenuItem value="error">Error</MenuItem>
                                <MenuItem value="warning">Warning</MenuItem>
                                <MenuItem value="info">Info</MenuItem>
                            </TextField>
                        </Box>

                        <Box className={classes.bulkRow}>
                            <Button size="small" variant="outlined" onClick={toggleSelectAllVisible} className={classes.smallButton}>
                                {filteredSortedEntries.length > 0 && selectedVisibleCount === filteredSortedEntries.length
                                    ? 'Unselect all'
                                    : 'Select all'}
                            </Button>
                            <Button size="small" variant="outlined" color="inherit" onClick={applyDismissToSelected} className={classes.smallButton}>
                                Dismiss selected
                            </Button>
                        </Box>
                    </Box>

                    {filteredSortedEntries.map((entry) => {
                        const { finding, index, key } = entry
                        const change = diffByPath.get(finding.filePath)
                        const previewLines = buildDiffPreviewForFinding(finding, change)
                        const aiResult = aiByKey[key]
                        const aiError = errorByKey[key]
                        const isLoading = loadingKey === key
                        const isSelected = selectedByKey[key] ?? true
                        const isRecurring = recurringSignatureSet.has(
                            buildFindingRecurrenceSignature(finding),
                        )

                        return (
                            <Alert
                                severity={finding.severity}
                                className={classes.finding}
                                key={`${finding.ruleId}-${finding.filePath}-${index}`}
                            >
                                <Box className={classes.findingHeaderRow}>
                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                        <Chip size="small" label={finding.severity.toUpperCase()} color={finding.severity === 'error' ? 'error' : finding.severity === 'warning' ? 'warning' : 'info'} />
                                        {isRecurring && (
                                            <Chip
                                                size="small"
                                                label="Keeps coming up"
                                                color="warning"
                                                variant="outlined"
                                            />
                                        )}
                                    </Stack>
                                    <Box className={classes.findingSelectWrap}>
                                        <Typography variant="caption" color="text.secondary">Posting</Typography>
                                        <Button
                                            size="small"
                                            className={classes.selectToggleButton}
                                            variant={isSelected ? 'contained' : 'outlined'}
                                            color={isSelected ? 'success' : 'inherit'}
                                            startIcon={
                                                isSelected ? (
                                                    <CheckCircleOutlineRoundedIcon fontSize="small" />
                                                ) : (
                                                    <RemoveCircleOutlineRoundedIcon fontSize="small" />
                                                )
                                            }
                                            onClick={() =>
                                                setSelectedByKey((previous) => ({
                                                    ...previous,
                                                    [key]: !(previous[key] ?? true),
                                                }))
                                            }
                                        >
                                            {isSelected ? 'Included' : 'Excluded'}
                                        </Button>
                                    </Box>
                                </Box>

                                <Box className={classes.findingMetaRow}>
                                    <Typography variant="body2"><strong>{finding.comment}</strong></Typography>
                                </Box>
                                <Typography variant="body2">File: {finding.filePath}</Typography>
                                <Typography variant="body2">Line: {finding.lineNumber ?? 'N/A'}</Typography>

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
