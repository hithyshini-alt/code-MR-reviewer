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
    IconButton,
    Paper,
    Radio,
    RadioGroup,
    Stack,
    Step,
    StepLabel,
    Stepper,
    TextField,
    Tooltip,
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
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import FolderRoundedIcon from '@mui/icons-material/FolderRounded'
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded'
import { makeStyles } from '../hooks/makeStyles'
import {
    fetchMergeRequestChanges,
    postFindingsAsNotes,
} from '../services/gitlab'
import {
    clearStoredCredentials,
    fetchStoredCredentials,
    saveStoredCredentials,
} from '../services/credentials'
import {
    createUserRule,
    deleteUserRule,
    fetchUserRules,
    seedDefaultRules,
    updateUserRule,
} from '../services/rules'
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
import type { AuthUser } from '../types/auth'

type ReviewerPageProps = {
    currentUser: AuthUser
    authToken: string
    onLogout: () => void
}

const useStyles = makeStyles((theme) => ({
    page: {
        minHeight: '100vh',
        backgroundColor: '#edf7f5',
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
        padding: theme.spacing(4, 2.5, 6),
        maxWidth: '100%',
        width: '100%',
        margin: 0,
        [theme.breakpoints.down('md')]: {
            padding: theme.spacing(2.5, 1.25, 3.5),
        },
    },
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(3),
        animation: 'riseIn 420ms ease both',
    },
    statusAlert: {
        borderRadius: theme.spacing(1.4),
    },
    hero: {
        padding: theme.spacing(2.25),
        borderRadius: theme.spacing(2),
        border: `1px solid ${theme.palette.primary.light}66`,
        backgroundColor: 'rgba(15, 118, 110, 0.08)',
    },
    heading: {
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: -0.35,
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
        backgroundColor: '#f8fcfb',
        border: `1px solid ${theme.palette.primary.light}55`,
        boxShadow: '0 12px 26px rgba(15, 23, 42, 0.07)',
        minHeight: 138,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        animation: 'cardFloat 440ms ease both',
        '&:hover': {
            transform: 'translateY(-3px)',
            borderColor: theme.palette.primary.light,
            boxShadow: '0 18px 32px rgba(15, 23, 42, 0.11)',
        },
        '&:nth-of-type(2)': {
            animationDelay: '50ms',
        },
        '&:nth-of-type(3)': {
            animationDelay: '90ms',
        },
        '&:nth-of-type(4)': {
            animationDelay: '130ms',
        },
        '&:nth-of-type(5)': {
            animationDelay: '170ms',
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
    statHelperText: {
        marginTop: theme.spacing(0.5),
        color: theme.palette.text.secondary,
        fontSize: '0.1rem',
        letterSpacing: 0.4,
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
            fontWeight: 600,
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
        backgroundColor: theme.palette.primary.main,
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
        padding: theme.spacing(0.75),
        marginTop: theme.spacing(1),
        backgroundColor: '#fcfcff',
    },
    treeRow: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.5),
        minHeight: 34,
        borderRadius: theme.spacing(1),
        paddingRight: theme.spacing(1),
        '&:hover': {
            backgroundColor: `${theme.palette.primary.light}1a`,
        },
    },
    folderLabel: {
        fontWeight: 600,
        color: theme.palette.text.primary,
    },
    treeMeta: {
        color: theme.palette.text.secondary,
        fontSize: '0.76rem',
    },
    fileLabel: {
        color: theme.palette.text.primary,
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
    contentInner: {
        position: 'relative',
    },
    collapsedSidebarRail: {
        width: 56,
        minWidth: 56,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: theme.spacing(2),
        backgroundColor: '#f0faf8',
        borderRight: `1px solid ${theme.palette.primary.light}66`,
        boxShadow: 'inset -1px 0 0 rgba(15, 118, 110, 0.1)',
        [theme.breakpoints.down('md')]: {
            display: 'none',
        },
    },
    collapsedSidebarButton: {
        border: `1px solid ${theme.palette.primary.light}`,
        color: theme.palette.primary.main,
        backgroundColor: '#eaf8f4',
        boxShadow: '0 6px 16px rgba(15, 23, 42, 0.08)',
        '&:hover': {
            backgroundColor: '#d8f1ea',
        },
    },
    historyWorkspace: {
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 420px) minmax(0, 1fr)',
        gap: theme.spacing(2),
        alignItems: 'start',
        [theme.breakpoints.down('lg')]: {
            gridTemplateColumns: '1fr',
        },
    },
    historyListCard: {
        position: 'sticky',
        top: theme.spacing(1),
        [theme.breakpoints.down('lg')]: {
            position: 'relative',
            top: 0,
        },
    },
    historyListScroll: {
        maxHeight: 'calc(100vh - 290px)',
        overflowY: 'auto',
        paddingRight: theme.spacing(0.25),
        [theme.breakpoints.down('lg')]: {
            maxHeight: 'none',
            overflowY: 'visible',
            paddingRight: 0,
        },
    },
    historyResultCard: {
        minHeight: 440,
    },
    historyResultMeta: {
        marginBottom: theme.spacing(1.25),
        color: theme.palette.text.secondary,
        wordBreak: 'break-word',
    },
    historyPlaceholder: {
        padding: theme.spacing(3),
        borderRadius: theme.spacing(1.5),
        border: `1px dashed ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.default,
    },
    legacySummaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: theme.spacing(1),
        [theme.breakpoints.down('sm')]: {
            gridTemplateColumns: '1fr',
        },
    },
    legacySummaryCard: {
        padding: theme.spacing(1.25),
        borderRadius: theme.spacing(1),
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
    },
    legacySummaryLabel: {
        color: theme.palette.text.secondary,
        fontSize: '0.82rem',
    },
    legacySummaryValue: {
        marginTop: theme.spacing(0.25),
        fontWeight: 700,
    },
}))

const HISTORY_STORAGE_KEY = 'mr-reviewer-history-v1'
const FINDING_RECURRENCE_STORAGE_KEY = 'mr-reviewer-finding-recurrence-v1'

type ReviewFlowState =
    | 'idle'
    | 'reviewing'
    | 'reviewed'
    | 'posting'
    | 'posted'
    | 'error'

const REVIEW_TIMELINE_STEPS_WITH_POSTING = [
    'Ready',
    'Reviewing',
    'Reviewed',
    'Posting comments',
    'Completed',
]

const REVIEW_TIMELINE_STEPS_NO_POSTING = [
    'Ready',
    'Reviewing',
    'Reviewed',
    'Completed',
]

type FileSelectionItem = {
    id: string
    path: string
    change: GitLabChange
    selected: boolean
}

type FileTreeFolder = {
    name: string
    path: string
    folders: FileTreeFolder[]
    files: FileSelectionItem[]
}

type FileSelectionTree = {
    folders: FileTreeFolder[]
    files: FileSelectionItem[]
}

function getChangePath(change: GitLabChange): string {
    return change.new_path || change.old_path || ''
}

function normalizeSelectionPath(filePath: string): string {
    return filePath.replace(/\\/g, '/').replace(/^\/+/, '')
}

function getFileNameFromPath(filePath: string): string {
    const normalized = normalizeSelectionPath(filePath)
    const parts = normalized.split('/').filter(Boolean)
    return parts.at(-1) || normalized
}

function buildFileSelectionTree(items: FileSelectionItem[]): FileSelectionTree {
    type MutableFolder = {
        name: string
        path: string
        folders: Map<string, MutableFolder>
        files: FileSelectionItem[]
    }

    const root: MutableFolder = {
        name: '',
        path: '',
        folders: new Map<string, MutableFolder>(),
        files: [],
    }

    const sortedItems = [...items].sort((a, b) => a.path.localeCompare(b.path))

    for (const item of sortedItems) {
        const normalized = normalizeSelectionPath(item.path)
        const parts = normalized.split('/').filter(Boolean)

        if (parts.length <= 1) {
            root.files.push(item)
            continue
        }

        let current = root
        const folderParts = parts.slice(0, -1)

        for (const folderName of folderParts) {
            const folderPath = current.path ? `${current.path}/${folderName}` : folderName

            if (!current.folders.has(folderName)) {
                current.folders.set(folderName, {
                    name: folderName,
                    path: folderPath,
                    folders: new Map<string, MutableFolder>(),
                    files: [],
                })
            }

            current = current.folders.get(folderName) as MutableFolder
        }

        current.files.push(item)
    }

    const toReadonlyFolder = (folder: MutableFolder): FileTreeFolder => ({
        name: folder.name,
        path: folder.path,
        folders: [...folder.folders.values()]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(toReadonlyFolder),
        files: [...folder.files].sort((a, b) => a.path.localeCompare(b.path)),
    })

    return {
        folders: [...root.folders.values()]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(toReadonlyFolder),
        files: [...root.files].sort((a, b) => a.path.localeCompare(b.path)),
    }
}

function isTestFilePath(filePath: string): boolean {
    const normalized = filePath.toLowerCase().replace(/\\/g, '/')

    return (
        /\.(test|spec)\.(ts|tsx)$/.test(normalized) ||
        normalized.includes('/__tests__/') ||
        normalized.includes('/tests/') ||
        normalized.includes('/test/')
    )
}

function isReviewableFileType(filePath: string, includeTestFiles: boolean): boolean {
    const normalized = filePath.toLowerCase()

    if (!includeTestFiles && isTestFilePath(normalized)) {
        return false
    }

    return normalized.endsWith('.ts') || normalized.endsWith('.tsx')
}

function buildFindingRecurrenceSignature(finding: Finding): string {
    const normalizedPath = finding.filePath.trim().toLowerCase().replace(/\\/g, '/')
    const normalizedSnippet = finding.snippet.trim().toLowerCase().replace(/\s+/g, ' ')
    return `${normalizedPath}|${finding.ruleId}|${normalizedSnippet}`
}

function safeParseRecurrenceCounts(raw: string | null): Record<string, number> {
    if (!raw) {
        return {}
    }

    try {
        const parsed = JSON.parse(raw) as Record<string, unknown>
        if (!parsed || typeof parsed !== 'object') {
            return {}
        }

        const normalized: Record<string, number> = {}
        for (const [key, value] of Object.entries(parsed)) {
            if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
                normalized[key] = Math.floor(value)
            }
        }

        return normalized
    } catch {
        return {}
    }
}

function toBuiltInSummary(summary: ReviewHistoryItem['summary'] | undefined): BuiltInFindingsSummary {
    return {
        noSx: summary?.noSx ?? 0,
        noDeprecatedTags: summary?.noDeprecatedTags ?? 0,
        optionalChaining: summary?.optionalChaining ?? 0,
        custom: summary?.custom ?? 0,
    }
}

function ReviewerPage({ currentUser, authToken, onLogout }: ReviewerPageProps) {
    const classes = useStyles()

    const [activeMenu, setActiveMenu] = useState<MenuKey>('dashboard')
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [mergeRequestUrl, setMergeRequestUrl] = useState('')
    const [accessToken, setAccessToken] = useState('')
    const [aiApiKey, setAiApiKey] = useState('')
    const [rules, setRules] = useState<ReviewRule[]>(defaultRules)
    const [findings, setFindings] = useState<Finding[]>([])
    const [postableFindings, setPostableFindings] = useState<Finding[]>([])
    const [history, setHistory] = useState<ReviewHistoryItem[]>([])
    const [selectedHistoryItemId, setSelectedHistoryItemId] = useState<string | null>(null)
    const [saveHistory, setSaveHistory] = useState(true)
    const [saveCredentials, setSaveCredentials] = useState(true)
    const [hasLoadedCredentials, setHasLoadedCredentials] = useState(false)
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
    const [reviewedChanges, setReviewedChanges] = useState<GitLabChange[]>([])
    const [isFileSelectionOpen, setIsFileSelectionOpen] = useState(false)
    const [fileSelectionItems, setFileSelectionItems] = useState<FileSelectionItem[]>([])
    const [fileSelectionTotalChanges, setFileSelectionTotalChanges] = useState(0)
    const [expandedFolderPaths, setExpandedFolderPaths] = useState<string[]>([])
    const [recurrenceCounts, setRecurrenceCounts] = useState<Record<string, number>>({})
    const [recurringSignatures, setRecurringSignatures] = useState<string[]>([])

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
    const selectedHistoryItem = useMemo(
        () => history.find((item) => item.id === selectedHistoryItemId) ?? null,
        [history, selectedHistoryItemId],
    )
    const selectedHistoryFindings = selectedHistoryItem?.findings ?? []
    const selectedHistoryReviewedChanges = selectedHistoryItem?.reviewedChanges ?? []
    const selectedHistorySummary = useMemo(
        () => toBuiltInSummary(selectedHistoryItem?.summary),
        [selectedHistoryItem],
    )
    const selectedFileCount = useMemo(
        () => fileSelectionItems.filter((item) => item.selected).length,
        [fileSelectionItems],
    )
    const fileSelectionTree = useMemo(
        () => buildFileSelectionTree(fileSelectionItems),
        [fileSelectionItems],
    )
    const shouldShowPostingStep = useMemo(
        () => findings.length > 0 || reviewFlowState === 'posting' || reviewFlowState === 'posted',
        [findings.length, reviewFlowState],
    )
    const timelineSteps = useMemo(
        () =>
            shouldShowPostingStep
                ? REVIEW_TIMELINE_STEPS_WITH_POSTING
                : REVIEW_TIMELINE_STEPS_NO_POSTING,
        [shouldShowPostingStep],
    )
    const timelineStepIndex = useMemo(() => {
        const isNoIssueReviewComplete =
            reviewFlowState === 'reviewed' && hasReviewed && findings.length === 0

        if (isNoIssueReviewComplete) {
            return shouldShowPostingStep ? 4 : 3
        }

        if (!shouldShowPostingStep) {
            switch (reviewFlowState) {
                case 'idle':
                    return 0
                case 'reviewing':
                    return 1
                case 'reviewed':
                    return 2
                case 'posted':
                    return 3
                case 'error':
                    return 0
                default:
                    return 0
            }
        }

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
    }, [findings.length, hasReviewed, reviewFlowState, shouldShowPostingStep])

    const isTimelineComplete = useMemo(() => {
        return (
            reviewFlowState === 'posted' ||
            (reviewFlowState === 'reviewed' && hasReviewed && findings.length === 0)
        )
    }, [findings.length, hasReviewed, reviewFlowState])

    const timelineStatusText = useMemo(() => {
        const isNoIssueReviewComplete =
            reviewFlowState === 'reviewed' && hasReviewed && findings.length === 0

        if (isNoIssueReviewComplete) {
            return 'Status: Review completed. No issues found.'
        }

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
    }, [findings.length, hasReviewed, reviewFlowState])

    useEffect(() => {
        try {
            const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
            if (!raw) {
                return
            }

            const parsed = JSON.parse(raw) as ReviewHistoryItem[]
            if (Array.isArray(parsed)) {
                const normalized = parsed
                    .map((item) => ({
                        ...item,
                        summary: toBuiltInSummary(item.summary),
                        findings: Array.isArray(item.findings) ? item.findings : [],
                        reviewedChanges: Array.isArray(item.reviewedChanges) ? item.reviewedChanges : [],
                    }))
                    .sort(
                        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                    )

                setHistory(normalized)
            }
        } catch {
            setHistory([])
        }
    }, [])

    useEffect(() => {
        if (history.length === 0) {
            setSelectedHistoryItemId(null)
            return
        }

        setSelectedHistoryItemId((previous) =>
            previous && history.some((item) => item.id === previous) ? previous : history[0].id,
        )
    }, [history])

    useEffect(() => {
        let isActive = true

        // Reset load state on account switch so persistence waits for the correct account data.
        setHasLoadedCredentials(false)
        setAccessToken('')
        setAiApiKey('')
        setSaveCredentials(true)

        const loadCredentials = async () => {
            try {
                const result = await fetchStoredCredentials(authToken)
                if (!isActive) {
                    return
                }

                const credentials = result.credentials

                if (!credentials) {
                    setAccessToken('')
                    setAiApiKey('')
                    setSaveCredentials(true)
                    return
                }

                // Keep account-level persistence enabled by default.
                // Empty stored values should not disable future saves.
                setSaveCredentials(true)
                setAccessToken(credentials.gitlabPat || '')
                setAiApiKey(credentials.aiApiKey || '')
            } catch {
                if (!isActive) {
                    return
                }

                setAccessToken('')
                setAiApiKey('')
                setSaveCredentials(true)
            } finally {
                if (isActive) {
                    setHasLoadedCredentials(true)
                }
            }
        }

        void loadCredentials()

        return () => {
            isActive = false
        }
    }, [authToken])

    useEffect(() => {
        let isActive = true

        const loadRules = async () => {
            try {
                const storedRules = await fetchUserRules(authToken)
                if (!isActive) {
                    return
                }

                if (storedRules.length > 0) {
                    setRules(storedRules)
                    return
                }

                // First login for this account: seed defaults so edits stay user-specific.
                const seededRules = await seedDefaultRules(authToken, defaultRules)
                if (!isActive) {
                    return
                }

                setRules(seededRules)
            } catch {
                if (!isActive) {
                    return
                }

                setRules(defaultRules)
                setErrorMessage('Failed to load account rules from backend.')
            }
        }

        void loadRules()

        return () => {
            isActive = false
        }
    }, [authToken])

    useEffect(() => {
        const parsedCounts = safeParseRecurrenceCounts(
            localStorage.getItem(FINDING_RECURRENCE_STORAGE_KEY),
        )
        setRecurrenceCounts(parsedCounts)
    }, [])

    useEffect(() => {
        if (Object.keys(recurrenceCounts).length === 0) {
            localStorage.removeItem(FINDING_RECURRENCE_STORAGE_KEY)
            return
        }

        localStorage.setItem(FINDING_RECURRENCE_STORAGE_KEY, JSON.stringify(recurrenceCounts))
    }, [recurrenceCounts])

    useEffect(() => {
        if (!saveHistory) {
            localStorage.removeItem(HISTORY_STORAGE_KEY)
            return
        }

        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
    }, [history, saveHistory])

    useEffect(() => {
        if (!hasLoadedCredentials) {
            return
        }

        const persistCredentials = async () => {
            try {
                if (!saveCredentials) {
                    await clearStoredCredentials(authToken)
                    return
                }

                // Avoid creating empty credential rows on first load before user enters keys.
                if (!accessToken.trim() && !aiApiKey.trim()) {
                    return
                }

                await saveStoredCredentials(authToken, {
                    gitlabPat: accessToken.trim(),
                    aiApiKey: aiApiKey.trim(),
                })
            } catch {
                // Keep reviewing flow usable even if credentials persistence fails.
            }
        }

        void persistCredentials()
    }, [accessToken, aiApiKey, authToken, hasLoadedCredentials, saveCredentials])

    const addCustomRule = (rule: {
        title: string
        pattern: string
        comment: string
        severity: RuleSeverity
    }) => {
        const newRuleInput: ReviewRule = {
            id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            matcherType: 'regex',
            title: rule.title,
            enabled: true,
            comment: rule.comment,
            severity: rule.severity,
            pattern: rule.pattern,
        }

        const createRule = async () => {
            try {
                const created = await createUserRule(authToken, newRuleInput)
                setRules((previous) => [...previous, created])
                setStatusMessage('Custom rule added.')
                setErrorMessage('')
            } catch {
                setErrorMessage('Failed to save custom rule for this account.')
            }
        }

        void createRule()
    }

    const updateRule = (
        ruleId: string,
        updates: Partial<Pick<ReviewRule, 'title' | 'comment' | 'severity' | 'enabled' | 'pattern'>>,
    ) => {
        setRules((previous) =>
            previous.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)),
        )

        const persistRuleUpdate = async () => {
            try {
                const updated = await updateUserRule(authToken, ruleId, updates)
                setRules((previous) =>
                    previous.map((rule) => (rule.id === ruleId ? updated : rule)),
                )
            } catch {
                setErrorMessage('Failed to update rule. Reloading account rules...')
                try {
                    const latest = await fetchUserRules(authToken)
                    setRules(latest.length > 0 ? latest : defaultRules)
                } catch {
                    setRules(defaultRules)
                }
            }
        }

        void persistRuleUpdate()
    }

    const deleteRule = (ruleId: string) => {
        const previousRules = rules
        setRules((previous) => previous.filter((item) => item.id !== ruleId))

        const persistRuleDelete = async () => {
            try {
                await deleteUserRule(authToken, ruleId)
                setStatusMessage('Rule deleted.')
                setErrorMessage('')
            } catch {
                setRules(previousRules)
                setErrorMessage('Failed to delete rule for this account.')
            }
        }

        void persistRuleDelete()
    }

    const completeReviewFromChanges = (changesToReview: GitLabChange[], totalReviewableCount: number) => {
        const excludedCount = Math.max(totalReviewableCount - changesToReview.length, 0)
        const newFindings = analyzeDiff(changesToReview, rules)
        const summary = summarizeFindings(newFindings, rules)
        const currentSignatures = newFindings.map(buildFindingRecurrenceSignature)
        const recurringNow = currentSignatures.filter(
            (signature) => (recurrenceCounts[signature] ?? 0) > 0,
        )

        setRecurringSignatures(Array.from(new Set(recurringNow)))

        setRecurrenceCounts((previous) => {
            const next = { ...previous }
            for (const signature of currentSignatures) {
                next[signature] = (next[signature] ?? 0) + 1
            }
            return next
        })

        setReviewedChanges(changesToReview)
        setFindings(newFindings)
        setPostableFindings(newFindings)
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
                findings: newFindings,
                reviewedChanges: changesToReview,
            }

            setHistory((previous) => [historyItem, ...previous].slice(0, 20))
            setSelectedHistoryItemId(historyItem.id)
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

    const toggleFolderExpanded = (folderPath: string) => {
        setExpandedFolderPaths((previous) =>
            previous.includes(folderPath)
                ? previous.filter((value) => value !== folderPath)
                : [...previous, folderPath],
        )
    }

    const getFolderSelectionStats = (folderPath: string) => {
        const matching = fileSelectionItems.filter((item) => {
            const normalized = normalizeSelectionPath(item.path)
            return normalized === folderPath || normalized.startsWith(`${folderPath}/`)
        })

        const selectedCount = matching.filter((item) => item.selected).length

        return {
            totalCount: matching.length,
            selectedCount,
        }
    }

    const toggleFolderSelection = (folderPath: string, checked: boolean) => {
        setFileSelectionItems((previous) =>
            previous.map((item) => {
                const normalized = normalizeSelectionPath(item.path)
                if (normalized === folderPath || normalized.startsWith(`${folderPath}/`)) {
                    return {
                        ...item,
                        selected: checked,
                    }
                }

                return item
            }),
        )
    }

    const cancelFileSelection = () => {
        setIsFileSelectionOpen(false)
        setFileSelectionItems([])
        setExpandedFolderPaths([])
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
        setExpandedFolderPaths([])

        completeReviewFromChanges(selectedChanges, fileSelectionTotalChanges)
        setFileSelectionTotalChanges(0)
    }

    const reviewMergeRequest = async () => {
        setErrorMessage('')
        setStatusMessage('')
        setFindings([])
        setPostableFindings([])
        setRecurringSignatures([])
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
                completeReviewFromChanges([], 0)
                setStatusMessage('No reviewable files found for the selected filter.')
                return
            }

            const items: FileSelectionItem[] = autoFilteredChanges.map((change, index) => ({
                id: `${index}-${getChangePath(change)}`,
                path: getChangePath(change),
                change,
                selected: true,
            }))

            const initialExpandedFolders = Array.from(
                new Set(
                    items.flatMap((item) => {
                        const parts = normalizeSelectionPath(item.path).split('/').filter(Boolean)
                        const folderParts = parts.slice(0, -1)

                        return folderParts.map((_, index) =>
                            folderParts.slice(0, index + 1).join('/'),
                        )
                    }),
                ),
            )

            setFileSelectionItems(items)
            setExpandedFolderPaths(initialExpandedFolders)
            setFileSelectionTotalChanges(autoFilteredChanges.length)
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

        if (postableFindings.length === 0) {
            setErrorMessage('No selected active findings to post.')
            return
        }

        try {
            setIsPosting(true)
            setReviewFlowState('posting')
            const target = parseMergeRequestUrl(mergeRequestUrl)
            const result = await postFindingsAsNotes(target, accessToken, postableFindings)
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
        setRecurrenceCounts({})
        setRecurringSignatures([])
        localStorage.removeItem(HISTORY_STORAGE_KEY)
        localStorage.removeItem(FINDING_RECURRENCE_STORAGE_KEY)
        setStatusMessage('Review history cleared.')
        setErrorMessage('')
    }

    const dashboardView = (
        <Stack className={classes.root}>
            <Box className={classes.hero}>
                <Typography variant="h4" className={classes.heading}>
                    Merge Request Reviewer
                </Typography>
                <Typography variant="body2" color="text.secondary" className={classes.subHeading}>
                    Analyze GitLab Merge Requests, surface code risks quickly, and post actionable comments with one flow.
                </Typography>
            </Box>

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
                    <Typography className={classes.statHelperText}>Current review only</Typography>
                </Paper>
                <Paper className={classes.statCard}>
                    <Box className={classes.statTopRow}>
                        <Box className={`${classes.statIconBadge} ${classes.statIconExcluded}`}>
                            <BlockRoundedIcon fontSize="small" />
                        </Box>
                        <Typography className={classes.statValue}>{lastExcludedFiles}</Typography>
                    </Box>
                    <Typography className={classes.statLabel}>FILES EXCLUDED</Typography>
                    <Typography className={classes.statHelperText}>Current review only</Typography>
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

                    <TextField
                        className={classes.field}
                        label="AI Fix API Key"
                        type="password"
                        value={aiApiKey}
                        onChange={(event) => setAiApiKey(event.target.value)}
                        fullWidth
                        helperText="Used by Get AI Fix for Llama 3 suggestions"
                    />

                    <RadioGroup
                        row
                        value={includeTestFiles ? 'include' : 'exclude'}
                        onChange={(event) => setIncludeTestFiles(event.target.value === 'include')}
                    >
                        <FormControlLabel
                            value="include"
                            control={<Radio />}
                            label="Include test case files"
                        />
                        <FormControlLabel
                            value="exclude"
                            control={<Radio />}
                            label="Exclude test case files"
                        />
                    </RadioGroup>

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
                            {rules.filter((rule) => rule.enabled).length} active of {rules.length} total rules
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
                        {timelineSteps.map((label, index) => (
                            <Step
                                key={label}
                                completed={
                                    timelineStepIndex > index ||
                                    (isTimelineComplete && index === timelineSteps.length - 1)
                                }
                            >
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
                    <FindingsSummary
                        findings={findings}
                        summary={findingCountByRule}
                        reviewedChanges={reviewedChanges}
                        aiApiKey={aiApiKey}
                        recurringSignatures={recurringSignatures}
                        onPostableFindingsChange={setPostableFindings}
                    />
                    <Box className={classes.resultActions}>
                        <Button
                            variant="outlined"
                            className={classes.postButton}
                            onClick={postCommentsToMergeRequest}
                            disabled={isReviewing || isPosting || postableFindings.length === 0}
                        >
                            {isPosting
                                ? 'Posting...'
                                : `Post Selected Comments to GitLab (${postableFindings.length})`}
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
            <Box className={classes.historyWorkspace}>
                <Box className={classes.historyListCard}>
                    <SectionCard title="Recent Reviews">
                        <Box className={classes.historyListScroll}>
                            <ReviewHistoryView
                                items={history}
                                selectedItemId={selectedHistoryItemId}
                                onSelectItem={setSelectedHistoryItemId}
                            />
                        </Box>
                    </SectionCard>
                </Box>

                <Box className={classes.historyResultCard}>
                    <SectionCard
                        title={
                            selectedHistoryItem
                                ? `Review Result · ${new Date(selectedHistoryItem.createdAt).toLocaleString()}`
                                : 'Review Result'
                        }
                    >
                        {!selectedHistoryItem ? (
                            <Box className={classes.historyPlaceholder}>
                                <Typography color="text.secondary">
                                    Select a history card to view its review result here.
                                </Typography>
                            </Box>
                        ) : selectedHistoryFindings.length > 0 ? (
                            <>
                                <Typography variant="body2" className={classes.historyResultMeta}>
                                    {selectedHistoryItem.mergeRequestUrl}
                                </Typography>
                                <FindingsSummary
                                    key={selectedHistoryItem.id}
                                    findings={selectedHistoryFindings}
                                    summary={selectedHistorySummary}
                                    reviewedChanges={selectedHistoryReviewedChanges}
                                    aiApiKey={aiApiKey}
                                    recurringSignatures={[]}
                                    onPostableFindingsChange={() => { }}
                                />
                            </>
                        ) : selectedHistoryItem.totalFindings > 0 ? (
                            <Stack spacing={1.25}>
                                <Typography variant="body2" className={classes.historyResultMeta}>
                                    {selectedHistoryItem.mergeRequestUrl}
                                </Typography>
                                <Typography color="text.secondary">
                                    This review was saved before detailed per-file findings were stored.
                                    Summary counts are still available below.
                                </Typography>
                                <Box className={classes.legacySummaryGrid}>
                                    <Box className={classes.legacySummaryCard}>
                                        <Typography className={classes.legacySummaryLabel}>Total findings</Typography>
                                        <Typography className={classes.legacySummaryValue}>{selectedHistoryItem.totalFindings}</Typography>
                                    </Box>
                                    <Box className={classes.legacySummaryCard}>
                                        <Typography className={classes.legacySummaryLabel}>No sx</Typography>
                                        <Typography className={classes.legacySummaryValue}>{selectedHistorySummary.noSx}</Typography>
                                    </Box>
                                    <Box className={classes.legacySummaryCard}>
                                        <Typography className={classes.legacySummaryLabel}>Deprecated tags</Typography>
                                        <Typography className={classes.legacySummaryValue}>{selectedHistorySummary.noDeprecatedTags}</Typography>
                                    </Box>
                                    <Box className={classes.legacySummaryCard}>
                                        <Typography className={classes.legacySummaryLabel}>Optional chaining</Typography>
                                        <Typography className={classes.legacySummaryValue}>{selectedHistorySummary.optionalChaining}</Typography>
                                    </Box>
                                    <Box className={classes.legacySummaryCard}>
                                        <Typography className={classes.legacySummaryLabel}>Custom</Typography>
                                        <Typography className={classes.legacySummaryValue}>{selectedHistorySummary.custom}</Typography>
                                    </Box>
                                </Box>
                            </Stack>
                        ) : (
                            <Stack spacing={1.25}>
                                <Typography variant="body2" className={classes.historyResultMeta}>
                                    {selectedHistoryItem.mergeRequestUrl}
                                </Typography>
                                <Typography color="text.secondary">
                                    No issues were found in this review.
                                </Typography>
                            </Stack>
                        )}
                    </SectionCard>
                </Box>
            </Box>
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
                    aiApiKey={aiApiKey}
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

    const renderFileNode = (item: FileSelectionItem, depth: number) => (
        <Box
            key={item.id}
            className={classes.treeRow}
            sx={{ pl: `${depth * 22 + 10}px` }}
        >
            <Box sx={{ width: 22, display: 'inline-flex', justifyContent: 'center' }}>
                <DescriptionOutlinedIcon fontSize="small" color="disabled" />
            </Box>
            <Checkbox
                checked={item.selected}
                onChange={() => toggleFileSelection(item.id)}
                size="small"
            />
            <Typography variant="body2" className={classes.fileLabel}>
                {getFileNameFromPath(item.path)}
            </Typography>
        </Box>
    )

    const renderFolderNode = (folder: FileTreeFolder, depth: number) => {
        const isExpanded = expandedFolderPaths.includes(folder.path)
        const stats = getFolderSelectionStats(folder.path)

        return (
            <Box key={folder.path}>
                <Box
                    className={classes.treeRow}
                    sx={{ pl: `${depth * 22 + 2}px` }}
                >
                    <IconButton
                        size="small"
                        onClick={() => toggleFolderExpanded(folder.path)}
                    >
                        {isExpanded ? <ExpandMoreRoundedIcon fontSize="small" /> : <ChevronRightRoundedIcon fontSize="small" />}
                    </IconButton>
                    <Checkbox
                        checked={stats.totalCount > 0 && stats.selectedCount === stats.totalCount}
                        indeterminate={stats.selectedCount > 0 && stats.selectedCount < stats.totalCount}
                        onChange={(event) => toggleFolderSelection(folder.path, event.target.checked)}
                        size="small"
                    />
                    {isExpanded ? <FolderOpenRoundedIcon fontSize="small" color="primary" /> : <FolderRoundedIcon fontSize="small" color="primary" />}
                    <Typography variant="body2" className={classes.folderLabel}>
                        {folder.name}
                    </Typography>
                    <Typography className={classes.treeMeta}>
                        {stats.selectedCount}/{stats.totalCount}
                    </Typography>
                </Box>

                {isExpanded && (
                    <Box>
                        {folder.folders.map((childFolder) => renderFolderNode(childFolder, depth + 1))}
                        {folder.files.map((item) => renderFileNode(item, depth + 1))}
                    </Box>
                )}
            </Box>
        )
    }

    return (
        <Box className={classes.page}>
            <Box className={classes.shell}>
                {!isSidebarCollapsed ? (
                    <TopMenu
                        active={activeMenu}
                        onChange={setActiveMenu}
                        currentUser={currentUser}
                        onLogout={onLogout}
                        onCollapse={() => setIsSidebarCollapsed(true)}
                    />
                ) : (
                    <Box className={classes.collapsedSidebarRail}>
                        <Tooltip title="Open sidebar" placement="right">
                            <IconButton
                                size="small"
                                className={classes.collapsedSidebarButton}
                                onClick={() => setIsSidebarCollapsed(false)}
                                aria-label="Open sidebar"
                            >
                                <MenuOpenRoundedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
                <Box className={classes.content}>
                    <Box className={classes.contentInner}>
                        {activeView}
                    </Box>
                </Box>
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
                                {fileSelectionTree.folders.map((folder) => renderFolderNode(folder, 0))}
                                {fileSelectionTree.files.map((item) => renderFileNode(item, 0))}
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
