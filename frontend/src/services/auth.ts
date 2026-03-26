import type { AuthMeResponse, AuthSuccessResponse } from '../types/auth'

const API_BASE_URL =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
    'http://localhost:3001/api'

async function parseError(response: Response): Promise<string> {
    try {
        const data = (await response.json()) as { error?: string }
        if (data.error) {
            return data.error
        }
    } catch {
        // fall through
    }

    return `Request failed with status ${response.status}`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
        },
    })

    if (!response.ok) {
        throw new Error(await parseError(response))
    }

    return (await response.json()) as T
}

export function register(payload: {
    email: string
    username: string
    password: string
}): Promise<AuthSuccessResponse> {
    return request<AuthSuccessResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export function login(payload: {
    emailOrUsername: string
    password: string
}): Promise<AuthSuccessResponse> {
    return request<AuthSuccessResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export function fetchMe(token: string): Promise<AuthMeResponse> {
    return request<AuthMeResponse>('/auth/me', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
}
