import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { fetchVDNController, refreshVDNController } from '../controllers/agent-vdn.controller';

const agentVDNRouter = Router();

agentVDNRouter.post('/interval', authenticate, fetchVDNController);
agentVDNRouter.post('/refresh', authenticate, refreshVDNController);

export default agentVDNRouter;