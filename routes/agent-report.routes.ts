import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { AgentEngagementController, AgentEngagementRefreshController, AgentLoginLogoutController, AgentLoginLogoutRefreshController, AgentPerfomanceController, AgentPerfomanceRefreshController, AgentTimecardController, AgentTimecardRefreshController, GroupSummaryController, GroupSummaryRefreshController } from '../controllers/agent-report.controller';

const reportRouter = Router();

reportRouter.post('/agent-perfomance', authenticate, AgentPerfomanceController);
reportRouter.post('/refresh/agent-perfomance', authenticate, AgentPerfomanceRefreshController);
reportRouter.post('/time-card', authenticate, AgentTimecardController);
reportRouter.post('/refresh/time-card', authenticate, AgentTimecardRefreshController);
reportRouter.post('/agent-login-report', authenticate, AgentLoginLogoutController);
reportRouter.post('/refresh/agent-login-report', authenticate, AgentLoginLogoutRefreshController);
reportRouter.post('/agent-engagement', authenticate, AgentEngagementController);
reportRouter.post('/refresh/agent-engagement', authenticate, AgentEngagementRefreshController);
reportRouter.post('/group-summary', authenticate, GroupSummaryController);
reportRouter.post('/refresh/group-summary', authenticate, GroupSummaryRefreshController);

export default reportRouter;