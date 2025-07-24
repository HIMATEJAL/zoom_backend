import { Role } from '../models/role.model';
import { User } from '../models/user.model';
import { UserAttributes, UserResponseBody } from '../types/user.type';
import { hashPassword, comparePasswords } from '../utils/bcrypt';

export const registerUser = async (name: string, email: string, password: string, roleId: string): Promise<UserAttributes> => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) throw Object.assign(new Error('Email already exists'), { status: 400 });

  const hashedPassword = await hashPassword(password);
  const user = await User.create({ name, email, password: hashedPassword, roleId });

  const result = user.toJSON() as UserAttributes;
  delete result.password;

  return result;
};

export const loginUser = async (email: string, password: string): Promise<UserAttributes> => {
  const user = await User.findOne({
    where: { email },
    include: [{ model: Role, as: 'role' }],
  });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const isMatch = await comparePasswords(password, user.password || '');
  if (!isMatch) throw Object.assign(new Error('Invalid password'), { status: 401 });

  const result = user.toJSON() as UserAttributes;
  delete result.password;

  return result;
};

export const findAllUsers = async (): Promise<UserAttributes[]> => {

  const allUsers = await User.findAll({
    attributes: { exclude: ['password'] },
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['role', 'permissions'],
      },
    ],
  })
  if (!allUsers) throw Object.assign(new Error('User not found'), { status: 404 });

  return allUsers as UserAttributes[];
}

export const updateUserById = async (userId: number, updateBody: Partial<UserAttributes>): Promise<UserAttributes> => {
  const user = await User.findByPk(userId);

  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const allowedUpdates: Partial<UserAttributes> = {
    name: updateBody.name,
    email: updateBody.email,
    roleId: updateBody.roleId,
  };

  await user.update(allowedUpdates);

  const updatedUser = await User.findByPk(userId, {
    attributes: { exclude: ['password', 'updatedAt'] }
  });

  if (!updatedUser) throw Object.assign(new Error('Failed to retrieve updated user'), { status: 404 });

  return updatedUser as UserAttributes;
};

export const updatePassword = async (user: User, newPassword: string ): Promise<UserResponseBody> => {
  try {
    const hashedPassword = await hashPassword(newPassword);
    await user.update({ password: hashedPassword });
    return { success: true };
  } catch (error) {
    throw Object.assign(new Error('Failed to update password'), { status: 500 });
  }
};
