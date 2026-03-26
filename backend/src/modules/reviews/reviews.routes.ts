import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { AuthRequest, requireAuth } from '../../middleware/auth';

const createReviewSchema = z.object({
    mrUrl: z.string().url(),
    mrTitle: z.string().optional(),
    projectId: z.string().optional(),
    mrIid: z.string().optional(),
    filesReviewed: z.number().int().nonnegative().default(0),
    filesExcluded: z.number().int().nonnegative().default(0),
    totalFindings: z.number().int().nonnegative().default(0),
    includeTestFiles: z.boolean().default(false),
});

export const reviewsRoutes = Router();

reviewsRoutes.use(requireAuth);

reviewsRoutes.get('/', async (req: AuthRequest, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const reviews = await prisma.reviewRun.findMany({
        where: { userId },
        orderBy: { runAt: 'desc' },
        include: {
            _count: {
                select: {
                    findings: true,
                    postedComments: true,
                },
            },
        },
    });

    res.json({ reviews });
});

reviewsRoutes.post('/', async (req: AuthRequest, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
        return;
    }

    const review = await prisma.reviewRun.create({
        data: {
            userId,
            ...parsed.data,
        },
    });

    res.status(201).json({ review });
});
