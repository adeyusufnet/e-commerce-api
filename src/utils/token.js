import crypto from 'node:crypto'

export const generateRefreshToken = () => crypto.randomBytes(40).toString('hex');

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')