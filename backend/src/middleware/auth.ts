import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
    userId?: string;
}

export function requireAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }
    try {
        const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
        req.userId = payload.userId;
        next();
    } catch {
        res.status(401).json({ error: 'Token expired or invalid' });
    }
}