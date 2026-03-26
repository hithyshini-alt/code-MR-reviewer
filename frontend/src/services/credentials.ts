const API_BASE_URL =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
    'http://localhost:3001/api'

type CredentialsPayload = {
    gitlabPat: string
    aiApiKey: string
    gitlabBaseUrl?: string
}

type CredentialsResponse = {
    credentials: {
        gitlabBaseUrl: string
        gitlabPat: string
        aiApiKey: string
        hasGitlabPat: boolean
        hasAiApiKey: boolean
        updatedAt: string
    } | null
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

export function fetchStoredCredentials(token: string): Promise<CredentialsResponse> {
    return request<CredentialsResponse>('/credentials', token, { method: 'GET' })
}

export function saveStoredCredentials(token: string, payload: CredentialsPayload): Promise<CredentialsResponse> {
    return request<CredentialsResponse>('/credentials', token, {
        method: 'PUT',
        body: JSON.stringify(payload),
    })
}

export function clearStoredCredentials(token: string): Promise<void> {
    return request<void>('/credentials', token, { method: 'DELETE' })
}
