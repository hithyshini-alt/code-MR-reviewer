import crypto from 'crypto';
import { env } from './env';

const ALGO = 'aes-256-gcm';
const KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex');

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);
    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return [iv, tag, encrypted].map(b => b.toString('hex')).join(':');
}

export function decrypt(stored: string): string {
    const [ivHex, tagHex, encHex] = stored.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]).toString('utf8');
}