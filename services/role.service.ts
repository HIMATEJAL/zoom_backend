import { Role } from "../models/role.model";
import { User } from "../models/user.model";
import { Permissions, RoleAttributes } from "../types/role.type";
import { UserAttributes } from "../types/user.type";

export const createNewRole = async (role: string, permissions: Permissions): Promise<RoleAttributes> => {

    const existingRole = await Role.findOne({ where: { role } });

    if (existingRole) {
        throw Object.assign(new Error('Role already exists!'), { status: 409 });
    }

    const newRole = await Role.create({ role, permissions });

    return newRole.toJSON() as RoleAttributes;
}

export const updatePermission = async (roleId: number, permissions: Permissions): Promise<RoleAttributes> => {
    const role = await Role.findByPk(roleId);

    if (!role) {
        throw Object.assign(new Error('Role not found'), { status: 404 });
    }

    role.permissions = permissions;
    const updatedRole = await role.save();

    return updatedRole.toJSON() as RoleAttributes;
}

export const addRole = async (userId: number, roleId: number): Promise<UserAttributes> => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw Object.assign(new Error('User not found'), { status: 404 });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
        throw Object.assign(new Error('Role not found'), { status: 404 });
    }

    user.roleId = roleId;
    await user.save();

    const updatedUser = await User.findByPk(userId, {
        include: [{ model: Role, as: 'role', attributes: ['role'] }],
    });

    if (!updatedUser) {
        throw Object.assign(new Error('Failed to fetch updated user'), { status: 500 });
    }

    const userData = updatedUser.toJSON() as UserAttributes;

    return {
        id: userData?.id,
        name: userData?.name,
        email: userData?.email,
        role: role?.role
    };
}