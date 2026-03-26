import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { AuthRequest, requireAuth } from '../../middleware/auth';

const registerSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(30),
    password: z.string().min(8).max(128),
});

const loginSchema = z.object({
    emailOrUsername: z.string().min(1),
    password: z.string().min(1),
});

function signToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '7d' });
}

function toPublicUser(user: { id: string; email: string; username: string; createdAt: Date }) {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
    };
}

export const authRoutes = Router();

authRoutes.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
        return;
    }

    const { email, username, password } = parsed.data;

    const existing = await prisma.user.findFirst({
        where: {
            OR: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() },
            ],
        },
    });

    if (existing) {
        res.status(409).json({ error: 'Email or username already exists' });
        return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
        data: {
            email: email.toLowerCase(),
            username: username.toLowerCase(),
            passwordHash,
        },
        select: {
            id: true,
            email: true,
            username: true,
            createdAt: true,
        },
    });

    const token = signToken(user.id);
    res.status(201).json({ token, user: toPublicUser(user) });
});

authRoutes.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
        return;
    }

    const { emailOrUsername, password } = parsed.data;
    const identifier = emailOrUsername.toLowerCase();

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: identifier },
                { username: identifier },
            ],
        },
    });

    if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }

    const token = signToken(user.id);

    res.json({
        token,
        user: toPublicUser(user),
    });
});

authRoutes.get('/me', requireAuth, async (req: AuthRequest, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            username: true,
            createdAt: true,
        },
    });

    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }

    res.json({ user: toPublicUser(user) });
});
