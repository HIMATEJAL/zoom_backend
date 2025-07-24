import { Router } from 'express';
import { deleteUser, fetchAllUsers, login, register, resetPassword, updateUser } from '../controllers/user.controller';
import { authenticate, verifyAdmin } from '../middlewares/auth';

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/all-users', authenticate, fetchAllUsers);
authRouter.patch('/update-user/:userId', updateUser);
authRouter.delete('/delete-user', verifyAdmin, deleteUser);
authRouter.patch('/reset-password', authenticate, resetPassword);

export default authRouter;