import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { Permissions } from '../types/role.type';

export class Role extends Model<InferAttributes<Role>, InferCreationAttributes<Role>> {
    declare id: CreationOptional<number>;
    declare role: string;
    declare permissions: Permissions;
}

export const initRoleModel = (sequelize: Sequelize) => {
    Role.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            role: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true,
            },
            permissions: {
                type: DataTypes.JSONB,
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: 'Role',
            tableName: 'roles',
            timestamps: false,
        }
    )
}