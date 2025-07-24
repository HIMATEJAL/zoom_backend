import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'SECRET_KEY';
const EXPIRES_IN = '10h';

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
};
