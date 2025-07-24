import { Router } from 'express';
import { authenticate, verifyAdmin } from '../middlewares/auth';
import { createTeam, deleteTeam, fetchTeams, updateTeam } from '../controllers/team.controller';

const teamRouter = Router();

teamRouter.post('/create', verifyAdmin, createTeam);
teamRouter.get('/fetch', authenticate, fetchTeams);
teamRouter.patch('/update/:id', verifyAdmin, updateTeam);
teamRouter.delete('/delete', verifyAdmin, deleteTeam);

export default teamRouter;