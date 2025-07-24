import { Role } from "../models/role.model";
import { User } from "../models/user.model";
import { hashPassword } from "./bcrypt";

export const createAdminUser = async () => {
  try {
    // let adminRole = await Role.findOne({ where: { role: 'admin' } });
    // if (!adminRole) {
    //   // Provide a default permissions object (adjust based on your Permissions type)
    //   const defaultPermissions: Permissions = {
    //     // Example permissions, adjust according to your Permissions type
    //     canManageUsers: true,
    //     canManageRoles: true,
    //     canViewReports: true,
    //     canManageTeams: true,
    //   };
    //   adminRole = await Role.create({
    //     role: 'admin',
    //     permissions: defaultPermissions,
    //   });
    // }

    // Check if admin user exists
    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin@123';
    const adminUser = await User.findOne({ where: { email: adminEmail } });

    if (!adminUser) {
      const hashedPassword = await hashPassword(adminPassword);
      await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        // roleId: adminRole.id,
      });
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Failed to create admin user:', error);
  }
};