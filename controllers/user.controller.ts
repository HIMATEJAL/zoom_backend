import { NextFunction, Request, Response } from 'express';
import { findAllUsers, loginUser, registerUser, updatePassword, updateUserById } from '../services/user.service';
import { RegisterRequestBody, LoginRequestBody, UserResponseBody } from '../types/user.type';
import { generateToken } from '../utils/jwt';
import { encryptRole } from '../utils/crypto';
import { User } from '../models/user.model';
import { comparePasswords } from '../utils/bcrypt';
import { AuthenticatedRequest } from '../middlewares/auth';

// register
export const register = async (req: Request<RegisterRequestBody>, res: Response<UserResponseBody>, next: NextFunction) => {
    console.log('register');
    try {
        const { name, email, password, roleId } = req.body;

        if (!name || !email) {
            return next(Object.assign(new Error('Missing required fields'), { status: 400 }));
        }

        const user = await registerUser(name, email, password, roleId);

        res.status(201).json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

// login
export const login = async (req: Request<LoginRequestBody>, res: Response<UserResponseBody>, next: NextFunction) => {   
    console.log('login');
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(Object.assign(new Error('Missing required fields'), { status: 400 }));
        }

        const user = await loginUser(email, password);

        const token = generateToken({ id: user.id, role: user?.role?.role });
        const encrypted = encryptRole(user.role);
        const userDetails = {
            id: user.id,
            name: user.name,
            email: user.email
        }
        res.status(200).json({ success: true, token: token, data: encrypted, user: userDetails });
    } catch (err) {
        next(err);
    }
};

// fetch all users
export const fetchAllUsers = async (req: Request, res: Response<UserResponseBody>, next: NextFunction) => {
    console.log('fetchAllUsers');

    try {
        const allUsers = await findAllUsers();

        res.status(200).json({ success: true, data: allUsers });
    } catch (err) {
        next(err)
    }
}

// update user
export const updateUser = async (req: Request, res: Response<UserResponseBody>, next: NextFunction) => {
    console.log('updateUser');

    try {
        const { userId } = req.params;
        const updateBody = req.body;

        const updatedUser = await updateUserById(parseInt(userId), updateBody);

        res.status(200).json({ success: true, data: updatedUser });
    } catch (err) {
        next(err)
    }
}

// delete user
export const deleteUser = async (req: Request, res: Response<UserResponseBody>, next: NextFunction) => {
    console.log('deleteUser');

    try {
        const { userId } = req.body;

        const user = await User.findByPk(userId);

        if (!user) return next(Object.assign(new Error('User not found'), { status: 404 }));

        await user.destroy();
        res.status(200).json({ success: true });
    } catch (err) {
        next(err)
    }
}

// reset password
export const resetPassword = async (req: AuthenticatedRequest, res: Response<UserResponseBody>, next: NextFunction) => {
    console.log('resetPassword');

    try {
        const user = req.user;
        const { currentPassword, newPassword } = req.body;

        const userId = user?.id;

        const currentuser = await User.findByPk(userId);
        if (!currentuser) {
            next(Object.assign(new Error('User not found'), { status: 404 }));
            return;
        }

        const isMatch = await comparePasswords(currentPassword, currentuser.password || '');
        if (!isMatch) {
            next(Object.assign(new Error('Current password is incorrect'), { status: 401 }));
            return;
        }

        if (await comparePasswords(newPassword, currentuser.password || '')) {
            next(Object.assign(new Error('New password cannot be the same as current password'), {status: 400}));
            return;
        }

        const result = await updatePassword(currentuser, newPassword);
        res.status(200).json(result);
    } catch (err) {
        next(err)
    }
}
