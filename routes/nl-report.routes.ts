import { Router } from 'express';
import { handleNLReport } from '../controllers/nl-report.controller';

const router = Router();

router.post('/api/nl-report', handleNLReport);

export default router; 