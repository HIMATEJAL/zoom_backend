import { Router } from 'express';
import { GetUserAccounts, InbondCalls, OutbondCalls, RawCallLogs, RefreshCallLogs, SaveZoomCredentials, SetPrimaryAccount } from '../controllers/callreport.controller';
import { authenticate } from '../middlewares/auth';

const zoomRouter = Router();

zoomRouter.post('/outbond-calls', authenticate, OutbondCalls);
zoomRouter.post('/inbond-calls', authenticate, InbondCalls);
zoomRouter.post('/save-zoomuser', authenticate, SaveZoomCredentials);
zoomRouter.post('/fetch-accounts', authenticate, GetUserAccounts);
zoomRouter.patch('/set-primary', authenticate, SetPrimaryAccount);
zoomRouter.post('/refresh-call-logs', authenticate, RefreshCallLogs);
zoomRouter.post('/raw-call-logs', authenticate, RawCallLogs);

export default zoomRouter;