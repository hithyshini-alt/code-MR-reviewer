import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.ts';
import { authRoutes } from './modules/auth/auth.routes.ts';
import { credentialsRoutes } from './modules/credentials/credentials.routes.ts';
import { rulesRoutes } from './modules/rules/rules.routes.ts';
import { reviewsRoutes } from './modules/reviews/reviews.routes.ts';
import { findingsRoutes } from './modules/findings/findings.routes.ts';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/credentials', credentialsRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/findings', findingsRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);

    const message = err.message || '';

    if (message.includes("Can't reach database server")) {
        res.status(503).json({
            error: 'Database unavailable. Start PostgreSQL and try again.',
        });
        return;
    }

    if (message.includes('did not initialize yet')) {
        res.status(500).json({
            error: 'Prisma client is not generated. Run: npm run prisma:generate',
        });
        return;
    }

    res.status(500).json({ error: 'Internal server error' });
});

app.listen(Number(env.PORT), () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
});