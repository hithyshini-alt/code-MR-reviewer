import {
    Alert,
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    FormGroup,
    Paper,
    Stack,
    Step,
    StepLabel,
    Stepper,
    TextField,
    Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import FindingsSummary from '../components/FindingsSummary'
import SettingsView from '../components/SettingsView'
import SectionCard from '../components/SectionCard'
import TopMenu, { type MenuKey } from '../components/TopMenu'
import ReviewHistoryView from '../components/ReviewHistoryView'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import { makeStyles } from '../hooks/makeStyles'
import {
    fetchMergeRequestChanges,
    postFindingsAsNotes,
} from '../services/gitlab'
import type {
    BuiltInFindingsSummary,
    Finding,
    GitLabChange,
    ReviewHistoryItem,
    ReviewRule,
    RuleSeverity,
} from '../types/reviewer'
import {
    analyzeDiff,
    defaultRules,
    parseMergeRequestUrl,
    summarizeFindings,
} from '../utils/reviewer'

const useStyles = makeStyles((theme) => ({
    page: {
        minHeight: '100vh',
        background: `radial-gradient(circle at top right, ${theme.palette.primary.light}1f 0%, transparent 38%), radial-gradient(circle at bottom left, #67e8f91f 0%, transparent 30%), ${theme.palette.background.default}`,
    },
    shell: {
        display: 'flex',
        minHeight: '100vh',
        [theme.breakpoints.down('md')]: {
            flexDirection: 'column',
        },
    },
    content: {
        flex: 1,
        padding: theme.spacing(4.5, 4, 6),
        maxWidth: 1200,
        width: '100%',
        margin: '0 auto',
        [theme.breakpoints.down('md')]: {
            padding: theme.spacing(3, 2, 4),
        },
    },
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(3),
    },
    statusAlert: {
        borderRadius: theme.spacing(1.25),
    },
    heading: {
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: -0.2,
    },
    subHeading: {
        maxWidth: '70ch',
        marginTop: theme.spacing(1),
        color: theme.palette.text.secondary,
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: theme.spacing(1.75),
        [theme.breakpoints.down('md')]: {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        },
        [theme.breakpoints.down('sm')]: {
            gridTemplateColumns: '1fr',
        },
    },
    statCard: {
        padding: theme.spacing(2),
        borderRadius: theme.spacing(2),
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 6px 14px rgba(44, 18, 99, 0.08)',
        minHeight: 138,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 24px rgba(44, 18, 99, 0.12)',
        },
    },
    statTopRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing(1),
    },
    statIconBadge: {
        width: 38,
        height: 38,
        borderRadius: theme.spacing(1.25),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statIconReviews: {
        color: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.light}33`,
    },
    statIconIssues: {
        color: theme.palette.error.main,
        backgroundColor: `${theme.palette.error.light}33`,
    },
    statIconComments: {
        color: theme.palette.success.main,
        backgroundColor: `${theme.palette.success.light}33`,
    },
    statIconReviewed: {
        color: theme.palette.info.main,
        backgroundColor: `${theme.palette.info.light}33`,
    },
    statIconExcluded: {
        color: theme.palette.warning.main,
        backgroundColor: `${theme.palette.warning.light}33`,
    },
    statValue: {
        fontWeight: 700,
        fontSize: '1.8rem',
        lineHeight: 1,
        color: theme.palette.primary.dark,
    },
    statLabel: {
        marginTop: theme.spacing(1.5),
        fontSize: '0.82rem',
        fontWeight: 700,
        letterSpacing: 0.8,
        color: theme.palette.text.secondary,
    },
    reviewPanel: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: theme.spacing(2),
        [theme.breakpoints.down('sm')]: {
            gridTemplateColumns: '1fr',
        },
    },
    field: {
        '& .MuiOutlinedInput-root': {
            borderRadius: theme.spacing(1.25),
            backgroundColor: '#fcfcff',
        },
        '& .MuiInputLabel-root': {
            fontWeight: 500,
        },
    },
    reviewActionRow: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(2),
        flexWrap: 'wrap',
    },
    reviewButton: {
        minWidth: 190,
        minHeight: 46,
        background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    },
    helperMeta: {
        color: theme.palette.text.secondary,
        fontWeight: 500,
    },
    stepTitle: {
        fontWeight: 700,
        color: theme.palette.text.primary,
        marginTop: theme.spacing(0.5),
    },
    stepHint: {
        color: theme.palette.text.secondary,
    },
    selectionHint: {
        color: theme.palette.text.secondary,
    },
    selectionList: {
        maxHeight: 340,
        overflowY: 'auto',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.spacing(1.25),
        padding: theme.spacing(1),
        marginTop: theme.spacing(1),
        backgroundColor: '#fcfcff',
    },
    diffList: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.25),
    },
    diffItem: {
        borderRadius: theme.spacing(1.25),
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: '#fcfcff',
        padding: theme.spacing(1.25),
    },
    diffPath: {
        fontWeight: 700,
        color: theme.palette.text.primary,
        marginBottom: theme.spacing(1),
    },
    diffCode: {
        margin: 0,
        maxHeight: 260,
        overflow: 'auto',
        whiteSpace: 'pre',
        fontSize: '0.78rem',
        lineHeight: 1.5,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        color: theme.palette.text.secondary,
    },
    timelineContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.5),
    },
    timelineStepper: {
        '& .MuiStepLabel-label': {
            fontWeight: 600,
            fontSize: '0.85rem',
        },
    },
    timelineStatus: {
        color: theme.palette.text.secondary,
        fontWeight: 600,
    },
    timelineError: {
        color: theme.palette.error.main,
        fontWeight: 600,
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.spacing(2),
        flexWrap: 'wrap',
    },
    resultActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: theme.spacing(2),
        [theme.breakpoints.down('sm')]: {
            justifyContent: 'stretch',
        },
    },
    postButton: {
        minWidth: 190,
        [theme.breakpoints.down('sm')]: {
            width: '100%',
        },
    },
}))

const HISTORY_STORAGE_KEY = 'mr-reviewer-history-v1'
const RULES_STORAGE_KEY = 'mr-reviewer-rules-v1'
const CREDENTIALS_STORAGE_KEY = 'mr-reviewer-credentials-v1'

type ReviewFlowState =
    | 'idle'
    | 'reviewing'
    | 'reviewed'
    | 'posting'
    | 'posted'
    | 'error'

const REVIEW_TIMELINE_STEPS = [
    'Ready',
    'Reviewing',
    'Reviewed',
    'Posting comments',
    'Completed',
]

type FileSelectionItem = {
    id: string
    path: string
    change: GitLabChange
    selected: boolean
}

function getChangePath(change: GitLabChange): string {
    return change.new_path || change.old_path || ''
}

function isReviewableFileType(filePath: string, includeTestFiles: boolean): boolean {
    const normalized = filePath.toLowerCase()

    if (!includeTestFiles && normalized.endsWith('.test.ts')) {
        return false
    }

    return normalized.endsWith('.ts') || normalized.endsWith('.tsx')
}

function ReviewerPage() {
    const classes = useStyles()

    const [activeMenu, setActiveMenu] = useState<MenuKey>('dashboard')
    const [mergeRequestUrl, setMergeRequestUrl] = useState('')
    const [accessToken, setAccessToken] = useState('')
    const [rules, setRules] = useState<ReviewRule[]>(defaultRules)
    const [findings, setFindings] = useState<Finding[]>([])
    const [history, setHistory] = useState<ReviewHistoryItem[]>([])
    const [saveHistory, setSaveHistory] = useState(true)
    const [saveCredentials, setSaveCredentials] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [isReviewing, setIsReviewing] = useState(false)
    const [isPosting, setIsPosting] = useState(false)
    const [hasReviewed, setHasReviewed] = useState(false)
    const [reviewFlowState, setReviewFlowState] = useState<ReviewFlowState>('idle')
    const [totalCommentsPosted, setTotalCommentsPosted] = useState(0)
    const [lastReviewedFiles, setLastReviewedFiles] = useState(0)
    const [lastExcludedFiles, setLastExcludedFiles] = useState(0)
    const [includeTestFiles, setIncludeTestFiles] = useState(false)
    const [, setReviewedChanges] = useState<GitLabChange[]>([])
    const [isFileSelectionOpen, setIsFileSelectionOpen] = useState(false)
    const [fileSelectionItems, setFileSelectionItems] = useState<FileSelectionItem[]>([])
    const [fileSelectionTotalChanges, setFileSelectionTotalChanges] = useState(0)

    const findingCountByRule: BuiltInFindingsSummary = useMemo(
        () => summarizeFindings(findings, rules),
        [findings, rules],
    )
    const autoDetectedHost = useMemo(() => {
        try {
            return mergeRequestUrl.trim() ? new URL(mergeRequestUrl.trim()).origin : ''
        } catch {
            return ''
        }
    }, [mergeRequestUrl])
    const reviewsRunCount = history.length
    const selectedFileCount = useMemo(
        () => fileSelectionItems.filter((item) => item.selected).length,
        [fileSelectionItems],
    )
    const timelineStepIndex = useMemo(() => {
        switch (reviewFlowState) {
            case 'idle':
                return 0
            case 'reviewing':
                return 1
            case 'reviewed':
                return 2
            case 'posting':
                return 3
            case 'posted':
                return 4
            case 'error':
                return 0
            default:
                return 0
        }
    }, [reviewFlowState])
    const timelineStatusText = useMemo(() => {
        switch (reviewFlowState) {
            case 'idle':
                return 'Status: Ready to run review.'
            case 'reviewing':
                return 'Status: Review in progress...'
            case 'reviewed':
                return 'Status: Review completed.'
            case 'posting':
                return 'Status: Posting comments to GitLab...'
            case 'posted':
                return 'Status: Review and comment posting completed.'
            case 'error':
                return 'Status: Review flow encountered an error.'
            default:
                return 'Status: Ready.'
        }
    }, [reviewFlowState])

    useEffect(() => {
        try {
            const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
            if (!raw) {
                return
            }

            const parsed = JSON.parse(raw) as ReviewHistoryItem[]
            if (Array.isArray(parsed)) {
                setHistory(
                    parsed.map((item) => ({
                        ...item,
                        summary: {
                            noSx: item.summary?.noSx ?? 0,
                            noDeprecatedTags: item.summary?.noDeprecatedTags ?? 0,
                            optionalChaining: item.summary?.optionalChaining ?? 0,
                            custom: item.summary?.custom ?? 0,
                        },
                    })),
                )
            }
        } catch {
            setHistory([])
        }
    }, [])

    useEffect(() => {
        try {
            const rawCredentials = localStorage.getItem(CREDENTIALS_STORAGE_KEY)
            if (!rawCredentials) {
                return
            }

            const parsed = JSON.parse(rawCredentials) as {
                saveCredentials?: boolean
                accessToken?: string
            }

            if (parsed.saveCredentials) {
                setSaveCredentials(true)
                setAccessToken(parsed.accessToken ?? '')
            }
        } catch {
            setSaveCredentials(false)
        }
    }, [])

    useEffect(() => {
        try {
            const rawRules = localStorage.getItem(RULES_STORAGE_KEY)
            if (!rawRules) {
                return
            }

            const parsed = JSON.parse(rawRules) as Partial<ReviewRule>[]
            if (!Array.isArray(parsed) || parsed.length === 0) {
                return
            }

            setRules(
                parsed.map((rule, index) => {
                    const matcherType = rule.matcherType || 'builtin'
                    const inferredKey =
                        rule.key ||
                        (rule.id === 'noSx' || rule.id === 'noDeprecatedTags' || rule.id === 'optionalChaining'
                            ? rule.id
                            : undefined)

                    return {
                        id: rule.id || `migrated-${index}`,
                        key: inferredKey,
                        matcherType,
                        title: rule.title || `Rule ${index + 1}`,
                        enabled: rule.enabled ?? true,
                        comment: rule.comment || 'Rule violated.',
                        severity: rule.severity || 'warning',
                        pattern: rule.pattern,
                    }
                }),
            )
        } catch {
            setRules(defaultRules)
        }
    }, [])

    useEffect(() => {
        if (!saveHistory) {
            localStorage.removeItem(HISTORY_STORAGE_KEY)
            return
        }

        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
    }, [history, saveHistory])

    useEffect(() => {
        localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules))
    }, [rules])

    useEffect(() => {
        if (!saveCredentials) {
            localStorage.removeItem(CREDENTIALS_STORAGE_KEY)
            return
        }

        localStorage.setItem(
            CREDENTIALS_STORAGE_KEY,
            JSON.stringify({
                saveCredentials: true,
                accessToken: accessToken.trim(),
            }),
        )
    }, [accessToken, saveCredentials])

    const addCustomRule = (rule: {
        title: string
        pattern: string
        comment: string
        severity: RuleSeverity
    }) => {
        const newRule: ReviewRule = {
            id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            matcherType: 'regex',
            title: rule.title,
            enabled: true,
            comment: rule.comment,
            severity: rule.severity,
            pattern: rule.pattern,
        }

        setRules((previous) => [...previous, newRule])
        setStatusMessage('Custom rule added.')
        setErrorMessage('')
    }

    const updateRule = (
        ruleId: string,
        updates: Partial<Pick<ReviewRule, 'title' | 'comment' | 'severity' | 'enabled' | 'pattern'>>,
    ) => {
        setRules((previous) =>
            previous.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)),
        )
    }

    const deleteRule = (ruleId: string) => {
        setRules((previous) => previous.filter((item) => item.id !== ruleId))
        setStatusMessage('Rule deleted.')
        setErrorMessage('')
    }

    const completeReviewFromChanges = (changesToReview: GitLabChange[], totalChangesCount: number) => {
        const excludedCount = Math.max(totalChangesCount - changesToReview.length, 0)
        const newFindings = analyzeDiff(changesToReview, rules)
        const summary = summarizeFindings(newFindings, rules)

        setReviewedChanges(changesToReview)
        setFindings(newFindings)
        setLastReviewedFiles(changesToReview.length)
        setLastExcludedFiles(excludedCount)
        setHasReviewed(true)
        setReviewFlowState('reviewed')

        if (saveHistory) {
            const historyItem: ReviewHistoryItem = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                mergeRequestUrl: mergeRequestUrl.trim(),
                createdAt: new Date().toISOString(),
                totalFindings: newFindings.length,
                summary,
            }

            setHistory((previous) => [historyItem, ...previous].slice(0, 20))
        }

        if (newFindings.length === 0) {
            setStatusMessage(
                excludedCount > 0
                    ? `No issues found for enabled rules. Skipped ${excludedCount} file(s).`
                    : 'No issues found for enabled rules.',
            )
            return
        }

        setStatusMessage(
            `Review complete. ${newFindings.length} issue(s) found.${excludedCount > 0 ? ` Skipped ${excludedCount} file(s).` : ''}`,
        )
    }

    const toggleFileSelection = (itemId: string) => {
        setFileSelectionItems((previous) =>
            previous.map((item) =>
                item.id === itemId ? { ...item, selected: !item.selected } : item,
            ),
        )
    }

    const toggleAllFileSelections = (checked: boolean) => {
        setFileSelectionItems((previous) => previous.map((item) => ({ ...item, selected: checked })))
    }

    const cancelFileSelection = () => {
        setIsFileSelectionOpen(false)
        setFileSelectionItems([])
        setFileSelectionTotalChanges(0)
        setReviewFlowState('idle')
        setStatusMessage('Review canceled before analysis.')
    }

    const confirmFileSelection = () => {
        const selectedChanges = fileSelectionItems
            .filter((item) => item.selected)
            .map((item) => item.change)

        setIsFileSelectionOpen(false)
        setFileSelectionItems([])

        completeReviewFromChanges(selectedChanges, fileSelectionTotalChanges)
        setFileSelectionTotalChanges(0)
    }

    const reviewMergeRequest = async () => {
        setErrorMessage('')
        setStatusMessage('')
        setFindings([])
        setReviewedChanges([])
        setHasReviewed(false)
        setReviewFlowState('idle')

        if (!mergeRequestUrl.trim()) {
            setErrorMessage('Please enter a GitLab Merge Request URL.')
            return
        }

        if (!accessToken.trim()) {
            setErrorMessage('Please enter a GitLab Personal Access Token.')
            return
        }

        try {
            setIsReviewing(true)
            setReviewFlowState('reviewing')
            const target = parseMergeRequestUrl(mergeRequestUrl)
            const data = await fetchMergeRequestChanges(target, accessToken)
            const autoFilteredChanges = data.changes.filter((change) => {
                const filePath = getChangePath(change)

                if (!filePath) {
                    return false
                }

                if (!isReviewableFileType(filePath, includeTestFiles)) {
                    return false
                }

                return true
            })

            if (autoFilteredChanges.length === 0) {
                completeReviewFromChanges([], data.changes.length)
                return
            }

            const items: FileSelectionItem[] = autoFilteredChanges.map((change, index) => ({
                id: `${index}-${getChangePath(change)}`,
                path: getChangePath(change),
                change,
                selected: true,
            }))

            setFileSelectionItems(items)
            setFileSelectionTotalChanges(data.changes.length)
            setIsFileSelectionOpen(true)
            setStatusMessage(
                `Loaded ${autoFilteredChanges.length} reviewable file(s). Deselect files you want to skip, then continue.`,
            )
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to review MR.'
            setErrorMessage(message)
            setReviewFlowState('error')
        } finally {
            setIsReviewing(false)
        }
    }

    const postCommentsToMergeRequest = async () => {
        setErrorMessage('')
        setStatusMessage('')

        if (findings.length === 0) {
            setErrorMessage('No findings to post. Run review first.')
            return
        }

        try {
            setIsPosting(true)
            setReviewFlowState('posting')
            const target = parseMergeRequestUrl(mergeRequestUrl)
            const result = await postFindingsAsNotes(target, accessToken, findings)
            const messageParts: string[] = []

            if (result.postedCount > 0) {
                messageParts.push(`Posted ${result.postedCount} new comment(s) to GitLab.`)
            }

            if (result.skippedCount > 0) {
                messageParts.push(`Skipped ${result.skippedCount} duplicate comment(s) already present on this MR.`)
            }

            setStatusMessage(messageParts.join(' ') || 'No new comments to post. All findings were already posted.')
            setTotalCommentsPosted((previous) => previous + result.postedCount)
            setReviewFlowState('posted')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to post comments.'
            setErrorMessage(message)
            setReviewFlowState('error')
        } finally {
            setIsPosting(false)
        }
    }

    const clearHistory = () => {
        setHistory([])
        localStorage.removeItem(HISTORY_STORAGE_KEY)
        setStatusMessage('Review history cleared.')
        setErrorMessage('')
    }

    const dashboardView = (
        <Stack className={classes.root}>
            <Typography variant="body2" color="text.secondary">
                Analyze GitLab Merge Requests and auto-post review comments.
            </Typography>

            <Box className={classes.statsGrid}>
                <Paper className={classes.statCard}>
                    <Box className={classes.statTopRow}>
                        <Box className={`${classes.statIconBadge} ${classes.statIconReviews}`}>
                            <InsightsRoundedIcon fontSize="small" />
                        </Box>
                        <Typography className={classes.statValue}>{reviewsRunCount}</Typography>
                    </Box>
                    <Typography className={classes.statLabel}>REVIEWS RUN</Typography>
                </Paper>
                <Paper className={classes.statCard}>
                    <Box className={classes.statTopRow}>
                        <Box className={`${classes.statIconBadge} ${classes.statIconIssues}`}>
                            <ErrorOutlineRoundedIcon fontSize="small" />
                        </Box>
                        <Typography className={classes.statValue}>{findings.length}</Typography>
                    </Box>
                    <Typography className={classes.statLabel}>ISSUES FOUND</Typography>
                </Paper>
                <Paper className={classes.statCard}>
                    <Box className={classes.statTopRow}>
                        <Box className={`${classes.statIconBadge} ${classes.statIconComments}`}>
                            <ChatBubbleOutlineRoundedIcon fontSize="small" />
                        </Box>
                        <Typography className={classes.statValue}>{totalCommentsPosted}</Typography>
                    </Box>
                    <Typography className={classes.statLabel}>COMMENTS POSTED</Typography>
                </Paper>
                <Paper className={classes.statCard}>
                    <Box className={classes.statTopRow}>
                        <Box className={`${classes.statIconBadge} ${classes.statIconReviewed}`}>
                            <DescriptionRoundedIcon fontSize="small" />
                        </Box>
                        <Typography className={classes.statValue}>{lastReviewedFiles}</Typography>
                    </Box>
                    <Typography className={classes.statLabel}>FILES REVIEWED</Typography>
                </Paper>
                <Paper className={classes.statCard}>
                    <Box className={classes.statTopRow}>
                        <Box className={`${classes.statIconBadge} ${classes.statIconExcluded}`}>
                            <BlockRoundedIcon fontSize="small" />
                        </Box>
                        <Typography className={classes.statValue}>{lastExcludedFiles}</Typography>
                    </Box>
                    <Typography className={classes.statLabel}>FILES EXCLUDED</Typography>
                </Paper>
            </Box>

            <SectionCard title="New Code Review">
                <Stack className={classes.reviewPanel}>
                    <Typography variant="subtitle2" className={classes.stepTitle}>
                        Enter Merge Request details
                    </Typography>
                    <TextField
                        className={classes.field}
                        label="GitLab MR URL"
                        placeholder="https://gitlab.company.com/group/project/-/merge_requests/42"
                        value={mergeRequestUrl}
                        onChange={(event) => setMergeRequestUrl(event.target.value)}
                        fullWidth
                    />

                    <Box className={classes.formGrid}>
                        <TextField
                            className={classes.field}
                            label="GitLab Host (Auto-detected)"
                            value={autoDetectedHost}
                            fullWidth
                            InputProps={{ readOnly: true }}
                        />
                        <TextField
                            className={classes.field}
                            label="Personal Access Token"
                            type="password"
                            value={accessToken}
                            onChange={(event) => setAccessToken(event.target.value)}
                            fullWidth
                        />
                    </Box>

                    <Typography variant="body2" className={classes.stepHint}>
                        File type filter is automatic: only `.ts` and `.tsx` files are reviewed.
                    </Typography>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={includeTestFiles}
                                onChange={(event) => setIncludeTestFiles(event.target.checked)}
                            />
                        }
                        label="Include Test Files"
                    />

                    <Box className={classes.reviewActionRow}>
                        <Button
                            variant="contained"
                            className={classes.reviewButton}
                            onClick={reviewMergeRequest}
                            disabled={isReviewing || isPosting || isFileSelectionOpen}
                        >
                            {isReviewing ? 'Reviewing...' : 'Start Review'}
                        </Button>
                        <Typography variant="body2" className={classes.helperMeta}>
                            {rules.filter((rule) => rule.enabled).length} active rules
                        </Typography>
                        <Button variant="text" onClick={() => setActiveMenu('history')}>
                            View review history
                        </Button>
                    </Box>
                </Stack>
            </SectionCard>

            <SectionCard title="Review Timeline">
                <Box className={classes.timelineContainer}>
                    <Stepper activeStep={timelineStepIndex} alternativeLabel className={classes.timelineStepper}>
                        {REVIEW_TIMELINE_STEPS.map((label, index) => (
                            <Step key={label} completed={timelineStepIndex > index}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                    <Typography
                        variant="body2"
                        className={reviewFlowState === 'error' ? classes.timelineError : classes.timelineStatus}
                    >
                        {timelineStatusText}
                    </Typography>
                </Box>
            </SectionCard>

            {statusMessage && <Alert severity="success" className={classes.statusAlert}>{statusMessage}</Alert>}
            {errorMessage && <Alert severity="error" className={classes.statusAlert}>{errorMessage}</Alert>}

            {/* {hasReviewed && reviewedChanges.length > 0 && (
                <SectionCard title="MR Diff Preview">
                    <Stack className={classes.diffList}>
                        {reviewedChanges.map((change, index) => {
                            const filePath = getChangePath(change) || `File ${index + 1}`
                            const diffText = change.diff?.trim() || 'No diff available for this file.'

                            return (
                                <Paper key={`${filePath}-${index}`} className={classes.diffItem}>
                                    <Typography variant="subtitle2" className={classes.diffPath}>
                                        {filePath}
                                    </Typography>
                                    <Box component="pre" className={classes.diffCode}>
                                        {diffText}
                                    </Box>
                                </Paper>
                            )
                        })}
                    </Stack>
                </SectionCard>
            )} */}

            {hasReviewed && findings.length > 0 && (
                <SectionCard title="Detected Issues">
                    <FindingsSummary findings={findings} summary={findingCountByRule} />
                    <Box className={classes.resultActions}>
                        <Button
                            variant="outlined"
                            className={classes.postButton}
                            onClick={postCommentsToMergeRequest}
                            disabled={isReviewing || isPosting || findings.length === 0}
                        >
                            {isPosting ? 'Posting...' : 'Post Comments to GitLab'}
                        </Button>
                    </Box>
                </SectionCard>
            )}
        </Stack>
    )

    const historyView = (
        <Stack className={classes.root}>
            <Box className={classes.sectionHeader}>
                <Typography variant="h4" className={classes.heading}>
                    History of Reviews
                </Typography>
                <Button variant="outlined" color="error" onClick={clearHistory}>
                    Clear review history
                </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" className={classes.subHeading}>
                Past review runs are saved locally in your browser.
            </Typography>
            <SectionCard title="Recent Reviews">
                <ReviewHistoryView items={history} />
            </SectionCard>
        </Stack>
    )

    const settingsView = (
        <Stack className={classes.root}>
            <Typography variant="h4" className={classes.heading}>
                Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" className={classes.subHeading}>
                Manage local behavior for this frontend utility.
            </Typography>
            <SectionCard title="Preferences">
                <SettingsView
                    saveHistory={saveHistory}
                    saveCredentials={saveCredentials}
                    rules={rules}
                    onSaveHistoryChange={setSaveHistory}
                    onSaveCredentialsChange={setSaveCredentials}
                    onRuleAdd={addCustomRule}
                    onRuleUpdate={updateRule}
                    onRuleDelete={deleteRule}
                />
            </SectionCard>
        </Stack>
    )

    const activeView =
        activeMenu === 'dashboard'
            ? dashboardView
            : activeMenu === 'history'
                ? historyView
                : settingsView

    return (
        <Box className={classes.page}>
            <Box className={classes.shell}>
                <TopMenu
                    active={activeMenu}
                    onChange={setActiveMenu}
                />
                <Box className={classes.content}>{activeView}</Box>
            </Box>

            <Dialog open={isFileSelectionOpen} onClose={cancelFileSelection} fullWidth maxWidth="md">
                <DialogTitle>Select Files to Review</DialogTitle>
                <DialogContent>
                    <Stack spacing={1.25}>
                        <Typography variant="body2" className={classes.selectionHint}>
                            Deselect any files you do not want to review. {selectedFileCount} of {fileSelectionItems.length} file(s) selected.
                        </Typography>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={fileSelectionItems.length > 0 && selectedFileCount === fileSelectionItems.length}
                                    indeterminate={selectedFileCount > 0 && selectedFileCount < fileSelectionItems.length}
                                    onChange={(event) => toggleAllFileSelections(event.target.checked)}
                                />
                            }
                            label="Select all files"
                        />
                        <Box className={classes.selectionList}>
                            <FormGroup>
                                {fileSelectionItems.map((item) => (
                                    <FormControlLabel
                                        key={item.id}
                                        control={
                                            <Checkbox
                                                checked={item.selected}
                                                onChange={() => toggleFileSelection(item.id)}
                                            />
                                        }
                                        label={item.path}
                                    />
                                ))}
                            </FormGroup>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelFileSelection}>Cancel</Button>
                    <Button variant="contained" onClick={confirmFileSelection}>
                        Continue Review
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default ReviewerPage
