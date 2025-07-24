import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_KEY = process.env.JWT_SECRET || 'SECRET_KEY';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_KEY) as { id: number; role: string };
    req.user = payload;
    next();
  } catch {
    throw Object.assign(new Error('Invalid or expired token'), { status: 403 });
  }
};

export const verifyAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  console.log("verifyAdmin");

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(409).json({ success: false, error: 'Token not found!' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const verified = jwt.verify(token, JWT_KEY) as { id: number; role: string };
    if (verified.role !== "admin") {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    req.user = verified;
    next();
  } catch (err) {
    return res.status(400).json({ success: false, error: 'Invalid token' });
  }
};
