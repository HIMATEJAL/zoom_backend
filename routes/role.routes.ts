import { Router } from 'express';
import { authenticate, verifyAdmin } from '../middlewares/auth';
import { addPermissions, assignRole, createRole, deleteRole, fetchAllRoles, fetchRole } from '../controllers/role.controller';

const roleRouter = Router();

roleRouter.post('/create-role', createRole);
roleRouter.patch('/add-permissions', authenticate, addPermissions);
roleRouter.patch('/add-role', authenticate, assignRole);
roleRouter.get('/fetch-role', authenticate, fetchRole);
roleRouter.get('/all-roles', authenticate, fetchAllRoles);
roleRouter.delete('/delete', verifyAdmin, deleteRole);

export default roleRouter;