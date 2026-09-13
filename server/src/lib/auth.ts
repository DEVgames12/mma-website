import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export type AuthPayload = {
  userId: string;
  email: string;
  role: string;
};

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, config.jwtSecret) as AuthPayload;
}
