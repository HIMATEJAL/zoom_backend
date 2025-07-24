import express from 'express';
import cors from 'cors';
import errorHandler from './middlewares/errorHandler';
import authRouter from './routes/user.routes';
import roleRouter from './routes/role.routes';
import zoomRouter from './routes/zoom.routes';
import reportRouter from './routes/agent-report.routes';
import teamRouter from './routes/team.routes';
import agentQueueRouter from './routes/agent-queue.routes';
import agentVDNRouter from './routes/agent-vdn.routes';
import dashboardRouter from './routes/dashboard.routes';
import nlReportRoutes from './routes/nl-report.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/users', authRouter);
app.use('/roles', roleRouter);
app.use('/zoom', zoomRouter);
app.use('/reports', reportRouter);
app.use('/teams', teamRouter);
app.use('/queues', agentQueueRouter);
app.use('/vdn', agentVDNRouter);
app.use('/dashboard', dashboardRouter);
app.use(nlReportRoutes);
app.use(errorHandler);

app.get('/', (_req, res) => {
  res.send('Server is running...');
});

export default app;
