import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string().min(32),
    ENCRYPTION_KEY: z.string().length(64),
    PORT: z.string().default('3001'),
    FRONTEND_URL: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;