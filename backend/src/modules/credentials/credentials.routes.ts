import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { decrypt, encrypt } from '../../config/crypto';
import { AuthRequest, requireAuth } from '../../middleware/auth';

const upsertCredentialsSchema = z.object({
    gitlabPat: z.string().optional(),
    aiApiKey: z.string().optional(),
    gitlabBaseUrl: z.string().url().optional(),
});

export const credentialsRoutes = Router();

credentialsRoutes.use(requireAuth);

function safeDecrypt(value: string | null): string {
    if (!value) {
        return '';
    }

    try {
        return decrypt(value);
    } catch {
        return '';
    }
}

credentialsRoutes.get('/', async (req: AuthRequest, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const credentials = await prisma.userCredential.findUnique({
        where: { userId },
        select: {
            gitlabBaseUrl: true,
            gitlabPatEncrypted: true,
            aiApiKeyEncrypted: true,
            updatedAt: true,
        },
    });

    res.json({
        credentials: credentials
            ? {
                gitlabBaseUrl: credentials.gitlabBaseUrl,
                gitlabPat: safeDecrypt(credentials.gitlabPatEncrypted),
                aiApiKey: safeDecrypt(credentials.aiApiKeyEncrypted),
                hasGitlabPat: Boolean(credentials.gitlabPatEncrypted),
                hasAiApiKey: Boolean(credentials.aiApiKeyEncrypted),
                updatedAt: credentials.updatedAt,
            }
            : null,
    });
});

credentialsRoutes.put('/', async (req: AuthRequest, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const parsed = upsertCredentialsSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
        return;
    }

    const { gitlabPat, aiApiKey, gitlabBaseUrl } = parsed.data;
    const normalizedGitlabPat = gitlabPat?.trim() ?? '';
    const normalizedAiApiKey = aiApiKey?.trim() ?? '';

    const updated = await prisma.userCredential.upsert({
        where: { userId },
        update: {
            gitlabBaseUrl,
            gitlabPatEncrypted: gitlabPat === undefined
                ? undefined
                : (normalizedGitlabPat ? encrypt(normalizedGitlabPat) : null),
            aiApiKeyEncrypted: aiApiKey === undefined
                ? undefined
                : (normalizedAiApiKey ? encrypt(normalizedAiApiKey) : null),
        },
        create: {
            userId,
            gitlabBaseUrl: gitlabBaseUrl ?? 'https://gitlab.com',
            gitlabPatEncrypted: normalizedGitlabPat ? encrypt(normalizedGitlabPat) : null,
            aiApiKeyEncrypted: normalizedAiApiKey ? encrypt(normalizedAiApiKey) : null,
        },
        select: {
            gitlabBaseUrl: true,
            gitlabPatEncrypted: true,
            aiApiKeyEncrypted: true,
            updatedAt: true,
        },
    });

    res.json({
        credentials: {
            gitlabBaseUrl: updated.gitlabBaseUrl,
            gitlabPat: safeDecrypt(updated.gitlabPatEncrypted),
            aiApiKey: safeDecrypt(updated.aiApiKeyEncrypted),
            hasGitlabPat: Boolean(updated.gitlabPatEncrypted),
            hasAiApiKey: Boolean(updated.aiApiKeyEncrypted),
            updatedAt: updated.updatedAt,
        },
    });
});

credentialsRoutes.delete('/', async (req: AuthRequest, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    await prisma.userCredential.upsert({
        where: { userId },
        update: {
            gitlabPatEncrypted: null,
            aiApiKeyEncrypted: null,
        },
        create: {
            userId,
            gitlabBaseUrl: 'https://gitlab.com',
            gitlabPatEncrypted: null,
            aiApiKeyEncrypted: null,
        },
    });

    res.status(204).send();
});
