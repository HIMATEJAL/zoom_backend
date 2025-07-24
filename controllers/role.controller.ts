import { NextFunction, Request, Response } from 'express';
import { addRole, createNewRole, updatePermission } from '../services/role.service';
import { Role } from '../models/role.model';
import { RoleResponseBody } from '../types/role.type';

export const createRole = async (req: Request, res: Response<RoleResponseBody>, next: NextFunction) => {
    console.log('createRole');

    try {
        const { role, permissions } = req.body;

        if (!role || !permissions) {
            return next(Object.assign(new Error('Role name and permissions are required!'), { status: 400 }));
        }

        const newRole = await createNewRole(role, permissions)

        res.status(201).json({success: true, data: newRole})
    } catch (err) {
        next(err);
    }
}

export const addPermissions = async (req: Request, res: Response<RoleResponseBody>, next: NextFunction) => {
    console.log('addPermissions');
    try {
        const { roleId, permissions } = req.body;

    if (!roleId || !permissions) {
      return next(Object.assign(new Error('Role and permissions are required'), { status: 400 }));
    }

    const role = await updatePermission(roleId, permissions)

    res.status(200).json({ success: true, data: role });

    } catch (err) {
        next(err)
    }
}

export const assignRole = async (req: Request, res: Response<RoleResponseBody>, next: NextFunction) => {
    console.log('assignRole');
    try {
        const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return next(Object.assign(new Error('User and Role are required'), { status: 400 }));
    }

    const user = await addRole(userId, roleId);

    res.status(200).json({ success: true, data: user });
  
    } catch (err) {
        next(err)
    }
}

export const fetchRole = async (req: Request, res: Response, next: NextFunction) => {
    console.log('fetchRole');
    
    try {
        const { roleId } = (req as any).user;
        const role = await Role.findByPk(roleId);

        if(!role) return next(Object.assign(new Error('Role not found!'), { status: 404 }));

        res.status(200).json(role)
    } catch (err) {
        next(err)
    }
}

export const fetchAllRoles = async (req: Request, res: Response<RoleResponseBody>, next: NextFunction) => {
    console.log('fetchAllRoles');
    
    try {
        const role = await Role.findAll()

        if(!role) return next(Object.assign(new Error('No role found!'), { status: 404 }));

        res.status(200).json({success: true, data: role})
    } catch (err) {
        next(err)
    }
}

export const deleteRole = async (req: Request, res: Response<RoleResponseBody>, next: NextFunction) => {
    console.log('deleteRole');

    try {
        const { roleId } = req.body;

        if (!roleId) {
            return next(Object.assign(new Error('Role ID is required'), { status: 400 }));
        }

        const deletedCount = await Role.destroy({
            where: { id: roleId }
        });

        if (deletedCount === 0) {
            return next(Object.assign(new Error('Role not found or already deleted'), { status: 404 }));
        }

        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
};
