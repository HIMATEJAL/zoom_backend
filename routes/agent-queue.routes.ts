import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { abandonedCallsController, agentAbandonedReportController, fetchAgentQueueController, getDailyQueueController, getIntervalQueueController, refreshAbandonedCallsController, refreshAgentAbandonedReportController, refreshAgentQueueController, refreshDailyQueueController, refreshIntervalQueueController } from '../controllers/agent-queue.controller';

const agentQueueRouter = Router();

agentQueueRouter.post('/all', authenticate, fetchAgentQueueController);
agentQueueRouter.post('/all/refresh', authenticate, refreshAgentQueueController);
agentQueueRouter.post('/daily', authenticate, getDailyQueueController);
agentQueueRouter.post('/daily/refresh', authenticate, refreshDailyQueueController);
agentQueueRouter.post('/interval', authenticate, getIntervalQueueController);
agentQueueRouter.post('/interval/refresh', authenticate, refreshIntervalQueueController);
agentQueueRouter.post('/abandoned-calls', authenticate, abandonedCallsController);
agentQueueRouter.post('/abandoned-calls/refresh', authenticate, refreshAbandonedCallsController);
agentQueueRouter.post('/abandoned-report', authenticate, agentAbandonedReportController);
agentQueueRouter.post('/abandoned-report/refresh', authenticate, refreshAgentAbandonedReportController);

export default agentQueueRouter;