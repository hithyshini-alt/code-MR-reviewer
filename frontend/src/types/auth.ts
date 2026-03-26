export type AuthUser = {
    id: string
    email: string
    username: string
    createdAt: string
}

export type AuthSuccessResponse = {
    token: string
    user: AuthUser
}

export type AuthMeResponse = {
    user: AuthUser
}
