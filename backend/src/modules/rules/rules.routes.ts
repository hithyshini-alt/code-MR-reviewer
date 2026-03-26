import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { AuthRequest, requireAuth } from '../../middleware/auth';

const createRuleSchema = z.object({
    title: z.string().min(1),
    severity: z.enum(['error', 'warning', 'info']),
    type: z.enum(['builtin', 'regex']).default('regex'),
    pattern: z.string().optional(),
    comment: z.string().min(1),
    category: z.enum(['bestpractice', 'security', 'performance', 'readability', 'maintainability']).optional(),
    suggestion: z.string().optional(),
    enabled: z.boolean().default(true),
});

const updateRuleSchema = createRuleSchema.partial();

export const rulesRoutes = Router();

rulesRoutes.use(requireAuth);

rulesRoutes.get('/', async (req: AuthRequest, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const rules = await prisma.rule.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
    });

    res.json({ rules });
});

rulesRoutes.post('/', async (req: AuthRequest, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const parsed = createRuleSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
        return;
    }

    const rule = await prisma.rule.create({
        data: {
            userId,
            ...parsed.data,
        },
    });

    res.status(201).json({ rule });
});

rulesRoutes.patch('/:id', async (req: AuthRequest, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const parsed = updateRuleSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
        return;
    }

    const ruleId = String(req.params.id);

    const updated = await prisma.rule.updateMany({
        where: {
            id: ruleId,
            userId,
        },
        data: parsed.data,
    });

    if (updated.count === 0) {
        res.status(404).json({ error: 'Rule not found' });
        return;
    }

    const rule = await prisma.rule.findFirst({
        where: {
            id: ruleId,
            userId,
        },
    });

    res.json({ rule });
});

rulesRoutes.delete('/:id', async (req: AuthRequest, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const ruleId = String(req.params.id);

    const deleted = await prisma.rule.deleteMany({
        where: {
            id: ruleId,
            userId,
        },
    });

    if (deleted.count === 0) {
        res.status(404).json({ error: 'Rule not found' });
        return;
    }

    res.status(204).send();
});
