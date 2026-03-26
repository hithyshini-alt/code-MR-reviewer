import { Router } from 'express';
import { prisma } from '../../config/db';
import { AuthRequest, requireAuth } from '../../middleware/auth';

export const findingsRoutes = Router();

findingsRoutes.use(requireAuth);

findingsRoutes.get('/run/:runId', async (req: AuthRequest, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const runId = String(req.params.runId);

    const run = await prisma.reviewRun.findFirst({
        where: {
            id: runId,
            userId,
        },
        select: { id: true },
    });

    if (!run) {
        res.status(404).json({ error: 'Review run not found' });
        return;
    }

    const findings = await prisma.finding.findMany({
        where: { runId: run.id },
        orderBy: { createdAt: 'asc' },
    });

    res.json({ findings });
});
